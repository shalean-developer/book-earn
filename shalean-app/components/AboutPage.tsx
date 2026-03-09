'use client';

import React from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Star,
  ShieldCheck,
  CheckCircle2,
  Award,
  Heart,
  Users,
  Target,
  Eye,
  ThumbsUp,
  MapPin,
  Sparkles,
} from 'lucide-react';

const TEAM_MEMBERS = [
  {
    name: 'Ashleigh van Wyk',
    role: 'Founder & CEO',
    photo:
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80',
    bio: "Ashleigh founded Shalean after recognizing a gap in Cape Town's cleaning market for a service that combined professionalism, reliability, and fair pricing.",
  },
  {
    name: 'Nomsa Dlamini',
    role: 'Head of Operations',
    photo:
      'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=300&q=80',
    bio: 'Nomsa oversees our team scheduling, quality control, and cleaner training programme — ensuring every Shalean clean meets our premium standard.',
  },
  {
    name: 'Bradley Adams',
    role: 'Customer Experience Manager',
    photo:
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
    bio: 'Bradley leads our customer support and satisfaction processes, making sure every client interaction reflects the Shalean commitment to excellence.',
  },
  {
    name: 'Fatima Hartley',
    role: 'Senior Cleaning Specialist',
    photo:
      'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80',
    bio: 'Fatima is one of our most experienced cleaners with 5+ years at Shalean, specializing in deep cleaning and move-in/out projects across Cape Town.',
  },
];

const VALUES = [
  {
    icon: <ShieldCheck className="w-6 h-6" />,
    title: 'Trust & Safety',
    desc: 'Every cleaner is rigorously vetted and fully insured. We take your safety seriously — every time.',
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: 'Professional Excellence',
    desc: 'We invest in continuous training and quality checks to ensure our team delivers outstanding results consistently.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Genuine Care',
    desc: 'We treat every home as if it were our own. Attention to detail, respect for your space, and care in every clean.',
  },
  {
    icon: <CheckCircle2 className="w-6 h-6" />,
    title: 'Transparency',
    desc: 'No hidden fees, no surprises. We believe in honest pricing and clear communication at every step.',
  },
  {
    icon: <ThumbsUp className="w-6 h-6" />,
    title: 'Accountability',
    desc: "If something isn't right, we fix it. Our 100% satisfaction guarantee backs every booking we take.",
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Community Focus',
    desc: "We're proud to be a Cape Town-based business, supporting local employment and serving our own community.",
  },
];

export const AboutPage = ({
  onNavigate,
}: {
  onNavigate: (page: string) => void;
}) => {
  return (
    <div className="pb-24">
      {/* Hero – same width and spacing as home (max-w-7xl, px-6) */}
      <div className="px-6 md:px-6 mt-2">
        <section className="max-w-7xl mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-24">
          <div className="max-w-4xl mx-auto text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <MapPin className="w-4 h-4" />
                Cape Town&apos;s Trusted Cleaning Service
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                About Shalean Cleaning Services in Cape Town
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed">
                We&apos;re a Cape Town-born cleaning company built on trust,
                quality, and a genuine passion for creating clean, healthy, and
                happy homes across South Africa.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Our Story – same card/section pattern as home */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-10"
            >
              <span className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 w-fit mb-5">
                <Sparkles className="w-4 h-4" /> Our Story
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-5 leading-tight">
                Born in Cape Town. Built on Trust.
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed">
                <p>
                  Shalean Cleaning Services was founded in Cape Town with a
                  simple but powerful idea: every home deserves to be cleaned by
                  someone who genuinely cares. We saw a gap in the market —
                  cleaning services that were either unreliable, overpriced, or
                  simply didn&apos;t deliver on their promises.
                </p>
                <p>
                  We started small, serving a handful of homes in Sea Point and
                  Gardens, and grew steadily through word of mouth — one
                  satisfied client at a time. Today, Shalean serves hundreds of
                  homes across Cape Town&apos;s most sought-after suburbs, from
                  Constantia to Durbanville, Claremont to Century City.
                </p>
                <p>
                  What makes us different isn&apos;t just the quality of our
                  clean — it&apos;s the people behind it. Our team of
                  professionally trained, vetted cleaners are more than
                  employees. They&apos;re the face of Shalean, and we invest in
                  them the same way we invest in our clients.
                </p>
              </div>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="relative"
            >
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden aspect-square">
                <img
                  src="https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80"
                  alt="Shalean professional cleaning team at work in Cape Town"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-4 -right-4 bg-white rounded-2xl border border-slate-100 shadow-lg p-5 max-w-[220px]">
                <div className="flex gap-1 mb-2">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className="w-4 h-4 text-amber-400 fill-amber-400"
                    />
                  ))}
                </div>
                <p className="text-sm font-bold text-slate-900 mb-1">
                  2,000+ Happy Homes
                </p>
                <p className="text-xs text-slate-500">Cleaned across Cape Town</p>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Mission & Vision */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-5 md:gap-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8"
            >
              <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6">
                <Target className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-4">
                Our Mission
              </h2>
              <p className="text-slate-600 leading-relaxed">
                To provide Cape Town homeowners, landlords, and Airbnb hosts with
                a cleaning service that&apos;s truly reliable, transparent, and
                professional — delivered by a team that takes genuine pride in
                every home they touch. We exist to make your life easier and your
                home a place you love coming back to.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="bg-blue-600 text-white rounded-2xl border border-blue-500 shadow-sm p-8"
            >
              <div className="w-14 h-14 bg-white/20 text-white rounded-2xl flex items-center justify-center mb-6">
                <Eye className="w-7 h-7" />
              </div>
              <h2 className="text-2xl font-bold mb-4">Our Vision</h2>
              <p className="text-blue-100 leading-relaxed">
                To become South Africa&apos;s most trusted residential cleaning
                service — a brand synonymous with quality, integrity, and
                innovation. We envision a future where booking a professional
                clean is as simple and reliable as any essential service, and
                where our team members are valued, empowered, and proud to wear
                the Shalean name.
              </p>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Why We Started */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto">
          <div className="text-center mb-8">
            <span className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 w-fit mb-4">
              <Heart className="w-4 h-4" /> Why We Started
            </span>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-2">
              The Problem We Set Out to Solve
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5 md:gap-6 text-left">
            {[
              {
                title: 'Unreliable Services',
                desc: "Too many Cape Town homeowners experienced cleaners who cancelled last-minute, arrived late, or simply didn't show up. We built systems to eliminate this.",
              },
              {
                title: 'Hidden Costs',
                desc: "Quotes that changed after the clean. Surprise charges. We built transparent, upfront pricing that's shown before any booking is confirmed.",
              },
              {
                title: 'Lack of Accountability',
                desc: "Unsatisfied clients with no recourse. We introduced a 100% satisfaction guarantee — if it's not right, we fix it at no cost.",
              },
            ].map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6"
              >
                <div className="w-10 h-10 bg-red-50 text-red-500 rounded-xl flex items-center justify-center mb-4">
                  <span className="text-lg font-bold">{idx + 1}</span>
                </div>
                <h3 className="font-bold text-slate-900 mb-2">{item.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  {item.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Values */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Our Values
            </h2>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              These values aren&apos;t just words on a wall — they guide every
              decision, every hire, and every clean we deliver.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {VALUES.map((value, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
              >
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 h-full hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {value.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Commitment to Quality */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-8 md:gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="rounded-2xl overflow-hidden border border-slate-100 shadow-sm aspect-video"
            >
              <img
                src="https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=800&q=80"
                alt="Shalean quality commitment"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-10"
            >
              <span className="inline-flex items-center gap-2 text-blue-600 font-semibold text-sm bg-blue-50 border border-blue-100 rounded-full px-4 py-1.5 w-fit mb-5">
                <Award className="w-4 h-4" /> Commitment to Quality
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-5 leading-tight">
                The Shalean Standard
              </h2>
              <div className="space-y-4 text-slate-600 leading-relaxed mb-8">
                <p>
                  Quality isn&apos;t an afterthought at Shalean — it&apos;s
                  built into every process. Before any cleaner joins our team,
                  they complete a multi-step vetting process that includes
                  background checks, reference verification, in-person
                  interviews, and hands-on skills assessment.
                </p>
                <p>
                  Our quality control doesn&apos;t stop at hiring. We conduct
                  regular spot-checks, use client feedback to improve our
                  processes, and maintain a strict satisfaction guarantee
                  policy.
                </p>
              </div>
              <div className="space-y-3">
                {[
                  'Multi-step cleaner vetting & background checks',
                  'Ongoing training and skills development',
                  'Post-clean quality follow-up on all bookings',
                  '100% satisfaction guarantee on every service',
                  'Fully insured — protecting your home and our team',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                    <span className="text-slate-700 font-medium text-sm">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Team Section */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Meet Our Professional Team
            </h2>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              The people behind Shalean — dedicated professionals who make clean
              homes a reality across Cape Town every single day.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {TEAM_MEMBERS.map((member, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                whileHover={{ y: -4 }}
              >
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:border-blue-200 hover:shadow-md transition-all group">
                  <div className="aspect-square overflow-hidden">
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-slate-900 mb-1">
                      {member.name}
                    </h3>
                    <p className="text-blue-600 text-sm font-semibold mb-3">
                      {member.role}
                    </p>
                    <p className="text-slate-500 text-xs leading-relaxed">
                      {member.bio}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Stats */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 py-16 md:py-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 px-6">
            {[
              { value: '2,000+', label: 'Homes cleaned in Cape Town' },
              { value: '4.9★', label: 'Average customer rating' },
              { value: '500+', label: 'Recurring monthly clients' },
              { value: '100%', label: 'Satisfaction guarantee' },
            ].map((stat, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.1 }}
                className="text-center text-white"
              >
                <p className="text-3xl md:text-4xl font-bold mb-2">
                  {stat.value}
                </p>
                <p className="text-blue-200 text-sm">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA – same pattern as home */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 lg:p-14 text-center max-w-3xl mx-auto">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck className="w-10 h-10 text-blue-600" />
            </div>
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-4">
              Book With Confidence
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-8 max-w-xl mx-auto">
              You now know who we are, what we stand for, and why hundreds of
              Cape Town homeowners trust Shalean every week. Join them today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => onNavigate('booking')}
                className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold text-base px-8 py-3.5 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg gap-2"
              >
                Book a Clean Now <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center justify-center rounded-full border-2 border-blue-600 text-blue-600 font-semibold text-base px-8 py-3.5 hover:bg-blue-50 transition-colors"
              >
                Get in Touch
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default AboutPage;
