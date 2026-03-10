import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type InviteStaffPayload = {
  email?: string;
  name?: string;
  admin_level?: "super_admin" | "content_admin";
};

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed." }, 405);
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

  if (!supabaseUrl || !serviceRoleKey) {
    return jsonResponse({ error: "Missing required environment variables." }, 500);
  }

  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return jsonResponse({ error: "Missing authorization token." }, 401);
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false },
  });

  const { data: authData, error: authError } = await supabase.auth.getUser(token);
  if (authError || !authData?.user) {
    return jsonResponse({ error: "Invalid auth token." }, 401);
  }

  const { data: requesterProfile, error: requesterProfileError } = await supabase
    .from("profiles")
    .select("role, admin_level")
    .eq("id", authData.user.id)
    .maybeSingle();

  if (
    requesterProfileError ||
    requesterProfile?.role !== "admin" ||
    requesterProfile?.admin_level !== "super_admin"
  ) {
    return jsonResponse({ error: "Only super admins can invite staff users." }, 403);
  }

  let payload: InviteStaffPayload;
  try {
    payload = await req.json();
  } catch (_error) {
    return jsonResponse({ error: "Invalid JSON payload." }, 400);
  }

  const email = String(payload.email ?? "").trim().toLowerCase();
  const name = String(payload.name ?? "").trim();
  const adminLevel = payload.admin_level ?? "content_admin";

  if (!email) {
    return jsonResponse({ error: "email is required." }, 400);
  }

  if (!name) {
    return jsonResponse({ error: "name is required." }, 400);
  }

  if (adminLevel !== "super_admin" && adminLevel !== "content_admin") {
    return jsonResponse({ error: "admin_level must be super_admin or content_admin." }, 400);
  }

  const redirectTo = Deno.env.get("STAFF_INVITE_REDIRECT_URL") ?? undefined;

  const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
    email,
    redirectTo ? { redirectTo } : undefined,
  );

  if (inviteError || !inviteData.user) {
    const message = inviteError?.message ?? "Failed to invite staff user.";
    return jsonResponse({ error: message }, 400);
  }

  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      {
        id: inviteData.user.id,
        name,
        email,
        role: "admin",
        admin_level: adminLevel,
      },
      { onConflict: "id" },
    );

  if (profileError) {
    return jsonResponse({ error: profileError.message }, 400);
  }

  return jsonResponse({
    id: inviteData.user.id,
    email,
    name,
    role: "admin",
    admin_level: adminLevel,
    invited: true,
  });
});
