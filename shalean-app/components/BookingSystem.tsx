import React from "react";

export const BookingSystem = ({
  onNavigateContact,
}: {
  onNavigateContact: () => void;
}) => {
  return (
    <div className="min-h-[60vh] px-6 py-24 bg-slate-50 flex items-center justify-center">
      <div className="max-w-xl w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 space-y-4 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-2">
          Booking System Placeholder
        </h2>
        <p className="text-slate-600">
          This is a placeholder for the interactive booking system. You can
          extend this component with forms, date pickers, and payment
          integrations as needed.
        </p>
        <button
          type="button"
          onClick={onNavigateContact}
          className="mt-4 inline-flex items-center justify-center px-6 py-3 rounded-full bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
        >
          Contact Us Instead
        </button>
      </div>
    </div>
  );
};

