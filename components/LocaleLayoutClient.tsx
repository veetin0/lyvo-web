"use client";

import { ReactNode } from "react";
import Header from "./header";

export default function LocaleLayoutClient({ children }: { children: ReactNode }) {
  return (
    <>
      <Header />
      <main className="pt-16">{children}</main>
    </>
  );
}
