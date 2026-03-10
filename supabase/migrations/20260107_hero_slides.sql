-- ============================================
-- Hero Slides Feature Migration
-- Creates hero_slides table and storage bucket
-- ============================================

-- ============================================
-- 1. CREATE HERO SLIDES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Custom Display Content (Override Text)
  title text NOT NULL,
  subtitle text,
  description text,
  cta_text text,
  cta_url text,

  -- Background Image
  background_image_url text,
  background_image_path text,

  -- Optional Content Reference (Link to Books/Authors/Posts)
  content_type text CHECK (content_type IN ('book', 'author', 'post', 'custom')),
  content_id uuid,  -- references books.id, profiles.id (authors), or posts.id

  -- Management
  order_weight integer DEFAULT 0,
  is_active boolean DEFAULT true,

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS hero_slides_active_idx ON public.hero_slides (is_active);
CREATE INDEX IF NOT EXISTS hero_slides_order_idx ON public.hero_slides (order_weight);
CREATE INDEX IF NOT EXISTS hero_slides_content_idx ON public.hero_slides (content_type, content_id);

-- Auto-update timestamp trigger
DROP TRIGGER IF EXISTS hero_slides_updated_at ON public.hero_slides;
CREATE TRIGGER hero_slides_updated_at
  BEFORE UPDATE ON public.hero_slides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- ============================================
-- 2. CREATE STORAGE BUCKET
-- ============================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('hero-backgrounds', 'hero-backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- 3. ROW LEVEL SECURITY POLICIES
-- ============================================

ALTER TABLE public.hero_slides ENABLE ROW LEVEL SECURITY;

-- Public can read active slides
DROP POLICY IF EXISTS "Hero slides: public can read active" ON public.hero_slides;
CREATE POLICY "Hero slides: public can read active"
  ON public.hero_slides FOR SELECT
  USING (is_active = true);

-- Admins have full access
DROP POLICY IF EXISTS "Hero slides: admins full access" ON public.hero_slides;
CREATE POLICY "Hero slides: admins full access"
  ON public.hero_slides FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- ============================================
-- 4. STORAGE POLICIES
-- ============================================

-- Public read access
DROP POLICY IF EXISTS "Hero backgrounds: public read" ON storage.objects;
CREATE POLICY "Hero backgrounds: public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'hero-backgrounds');

-- Admins can upload
DROP POLICY IF EXISTS "Hero backgrounds: admins upload" ON storage.objects;
CREATE POLICY "Hero backgrounds: admins upload"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'hero-backgrounds' AND public.is_admin());

-- Admins can update
DROP POLICY IF EXISTS "Hero backgrounds: admins update" ON storage.objects;
CREATE POLICY "Hero backgrounds: admins update"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'hero-backgrounds' AND public.is_admin());

-- Admins can delete
DROP POLICY IF EXISTS "Hero backgrounds: admins delete" ON storage.objects;
CREATE POLICY "Hero backgrounds: admins delete"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'hero-backgrounds' AND public.is_admin());

-- ============================================
-- 5. SEED DATA (Sample Slides)
-- ============================================

-- Insert sample slides to demonstrate the feature
INSERT INTO public.hero_slides (
  title,
  subtitle,
  description,
  cta_text,
  cta_url,
  content_type,
  order_weight,
  is_active
) VALUES
  (
    'Bem-vindo à Catalogus',
    'Livraria & Cultura Moçambicana',
    'Descubra uma seleção curada de livros, autores locais e eventos literários que celebram a rica herança cultural de Moçambique.',
    'Explorar Catálogo',
    '/loja',
    'custom',
    1,
    true
  ),
  (
    'Autores Moçambicanos em Destaque',
    'Vozes que Contam Nossas Histórias',
    'Conheça os escritores que estão moldando a literatura contemporânea e preservando nossas tradições através das palavras.',
    'Ver Autores',
    '/autores',
    'custom',
    2,
    true
  ),
  (
    'Novidades & Eventos Literários',
    'Participe da Nossa Comunidade',
    'Fique por dentro dos lançamentos, clubes do livro, oficinas criativas e eventos que celebram a literatura moçambicana.',
    'Ver Eventos',
    '/eventos',
    'custom',
    3,
    true
  )
ON CONFLICT DO NOTHING;
