'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  CheckCircle2,
  Star,
  Users,
  Clock,
  Award,
  Heart,
  Zap,
  Briefcase,
  Upload,
  Loader2,
  CheckCircle,
} from 'lucide-react';

type PageType =
  | 'home'
  | 'services'
  | 'booking'
  | 'locations'
  | 'about'
  | 'blog'
  | 'contact'
  | 'careers'
  | 'pricing';

interface CareersPageProps {
  onNavigate: (page: PageType) => void;
}

const Button = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
  type = 'button',
  disabled = false,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit';
  disabled?: boolean;
}) => {
  const base =
    'px-6 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
    outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
    ghost: 'text-slate-600 hover:text-blue-600 hover:bg-slate-100',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const WHY_WORK = [
  {
    icon: <Clock className="w-6 h-6" />,
    title: 'Flexible Scheduling',
    desc: 'Choose shifts that fit your life. We work around your availability — mornings, afternoons, and weekends available.',
  },
  {
    icon: <Award className="w-6 h-6" />,
    title: 'Competitive Pay',
    desc: 'Earn above-market rates with performance bonuses, tips, and a clear pathway to higher earnings.',
  },
  {
    icon: <Heart className="w-6 h-6" />,
    title: 'Supportive Team Culture',
    desc: 'Join a team that genuinely values and respects you. We invest in our people and their long-term growth.',
  },
  {
    icon: <Star className="w-6 h-6" />,
    title: 'Training & Development',
    desc: "Receive comprehensive onboarding and ongoing training. No experience? No problem — we'll train you.",
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: 'Steady Work Flow',
    desc: 'Consistent bookings across Cape Town means you always have work. No dry spells, no uncertainty.',
  },
  {
    icon: <Users className="w-6 h-6" />,
    title: 'Growth Opportunities',
    desc: 'From cleaner to team leader to senior specialist — there\'s a career path at Shalean for those who want to grow.',
  },
];

const REQUIREMENTS = [
  'South African ID or valid work permit',
  'Reliable transportation or access to public transport',
  'Clean criminal record (background check required)',
  'Strong attention to detail and work ethic',
  'Good communication skills',
  'Smartphone for booking management app',
  'Willingness to undergo our onboarding training programme',
  'Minimum age of 18 years',
];

const BENEFITS = [
  'Competitive hourly rates with regular reviews',
  'Performance bonuses and client tip-sharing',
  'Full training and onboarding at no cost',
  'Equipment and supplies provided by Shalean',
  'Weekly payment schedule',
  'Liability insurance coverage while working',
  'Access to in-app scheduling and support',
  'Recognition and rewards programme',
];

interface FormData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  experience: string;
  availability: string;
  suburb: string;
  motivation: string;
}

const DEFAULT_FORM: FormData = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  experience: '',
  availability: '',
  suburb: '',
  motivation: '',
};

export const CareersPage: React.FC<CareersPageProps> = ({ onNavigate }) => {
  const [form, setForm] = useState<FormData>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [cvFileName, setCvFileName] = useState('');

  const update = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<FormData> = {};
    if (!form.firstName.trim()) newErrors.firstName = 'First name required';
    if (!form.lastName.trim()) newErrors.lastName = 'Last name required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Valid email required';
    if (!form.experience) newErrors.experience = 'Please select your experience level';
    if (!form.availability) newErrors.availability = 'Please select your availability';
    if (!form.suburb.trim()) newErrors.suburb = 'Please enter your suburb';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const inputClass = (field: keyof FormData) =>
    `w-full px-4 py-3 bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200'
    }`;

  return (
    <div className="pb-24">
      {/* Hero — same width and rounded container as Home */}
      <div className="px-6 md:px-6 mt-2">
        <section className="relative max-w-7xl mx-auto rounded-2xl overflow-hidden min-h-[50vh] flex flex-col justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                'linear-gradient(135deg, rgb(37 99 235) 0%, rgb(30 64 175) 100%)',
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/20" aria-hidden />
          <div className="relative z-10 px-8 md:px-12 lg:px-16 py-16 md:py-24 max-w-7xl mx-auto w-full">
            <div className="max-w-4xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                  <Briefcase className="w-4 h-4" />
                  <span>Now Hiring in Cape Town</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight mb-6">
                  Join the Shalean Cleaning Team in Cape Town
                </h1>
                <p className="text-lg md:text-xl text-white/95 max-w-2xl leading-relaxed mb-10">
                  Build a rewarding career with Cape Town&apos;s fastest-growing professional cleaning service. Flexible hours, competitive pay, and a team that genuinely values you.
                </p>
                <a
                  href="#apply"
                  className="inline-flex items-center gap-2 bg-white text-blue-600 font-bold text-base px-8 py-3.5 rounded-full hover:bg-blue-50 transition-colors shadow-lg"
                >
                  Apply Now <ChevronRight className="w-5 h-5" />
                </a>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* Why Work With Us — same section/card pattern as Home */}
      <div className="px-6 md:px-6 mt-8 md:mt-10">
        <section className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
            <div className="mb-10">
              <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-4">
                <Briefcase className="w-4 h-4 text-slate-500" />
                Why Work With Us
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
                Why Work With Shalean?
              </h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl">
                We don&apos;t just hire cleaners — we build careers. Here&apos;s what makes Shalean a great place to work in Cape Town.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {WHY_WORK.map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  whileHover={{ y: -4 }}
                >
                  <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 h-full hover:border-blue-200 hover:shadow-sm transition-all group">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {item.icon}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">
                      {item.title}
                    </h3>
                    <p className="text-slate-500 text-sm leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Requirements & Benefits — same card layout as Home */}
      <div className="px-6 md:px-6 mt-8 md:mt-10">
        <section className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-4 py-1.5 rounded-full mb-4">
                <CheckCircle2 className="w-4 h-4" /> Cleaner Requirements
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-4">
                What We Look For
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                You don&apos;t need years of professional cleaning experience — what we care about most is your character, reliability, and willingness to learn. We&apos;ll take care of the training.
              </p>
              <ul className="space-y-3">
                {REQUIREMENTS.map((req, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    <span className="text-slate-700">{req}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
              <div className="inline-flex items-center gap-2 text-emerald-600 font-bold text-sm bg-emerald-50 px-4 py-1.5 rounded-full mb-4">
                <Star className="w-4 h-4" /> Benefits
              </div>
              <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-4">
                What You&apos;ll Get
              </h2>
              <p className="text-slate-600 leading-relaxed mb-6">
                At Shalean, we believe that taking care of our team means they take care of our clients. Here&apos;s what you&apos;ll receive as part of our team:
              </p>
              <ul className="space-y-3">
                {BENEFITS.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <div className="w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ChevronRight className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-slate-700">{benefit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>

      {/* Testimonial — full-width blue block, content in max-w-7xl */}
      <div className="px-6 md:px-6 mt-8 md:mt-10">
        <section className="max-w-7xl mx-auto rounded-2xl overflow-hidden bg-blue-600 shadow-sm p-8 md:p-12 lg:p-14 text-white">
          <div className="max-w-3xl mx-auto text-center">
            <div className="flex justify-center gap-1 mb-6">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-5 h-5 text-amber-400 fill-amber-400"
                />
              ))}
            </div>
            <blockquote className="text-xl md:text-2xl font-bold italic mb-8 leading-relaxed">
              &ldquo;I joined Shalean two years ago with no professional cleaning experience. Today I&apos;m a team leader earning more than I ever expected. The support and training made all the difference.&rdquo;
            </blockquote>
            <div className="flex items-center justify-center gap-4">
              <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-white/30">
                <img
                  src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=100&q=80"
                  alt="Nomsa D."
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="text-left">
                <p className="font-bold text-lg">Nomsa D.</p>
                <p className="text-blue-200 text-sm">
                  Team Leader, Shalean (2 years)
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Application Form */}
      <div className="px-6 md:px-6 mt-8 md:mt-10" id="apply">
        <section className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-10">
                <span className="inline-flex items-center gap-2 text-blue-600 font-bold text-sm bg-blue-50 px-4 py-1.5 rounded-full mb-4">
                  <Briefcase className="w-4 h-4" /> Apply Now
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
                  Start Your Application
                </h2>
                <p className="text-slate-600">
                  Fill in the form below and our team will be in touch within 2 business days.
                </p>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-slate-50 rounded-2xl border border-slate-100 p-8 md:p-12 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-slate-900 mb-3">
                    Application Submitted!
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-8">
                    Thank you for your interest in joining Shalean. Our team will review your application and contact you within 2 business days.
                  </p>
                  <Button
                    onClick={() => {
                      setSubmitted(false);
                      setForm(DEFAULT_FORM);
                    }}
                    variant="outline"
                  >
                    Submit Another Application
                  </Button>
                </motion.div>
              ) : (
                <div className="bg-slate-50/50 rounded-2xl border border-slate-100 p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          First Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Sarah"
                          value={form.firstName}
                          onChange={(e) => update('firstName', e.target.value)}
                          className={inputClass('firstName')}
                        />
                        {errors.firstName && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.firstName}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Last Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Jenkins"
                          value={form.lastName}
                          onChange={(e) => update('lastName', e.target.value)}
                          className={inputClass('lastName')}
                        />
                        {errors.lastName && (
                          <p className="text-xs text-red-500 mt-1">
                            {errors.lastName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        placeholder="+27 82 123 4567"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        className={inputClass('phone')}
                      />
                      {errors.phone && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        placeholder="sarah@example.com"
                        value={form.email}
                        onChange={(e) => update('email', e.target.value)}
                        className={inputClass('email')}
                      />
                      {errors.email && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.email}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Cleaning Experience <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.experience}
                          onChange={(e) => update('experience', e.target.value)}
                          className={`${inputClass('experience')} appearance-none`}
                        >
                          <option value="">Select your experience level</option>
                          <option value="none">
                            No prior experience — willing to learn
                          </option>
                          <option value="some">Less than 1 year experience</option>
                          <option value="1-2">1–2 years experience</option>
                          <option value="3-5">3–5 years experience</option>
                          <option value="5+">5+ years experience</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                      </div>
                      {errors.experience && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.experience}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Availability <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <select
                          value={form.availability}
                          onChange={(e) =>
                            update('availability', e.target.value)
                          }
                          className={`${inputClass('availability')} appearance-none`}
                        >
                          <option value="">Select your availability</option>
                          <option value="full">Full-time (5 days/week)</option>
                          <option value="part">Part-time (3–4 days/week)</option>
                          <option value="flex">Flexible (as needed)</option>
                          <option value="weekends">Weekends only</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                      </div>
                      {errors.availability && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.availability}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Your Cape Town Suburb <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Sea Point, Claremont, Durbanville"
                        value={form.suburb}
                        onChange={(e) => update('suburb', e.target.value)}
                        className={inputClass('suburb')}
                      />
                      {errors.suburb && (
                        <p className="text-xs text-red-500 mt-1">
                          {errors.suburb}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Why do you want to join Shalean?
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Tell us a little about yourself and why you'd like to join our team..."
                        value={form.motivation}
                        onChange={(e) => update('motivation', e.target.value)}
                        className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Upload CV (Optional)
                      </label>
                      <label className="flex items-center gap-3 w-full px-4 py-3 bg-white border-2 border-dashed border-slate-200 rounded-xl text-slate-500 hover:border-blue-400 hover:bg-blue-50 transition-all cursor-pointer text-sm">
                        <Upload className="w-5 h-5 text-slate-400" />
                        <span>
                          {cvFileName ||
                            'Click to upload your CV (PDF, DOC, DOCX)'}
                        </span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={(e) =>
                            setCvFileName(e.target.files?.[0]?.name || '')
                          }
                        />
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200/50 text-base"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Submitting Application...
                        </>
                      ) : (
                        <>
                          <Briefcase className="w-5 h-5" /> Submit Application
                        </>
                      )}
                    </button>

                    <p className="text-xs text-center text-slate-400">
                      By submitting this form, you agree to Shalean&apos;s privacy policy. We&apos;ll only use your information to process your application.
                    </p>
                  </form>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default CareersPage;
