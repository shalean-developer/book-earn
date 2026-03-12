"use client";

import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AdminDashboard as RichAdminDashboard } from "@/components/AdminDashboard";

export default function AdminPage() {
  const router = useRouter();
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-500">Loading your admin dashboard...</p>
      </div>
    );
  }

  return (
    <RichAdminDashboard
      onBack={() => {
        router.push("/");
      }}
    />
  );
}

