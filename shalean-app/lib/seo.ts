import type { Metadata } from "next";
import type { BlogPost } from "@/lib/blog-types";

export function buildBlogPostMetadata(post: BlogPost, baseUrl: string): Metadata {
  const url = post.canonical_url || `${baseUrl}/blog/${post.slug}`;
  const baseTitle = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || "";
  const image = post.og_image_url || post.twitter_image_url || undefined;

  return {
    title: `${baseTitle} | Shalean Blog`,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title: post.og_title || baseTitle,
      description: post.og_description || description,
      url,
      type: "article",
      images: image ? [image] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.twitter_title || baseTitle,
      description: post.twitter_description || description,
      images: image ? [image] : [],
    },
    robots: {
      index: post.indexable,
      follow: post.follow_links,
    },
  };
}

export function buildBlogPostJsonLd(post: BlogPost, baseUrl: string) {
  if (post.structured_data) {
    return post.structured_data;
  }

  const url = post.canonical_url || `${baseUrl}/blog/${post.slug}`;
  const headline = post.seo_title || post.title;
  const description = post.seo_description || post.excerpt || "";
  const image = post.og_image_url || post.twitter_image_url || undefined;

  const publishedAt = post.published_at ?? post.created_at;
  const updatedAt = post.updated_at;

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Article",
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    headline,
    description,
    datePublished: publishedAt,
    dateModified: updatedAt,
    url,
  };

  if (image) {
    jsonLd.image = [image];
  }

  return jsonLd;
}

