import React, { Suspense } from "react";
import { redirect } from "next/navigation";
import ShaleanWebsite from "@/components/ShaleanWebsite";

const VALID_ROLES = ["customer", "cleaner", "admin"] as const;

type Props = { params: Promise<{ role: string }> };

export default async function DashboardRolePage({ params }: Props) {
  const { role } = await params;
  if (!VALID_ROLES.includes(role as (typeof VALID_ROLES)[number])) {
    redirect("/");
  }
  return (
    <Suspense fallback={null}>
      <ShaleanWebsite initialPage={role as (typeof VALID_ROLES)[number]} />
    </Suspense>
  );
}
