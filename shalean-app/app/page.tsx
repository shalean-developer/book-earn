import React, { Suspense } from "react";
import ShaleanWebsite from "../components/ShaleanWebsite";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <ShaleanWebsite initialPage="home" />
    </Suspense>
  );
}

