"use client";

import React from "react";

export const CleanerDashboard = ({ onBack }: { onBack: () => void }) => {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col">
      <header className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h1 className="text-xl font-bold">Cleaner Portal (Placeholder)</h1>
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
          This is a placeholder cleaner dashboard. We can add schedules, route
          planning, payouts, and job details here.
        </p>
      </main>
    </div>
  );
};

