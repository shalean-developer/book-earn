-- Blog posts table with rich per-post SEO configuration.
-- Run in Supabase SQL Editor or via: supabase db push

CREATE TABLE IF NOT EXISTS public.blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Core content
  slug TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  category TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- SEO meta
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT,
  canonical_url TEXT,

  -- Open Graph
  og_title TEXT,
  og_description TEXT,
  og_image_url TEXT,

  -- Twitter
  twitter_title TEXT,
  twitter_description TEXT,
  twitter_image_url TEXT,

  -- Robots / indexing
  indexable BOOLEAN NOT NULL DEFAULT true,
  follow_links BOOLEAN NOT NULL DEFAULT true,

  -- Optional structured data override/extension (JSON-LD)
  structured_data JSONB
);

-- Unique slug for routing (e.g. /blog/my-post)
CREATE UNIQUE INDEX IF NOT EXISTS blog_posts_slug_key
  ON public.blog_posts (slug);

-- Index for public blog listing (status + published_at)
CREATE INDEX IF NOT EXISTS blog_posts_status_published_at_idx
  ON public.blog_posts (status, published_at DESC);

-- Enable RLS; server actions typically use service role to bypass.
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;

-- Public can read only published & indexable posts.
CREATE POLICY "Public can read published blog posts"
  ON public.blog_posts FOR SELECT
  USING (
    status = 'published'
    AND indexable = true
  );

-- Admins can manage blog posts (insert/update/delete) when using anon key.
CREATE POLICY "Admins can manage blog posts"
  ON public.blog_posts
  FOR ALL
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

COMMENT ON TABLE public.blog_posts IS 'Marketing blog posts with rich per-post SEO settings.';

