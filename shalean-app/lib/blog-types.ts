export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  category: string | null;
  status: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;

  seo_title: string | null;
  seo_description: string | null;
  seo_keywords: string | null;
  canonical_url: string | null;

  og_title: string | null;
  og_description: string | null;
  og_image_url: string | null;

  twitter_title: string | null;
  twitter_description: string | null;
  twitter_image_url: string | null;

  indexable: boolean;
  follow_links: boolean;
  structured_data: unknown | null;
}

export interface BlogPostInput {
  id?: string;
  slug?: string;
  title: string;
  excerpt?: string | null;
  content: string;
  category?: string | null;
  status?: string;
  published_at?: string | null;

  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonical_url?: string | null;

  og_title?: string | null;
  og_description?: string | null;
  og_image_url?: string | null;

  twitter_title?: string | null;
  twitter_description?: string | null;
  twitter_image_url?: string | null;

  indexable?: boolean;
  follow_links?: boolean;
  structured_data?: unknown | string | null;
}

export interface BlogPostListParams {
  status?: string;
  category?: string;
  search?: string;
  limit?: number;
  offset?: number;
}

