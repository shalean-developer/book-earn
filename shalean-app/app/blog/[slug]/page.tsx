import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBlogPostBySlug } from "@/app/actions/blog";
import { buildBlogPostMetadata, buildBlogPostJsonLd } from "@/lib/seo";

type Props = { params: Promise<{ slug: string }> };

async function loadPost(slug: string) {
  const post = await getBlogPostBySlug(slug);
  if (!post) return null;
  if (post.status !== "published" || !post.indexable || !post.published_at) {
    return null;
  }
  return post;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) {
    return {
      title: "Article not found | Shalean Blog",
      description: "The requested cleaning guide could not be found.",
      robots: { index: false, follow: true },
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  return buildBlogPostMetadata(post, baseUrl);
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await loadPost(slug);
  if (!post) {
    notFound();
  }

  const publishedAt = post.published_at ?? post.created_at;
  const dateLabel = new Date(publishedAt).toLocaleDateString("en-ZA", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const contentParagraphs = post.content
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  const category = post.category ?? "Shalean";
  const image =
    post.og_image_url ??
    post.twitter_image_url ??
    "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1600&q=80";

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "";
  const jsonLd = buildBlogPostJsonLd(post, baseUrl);

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <article className="px-6 md:px-8 pt-24 md:pt-28">
        <div className="max-w-4xl mx-auto">
          <header className="mb-10">
            <p className="inline-flex items-center gap-2 text-slate-600 text-xs md:text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              {category}
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-4">
              {post.title}
            </h1>
            <p className="text-slate-500 text-sm md:text-base">
              {dateLabel}
            </p>
          </header>

          <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 mb-10 aspect-[16/7] bg-slate-100">
            <img
              src={image}
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm p-6 md:p-10">
            <script
              type="application/ld+json"
              // eslint-disable-next-line react/no-danger
              dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <div className="prose prose-slate md:prose-lg max-w-none">
              {contentParagraphs.map((paragraph, idx) => (
                <p key={idx}>{paragraph}</p>
              ))}
            </div>
            <div className="mt-10 rounded-2xl border border-slate-100 bg-slate-50 p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-2">
                Need a professional clean in Cape Town?
              </h2>
              <p className="text-slate-600 mb-4">
                Book a Shalean cleaner for your home or Airbnb in Cape Town, or compare our{" "}
                <a href="/pricing" className="text-blue-600 hover:underline">
                  cleaning service pricing
                </a>
                .
              </p>
              <div className="flex flex-wrap gap-3">
                <a
                  href="/booking/standard-cleaning"
                  className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm px-5 py-2.5 hover:bg-blue-700 transition-colors"
                >
                  Book a cleaning
                </a>
                <a
                  href="/quote"
                  className="inline-flex items-center justify-center rounded-full border border-blue-600 text-blue-600 font-semibold text-sm px-5 py-2.5 hover:bg-blue-50 transition-colors"
                >
                  Get a cleaning quote
                </a>
              </div>
            </div>
          </div>
        </div>
      </article>
    </main>
  );
}

