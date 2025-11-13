"use client";

import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("home");

  return (
    <main className="text-center mt-10">
      <h1 className="text-3xl font-bold text-emerald-700">{t("title")}</h1>
      <p className="text-neutral-700 mt-2">{t("subtitle")}</p>
    </main>
  );
}