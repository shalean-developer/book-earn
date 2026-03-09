import type { Metadata } from "next";
import Link from "next/link";
import { getPublishedBlogPosts } from "@/app/actions/blog";

export const metadata: Metadata = {
  title: "Cleaning Guides & Tips | Shalean Blog",
  description:
    "Cleaning guides, pricing breakdowns, and Airbnb hosting tips from Shalean Cleaning Services in Cape Town.",
};

export default async function BlogIndexPage() {
  const posts = await getPublishedBlogPosts({ limit: 50 });

  return (
    <main className="min-h-screen bg-slate-50 pb-24">
      <section className="px-6 md:px-8 pt-24 md:pt-28">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-100 shadow-sm p-6 md:p-10">
            <p className="inline-flex items-center gap-2 text-slate-600 text-xs md:text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-4">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              From the Shalean blog
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 tracking-tight mb-3">
              Cleaning guides &amp; Cape Town hosting tips
            </h1>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl">
              Practical advice on deep cleaning, transparent pricing, and running five-star short‑term
              rentals – written by the Shalean team.
            </p>
          </div>
        </div>
      </section>

      <section className="px-6 md:px-8 mt-8 md:mt-10">
        <div className="max-w-5xl mx-auto">
          {posts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center">
              <p className="text-slate-600 text-sm">
                No articles have been published yet. Check back soon for new cleaning guides.
              </p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-5 md:gap-6">
              {posts.map((post) => {
                const publishedAt = post.published_at ?? post.created_at;
                const dateLabel = new Date(publishedAt).toLocaleDateString("en-ZA", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                });
                const excerpt = post.seo_description ?? post.excerpt ?? "";
                const category = post.category ?? "Shalean";
                const image =
                  post.og_image_url ??
                  post.twitter_image_url ??
                  "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80";
                return (
                  <article
                    key={post.id}
                    className="group bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow duration-300"
                  >
                    <Link href={`/blog/${post.slug}`} className="flex flex-col h-full">
                      <div className="relative aspect-[16/9] overflow-hidden">
                        <img
                          src={image}
                          alt={post.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                          <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-full">
                            {category}
                          </span>
                          <span className="text-xs font-medium text-white/90 bg-black/40 px-2.5 py-1 rounded-full">
                            {dateLabel}
                          </span>
                        </div>
                      </div>
                      <div className="p-6 flex flex-col flex-grow">
                        <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        {excerpt && (
                          <p className="text-slate-600 text-sm leading-relaxed mb-4 line-clamp-3 flex-grow">
                            {excerpt}
                          </p>
                        )}
                        <span className="inline-flex items-center gap-2 text-blue-600 font-semibold text-xs mt-auto">
                          Read article
                          <span aria-hidden>→</span>
                        </span>
                      </div>
                    </Link>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

