"use client";

import React from "react";

export const AdminDashboard = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-xl font-bold">Admin Dashboard (Placeholder)</h1>
        <button
          type="button"
          onClick={onBack}
          className="rounded-full border border-slate-600 px-4 py-2 text-sm hover:bg-slate-800"
        >
          Back to site
        </button>
      </header>
      <main className="flex-1 px-6 py-8">
        <p className="text-slate-400">
          This is a placeholder admin dashboard. We can add bookings, customers,
          cleaners, analytics and more here.
        </p>
      </main>
    </div>
  );
};

