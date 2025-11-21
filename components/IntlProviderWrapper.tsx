"use client";

import { ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import Header from "./header";

interface IntlProviderWrapperProps {
  locale: string;
  messages: any;
  children: ReactNode;
}

export default function IntlProviderWrapper({
  locale,
  messages,
  children,
}: IntlProviderWrapperProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      <main className="pt-16">
        {children}
      </main>
    </NextIntlClientProvider>
  );
}
