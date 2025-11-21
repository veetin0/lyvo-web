import { ReactNode } from "react";
import { notFound } from "next/navigation";
import LocaleLayoutClient from "@/components/LocaleLayoutClient";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const supportedLocales = ["fi", "en", "sv"];
  if (!supportedLocales.includes(locale)) {
    notFound();
  }

  let messages;
  try {
    messages = (await import(`../../messages/${locale}.json`)).default;
  } catch {
    notFound();
  }

  return (
    <LocaleLayoutClient>
      {children}
    </LocaleLayoutClient>
  );
}