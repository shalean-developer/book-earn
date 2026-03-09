"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { getProfileForSession } from "@/app/actions/profile";
import type { BlogPost, BlogPostInput, BlogPostListParams } from "@/lib/blog-types";

function isAdmin(profile: { role: string } | null): boolean {
  return !!profile && profile.role === "admin";
}

export async function getBlogPostsForAdmin(
  params: BlogPostListParams = {}
): Promise<BlogPost[]> {
  const profile = await getProfileForSession();
  if (!isAdmin(profile)) return [];

  try {
    const supabase = createServerSupabase();
    let query = supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, content, category, status, published_at, created_at, updated_at, " +
          "seo_title, seo_description, seo_keywords, canonical_url, " +
          "og_title, og_description, og_image_url, " +
          "twitter_title, twitter_description, twitter_image_url, " +
          "indexable, follow_links, structured_data"
      )
      .order("created_at", { ascending: false });

    if (params.status) {
      query = query.eq("status", params.status);
    }
    if (params.category) {
      query = query.eq("category", params.category);
    }
    if (params.search) {
      const search = params.search.trim();
      if (search) {
        query = query.or(
          `title.ilike.%${search}%,excerpt.ilike.%${search}%,slug.ilike.%${search}%`
        );
      }
    }
    if (params.limit) {
      const from = params.offset ?? 0;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as unknown as BlogPost[];
  } catch {
    return [];
  }
}

export async function getPublishedBlogPosts(
  params: { limit?: number; offset?: number; category?: string } = {}
): Promise<BlogPost[]> {
  try {
    const supabase = createServerSupabase();
    let query = supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, content, category, status, published_at, created_at, updated_at, " +
          "seo_title, seo_description, seo_keywords, canonical_url, " +
          "og_title, og_description, og_image_url, " +
          "twitter_title, twitter_description, twitter_image_url, " +
          "indexable, follow_links, structured_data"
      )
      .eq("status", "published")
      .eq("indexable", true)
      .not("published_at", "is", null)
      .order("published_at", { ascending: false });

    if (params.category) {
      query = query.eq("category", params.category);
    }
    if (params.limit) {
      const from = params.offset ?? 0;
      const to = from + params.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error || !data) return [];
    return data as unknown as BlogPost[];
  } catch {
    return [];
  }
}

export async function getBlogPostBySlug(slug: string): Promise<BlogPost | null> {
  if (!slug.trim()) return null;

  try {
    const supabase = createServerSupabase();
    const { data, error } = await supabase
      .from("blog_posts")
      .select(
        "id, slug, title, excerpt, content, category, status, published_at, created_at, updated_at, " +
          "seo_title, seo_description, seo_keywords, canonical_url, " +
          "og_title, og_description, og_image_url, " +
          "twitter_title, twitter_description, twitter_image_url, " +
          "indexable, follow_links, structured_data"
      )
      .eq("slug", slug)
      .maybeSingle();

    if (error || !data) return null;
    return data as unknown as BlogPost;
  } catch {
    return null;
  }
}

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ensureUniqueSlug(
  supabase: ReturnType<typeof createServerSupabase>,
  baseSlug: string,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug || "post";
  let suffix = 0;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    let query = supabase.from("blog_posts").select("id").eq("slug", slug).limit(1);
    if (excludeId) {
      query = query.neq("id", excludeId);
    }
    const { data, error } = await query;
    if (error) {
      return slug;
    }
    if (!data || data.length === 0) {
      return slug;
    }
    suffix += 1;
    slug = `${baseSlug}-${suffix}`;
  }
}

const BLOG_IMAGE_MAX_BYTES = 4 * 1024 * 1024; // 4MB
const BLOG_IMAGE_ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

export async function uploadBlogImage(
  formData: FormData
): Promise<{ ok: true; url: string } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!isAdmin(profile)) {
    return { ok: false, error: "Only admins can upload blog images." };
  }

  try {
    const file = formData.get("image");
    if (!file || !(file instanceof File)) {
      return { ok: false, error: "No image file provided." };
    }

    if (file.size > BLOG_IMAGE_MAX_BYTES) {
      return { ok: false, error: "Image must be 4MB or smaller." };
    }
    if (!BLOG_IMAGE_ALLOWED_TYPES.includes(file.type)) {
      return {
        ok: false,
        error: "Use a JPEG, PNG, GIF, or WebP image.",
      };
    }

    const supabase = createServerSupabase();
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const safeExt = ["jpeg", "jpg", "png", "gif", "webp"].includes(ext) ? ext : "jpg";
    const path = `blog/${Date.now()}-${Math.random().toString(36).slice(2)}.${safeExt}`;

    const { error } = await supabase.storage.from("blog-images").upload(path, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) {
      return { ok: false, error: error.message };
    }

    const { data: urlData } = supabase.storage.from("blog-images").getPublicUrl(path);
    return { ok: true, url: urlData.publicUrl };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

export async function createOrUpdateBlogPost(
  input: BlogPostInput
): Promise<{ ok: true; post: BlogPost } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!isAdmin(profile)) {
    return { ok: false, error: "Only admins can manage blog posts." };
  }

  const title = input.title?.trim();
  const content = input.content?.trim();
  if (!title || !content) {
    return { ok: false, error: "Title and content are required." };
  }

  try {
    const supabase = createServerSupabase();

    const baseSlug = (input.slug ?? generateSlug(title)).trim() || generateSlug(title);
    const slug = await ensureUniqueSlug(supabase, baseSlug, input.id);

    const nowIso = new Date().toISOString();
    const status = input.status ?? "draft";
    let publishedAt: string | null =
      input.published_at ?? (status === "published" ? nowIso : null);

    // If explicitly unpublishing, clear published_at.
    if (status !== "published" && input.published_at === null) {
      publishedAt = null;
    }

    let structuredData = input.structured_data ?? null;
    if (typeof structuredData === "string" && structuredData.trim()) {
      try {
        structuredData = JSON.parse(structuredData);
      } catch {
        return { ok: false, error: "Structured data must be valid JSON." };
      }
    }

    const payload: Record<string, unknown> = {
      slug,
      title,
      excerpt: input.excerpt?.trim() || null,
      content,
      category: input.category?.trim() || null,
      status,
      published_at: publishedAt,
      updated_at: nowIso,

      seo_title: input.seo_title?.trim() || null,
      seo_description: input.seo_description?.trim() || null,
      seo_keywords: input.seo_keywords?.trim() || null,
      canonical_url: input.canonical_url?.trim() || null,

      og_title: input.og_title?.trim() || null,
      og_description: input.og_description?.trim() || null,
      og_image_url: input.og_image_url?.trim() || null,

      twitter_title: input.twitter_title?.trim() || null,
      twitter_description: input.twitter_description?.trim() || null,
      twitter_image_url: input.twitter_image_url?.trim() || null,

      indexable: input.indexable ?? true,
      follow_links: input.follow_links ?? true,
      structured_data: structuredData,
    };

    let result: BlogPost | null = null;

    if (input.id) {
      const { data, error } = await supabase
        .from("blog_posts")
        .update(payload)
        .eq("id", input.id)
        .select(
          "id, slug, title, excerpt, content, category, status, published_at, created_at, updated_at, " +
            "seo_title, seo_description, seo_keywords, canonical_url, " +
            "og_title, og_description, og_image_url, " +
            "twitter_title, twitter_description, twitter_image_url, " +
            "indexable, follow_links, structured_data"
        )
        .maybeSingle();
      if (error || !data) {
        return { ok: false, error: error?.message ?? "Failed to update blog post." };
      }
      result = data as unknown as BlogPost;
    } else {
      const insertPayload = {
        ...payload,
        created_at: nowIso,
      };
      const { data, error } = await supabase
        .from("blog_posts")
        .insert(insertPayload)
        .select(
          "id, slug, title, excerpt, content, category, status, published_at, created_at, updated_at, " +
            "seo_title, seo_description, seo_keywords, canonical_url, " +
            "og_title, og_description, og_image_url, " +
            "twitter_title, twitter_description, twitter_image_url, " +
            "indexable, follow_links, structured_data"
        )
        .maybeSingle();
      if (error || !data) {
        return { ok: false, error: error?.message ?? "Failed to create blog post." };
      }
      result = data as unknown as BlogPost;
    }

    return { ok: true, post: result };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Something went wrong.";
    return { ok: false, error: message };
  }
}

export async function deleteBlogPost(
  id: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!isAdmin(profile)) {
    return { ok: false, error: "Only admins can delete blog posts." };
  }
  if (!id.trim()) {
    return { ok: false, error: "Invalid blog post id." };
  }

  try {
    const supabase = createServerSupabase();
    const { error } = await supabase.from("blog_posts").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

export async function togglePublishBlogPost(
  id: string,
  publish: boolean
): Promise<{ ok: true } | { ok: false; error: string }> {
  const profile = await getProfileForSession();
  if (!isAdmin(profile)) {
    return { ok: false, error: "Only admins can publish blog posts." };
  }
  if (!id.trim()) {
    return { ok: false, error: "Invalid blog post id." };
  }

  try {
    const supabase = createServerSupabase();
    const nowIso = new Date().toISOString();
    const updates: Record<string, unknown> = {
      status: publish ? "published" : "draft",
      updated_at: nowIso,
    };
    if (publish) {
      updates.published_at = nowIso;
      if (!("indexable" in updates)) {
        updates.indexable = true;
      }
      if (!("follow_links" in updates)) {
        updates.follow_links = true;
      }
    } else {
      updates.published_at = null;
    }

    const { error } = await supabase.from("blog_posts").update(updates).eq("id", id);
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch {
    return { ok: false, error: "Something went wrong." };
  }
}

