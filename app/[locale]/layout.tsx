import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import IntlProviderWrapper from "@/components/IntlProviderWrapper";

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

  try {
    const messages = (await import(`../../messages/${locale}.json`)).default;

    return (
      <IntlProviderWrapper locale={locale} messages={messages}>
        {children}
      </IntlProviderWrapper>
    );
  } catch {
    notFound();
  }

  return null;
}