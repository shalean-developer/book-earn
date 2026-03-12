"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { CleanerDashboard as RichCleanerDashboard } from "@/components/CleanerDashboard";

export default function CleanerPage() {
  const router = useRouter();
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">
          Loading your cleaner dashboard...
        </p>
      </div>
    );
  }

  return (
    <RichCleanerDashboard
      onBack={() => {
        router.push("/");
      }}
    />
  );
}

