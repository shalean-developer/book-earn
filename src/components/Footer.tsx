import Link from "next/link";
import Image from "next/image";
import { Instagram, Twitter } from "lucide-react";

const Footer = () => {
  const explore = [
    { label: "Home", href: "/" },
    { label: "Book a clean", href: "/booking/your-cleaning-plan" },
    { label: "Promotions", href: "/promotions" },
    { label: "Log in", href: "/login" },
  ];

  const company = [
    { label: "About", href: "/" },
    { label: "Contact", href: "/" },
    { label: "Areas we serve", href: "/locations/sea-point" },
  ];

  const legal = [
    { label: "Terms of service", href: "/terms" },
    { label: "Cancellation policy", href: "/cancellation-policy" },
  ];

  const social = [
    { label: "X", icon: <Twitter className="h-4 w-4" /> },
    { label: "Instagram", icon: <Instagram className="h-4 w-4" /> },
  ];

  return (
    <footer className="bg-neutral-950 text-neutral-100 py-12">
      <div className="container mx-auto px-4">
        <div className="relative overflow-hidden rounded-3xl border border-neutral-800 bg-black/90 px-6 py-10 md:px-10 md:py-12">
          {/* Big watermark text */}
          <div className="pointer-events-none absolute inset-x-0 bottom-[-10%] flex justify-center opacity-10">
            <span className="font-semibold tracking-[0.2em] text-[60px] md:text-[96px] lg:text-[128px]">
              SHALEAN
            </span>
          </div>

          <div className="relative grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* Left: Brand */}
            <div className="space-y-6">
              <div className="space-y-3">
                <Link href="/" className="inline-flex items-center gap-2">
                  <Image
                    src="/logo.png"
                    alt="Shalean"
                    width={40}
                    height={40}
                    className="h-10 w-10 object-contain"
                  />
                  <h2 className="text-xl font-semibold tracking-tight text-white">
                    Shalean Cleaning Services
                  </h2>
                </Link>
                <p className="max-w-sm text-sm text-neutral-400">
                  Professional home, office and Airbnb cleaning in Cape Town.
                  Book online with trusted, vetted cleaners.
                </p>
              </div>

              <div className="flex items-center gap-3 text-neutral-400">
                {social.map((item) => (
                  <a
                    key={item.label}
                    href="#"
                    aria-label={item.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/60 text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
                  >
                    {item.icon}
                  </a>
                ))}
              </div>
            </div>

            {/* Right: Columns */}
            <div className="grid gap-8 text-sm md:grid-cols-3">
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Explore
                </h3>
                <ul className="space-y-2">
                  {explore.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-neutral-300 transition hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Company
                </h3>
                <ul className="space-y-2">
                  {company.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-neutral-300 transition hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Legal
                </h3>
                <ul className="space-y-2">
                  {legal.map((item) => (
                    <li key={item.label}>
                      <Link
                        href={item.href}
                        className="text-neutral-300 transition hover:text-white"
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="relative mt-10 flex flex-col gap-4 border-t border-neutral-800 pt-6 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
            <p>©2026 Shalean Cleaning Services. All rights reserved</p>
            <div className="flex items-center gap-6">
              <Link href="/terms" className="transition hover:text-neutral-200">
                Terms of service
              </Link>
              <Link href="/cancellation-policy" className="transition hover:text-neutral-200">
                Cancellation policy
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
