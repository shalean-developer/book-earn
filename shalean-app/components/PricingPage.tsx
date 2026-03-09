'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Home,
  Layers,
  Sparkles,
  Wind,
  Calendar,
  Plus,
  Info,
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
  | 'pricing'
  | 'quote';

interface PricingPageProps {
  onNavigate: (page: PageType) => void;
}

const Button = ({
  children,
  variant = 'primary',
  className = '',
  onClick,
}: {
  children: React.ReactNode;
  variant?: 'primary' | 'outline' | 'ghost';
  className?: string;
  onClick?: () => void;
}) => {
  const base =
    'px-6 py-3 rounded-full font-semibold transition-all duration-200 inline-flex items-center justify-center gap-2';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 shadow-md',
    outline: 'border-2 border-blue-600 text-blue-600 bg-transparent hover:bg-blue-50',
    ghost: 'text-slate-700 bg-transparent hover:text-blue-600 hover:bg-slate-100',
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

const PRICING_PLANS = [
  {
    id: 'standard',
    title: 'Standard Cleaning',
    description:
      'Regular upkeep for a consistently clean home. Perfect for weekly or bi-weekly visits.',
    basePrice: 450,
    icon: <Sparkles className="w-7 h-7" />,
    popular: false,
    includes: [
      'Lounge & living areas',
      'Kitchen surfaces',
      'Bathroom sanitizing',
      'Vacuuming & mopping',
      'Dusting all surfaces',
      'Bin emptying',
    ],
    note: 'Base price for 2 bedrooms, 1 bathroom',
  },
  {
    id: 'deep',
    title: 'Deep Cleaning',
    description:
      'Thorough, intensive clean — ideal for first cleans, post-renovation, or seasonal deep cleans.',
    basePrice: 850,
    icon: <Layers className="w-7 h-7" />,
    popular: true,
    includes: [
      'Everything in Standard',
      'Inside cupboards & drawers',
      'Grout & tile scrubbing',
      'Skirting boards & door frames',
      'Interior windows',
      'Behind & under appliances',
    ],
    note: 'Base price for 2 bedrooms, 1 bathroom',
  },
  {
    id: 'move',
    title: 'Move In / Out',
    description:
      'Complete property reset for tenants, landlords, or new homeowners across Cape Town.',
    basePrice: 1200,
    icon: <Home className="w-7 h-7" />,
    popular: false,
    includes: [
      'Full deep clean included',
      'All appliances inside & out',
      'Wall spot cleaning',
      'Complete bathroom sanitize',
      'All cupboards & drawers',
      'Garage & utility areas',
    ],
    note: 'Base price for 2 bedrooms, 1 bathroom',
  },
  {
    id: 'airbnb',
    title: 'Airbnb Cleaning',
    description:
      'Fast, reliable turnaround cleaning for short-term rental hosts. Maintain 5-star ratings.',
    basePrice: 650,
    icon: <Calendar className="w-7 h-7" />,
    popular: false,
    includes: [
      'Guest-ready clean',
      'Linen change service',
      'Amenity restocking check',
      'Photo-ready presentation',
      'Full bathroom refresh',
      'Quick turnaround available',
    ],
    note: 'Base price for 2 bedrooms, 1 bathroom',
  },
  {
    id: 'carpet',
    title: 'Carpet Cleaning',
    description:
      'Professional stain removal and deep carpet extraction for fresh, clean carpets.',
    basePrice: 350,
    icon: <Wind className="w-7 h-7" />,
    popular: false,
    includes: [
      'Deep hot extraction',
      'Stain removal treatment',
      'Odour neutralizing',
      'Quick-dry method',
      'Pre-treatment inspection',
      'Per-room pricing available',
    ],
    note: 'Base price per standard room',
  },
];

const PRICING_FACTORS = [
  {
    icon: <Home className="w-5 h-5 text-blue-600" />,
    title: 'Bedrooms & Bathrooms',
    desc: 'Each additional bedroom adds R100. Each additional bathroom adds R50 to the base price.',
  },
  {
    icon: <Layers className="w-5 h-5 text-blue-600" />,
    title: 'Property Size',
    desc: 'Larger homes require more time and resources. Prices are adjusted based on total floor area.',
  },
  {
    icon: <Info className="w-5 h-5 text-blue-600" />,
    title: 'Property Condition',
    desc: "Properties requiring extra attention may be quoted higher. We'll confirm before your booking.",
  },
  {
    icon: <Plus className="w-5 h-5 text-blue-600" />,
    title: 'Add-On Services',
    desc: 'Inside oven (R150), inside fridge (R150), interior windows (R200), wall spot cleaning (R120), and more.',
  },
  {
    icon: <CheckCircle2 className="w-5 h-5 text-blue-600" />,
    title: 'Cleaning Frequency',
    desc: 'Recurring weekly or bi-weekly bookings qualify for loyalty discounts. Ask about our packages.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-blue-600" />,
    title: 'Duration & Scope',
    desc: 'Complex properties or extensive cleaning scopes are quoted individually to ensure fair pricing.',
  },
];

const PRICING_FAQS = [
  {
    q: 'Are there any hidden fees?',
    a: 'Never. The price you see is the price you pay. Our booking system shows your full estimated total before you confirm — including all selected extras.',
  },
  {
    q: 'Do prices include cleaning supplies?',
    a: 'Yes, all standard supplies are included in the price. Heavy equipment like steam cleaners can be requested for an additional fee during booking.',
  },
  {
    q: 'How do I get an exact quote?',
    a: 'Use our online booking system to get an instant, itemized quote based on your specific property, service type, and chosen add-ons. No commitment required.',
  },
  {
    q: 'Do you offer discounts for regular bookings?',
    a: 'Yes! Clients who book weekly or bi-weekly services qualify for our loyalty discount. Contact us or mention it during your first booking to set it up.',
  },
  {
    q: 'Can I pay cash on the day?',
    a: 'Yes. You can choose to pay via Paystack online (cards, EFT, Ozow) or pay cash/EFT on the day of your clean. We recommend online payment for instant confirmation.',
  },
];

const ADDONS = [
  { label: 'Inside Fridge', price: 'R150' },
  { label: 'Inside Oven', price: 'R150' },
  { label: 'Interior Windows', price: 'R200' },
  { label: 'Inside Cabinets', price: 'R180' },
  { label: 'Wall Spot Cleaning', price: 'R120' },
  { label: 'Extra Cleaner', price: 'R350' },
  { label: 'Equipment Request', price: 'R200' },
];

export const PricingPage: React.FC<PricingPageProps> = ({ onNavigate }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="pb-24">
      {/* Hero – same width and style as home / services / about */}
      <div className="px-6 md:px-6 mt-2">
        <section className="max-w-7xl mx-auto rounded-2xl overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 text-white py-20 md:py-24">
          <div className="max-w-4xl mx-auto text-center px-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 bg-white/10 text-white px-4 py-1.5 rounded-full text-sm font-medium mb-6">
                <ShieldCheck className="w-4 h-4" />
                <span>Transparent, No-Surprise Pricing</span>
              </div>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight tracking-tight mb-6">
                Cleaning Service Pricing in Cape Town
              </h1>
              <p className="text-lg md:text-xl text-blue-100 mb-10 max-w-2xl mx-auto leading-relaxed">
                Honest, upfront pricing for every cleaning service. No hidden
                fees, no surprises — just professional cleaning at fair prices
                across Cape Town.
              </p>
              <button
                type="button"
                onClick={() => onNavigate('booking')}
                className="inline-flex items-center justify-center rounded-full bg-white text-blue-600 font-semibold text-base px-8 py-3.5 hover:bg-blue-50 transition-all shadow-lg gap-2"
              >
                Get Instant Quote <ChevronRight className="w-5 h-5" />
              </button>
            </motion.div>
          </div>
        </section>
      </div>

      {/* Pricing Cards – same section pattern as home (max-w-7xl, px-6, mt-8) */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              Service Pricing Overview
            </h2>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Starting prices shown below. Use our booking tool to get your
              exact quote based on your property.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {PRICING_PLANS.map((plan, idx) => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: idx * 0.08 }}
                className="relative"
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                    <span className="bg-blue-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                      Most Popular
                    </span>
                  </div>
                )}
                <div
                  className={`bg-white rounded-2xl border p-6 h-full flex flex-col transition-all hover:shadow-md ${
                    plan.popular
                      ? 'border-2 border-blue-600 shadow-lg shadow-blue-100'
                      : 'border-slate-100 hover:border-blue-200'
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
                      plan.popular ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'
                    }`}
                  >
                    {plan.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight mb-2">
                    {plan.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed mb-5">
                    {plan.description}
                  </p>
                  <div className="mb-5">
                    <p className="text-xs text-slate-400 font-medium mb-1">
                      Starting from
                    </p>
                    <p className="text-4xl font-black text-blue-600">
                      R{plan.basePrice}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{plan.note}</p>
                  </div>
                  <ul className="space-y-2.5 mb-6 flex-grow">
                    {plan.includes.map((item, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 text-sm text-slate-600"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Button
                    onClick={() => onNavigate('booking')}
                    variant={plan.popular ? 'primary' : 'outline'}
                    className="w-full justify-center"
                  >
                    Book Now <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Add-ons Table – same section spacing */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-3xl mx-auto">
          <div className="text-center mb-8 md:mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight mb-3">
              Add-On Services
            </h2>
            <p className="text-slate-600 text-base md:text-lg leading-relaxed">
              Enhance your clean with any of the following extras, available
              during booking.
            </p>
          </div>
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            {ADDONS.map((addon, idx) => (
              <div
                key={addon.label}
                className={`flex items-center justify-between px-6 py-4 ${
                  idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-4 h-4 text-blue-500" />
                  <span className="font-medium text-slate-800">
                    {addon.label}
                  </span>
                </div>
                <span className="font-bold text-blue-600">{addon.price}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* Pricing Factors – same card style as home (white cards, border-slate-100) */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto">
          <div className="text-center mb-10 md:mb-12">
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-3">
              What Affects Your Price?
            </h2>
            <p className="text-slate-600 text-base md:text-lg max-w-2xl mx-auto leading-relaxed">
              Our quotes are tailored to your specific home and needs. Here&apos;s
              what determines your final price — always shown before you confirm.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
            {PRICING_FACTORS.map((f, idx) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ delay: idx * 0.06 }}
              >
                <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 hover:border-blue-200 hover:shadow-md transition-all h-full">
                  <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 tracking-tight mb-2">
                    {f.title}
                  </h3>
                  <p className="text-slate-500 text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>
      </div>

      {/* Trust Signals – same blue bar style as home "How It Works" */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-7xl mx-auto rounded-2xl md:rounded-3xl bg-blue-600 shadow-xl py-12 md:py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-6 md:px-8">
            {[
              { value: 'R450', label: 'Standard Clean from' },
              { value: 'R850', label: 'Deep Clean from' },
              { value: 'R1,200', label: 'Move In/Out from' },
              { value: '0', label: 'Hidden fees — guaranteed' },
            ].map((s) => (
              <div key={s.label} className="text-center text-white">
                <p className="text-2xl md:text-3xl lg:text-4xl font-black mb-1">
                  {s.value}
                </p>
                <p className="text-blue-200 text-sm">{s.label}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* FAQ – same section spacing and accordion style */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-3xl mx-auto">
          <div className="text-center mb-8 md:mb-12">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
              Pricing FAQs
            </h2>
          </div>
          <div className="space-y-4">
            {PRICING_FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-bold text-slate-800 pr-4">
                    {faq.q}
                  </span>
                  <Plus
                    className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform ${
                      openFaq === idx ? 'rotate-45' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 text-slate-600 text-sm leading-relaxed border-t border-slate-100">
                    <div className="pt-4">{faq.a}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* CTA – same blue card style as home "How It Works" */}
      <div className="px-6 md:px-6 mt-8 md:mt-12">
        <section className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl md:rounded-3xl bg-blue-600 shadow-xl p-6 md:p-8 lg:p-10 text-center text-white"
          >
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight mb-4">
              Get Your Instant Quote
            </h2>
            <p className="text-blue-100 text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed">
              Enter your property details to see your exact price in seconds. No
              commitment, no obligation.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => onNavigate('quote')}
                className="inline-flex items-center justify-center rounded-full bg-white text-blue-600 font-semibold text-base px-8 py-3.5 hover:bg-blue-50 transition-all shadow-lg gap-2"
              >
                Get Instant Quote <ChevronRight className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center justify-center rounded-full border-2 border-white text-white font-semibold text-base px-8 py-3.5 hover:bg-white/10 transition-colors"
              >
                Talk to Us
              </button>
            </div>
          </motion.div>
        </section>
      </div>
    </div>
  );
};

export default PricingPage;
