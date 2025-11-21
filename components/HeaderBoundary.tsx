"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";

const Header = dynamic(() => import("./header"), {
  ssr: false,
  loading: () => <div className="h-16" />,
});

export default function HeaderBoundary() {
  return (
    <Suspense fallback={<div className="h-16" />}>
      <Header />
    </Suspense>
  );
}
