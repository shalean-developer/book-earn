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

export const LocationsPage = ({ onNavigate }: { onNavigate: (page: PageType) => void }) => {
  return (
    <div className="max-w-4xl mx-auto px-6 py-24">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Locations</h1>
      <p className="text-slate-600">
        This is a placeholder Locations page. We can list all Cape Town suburbs and
        service details here.
      </p>
    </div>
  );
};

