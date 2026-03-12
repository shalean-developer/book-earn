"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CustomerDashboard } from "@/components/CustomerDashboard";

export default function CustomerPage() {
  const router = useRouter();
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading your customer dashboard...
        </p>
      </div>
    );
  }

  return (
    <CustomerDashboard
      onBack={() => {
        router.push("/");
      }}
      onBookNew={() => {
        router.push("/booking/your-cleaning-plan");
      }}
    />
  );
}

