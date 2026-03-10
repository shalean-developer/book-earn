"use client";

import React from "react";

export const CustomerDashboard = ({
  onBack,
  onBookNew,
}: {
  onBack: () => void;
  onBookNew: () => void;
}) => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-white">
        <h1 className="text-xl font-bold text-slate-900">
          Customer Portal (Placeholder)
        </h1>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onBookNew}
            className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Book New Cleaning
          </button>
          <button
            type="button"
            onClick={onBack}
            className="rounded-full border border-slate-300 px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
          >
            Back to site
          </button>
        </div>
      </header>
      <main className="flex-1 px-6 py-8">
        <p className="text-slate-600">
          This is a placeholder customer dashboard. We can show upcoming bookings,
          history, billing details and more here.
        </p>
      </main>
    </div>
  );
};

