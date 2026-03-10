import { Instagram, Twitter } from "lucide-react";

const Footer = () => {
  const navigation = ["Home", "Features", "Service", "How it works", "Pricing", "FAQ"];
  const whatWeDo = ["Workflow Automation", "Collaboration Tools", "Integrations", "How it works", "Policy"];
  const support = ["FAQ", "Collaboration", "Hire Me", "Licensing & Usage", "Feedback", "Resources"];

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
              HOMYCLEAN
            </span>
          </div>

          <div className="relative grid gap-10 md:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
            {/* Left: Brand */}
            <div className="space-y-6">
              <div className="space-y-3">
                <h2 className="text-xl font-semibold tracking-tight">HomyClean</h2>
                <p className="max-w-sm text-sm text-neutral-400">
                  Crafting meaningful designs that blend creativity, usability, and impact.
                </p>
              </div>

              <div className="flex items-center gap-3 text-neutral-400">
                {social.map((item) => (
                  <button
                    key={item.label}
                    aria-label={item.label}
                    className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-700 bg-neutral-900/60 text-neutral-200 transition hover:border-neutral-500 hover:bg-neutral-800"
                  >
                    {item.icon}
                  </button>
                ))}
              </div>
            </div>

            {/* Right: Columns */}
            <div className="grid gap-8 text-sm md:grid-cols-3">
              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Navigation
                </h3>
                <ul className="space-y-2">
                  {navigation.map((item) => (
                    <li key={item}>
                      <a href="#" className="text-neutral-300 transition hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  What we do
                </h3>
                <ul className="space-y-2">
                  {whatWeDo.map((item) => (
                    <li key={item}>
                      <a href="#" className="text-neutral-300 transition hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                  Support
                </h3>
                <ul className="space-y-2">
                  {support.map((item) => (
                    <li key={item}>
                      <a href="#" className="text-neutral-300 transition hover:text-white">
                        {item}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="relative mt-10 flex flex-col gap-4 border-t border-neutral-800 pt-6 text-xs text-neutral-500 md:flex-row md:items-center md:justify-between">
            <p>©2025 HomyClean. All rights reserved</p>
            <div className="flex items-center gap-6">
              <a href="#" className="transition hover:text-neutral-200">
                Privacy Policy
              </a>
              <a href="#" className="transition hover:text-neutral-200">
                Term of Use
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

