import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { MapPin, ArrowRight, Calendar } from "lucide-react";
import { SITE_URL } from "@/lib/utils";

const LOCATIONS: { name: string; slug: string }[] = [
  { name: "Sea Point", slug: "sea-point" },
  { name: "Claremont", slug: "claremont" },
  { name: "Durbanville", slug: "durbanville" },
  { name: "Observatory", slug: "observatory" },
  { name: "Century City", slug: "century-city" },
  { name: "Table View", slug: "table-view" },
  { name: "Gardens", slug: "gardens" },
  { name: "Constantia", slug: "constantia" },
];

export function generateStaticParams() {
  return LOCATIONS.map((loc) => ({ slug: loc.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const loc = LOCATIONS.find((l) => l.slug === slug);
  if (!loc)
    return {
      title: "Location – Shalean Cleaning Services",
      alternates: { canonical: `${SITE_URL}/locations` },
      openGraph: { url: `${SITE_URL}/locations`, type: "website" },
    };
  const url = `${SITE_URL}/locations/${slug}`;
  const title = `Cleaning Services in ${loc.name} – Shalean`;
  const description = `Professional home and office cleaning in ${loc.name}, Cape Town. Book trusted Shalean cleaners with same-week availability.`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      url,
      title,
      description,
      type: "website",
    },
  };
}

export default async function LocationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const location = LOCATIONS.find((l) => l.slug === slug);
  if (!location) notFound();
  const otherLocations = LOCATIONS.filter((l) => l.slug !== slug);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="border-b border-slate-200 bg-white">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-slate-700 hover:text-slate-900"
          >
            <Image
              src="/logo.png"
              alt="Shalean"
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
            />
            <span className="font-bold tracking-wide">Shalean</span>
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-slate-600 hover:text-blue-600"
          >
            Log in
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="flex items-center gap-2 text-slate-500 mb-4">
          <MapPin className="w-4 h-4" />
          <span className="text-sm font-medium">Cape Town</span>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
          Cleaning services in {location.name}
        </h1>
        <p className="text-lg text-slate-600 mb-8 max-w-2xl">
          Shalean provides professional home, office and Airbnb cleaning in{" "}
          <strong className="text-slate-900">{location.name}</strong> and the
          greater Cape Town area. Our local team offers same-week availability,
          vetted cleaners and transparent pricing.
        </p>

        <div className="flex flex-wrap gap-4">
          <Link
            href="/booking/your-cleaning-plan"
            className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-bold text-white shadow-md hover:bg-blue-700"
          >
            <Calendar className="w-4 h-4" />
            Book a clean in {location.name}
          </Link>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-full border-2 border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 hover:border-slate-300 hover:bg-slate-50"
          >
            View all areas
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <section className="mt-12 pt-8 border-t border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-3">
            Other areas we serve
          </h2>
          <ul className="flex flex-wrap gap-x-2 gap-y-1 items-center">
            {otherLocations.map((l, i) => (
              <li key={l.slug} className="flex items-center gap-2">
                <Link
                  href={`/locations/${l.slug}`}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {l.name}
                </Link>
                {i < otherLocations.length - 1 && (
                  <span className="text-slate-300">|</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
