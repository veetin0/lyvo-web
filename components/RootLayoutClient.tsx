"use client";

import { NextIntlClientProvider } from "next-intl";
import { ReactNode } from "react";
import Header from "./header";

interface RootLayoutClientProps {
  locale: string;
  messagesJson: string;
  children: ReactNode;
}

export default function RootLayoutClient({
  locale,
  messagesJson,
  children,
}: RootLayoutClientProps) {
  const messages = JSON.parse(messagesJson);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <Header />
      <main className="pt-16">{children}</main>
    </NextIntlClientProvider>
  );
}
