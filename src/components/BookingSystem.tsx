"use client";

import React from "react";

export const BookingSystem = ({
  onNavigateContact,
}: {
  onNavigateContact: () => void;
}) => {
  return (
    <div className="max-w-3xl mx-auto px-6 py-24">
      <h1 className="text-3xl md:text-4xl font-bold mb-4">Book a Cleaning</h1>
      <p className="text-slate-600 mb-4">
        This is a placeholder Booking System. We can later replace this with your
        full multi-step booking flow, pricing logic, and integrations.
      </p>
      <button
        type="button"
        onClick={onNavigateContact}
        className="mt-4 inline-flex items-center justify-center rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700"
      >
        Contact Us Instead
      </button>
    </div>
  );
};

