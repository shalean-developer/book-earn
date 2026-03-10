"use client";

import React from "react";

type PageType =
  | "home"
  | "services"
  | "booking"
  | "locations"
  | "about"
  | "blog"
  | "contact"
  | "careers"
  | "pricing"
  | "admin"
  | "customer"
  | "cleaner";

export const PricingPage = ({ onNavigate }: { onNavigate: (page: PageType) => void }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Pricing</h1>
      <p className="text-slate-600">
        This is a placeholder Pricing page. We can plug in your full pricing
        tables and content here.
      </p>
    </div>
  );
};

