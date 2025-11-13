import { NextIntlClientProvider } from 'next-intl';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import '../globals.css';
import RootLayout from '../layout';

export function generateStaticParams() {
  return [{ locale: 'fi' }, { locale: 'sv' }, { locale: 'en' }];
}

export default async function LocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  let messages;
  try {
    messages = (await import(`../../locales/${locale}.json`)).default;
  } catch (error) {
    notFound();
  }

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <RootLayout>{children}</RootLayout>
    </NextIntlClientProvider>
  );
}