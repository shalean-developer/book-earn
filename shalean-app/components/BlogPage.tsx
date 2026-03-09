"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ArrowRight, Calendar, Clock, User, Tag, Search, ArrowLeft, Share2, Facebook, Twitter, Linkedin, MessageSquare, Sparkles, Bookmark } from 'lucide-react';

// --- Types ---

interface Author {
  name: string;
  role: string;
  avatar: string;
}
interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  content: string[];
  category: string;
  author: Author;
  date: string;
  readTime: string;
  image: string;
  featured?: boolean;
}

// --- Mock Data ---

const BLOG_POSTS: BlogPost[] = [{
  id: 'deep-cleaning-guide',
  title: "Complete Guide to Deep Cleaning Your Cape Town Home",
  category: "Deep Cleaning",
  date: "May 15, 2024",
  readTime: "8 min read",
  featured: true,
  image: "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
  author: {
    name: "Sarah Meyer",
    role: "Cleaning Specialist",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
  },
  excerpt: "Everything you need to know about scheduling a professional deep clean, what's covered, and how to prepare your home for the best results.",
  content: ["Deep cleaning isn't just about making things look pretty—it's about hygiene, longevity of your home's surfaces, and the peace of mind that comes with a truly sanitized environment.", "In Cape Town's coastal climate, dust and salt air can accumulate faster than you might think. This guide breaks down the essential checklist for a professional-grade deep clean.", "1. The Kitchen: Moving appliances to clean behind them, degreasing the oven, and sanitizing the inside of all cabinets.", "2. The Bathrooms: Scrubbing grout lines, descaling shower heads, and deep-cleaning the exhaust fans.", "3. Living Areas: Dusting high-reach areas, cleaning skirting boards, and professional carpet steam cleaning.", "Why choose a professional service? While many homeowners try to DIY, a professional team has the commercial-grade equipment and specialized chemicals (many of which are eco-friendly) to achieve results that are impossible with standard household tools."]
}, {
  id: 'cleaning-costs-2024',
  title: "How Much Does Cleaning Cost in Cape Town? (2024 Guide)",
  category: "Pricing Guide",
  date: "June 02, 2024",
  readTime: "5 min read",
  image: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80",
  author: {
    name: "David Chen",
    role: "Operations Manager",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&q=80"
  },
  excerpt: "A transparent breakdown of cleaning service costs across Cape Town suburbs, including factors that influence pricing.",
  content: ["Pricing for cleaning services in Cape Town can vary significantly based on your location, the size of your property, and the level of service required.", "Most reputable agencies now offer flat-rate pricing based on bedroom and bathroom counts, which provides the most transparency for consumers.", "Factors that impact the price include:", "- Property size (Square footage and room count)", "- Frequency (One-off vs. Weekly recurring discounts)", "- Specialized needs (Pet hair removal, interior window cleaning)", "At Shalean, we believe in upfront pricing. Our goal is to provide a premium service that remains accessible to all Cape Town residents."]
}, {
  id: 'airbnb-checklist',
  title: "The Ultimate Airbnb Turnover Checklist for 5-Star Reviews",
  category: "Airbnb",
  date: "June 12, 2024",
  readTime: "6 min read",
  image: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80",
  author: {
    name: "Elena Rodriguez",
    role: "Hospitality Lead",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=150&q=80"
  },
  excerpt: "Maintain your Superhost status with our professional turnover guide. Learn the small details that make a big difference.",
  content: ["In the world of short-term rentals, cleanliness is the #1 factor in guest reviews. A single stray hair can be the difference between a 5-star and a 3-star rating.", "Our hospitality team has managed thousands of turnovers in Cape Town's most popular Airbnb hubs like Sea Point and the CBD. Here is our secret sauce:", "The 'Hotel Feel': It's not just clean; it's staged. Towels must be folded precisely, toilet paper ends pointed, and linens perfectly crisp.", "Inventory Checks: Part of a good turnover is checking for damage or missing items. We check lightbulbs, remote batteries, and basic amenities.", "The Scent of Clean: We avoid heavy chemical smells, opting for subtle, fresh scents that tell guests the space has been recently prepared just for them."]
}, {
  id: 'eco-friendly-tips',
  title: "5 Eco-Friendly Cleaning Hacks You Can Try at Home",
  category: "Tips & Tricks",
  date: "May 20, 2024",
  readTime: "4 min read",
  image: "https://images.unsplash.com/photo-1528740561666-dc2479dc08ab?auto=format&fit=crop&w=800&q=80",
  author: {
    name: "Sarah Meyer",
    role: "Cleaning Specialist",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80"
  },
  excerpt: "Clean your home without harsh chemicals. These simple, natural ingredients are likely already in your pantry.",
  content: ["Sustainability is at the core of what we do. While we use professional-grade eco-friendly products, you can maintain your home between visits with these simple hacks.", "1. Lemon for Faucets: Cut a lemon in half and rub it over chrome faucets to remove hard water stains and leave a fresh scent.", "2. Vinegar for Windows: A 50/50 mix of white vinegar and water is often more effective than blue spray cleaners.", "3. Baking Soda for Ovens: Make a paste with water, let it sit overnight, and watch grease wipe away effortlessly.", "4. Essential Oils: Add a few drops of tea tree or lavender to your mop water for natural antibacterial properties."]
}];
const CATEGORIES = ["All", "Deep Cleaning", "Pricing Guide", "Airbnb", "Tips & Tricks", "Company News"];

// --- Components ---

const BlogCard = ({
  post,
  onClick
}: {
  post: BlogPost;
  onClick: (id: string) => void;
}) => <motion.div whileHover={{ y: -4 }} className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 flex flex-col h-full cursor-pointer hover:shadow-md transition-all duration-300" onClick={() => onClick(post.id)}>
    <div className="relative aspect-[16/9] overflow-hidden">
      <img src={post.image} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
        <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-full">
          {post.category}
        </span>
        <span className="text-xs font-medium text-white/90 bg-black/40 px-2.5 py-1 rounded-full">
          {post.readTime}
        </span>
      </div>
    </div>
    <div className="p-6 flex flex-col flex-grow">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Calendar className="w-3.5 h-3.5" />
          <span>{post.date}</span>
        </div>
        <div className="flex items-center gap-1.5 text-slate-400 text-xs">
          <Clock className="w-3.5 h-3.5" />
          <span>{post.readTime}</span>
        </div>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
        {post.title}
      </h3>
      <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3 flex-grow">
        {post.excerpt}
      </p>
      <div className="flex items-center justify-between pt-4 border-t border-slate-50">
        <div className="flex items-center gap-3">
          <img src={post.author.avatar} alt={post.author.name} className="w-8 h-8 rounded-full object-cover" />
          <div className="text-[10px]">
            <p className="font-bold text-slate-900">{post.author.name}</p>
            <p className="text-slate-500">{post.author.role}</p>
          </div>
        </div>
        <div className="text-blue-600">
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </div>
  </motion.div>;

const BlogDetail = ({
  post,
  onBack,
  onNavigate
}: {
  post: BlogPost;
  onBack: () => void;
  onNavigate?: (page: string) => void;
}) => <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="pb-24">
    <section className="px-6 md:px-6 mt-8 md:mt-10">
      <div className="max-w-7xl mx-auto">
        <button type="button" onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-blue-600 transition-colors mb-8 group font-semibold text-sm">
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
          Back to Blog
        </button>
      </div>
    </section>
    <section className="px-6 md:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
    <div className="mb-10 text-center">
      <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-4">
        <Tag className="w-4 h-4 text-slate-500" />
        <span>{post.category}</span>
      </span>
      <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-6 leading-tight">
        {post.title}
      </h1>
      <div className="flex flex-wrap items-center justify-center gap-6 text-slate-500">
        <div className="flex items-center gap-3 text-left">
          <img src={post.author.avatar} alt={post.author.name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-sm" />
          <div>
            <p className="font-bold text-slate-900 leading-none">{post.author.name}</p>
            <p className="text-xs">{post.author.role}</p>
          </div>
        </div>
        <div className="w-px h-8 bg-slate-200 hidden sm:block" />
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          <span className="text-sm font-medium">{post.date}</span>
        </div>
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4" />
          <span className="text-sm font-medium">{post.readTime}</span>
        </div>
      </div>
    </div>

    <div className="rounded-2xl overflow-hidden shadow-sm border border-slate-100 mb-12 aspect-[21/9]">
      <img src={post.image} alt={post.title} className="w-full h-full object-cover" />
    </div>

    <div className="grid lg:grid-cols-[1fr_200px] gap-12">
      <article className="prose prose-slate lg:prose-lg max-w-none">
        {post.content.map((paragraph, idx) => <p key={idx} className="text-slate-600 leading-relaxed text-lg mb-6">
            {paragraph}
          </p>)}
        
        <div className="mt-12 p-6 md:p-8 bg-slate-50 rounded-2xl border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Ready for a clean home?
          </h3>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-6">
            Join thousands of happy homeowners who trust Shalean for their cleaning needs. Book your first session in under 60 seconds.
          </p>
          <button
            type="button"
            onClick={() => onNavigate?.('quote')}
            className="inline-flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base px-6 py-3.5 transition-colors"
          >
            Get an Instant Quote <ChevronRight className="w-5 h-5 ml-1" />
          </button>
        </div>
      </article>

      <aside className="space-y-8">
        <div>
          <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest">Share</h4>
          <div className="flex flex-col gap-2">
            <button type="button" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-slate-600 hover:text-blue-600">
              <Facebook className="w-5 h-5" />
              <span className="text-sm font-semibold">Facebook</span>
            </button>
            <button type="button" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-slate-600 hover:text-blue-600">
              <Twitter className="w-5 h-5" />
              <span className="text-sm font-semibold">Twitter</span>
            </button>
            <button type="button" className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-blue-50 hover:border-blue-200 transition-all text-slate-600 hover:text-blue-600">
              <Linkedin className="w-5 h-5" />
              <span className="text-sm font-semibold">LinkedIn</span>
            </button>
          </div>
        </div>

        <div>
          <h4 className="font-bold text-slate-900 mb-4 uppercase text-xs tracking-widest">Support</h4>
          <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100">
            <MessageSquare className="w-8 h-8 text-emerald-600 mb-4" />
            <p className="font-bold text-emerald-900 mb-2">Have questions?</p>
            <p className="text-emerald-700 text-sm mb-4">Chat with our team on WhatsApp for instant help.</p>
            <a href="https://wa.me/27825915525" target="_blank" rel="noopener noreferrer" className="block w-full bg-emerald-600 text-white py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors text-sm text-center">
              WhatsApp Us
            </a>
          </div>
        </div>
      </aside>
    </div>
        </div>
      </div>
    </section>
  </motion.div>;

export const BlogPage = ({
  onNavigate
}: {
  onNavigate?: (page: string) => void;
}) => {
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const filteredPosts = BLOG_POSTS.filter(post => {
    const matchesCategory = activeCategory === "All" || post.category === activeCategory;
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });
  const featuredPost = BLOG_POSTS.find(p => p.featured);
  const selectedPost = BLOG_POSTS.find(p => p.id === selectedPostId);
  if (selectedPostId && selectedPost) {
    return <BlogDetail post={selectedPost} onBack={() => setSelectedPostId(null)} onNavigate={onNavigate} />;
  }
  return <div className="pb-24">
      {/* Hero Section — same pattern as Home: pill + heading inside white card */}
      <section className="px-6 md:px-6 mt-8 md:mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
            <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-4">
              <Search className="w-4 h-4 text-slate-500" />
              From the blog
            </span>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-2">
              The <span className="text-blue-600">Clean</span> Slate
            </h1>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-xl mb-8">
              Expert advice, cleaning guides, and hospitality insights from South Africa&apos;s leading cleaning professionals.
            </p>
            <div className="relative max-w-lg">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="Search articles..." className="w-full pl-12 pr-4 py-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
            </div>
          </div>
        </div>
      </section>

      {/* Categories — inside same-section white card pattern */}
      <section className="px-6 md:px-6 mt-8 md:mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map(cat => <button key={cat} type="button" onClick={() => setActiveCategory(cat)} className={`px-6 py-2 rounded-full font-bold text-sm transition-all ${activeCategory === cat ? 'bg-blue-500 text-white hover:bg-blue-600' : 'bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-100'}`}>
                {cat}
              </button>)}
            </div>
          </div>
        </div>
      </section>

      {/* Featured Post — card style like Home blog preview */}
      {featuredPost && activeCategory === "All" && !searchQuery && <section className="px-6 md:px-6 mt-8 md:mt-10">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedPostId(featuredPost.id)}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedPostId(featuredPost.id)}
              className="group h-full bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col cursor-pointer"
            >
              <div className="flex flex-col md:flex-row">
                <div className="w-full md:w-1/2 aspect-[16/10] md:aspect-auto md:min-h-[320px] overflow-hidden relative">
                  <img src={featuredPost.image} alt={featuredPost.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">
                    <span className="text-xs font-semibold text-white bg-blue-600 px-3 py-1.5 rounded-full">
                      {featuredPost.category}
                    </span>
                    <span className="text-xs font-medium text-white/90 bg-black/40 px-2.5 py-1 rounded-full">
                      {featuredPost.readTime}
                    </span>
                  </div>
                </div>
                <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col flex-grow justify-center">
                  <span className="inline-flex items-center gap-2 text-blue-600 text-xs font-semibold uppercase tracking-wider mb-3">
                    Featured Article
                  </span>
                  <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-3 leading-tight group-hover:text-blue-600 transition-colors">
                    {featuredPost.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed flex-grow mb-6 line-clamp-3">
                    {featuredPost.excerpt}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img src={featuredPost.author.avatar} alt={featuredPost.author.name} className="w-10 h-10 rounded-full object-cover border-2 border-slate-100" />
                      <div className="text-[10px]">
                        <p className="font-bold text-slate-900">{featuredPost.author.name}</p>
                        <p className="text-slate-500">{featuredPost.author.role}</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm group-hover:gap-3 transition-all">
                      Read full guide <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>}

      {/* Articles Grid — white card wrapper like Home sections */}
      <section className="px-6 md:px-6 mt-8 md:mt-10 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight">
                {activeCategory === "All" ? "Latest Articles" : activeCategory}
                <span className="ml-3 text-sm font-medium text-slate-400">({filteredPosts.length})</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              <AnimatePresence mode="popLayout">
                {filteredPosts.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: idx * 0.06 }}
                  >
                    <BlogCard post={post} onClick={setSelectedPostId} />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {filteredPosts.length === 0 && <div className="text-center py-16 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm border border-slate-100">
                <Search className="w-6 h-6 text-slate-300" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">No articles found</h3>
              <p className="text-slate-500 text-sm mb-4">Try adjusting your filters or search terms.</p>
              <button type="button" onClick={() => { setActiveCategory("All"); setSearchQuery(""); }} className="inline-flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base px-6 py-3 transition-colors">
                Clear all filters
              </button>
            </div>}
          </div>
        </div>
      </section>

      {/* Newsletter — same rounded and spacing as Home "How it works" blue block */}
      <section className="px-6 md:px-6 mt-8 md:mt-10 pb-8">
        <div className="max-w-7xl mx-auto">
          <div className="rounded-2xl md:rounded-3xl bg-blue-600 shadow-xl p-6 md:p-8 lg:p-10 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-400 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
          </div>
          
          <div className="relative z-10">
            <h2 className="text-3xl md:text-5xl font-black mb-6">Never miss a tip</h2>
            <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
              Subscribe to our monthly newsletter for exclusive cleaning hacks, seasonal offers, and Cape Town living guides.
            </p>
            <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto" onSubmit={e => e.preventDefault()}>
              <input type="email" placeholder="Enter your email" className="flex-grow px-6 py-4 rounded-2xl bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/50 backdrop-blur-sm" />
              <button type="submit" className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold hover:bg-blue-50 transition-all shadow-xl">
                Subscribe
              </button>
            </form>
            <p className="text-blue-200 text-xs mt-6">
              Join 5,000+ subscribers. Unsubscribe at any time.
            </p>
          </div>
          </div>
        </div>
      </section>
    </div>;
};
export default BlogPage;
