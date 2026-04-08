"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import {
  Facebook,
  Twitter,
  Instagram,
  Linkedin,
  MapPin,
} from "lucide-react";

const services = [
  { label: "Standard Clean", href: "/services#standard" },
  { label: "Deep Clean", href: "/services#deep" },
  { label: "Airbnb Clean", href: "/services#airbnb" },
  { label: "Carpet Clean", href: "/services#carpet" },
  { label: "Move In / Out", href: "/services#move" },
  { label: "Office Clean", href: "/services" },
  { label: "Eco Clean", href: "/services" },
];

const company = [
  { label: "About us", href: "/about" },
  { label: "Join our team", href: "/careers" },
  { label: "Locations", href: "/locations" },
  { label: "Shalean Prime", href: "/promotions" },
  { label: "For business", href: "/contact" },
];

const support = [
  { label: "Help centre", href: "/contact" },
  { label: "Contact us", href: "/contact" },
  { label: "Cancellation policy", href: "/cancellation-policy" },
  { label: "Trust & safety", href: "/about" },
  { label: "Accessibility", href: "/contact" },
];

const legal = [
  { label: "Privacy policy", href: "/terms" },
  { label: "Terms of service", href: "/terms" },
  { label: "Cookie policy", href: "/terms" },
  { label: "POPIA notice", href: "/terms" },
];

const social = [
  { label: "Facebook", href: "#", icon: Facebook },
  { label: "Twitter", href: "#", icon: Twitter },
  { label: "Instagram", href: "#", icon: Instagram },
  { label: "LinkedIn", href: "#", icon: Linkedin },
];

const linkClass =
  "text-neutral-400 transition hover:text-white text-sm leading-relaxed";

function dashboardHrefForRole(role: string | undefined): string | null {
  if (role === "admin") return "/admin";
  if (role === "customer") return "/customer";
  if (role === "cleaner") return "/cleaner";
  return null;
}

const Footer = () => {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string } | undefined)?.role;
  const dashboardHref = dashboardHrefForRole(role);
  const isAuthed = status === "authenticated";

  return (
    <footer className="bg-[#0a0a0a] text-neutral-400">
      <div className="max-w-7xl mx-auto w-full px-6 pt-8 pb-10 md:pt-10 md:pb-12">
        <div className="grid gap-12 lg:gap-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1.85fr)]">
          {/* Brand */}
          <div className="space-y-6">
            <Link
              href="/"
              className="inline-block text-2xl font-bold tracking-tight text-white"
            >
              Shalean.
            </Link>
            <p className="max-w-md text-sm leading-relaxed text-neutral-400">
              Professional cleaning services for homes and businesses across
              South Africa. Vetted cleaners, transparent pricing, guaranteed
              results.
            </p>
            <div className="flex items-center gap-2 text-sm text-neutral-400">
              <span
                className="h-2 w-2 shrink-0 rounded-full bg-teal-500"
                aria-hidden
              />
              <span>
                Available in Cape Town, Johannesburg, Pretoria &amp; Durban
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {social.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-neutral-800/80 text-neutral-300 transition hover:bg-neutral-700 hover:text-white"
                >
                  <Icon className="h-4 w-4" strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 md:gap-12 lg:grid-cols-5">
            <div>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Account
              </h3>
              <ul className="space-y-2.5">
                {isAuthed && dashboardHref ? (
                  <>
                    <li>
                      <Link href={dashboardHref} className={linkClass}>
                        My dashboard
                      </Link>
                    </li>
                    <li>
                      <button
                        type="button"
                        onClick={() => signOut({ callbackUrl: "/" })}
                        className={`${linkClass} text-left w-full bg-transparent border-0 p-0 cursor-pointer`}
                      >
                        Sign out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link href="/login" className={linkClass}>
                        Sign in
                      </Link>
                    </li>
                    <li>
                      <Link href="/signup" className={linkClass}>
                        Create account
                      </Link>
                    </li>
                    <li>
                      <Link href="/login" className={linkClass}>
                        Cleaner &amp; admin login
                      </Link>
                    </li>
                  </>
                )}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Services
              </h3>
              <ul className="space-y-2.5">
                {services.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Company
              </h3>
              <ul className="space-y-2.5">
                {company.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Support
              </h3>
              <ul className="space-y-2.5">
                {support.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-neutral-500">
                Legal
              </h3>
              <ul className="space-y-2.5">
                {legal.map((item) => (
                  <li key={item.label}>
                    <Link href={item.href} className={linkClass}>
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-neutral-800/90 pt-8 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 Shalean Cleaning Services Inc. All rights
            reserved.
          </p>
          <div className="flex items-center gap-1.5 text-neutral-500">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>South Africa</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
