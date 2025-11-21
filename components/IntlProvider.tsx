"use client";

import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";
import Header from "./header";

interface IntlProviderProps {
  locale: string;
  messagesJson: string;
  children: ReactNode;
}

export default function IntlProvider({
  locale,
  messagesJson,
  children,
}: IntlProviderProps) {
  const messages = JSON.parse(messagesJson);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      <main className="pt-16">{children}</main>
    </NextIntlClientProvider>
  );
}
