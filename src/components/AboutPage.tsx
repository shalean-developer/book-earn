"use client";

import React from "react";

import { Button } from "@/components/ui/button";

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

export const AboutPage = ({ onNavigate }: { onNavigate: (page: PageType) => void }) => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">About Shalean</h1>
      <p className="text-slate-600 mb-6">
        This is a placeholder About page. We can replace this with your full About
        content and layout next.
      </p>
      <Button onClick={() => onNavigate("home")}>Back to Home</Button>
    </div>
  );
};

