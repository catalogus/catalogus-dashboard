import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type TranslateRequest = {
  post_id?: string;
};

type TranslatePayload = {
  title: string;
  excerpt: string;
  body: string;
  categories: { id: string; name: string }[];
  tags: { id: string; name: string }[];
};

const slugify = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const hashText = async (value: string) => {
  const data = new TextEncoder().encode(value);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  const deeplKey = Deno.env.get("DEEPL_API_KEY") ?? "";
  const deeplApiUrl =
    Deno.env.get("DEEPL_API_URL") ?? "https://api-free.deepl.com/v2/translate";

  if (!supabaseUrl || !serviceRoleKey || !deeplKey) {
    return new Response(
      JSON.stringify({ error: "Missing required environment variables." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return new Response(JSON.stringify({ error: "Missing authorization token." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return new Response(JSON.stringify({ error: "Invalid auth token." }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", authData.user.id)
    .maybeSingle();
  if (profileError || profile?.role !== "admin") {
    return new Response(JSON.stringify({ error: "Admin access required." }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: TranslateRequest;
  try {
    payload = await req.json();
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Invalid JSON payload." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!payload.post_id) {
    return new Response(JSON.stringify({ error: "post_id is required." }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const { data: post, error: postError } = await supabase
    .from("posts")
    .select(
      `
      id,
      title,
      slug,
      excerpt,
      body,
      language,
      featured,
      featured_image_url,
      featured_image_path,
      author_id,
      status,
      published_at,
      translation_group_id,
      source_post_id,
      categories:post_categories_map(category:post_categories(id, name, slug, name_en, slug_en)),
      tags:post_tags_map(tag:post_tags(id, name, slug, name_en, slug_en))
    `,
    )
    .eq("id", payload.post_id)
    .maybeSingle();

  if (postError || !post) {
    return new Response(JSON.stringify({ error: "Post not found." }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (post.source_post_id) {
    return new Response(JSON.stringify({ status: "skipped", reason: "translation-post" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const sourceLangDb = post.language === "en" ? "en" : "pt";
  const targetLangDb = sourceLangDb === "pt" ? "en" : "pt";
  const sourceLang = sourceLangDb.toUpperCase();
  const targetLang = targetLangDb.toUpperCase();

  const categories = (post.categories ?? [])
    .map((entry: any) => entry.category)
    .filter(Boolean);
  const tags = (post.tags ?? []).map((entry: any) => entry.tag).filter(Boolean);

  const categoriesToTranslate =
    targetLangDb === "en"
      ? categories
          .filter((category: any) => !category.name_en)
          .map((category: any) => ({ id: category.id, name: category.name }))
      : [];

  const tagsToTranslate =
    targetLangDb === "en"
      ? tags.filter((tag: any) => !tag.name_en).map((tag: any) => ({
        id: tag.id,
        name: tag.name,
      }))
      : [];

  const sourceSignature = JSON.stringify({
    title: post.title ?? "",
    excerpt: post.excerpt ?? "",
    body: post.body ?? "",
    categories: categories.map((category: any) => ({
      id: category.id,
      name: category.name,
    })),
    tags: tags.map((tag: any) => ({ id: tag.id, name: tag.name })),
    sourceLang: sourceLangDb,
    targetLang: targetLangDb,
  });
  const sourceHash = await hashText(sourceSignature);

  const translationGroupId = post.translation_group_id ?? post.id;

  const { data: existingTranslation } = await supabase
    .from("posts")
    .select(
      `
      id,
      slug,
      translation_source_hash
    `,
    )
    .eq("translation_group_id", translationGroupId)
    .eq("language", targetLangDb)
    .maybeSingle();

  if (existingTranslation?.translation_source_hash === sourceHash) {
    return new Response(JSON.stringify({ status: "cached" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  await supabase
    .from("posts")
    .update({ translation_status: "pending", translation_error: null })
    .eq("id", post.id);

  const translationInput = {
    title: post.title ?? "",
    excerpt: post.excerpt ?? "",
    body: post.body ?? "",
    categories: categoriesToTranslate,
    tags: tagsToTranslate,
  } as TranslatePayload;

  const texts: string[] = [
    translationInput.title,
    translationInput.excerpt ?? "",
    translationInput.body ?? "",
  ];
  const categoryIndexStart = texts.length;
  texts.push(...categoriesToTranslate.map((category) => category.name));
  const tagIndexStart = texts.length;
  texts.push(...tagsToTranslate.map((tag) => tag.name));

  const requestPayload = {
    text: texts,
    source_lang: sourceLang,
    target_lang: targetLang,
    tag_handling: "html",
  };

  const payloadSize = new TextEncoder().encode(JSON.stringify(requestPayload)).length;
  if (payloadSize > 128 * 1024) {
    const errorText = "DeepL request too large (>128 KiB).";
    await supabase
      .from("posts")
      .update({
        translation_status: "failed",
        translation_error: errorText,
      })
      .eq("id", post.id);
    return new Response(JSON.stringify({ error: errorText }), {
      status: 413,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const deeplResponse = await fetch(deeplApiUrl, {
    method: "POST",
    headers: {
      Authorization: `DeepL-Auth-Key ${deeplKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  if (!deeplResponse.ok) {
    const errorText = await deeplResponse.text();
    console.error("DeepL error response:", errorText);
    if (existingTranslation?.id) {
      await supabase
        .from("posts")
        .update({
          translation_status: "failed",
          translation_error: errorText.slice(0, 4000),
        })
        .eq("id", existingTranslation.id);
    }
    await supabase
      .from("posts")
      .update({
        translation_status: "failed",
        translation_error: errorText.slice(0, 4000),
      })
      .eq("id", post.id);
    return new Response(JSON.stringify({ error: "Translation API failed." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const deeplData = await deeplResponse.json();
  const translations = Array.isArray(deeplData?.translations)
    ? deeplData.translations
    : [];

  if (translations.length < texts.length) {
    if (existingTranslation?.id) {
      await supabase
        .from("posts")
        .update({
          translation_status: "failed",
          translation_error: "Incomplete translation response.",
        })
        .eq("id", existingTranslation.id);
    }
    await supabase
      .from("posts")
      .update({
        translation_status: "failed",
        translation_error: "Incomplete translation response.",
      })
      .eq("id", post.id);
    return new Response(JSON.stringify({ error: "Invalid translation response." }), {
      status: 502,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const translatedTitle = String(translations[0]?.text ?? "").trim();
  const translatedExcerpt = String(translations[1]?.text ?? "").trim();
  const translatedBody = String(translations[2]?.text ?? "").trim();

  const translatedCategories = categoriesToTranslate.map((category, index) => ({
    id: category.id,
    name: String(translations[categoryIndexStart + index]?.text ?? "").trim(),
  }));

  const translatedTags = tagsToTranslate.map((tag, index) => ({
    id: tag.id,
    name: String(translations[tagIndexStart + index]?.text ?? "").trim(),
  }));

  const categoryUpdates = translatedCategories
    .filter((category: any) => category?.id && category?.name)
    .map((category: any) => ({
      id: category.id,
      name_en: String(category.name).trim(),
      slug_en: slugify(String(category.name)),
    }))
    .filter((category: any) => category.name_en);

  const tagUpdates = translatedTags
    .filter((tag: any) => tag?.id && tag?.name)
    .map((tag: any) => ({
      id: tag.id,
      name_en: String(tag.name).trim(),
      slug_en: slugify(String(tag.name)),
    }))
    .filter((tag: any) => tag.name_en);

  if (categoryUpdates.length > 0) {
    await supabase.from("post_categories").upsert(categoryUpdates, {
      onConflict: "id",
    });
  }

  if (tagUpdates.length > 0) {
    await supabase.from("post_tags").upsert(tagUpdates, {
      onConflict: "id",
    });
  }

  let translatedSlug = slugify(translatedTitle) || `${post.slug}-${targetLangDb}`;
  const { data: slugConflict } = await supabase
    .from("posts")
    .select("id")
    .eq("language", targetLangDb)
    .eq("slug", translatedSlug)
    .neq("translation_group_id", translationGroupId)
    .maybeSingle();

  if (slugConflict) {
    translatedSlug = `${translatedSlug}-${post.id.slice(0, 6)}`;
  }

  const translationRecord = {
    title: translatedTitle || post.title,
    slug: translatedSlug,
    excerpt: translatedExcerpt,
    body: translatedBody,
    featured_image_url: post.featured_image_url,
    featured_image_path: post.featured_image_path,
    author_id: post.author_id,
    status: "draft",
    published_at: null,
    featured: post.featured,
    language: targetLangDb,
    translation_group_id: translationGroupId,
    source_post_id: post.id,
    translation_status: "review",
    translation_source_hash: sourceHash,
    translated_at: new Date().toISOString(),
    translation_error: null,
  };

  if (existingTranslation?.id) {
    const { error } = await supabase
      .from("posts")
      .update(translationRecord)
      .eq("id", existingTranslation.id);
    if (error) {
      await supabase
        .from("posts")
        .update({
          translation_status: "failed",
          translation_error: error.message,
        })
        .eq("id", post.id);
      return new Response(JSON.stringify({ error: "Failed to update translation." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } else {
    const { error } = await supabase.from("posts").insert({
      ...translationRecord,
      id: crypto.randomUUID(),
    });
    if (error) {
      await supabase
        .from("posts")
        .update({
          translation_status: "failed",
          translation_error: error.message,
        })
        .eq("id", post.id);
      return new Response(JSON.stringify({ error: "Failed to create translation." }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  }

  await supabase
    .from("posts")
    .update({
      translation_status: "review",
      translation_error: null,
    })
    .eq("id", post.id);

  return new Response(JSON.stringify({ status: "translated" }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
