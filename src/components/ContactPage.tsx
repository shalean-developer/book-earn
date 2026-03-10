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

export const ContactPage = ({ onNavigate }: { onNavigate: (page: PageType) => void }) => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
      <p className="text-slate-600 mb-4">
        This is a placeholder Contact page. We can later replace this with your full
        contact form, WhatsApp entry points, and details.
      </p>
      <p className="text-slate-500">
        For now, use the footer and floating actions on the home page to simulate
        contact options.
      </p>
    </div>
  );
};

