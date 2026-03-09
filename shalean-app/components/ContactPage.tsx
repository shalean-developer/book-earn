'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  Phone,
  Mail,
  MapPin,
  MessageSquare,
  Clock,
  CheckCircle,
  Loader2,
  ShieldCheck,
  Star,
  Send,
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

interface ContactPageProps {
  onNavigate: (page: PageType | string) => void;
}

const Button = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost' | 'white';
  className?: string;
  onClick?: () => void;
}) => {
  const base =
    'px-6 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
    outline: 'border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50',
    ghost: 'text-slate-700 bg-transparent hover:text-blue-600 hover:bg-slate-100',
    white: 'bg-white text-blue-600 hover:bg-blue-50 shadow-md',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

interface ContactForm {
  name: string;
  email: string;
  phone: string;
  suburb: string;
  subject: string;
  message: string;
}

const DEFAULT_FORM: ContactForm = {
  name: '',
  email: '',
  phone: '',
  suburb: '',
  subject: '',
  message: '',
};

const BUSINESS_HOURS = [
  { day: 'Monday – Friday', hours: '07:00 – 18:00' },
  { day: 'Saturday', hours: '08:00 – 16:00' },
  { day: 'Sunday', hours: '09:00 – 14:00' },
  { day: 'Public Holidays', hours: 'Limited availability' },
];

export const ContactPage: React.FC<ContactPageProps> = ({ onNavigate }) => {
  const [form, setForm] = useState<ContactForm>(DEFAULT_FORM);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = (field: keyof ContactForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field])
      setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = (): boolean => {
    const newErrors: Partial<ContactForm> = {};
    if (!form.name.trim()) newErrors.name = 'Name required';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      newErrors.email = 'Valid email required';
    if (!form.phone.trim()) newErrors.phone = 'Phone number required';
    if (!form.message.trim()) newErrors.message = 'Message required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 1800));
    setIsSubmitting(false);
    setSubmitted(true);
  };

  const inputClass = (field: keyof ContactForm) =>
    `w-full px-4 py-3 bg-white border rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-sm ${
      errors[field] ? 'border-red-400 bg-red-50' : 'border-slate-200'
    }`;

  const contactCards = [
    {
      icon: <Phone className="w-6 h-6" />,
      title: 'Call Us',
      main: '087 153 5250',
      sub: 'Mon–Sat, 07:00–18:00',
      href: 'tel:+27871535250',
      color: 'bg-blue-600',
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: 'WhatsApp',
      main: '082 591 5525',
      sub: 'Fastest response — 7 days',
      href: 'https://wa.me/27825915525',
      color: 'bg-emerald-500',
    },
    {
      icon: <Mail className="w-6 h-6" />,
      title: 'Email Us',
      main: 'hello@shalean.co.za',
      sub: 'We reply within 2 hours',
      href: 'mailto:hello@shalean.co.za',
      color: 'bg-violet-600',
    },
    {
      icon: <MapPin className="w-6 h-6" />,
      title: 'Location',
      main: 'Cape Town, South Africa',
      sub: 'Serving all major suburbs',
      href: '#map',
      color: 'bg-amber-500',
    },
  ];

  const trustItems = [
    { icon: <ShieldCheck className="w-4 h-4 text-emerald-500" />, text: 'Free, no-obligation quotes' },
    { icon: <Star className="w-4 h-4 text-amber-400" />, text: '4.9/5 customer satisfaction' },
    { icon: <Clock className="w-4 h-4 text-blue-500" />, text: 'Same-week availability' },
    { icon: <CheckCircle className="w-4 h-4 text-blue-500" />, text: '100% satisfaction guarantee' },
  ];

  const locations = [
    'Sea Point',
    'Claremont',
    'Gardens',
    'Constantia',
    'Durbanville',
    'Century City',
    'Table View',
    'Observatory',
  ];

  return (
    <div className="pb-24">
      {/* Hero – same width and style as About (max-w-7xl, rounded-2xl) */}
      <div className="px-6 md:px-6 mt-2">
        <section className="max-w-7xl mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-24">
          <div className="max-w-4xl mx-auto text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <MessageSquare className="w-4 h-4" />
                We&apos;re here to help — 7 days a week
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                Contact Shalean Cleaning Services in Cape Town
              </h1>
              <p className="text-lg md:text-xl text-blue-100 max-w-2xl mx-auto leading-relaxed mb-10">
                Have a question, need a quote, or want to make a booking? Get in touch with our friendly Cape Town team — we typically respond within the hour.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button
                  variant="white"
                  onClick={() => onNavigate('booking')}
                  className="text-lg px-10"
                >
                  Book a Clean <ChevronRight className="w-5 h-5" />
                </Button>
                <a
                  href="https://wa.me/27825915525"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-emerald-500 text-white font-bold text-lg px-10 py-3 rounded-full hover:bg-emerald-600 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" /> WhatsApp Us
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Contact Info Cards – same card style as Home */}
      <div className="px-6 md:px-6 mt-8 md:mt-10">
        <section className="max-w-7xl mx-auto">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
            {contactCards.map((card, idx) => (
              <motion.a
                key={card.title}
                href={card.href}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: idx * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-blue-200 hover:shadow-md transition-all block group"
              >
                <div
                  className={`w-12 h-12 ${card.color} text-white rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  {card.icon}
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {card.title}
                </p>
                <p className="font-bold text-slate-900 mb-1">{card.main}</p>
                <p className="text-slate-500 text-xs">{card.sub}</p>
              </motion.a>
            ))}
          </div>
        </section>
      </div>

      {/* Form + Sidebar – same container and card style as Home */}
      <div className="px-6 md:px-6 mt-8 md:mt-10">
        <section className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-[1fr_400px] gap-8 md:gap-12">
            {/* Form */}
            <div>
              <div className="mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-3">
                  Send Us a Message
                </h2>
                <p className="text-slate-600 text-base md:text-lg leading-relaxed">
                  Fill in the form below and we&apos;ll get back to you promptly. For urgent enquiries, please call or WhatsApp us directly.
                </p>
              </div>

              {submitted ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-12 text-center"
                >
                  <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle className="w-10 h-10 text-emerald-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 mb-3">
                    Message Sent!
                  </h3>
                  <p className="text-slate-600 leading-relaxed mb-8">
                    Thanks for getting in touch. Our team will respond to{' '}
                    <strong>{form.email}</strong> within 2 hours during business hours.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSubmitted(false);
                        setForm(DEFAULT_FORM);
                      }}
                    >
                      Send Another Message
                    </Button>
                    <Button onClick={() => onNavigate('booking')}>
                      Book a Clean <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Full Name <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="text"
                          placeholder="Sarah Jenkins"
                          value={form.name}
                          onChange={(e) => update('name', e.target.value)}
                          className={inputClass('name')}
                        />
                        {errors.name && (
                          <p className="text-xs text-red-500 mt-1">{errors.name}</p>
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
                          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                        )}
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
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
                          <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                          Cape Town Suburb
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Sea Point, Claremont"
                          value={form.suburb}
                          onChange={(e) => update('suburb', e.target.value)}
                          className={inputClass('suburb')}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Subject
                      </label>
                      <div className="relative">
                        <select
                          value={form.subject}
                          onChange={(e) => update('subject', e.target.value)}
                          className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none"
                        >
                          <option value="">Select a subject</option>
                          <option value="booking">Booking enquiry</option>
                          <option value="quote">Get a quote</option>
                          <option value="support">Customer support</option>
                          <option value="complaint">Feedback / complaint</option>
                          <option value="partnership">Business partnership</option>
                          <option value="other">Other</option>
                        </select>
                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none rotate-90" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                        Message <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={5}
                        placeholder="Tell us how we can help you. Include your property details, preferred dates, or any specific requirements..."
                        value={form.message}
                        onChange={(e) => update('message', e.target.value)}
                        className={`${inputClass('message')} resize-none`}
                      />
                      {errors.message && (
                        <p className="text-xs text-red-500 mt-1">{errors.message}</p>
                      )}
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3 transition-all shadow-lg shadow-blue-200/50 text-base border-0"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" /> Sending Message...
                        </>
                      ) : (
                        <>
                          <Send className="w-5 h-5" /> Send Message
                        </>
                      )}
                    </button>
                  </form>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <aside className="space-y-5">
              {/* Business Hours */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
                    <Clock className="w-5 h-5" />
                  </div>
                  <h3 className="font-bold text-slate-900">Business Hours</h3>
                </div>
                <div className="space-y-3">
                  {BUSINESS_HOURS.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between text-sm"
                    >
                      <span className="text-slate-600">{item.day}</span>
                      <span className="font-semibold text-slate-900">
                        {item.hours}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-xs font-semibold text-emerald-600">
                      Currently accepting bookings
                    </span>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <a
                href="https://wa.me/27825915525"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-emerald-500 hover:bg-emerald-600 transition-colors rounded-2xl p-6 text-white"
              >
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center">
                    <MessageSquare className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-bold text-lg">WhatsApp Us</p>
                    <p className="text-emerald-100 text-sm">Get a reply in minutes</p>
                  </div>
                </div>
                <p className="text-emerald-100 text-sm">
                  Chat directly with our team for fast quotes, bookings, or any questions about our services in Cape Town.
                </p>
              </a>

              {/* Trust Signals */}
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h3 className="font-bold text-slate-900 mb-4">Why Contact Us?</h3>
                <div className="space-y-3">
                  {trustItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      {item.icon}
                      <span className="text-sm text-slate-600">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Book CTA */}
              <div className="rounded-2xl bg-blue-600 shadow-md p-6 text-white text-center">
                <h3 className="font-bold text-lg mb-2">Ready to Book?</h3>
                <p className="text-blue-100 text-sm mb-4">
                  Skip the queue and book directly online in under 60 seconds.
                </p>
                <button
                  type="button"
                  onClick={() => onNavigate('booking')}
                  className="w-full bg-white text-blue-600 font-bold py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center gap-2 border-0"
                >
                  Book Online Now <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>

      {/* Map Section – same container as Home sections */}
      <div className="px-6 md:px-6 mt-8 md:mt-10" id="map">
        <section className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-3">
              Find Us in Cape Town
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl">
              We&apos;re based in Cape Town and serve all major suburbs across the greater Cape Town metropolitan area.
            </p>
          </div>
          <div className="rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
            <iframe
              title="Shalean Cleaning Services Cape Town"
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d211248.1!2d18.3721668!3d-33.9248685!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x1dcc500f8826eed7%3A0x687fe1fc2828aa87!2sCape+Town%2C+South+Africa!5e0!3m2!1sen!2s!4v1699000000000"
              width="100%"
              height="400"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {locations.map((loc) => (
              <span
                key={loc}
                className="inline-flex items-center gap-1.5 bg-white border border-slate-200 text-slate-600 text-sm font-medium px-3 py-1.5 rounded-full hover:border-blue-300 hover:text-blue-600 transition-colors cursor-pointer"
              >
                <MapPin className="w-3 h-3" /> {loc}
              </span>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
};

export default ContactPage;
