import type { Metadata } from "next";

const LOCATIONS = [
  {
    name: "Sea Point",
    slug: "sea-point",
    heading: "Cleaning Services in Sea Point, Cape Town",
    intro:
      "Sea Point is one of Cape Town's most vibrant coastal neighbourhoods, with a mix of modern apartment blocks, holiday rentals, and family homes.",
    services: ["Standard Cleaning", "Airbnb Cleaning", "Deep Cleaning"],
    areas: ["Fresnaye", "Three Anchor Bay", "Green Point", "De Waterkant"],
  },
  {
    name: "Claremont",
    slug: "claremont",
    heading: "Cleaning Services in Claremont, Cape Town",
    intro:
      "Claremont in the Southern Suburbs is known for its leafy streets, top schools, and spacious family homes.",
    services: ["Standard Cleaning", "Deep Cleaning", "Move In / Out"],
    areas: ["Upper Claremont", "Lower Claremont", "Harfield Village", "Kenilworth"],
  },
  {
    name: "Durbanville",
    slug: "durbanville",
    heading: "Cleaning Services in Durbanville, Cape Town",
    intro:
      "Durbanville is a fast‑growing northern suburb with new estates, wine farms, and larger family properties.",
    services: ["Standard Cleaning", "Deep Cleaning", "Carpet Cleaning"],
    areas: ["Sonstraal", "Pinehurst", "Protea Valley", "Vierlanden"],
  },
  {
    name: "Observatory",
    slug: "observatory",
    heading: "Cleaning Services in Observatory, Cape Town",
    intro:
      "Observatory is a diverse, artsy suburb popular with students, young professionals, and families.",
    services: ["Standard Cleaning", "Deep Cleaning", "Move In / Out"],
    areas: ["Lower Observatory", "Upper Observatory", "Salt River", "Woodstock"],
  },
  {
    name: "Century City",
    slug: "century-city",
    heading: "Cleaning Services in Century City, Cape Town",
    intro:
      "Century City combines luxury apartments, offices, and retail in one mixed‑use precinct.",
    services: ["Standard Cleaning", "Airbnb Cleaning", "Deep Cleaning"],
    areas: ["Bridgeways", "Canal Walk vicinity", "Ratanga Junction area", "Nouveau"],
  },
  {
    name: "Table View",
    slug: "table-view",
    heading: "Cleaning Services in Table View & Blouberg, Cape Town",
    intro:
      "Table View and Bloubergstrand are popular beachside suburbs with fantastic views of Table Mountain.",
    services: ["Standard Cleaning", "Airbnb Cleaning", "Carpet Cleaning"],
    areas: ["Bloubergstrand", "Parklands", "Sunningdale", "Milnerton"],
  },
  {
    name: "Gardens",
    slug: "gardens",
    heading: "Cleaning Services in Gardens, Cape Town",
    intro:
      "Gardens in the City Bowl blends historic Victorian cottages with modern apartments and townhouses.",
    services: ["Standard Cleaning", "Deep Cleaning", "Move In / Out"],
    areas: ["De Waal Park area", "Tamboerskloof", "Oranjezicht", "Higgovale"],
  },
  {
    name: "Constantia",
    slug: "constantia",
    heading: "Premium Cleaning Services in Constantia, Cape Town",
    intro:
      "Constantia is home to luxury estates, wine farms, and some of Cape Town's finest residential properties.",
    services: ["Standard Cleaning", "Deep Cleaning", "Carpet Cleaning"],
    areas: ["Upper Constantia", "Lower Constantia", "Constantia Valley", "Bergvliet"],
  },
] as const;

type LocationSlug = (typeof LOCATIONS)[number]["slug"];

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const location = LOCATIONS.find((loc) => loc.slug === slug) as
    | (typeof LOCATIONS)[number]
    | undefined;

  if (!location) {
    return {
      title: "Cleaning Services in Cape Town | Shalean",
      description:
        "Professional home and Airbnb cleaning services across Cape Town's major suburbs.",
      robots: { index: false, follow: true },
    };
  }

  const baseTitle = location.heading;

  return {
    title: `${baseTitle} | Shalean`,
    description: `Professional home and Airbnb cleaning services in ${location.name}, Cape Town and nearby areas like ${location.areas.join(
      ", ",
    )}.`,
    openGraph: {
      title: `${baseTitle} | Shalean`,
      description: `Book trusted cleaners in ${location.name}, Cape Town and nearby suburbs such as ${location.areas.join(
        ", ",
      )}.`,
    },
    twitter: {
      card: "summary_large_image",
      title: `${baseTitle} | Shalean`,
      description: `Local cleaning services in ${location.name}, Cape Town with vetted cleaners and transparent pricing.`,
    },
  };
}

export default async function LocationDetailPage({ params }: Props) {
  const { slug } = await params;
  const location = LOCATIONS.find((loc) => loc.slug === slug as LocationSlug);

  if (!location) {
    return (
      <main className="min-h-screen bg-slate-50 pt-24 pb-24">
        <section className="px-6 md:px-8">
          <div className="max-w-3xl mx-auto bg-white rounded-2xl border border-slate-100 shadow-sm p-8 md:p-10">
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
              Area not found
            </h1>
            <p className="text-slate-600 mb-6">
              We could not find this Cape Town suburb. Please browse our main locations page to
              see all areas we currently serve.
            </p>
            <a
              href="/locations"
              className="inline-flex items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-sm px-6 py-3 hover:bg-blue-700 transition-colors"
            >
              View Cape Town locations
            </a>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 pt-24 pb-24">
      <section className="px-6 md:px-8">
        <div className="max-w-5xl mx-auto">
          <header className="mb-8 md:mb-10">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-blue-600 mb-3">
              Cape Town • Locations
            </p>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4">
              {location.heading}
            </h1>
            <p className="text-slate-600 text-base md:text-lg max-w-3xl">
              {location.intro} Shalean Cleaning Services provides professional home and Airbnb
              cleaning across {location.name} and nearby suburbs in Cape Town.
            </p>
          </header>

          <div className="grid lg:grid-cols-[2fr,1.2fr] gap-8 md:gap-10">
            <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 md:p-8">
              <h2 className="text-xl md:text-2xl font-bold text-slate-900 mb-4">
                Services available in {location.name}
              </h2>
              <p className="text-slate-600 mb-4">
                Book any of the following cleaning services in {location.name} with transparent
                pricing and vetted local cleaners.
              </p>
              <ul className="space-y-3">
                {location.services.map((service) => (
                  <li
                    key={service}
                    className="flex items-center gap-2 text-sm md:text-base text-slate-700"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-blue-600 text-xs font-bold">
                      ✓
                    </span>
                    {service}
                  </li>
                ))}
              </ul>
            </section>

            <aside className="space-y-6">
              <section className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
                <h2 className="text-lg font-bold text-slate-900 mb-3">
                  Nearby areas we also cover
                </h2>
                <div className="flex flex-wrap gap-2">
                  {location.areas.map((area) => (
                    <span
                      key={area}
                      className="inline-flex items-center rounded-full bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 border border-slate-200"
                    >
                      {area}
                    </span>
                  ))}
                </div>
              </section>

              <section className="bg-blue-600 rounded-2xl shadow-md p-6 text-white">
                <h2 className="text-lg font-bold mb-2">
                  Book cleaning in {location.name}
                </h2>
                <p className="text-blue-100 text-sm mb-4">
                  Get an instant online quote and confirm your booking in under a minute.
                </p>
                <a
                  href="/booking/standard-cleaning"
                  className="inline-flex w-full items-center justify-center rounded-full bg-white text-blue-600 font-semibold text-sm px-6 py-3 hover:bg-blue-50 transition-colors"
                >
                  Book a clean
                </a>
              </section>
            </aside>
          </div>
        </div>
      </section>
    </main>
  );
}

