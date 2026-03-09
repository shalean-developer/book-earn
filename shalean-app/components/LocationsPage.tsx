'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronRight,
  MapPin,
  Star,
  CheckCircle2,
  ArrowRight,
  X,
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

interface LocationsPageProps {
  onNavigate: (page: PageType) => void;
}

interface Location {
  name: string;
  slug: string;
  description: string;
  localDesc: string;
  areas: string[];
  testimonial: {
    text: string;
    name: string;
    role: string;
  };
  image: string;
  services: string[];
}

const LOCATIONS: Location[] = [
  {
    name: 'Sea Point',
    slug: 'sea-point',
    description:
      'Serving Sea Point apartments, townhouses, and Airbnb rentals along the Atlantic Seaboard.',
    localDesc:
      "Sea Point is one of Cape Town's most vibrant coastal neighbourhoods, home to a mix of modern apartment blocks, holiday rentals, and family homes. Shalean provides fast, reliable cleaning services tailored to the busy Sea Point lifestyle — whether you're a resident, landlord, or Airbnb host.",
    areas: ['Fresnaye', 'Three Anchor Bay', 'Green Point', 'De Waterkant'],
    testimonial: {
      text: 'The best cleaning service I\'ve used in Sea Point. Friendly, punctual, and my apartment was spotless.',
      name: 'Sarah Jenkins',
      role: 'Airbnb Host, Sea Point',
    },
    image:
      'https://images.unsplash.com/photo-1580982324076-d95230549339?auto=format&fit=crop&w=800&q=80',
    services: ['Standard Cleaning', 'Airbnb Cleaning', 'Deep Cleaning'],
  },
  {
    name: 'Claremont',
    slug: 'claremont',
    description:
      'Professional cleaning services for Claremont family homes, estates, and rental properties.',
    localDesc:
      'Claremont is a premier Southern Suburbs neighbourhood known for its top schools, leafy streets, and spacious family homes. Our Claremont cleaning team is experienced with larger residential properties and offers flexible scheduling around busy family routines.',
    areas: ['Upper Claremont', 'Lower Claremont', 'Harfield Village', 'Kenilworth'],
    testimonial: {
      text: 'Shalean has been cleaning our family home in Claremont for 6 months. Consistent, thorough, and always on time.',
      name: 'Michael Botha',
      role: 'Homeowner, Claremont',
    },
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
    services: ['Standard Cleaning', 'Deep Cleaning', 'Move In/Out'],
  },
  {
    name: 'Durbanville',
    slug: 'durbanville',
    description:
      'Trusted cleaning services for Durbanville estates, wine farms, and suburban homes.',
    localDesc:
      "Durbanville is one of Cape Town's fastest-growing northern suburbs, with new estates, wine farms, and family properties. Our Durbanville team offers professional cleaning tailored to the area's larger homes and complex properties.",
    areas: ['Sonstraal', 'Pinehurst', 'Protea Valley', 'Vierlanden'],
    testimonial: {
      text: 'Professional, thorough, and great value. My Durbanville home has never looked so clean.',
      name: 'Linda van der Berg',
      role: 'Homeowner, Durbanville',
    },
    image:
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80',
    services: ['Standard Cleaning', 'Deep Cleaning', 'Carpet Cleaning'],
  },
  {
    name: 'Observatory',
    slug: 'observatory',
    description:
      'Affordable, professional cleaning for Observatory homes, flats, and student properties.',
    localDesc:
      'Observatory is a diverse, artsy Cape Town suburb popular with young professionals, students, and families. We offer affordable, reliable cleaning services for the varied property types found throughout Obs.',
    areas: ['Lower Observatory', 'Upper Observatory', 'Salt River', 'Woodstock'],
    testimonial: {
      text: 'Great service at a fair price. The team was thorough and professional. My Observatory flat looks brand new.',
      name: 'James Paulsen',
      role: 'Renter, Observatory',
    },
    image:
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
    services: ['Standard Cleaning', 'Deep Cleaning', 'Move In/Out'],
  },
  {
    name: 'Century City',
    slug: 'century-city',
    description:
      'Commercial and residential cleaning for Century City apartments, offices, and mixed-use properties.',
    localDesc:
      "Century City is Cape Town's premier mixed-use precinct, combining luxury apartments, corporate offices, and retail. We provide both residential and light commercial cleaning services for the Century City community.",
    areas: ['Bridgeways', 'Ratanga Junction area', 'Canal Walk vicinity', 'Nouveau'],
    testimonial: {
      text: 'We use Shalean for our Century City apartment. Always immaculate and the team is incredibly professional.',
      name: 'Priya Naidoo',
      role: 'Resident, Century City',
    },
    image:
      'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=80',
    services: ['Standard Cleaning', 'Airbnb Cleaning', 'Deep Cleaning'],
  },
  {
    name: 'Table View',
    slug: 'table-view',
    description:
      'Reliable cleaning services across Table View, Blouberg, and the greater Blaauwberg area.',
    localDesc:
      'Table View and Bloubergstrand are popular beachside suburbs with fantastic views of Table Mountain. We serve the full Table View and Blaauwberg area, offering cleaning services for beachside apartments and family homes alike.',
    areas: ['Bloubergstrand', 'Parklands', 'Sunningdale', 'Milnerton'],
    testimonial: {
      text: "Shalean's team cleaned our Blouberg holiday rental to perfection. Our guests keep giving us 5-star reviews!",
      name: 'David Ferreira',
      role: 'Holiday Rental Owner, Table View',
    },
    image:
      'https://images.unsplash.com/photo-1613490493576-7fde63acd811?auto=format&fit=crop&w=800&q=80',
    services: ['Standard Cleaning', 'Airbnb Cleaning', 'Carpet Cleaning'],
  },
  {
    name: 'Gardens',
    slug: 'gardens',
    description:
      'Professional cleaning services for Gardens City Bowl apartments and Victorian homes.',
    localDesc:
      "Gardens is one of Cape Town's most sought-after City Bowl suburbs, combining historic Victorian architecture with modern apartment living. We specialise in cleaning Gardens properties — from studio apartments to multi-storey family homes.",
    areas: ['De Waal Park area', 'Tamboerskloof', 'Oranjezicht', 'Higgovale'],
    testimonial: {
      text: "Incredible attention to detail. My Gardens cottage is spotless every time. I won't use anyone else.",
      name: 'Yolande Cilliers',
      role: 'Homeowner, Gardens',
    },
    image:
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=800&q=80',
    services: ['Standard Cleaning', 'Deep Cleaning', 'Move In/Out'],
  },
  {
    name: 'Constantia',
    slug: 'constantia',
    description:
      'Premium cleaning services for Constantia luxury estates, wine farms, and upmarket homes.',
    localDesc:
      "Constantia is Cape Town's most prestigious suburb, home to luxury estates, wine farms, and some of the city's finest properties. Our premium cleaning service in Constantia caters to larger, high-value homes with the care and professionalism they deserve.",
    areas: ['Upper Constantia', 'Lower Constantia', 'Constantia Valley', 'Bergvliet'],
    testimonial: {
      text: "We've tried many cleaning services in Constantia over the years. Shalean is by far the most professional and consistent.",
      name: 'Mark & Helen Schilder',
      role: 'Estate Owners, Constantia',
    },
    image:
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=800&q=80',
    services: ['Standard Cleaning', 'Deep Cleaning', 'Carpet Cleaning'],
  },
];

const LocationModal: React.FC<{
  location: Location;
  onClose: () => void;
  onBook: () => void;
}> = ({ location, onClose, onBook }) => (
  <AnimatePresence>
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Image */}
        <div className="relative aspect-video overflow-hidden rounded-t-3xl">
          <img
            src={location.image}
            alt={location.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 to-transparent" />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="absolute bottom-4 left-6">
            <div className="flex items-center gap-2 text-white">
              <MapPin className="w-5 h-5 text-blue-300" />
              <h2 className="text-2xl font-extrabold">
                Cleaning Services in {location.name}
              </h2>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Description */}
          <p className="text-slate-600 leading-relaxed">{location.localDesc}</p>

          {/* Services */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Services Available in {location.name}
            </h3>
            <div className="flex flex-wrap gap-2">
              {location.services.map((s) => (
                <span
                  key={s}
                  className="bg-blue-50 text-blue-700 text-sm font-semibold px-3 py-1.5 rounded-full"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* Nearby Areas */}
          <div>
            <h3 className="text-lg font-bold text-slate-900 mb-3">
              Also Serving Nearby Areas
            </h3>
            <div className="flex flex-wrap gap-2">
              {location.areas.map((a) => (
                <span
                  key={a}
                  className="inline-flex items-center gap-1 text-sm text-slate-600 bg-slate-100 px-3 py-1.5 rounded-full"
                >
                  <MapPin className="w-3 h-3 text-slate-400" /> {a}
                </span>
              ))}
            </div>
          </div>

          {/* Testimonial */}
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5">
            <div className="flex gap-1 mb-3">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className="w-4 h-4 text-amber-400 fill-amber-400"
                />
              ))}
            </div>
            <p className="text-slate-700 italic mb-3">
              &ldquo;{location.testimonial.text}&rdquo;
            </p>
            <div>
              <p className="font-bold text-slate-900 text-sm">
                {location.testimonial.name}
              </p>
              <p className="text-slate-500 text-xs">
                {location.testimonial.role}
              </p>
            </div>
          </div>

          {/* CTA */}
          <button
            type="button"
            onClick={onBook}
            className="w-full bg-blue-600 text-white font-bold py-4 rounded-2xl hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-lg shadow-lg shadow-blue-200"
          >
            Book Cleaning in {location.name}{' '}
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </motion.div>
  </AnimatePresence>
);

export const LocationsPage: React.FC<LocationsPageProps> = ({ onNavigate }) => {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(
    null
  );

  return (
    <div className="pb-24">
      {/* Hero: same width and style as home */}
      <div className="px-6 md:px-6 mt-2">
        <section className="relative max-w-7xl mx-auto rounded-2xl overflow-hidden min-h-[85vh] md:min-h-[90vh] flex flex-col justify-center">
          <div
            className="absolute inset-0 bg-cover bg-center bg-no-repeat"
            style={{
              backgroundImage:
                'url(https://images.unsplash.com/photo-1580982324076-d95230549339?auto=format&fit=crop&w=1600&q=80)',
            }}
            aria-hidden
          />
          <div className="absolute inset-0 bg-black/40" aria-hidden />
          <div className="relative z-10 px-8 md:px-12 lg:px-16 py-16 md:py-24 max-w-7xl mx-auto w-full">
            <div className="grid lg:grid-cols-12 gap-8 items-end">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="lg:col-span-7 space-y-5 md:space-y-6"
              >
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight tracking-tight">
                  Cleaning Services Across Cape Town
                </h1>
                <p className="text-lg md:text-xl text-white/95 max-w-xl leading-relaxed font-normal">
                  Shalean operates across all major Cape Town suburbs. Whether
                  you&apos;re in the City Bowl, Southern Suburbs, Atlantic
                  Seaboard, or Northern Suburbs — we&apos;re nearby and ready
                  to help.
                </p>
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 pt-2">
                  <button
                    type="button"
                    onClick={() => onNavigate('booking')}
                    className="inline-flex items-center justify-center rounded-full bg-gradient-to-b from-blue-500 to-blue-600 text-white font-semibold text-base px-8 py-3.5 hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg"
                  >
                    Book in Your Area
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('contact')}
                    className="inline-flex items-center justify-center rounded-full border-2 border-white text-white font-semibold text-base px-8 py-3.5 hover:bg-white/10 transition-colors"
                  >
                    Contact Us
                  </button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </div>

      {/* Location Grid: same section pattern as home (white card, pill + heading) */}
      <div className="px-6 md:px-6 mt-8 md:mt-10">
        <section className="max-w-7xl mx-auto">
          <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8 lg:p-10">
            <div className="mb-8 md:mb-10">
              <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-4">
                <MapPin className="w-4 h-4 text-slate-500" />
                Areas We Serve
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-2">
                Cape Town Locations We Serve
              </h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed max-w-2xl">
                Click any location to see local services, customer testimonials,
                and to book your clean.
              </p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 md:gap-6">
              {LOCATIONS.map((location, idx) => (
                <motion.div
                  key={location.slug}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.4, delay: idx * 0.06 }}
                  whileHover={{ y: -4 }}
                  onClick={() => setSelectedLocation(location)}
                  className="group cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md hover:border-blue-200 transition-all duration-300"
                >
                  <div className="aspect-[4/3] overflow-hidden">
                    <img
                      src={location.image}
                      alt={`Cleaning services in ${location.name}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-lg font-bold text-slate-900">
                        {location.name}
                      </h3>
                      <MapPin className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    </div>
                    <p className="text-slate-500 text-sm leading-relaxed mb-4">
                      {location.description}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {location.services.slice(0, 2).map((s) => (
                        <span
                          key={s}
                          className="text-[11px] font-semibold bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full"
                        >
                          {s}
                        </span>
                      ))}
                    </div>
                    <a
                      href={`/locations/${location.slug}`}
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-blue-600 text-sm font-semibold"
                    >
                      View area page &amp; book{" "}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </a>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Why Cape Town: same two-column + stat cards as home About / stats */}
      <div className="px-6 md:px-6 mt-8 md:mt-10">
        <section className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-5 md:gap-8 items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-20px' }}
              transition={{ duration: 0.4 }}
              className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-10 flex flex-col justify-center min-h-[320px] lg:min-h-0"
            >
              <span className="inline-flex items-center gap-2 text-slate-600 text-sm font-medium border border-slate-200 rounded-full px-4 py-1.5 w-fit mb-6">
                <MapPin className="w-4 h-4 text-slate-500" />
                Why Shalean
              </span>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-slate-900 tracking-tight mb-5 leading-tight">
                Why Cape Town Chooses Shalean
              </h2>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-6">
                We&apos;re not a national call centre — we&apos;re a Cape
                Town-based cleaning service that understands the local market.
                Our teams live and work in the suburbs they serve.
              </p>
              <p className="text-slate-600 text-base md:text-lg leading-relaxed mb-6">
                From the leafy estates of{' '}
                <strong className="text-slate-900">Constantia</strong> to{' '}
                <strong className="text-slate-900">Sea Point</strong> and{' '}
                <strong className="text-slate-900">Durbanville</strong> —
                Shalean is the local choice for professional home cleaning in
                Cape Town.
              </p>
              <ul className="space-y-3 mb-8">
                {[
                  'Local Cape Town teams — not national contractors',
                  'Same-week availability in all serving suburbs',
                  'Fully vetted and insured professionals',
                  '100% satisfaction guarantee on every clean',
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-3 text-slate-700 text-base">
                    <CheckCircle2 className="w-5 h-5 text-blue-500 shrink-0" aria-hidden />
                    {item}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => onNavigate('booking')}
                className="inline-flex items-center justify-center rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-semibold text-base px-6 py-3.5 transition-colors w-fit"
              >
                Book in Cape Town <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </motion.div>
            <div className="grid grid-cols-2 gap-4 md:gap-6">
              {[
                { value: '8+', title: 'Cape Town suburbs served', description: 'We cover Sea Point, Claremont, Durbanville, Observatory, Century City, Table View, Gardens, and Constantia.' },
                { value: '2,000+', title: 'Homes cleaned', description: 'Trusted by hundreds of homeowners and Airbnb hosts across the greater Cape Town metro.' },
                { value: '4.9★', title: 'Average rating', description: 'Consistently high ratings from customers in every suburb we serve.' },
                { value: 'Same Week', title: 'Availability', description: 'Fast scheduling with same-week slots in most areas.' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-20px' }}
                  transition={{ duration: 0.4, delay: idx * 0.08 }}
                  className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8"
                >
                  <p className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">{stat.value}</p>
                  <h3 className="text-lg font-bold text-slate-900 mb-3">{stat.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed">{stat.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      </div>

      {/* Final CTA: same blue card style as home "How It Works" */}
      <div className="px-6 md:px-6 mt-8 md:mt-10">
        <section className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-20px' }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl md:rounded-3xl bg-blue-600 shadow-xl p-6 md:p-8 lg:p-10"
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-6">
              <div>
                <span className="inline-flex items-center gap-2 text-blue-200 bg-blue-500/40 rounded-full px-4 py-2 text-sm font-medium mb-4 shadow-sm">
                  <MapPin className="w-4 h-4" />
                  Don&apos;t See Your Area?
                </span>
                <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white tracking-tight mb-3">
                  We&apos;re Expanding Across Cape Town
                </h2>
                <p className="text-white/90 text-base md:text-lg max-w-2xl">
                  Contact us to check availability in your suburb or to request
                  service in a new area.
                </p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 md:gap-4">
              <button
                type="button"
                onClick={() => onNavigate('contact')}
                className="inline-flex items-center justify-center rounded-xl bg-white text-blue-600 hover:bg-blue-50 font-semibold text-base px-6 py-3.5 transition-colors"
              >
                Contact Us <ChevronRight className="w-4 h-4 ml-1" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('booking')}
                className="inline-flex items-center justify-center rounded-xl border-2 border-white text-white font-semibold text-base px-6 py-3.5 hover:bg-white/10 transition-colors"
              >
                Book Now
              </button>
            </div>
          </motion.div>
        </section>
      </div>

      {/* Location Modal */}
      {selectedLocation && (
        <LocationModal
          location={selectedLocation}
          onClose={() => setSelectedLocation(null)}
          onBook={() => {
            setSelectedLocation(null);
            onNavigate('booking');
          }}
        />
      )}
    </div>
  );
};

export default LocationsPage;
