import type { ReactNode } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import IntlProviderWrapper from "@/components/IntlProviderWrapper";

const SITE_METADATA: Record<string, { title: string; description: string }> = {
  fi: {
    title: "Lyvo — kimppakyydit",
    description:
      "Löydä kimppakyyti tai jaa oma matkasi. Lyvo yhdistää kuljettajat ja matkustajat samalle reitille.",
  },
  en: {
    title: "Lyvo — ride sharing",
    description:
      "Find a ride or share your own journey. Lyvo connects drivers and passengers travelling the same route.",
  },
  sv: {
    title: "Lyvo — samåkning",
    description:
      "Hitta en skjuts eller dela din egen resa. Lyvo kopplar ihop förare och passagerare på samma rutt.",
  },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const copy = SITE_METADATA[locale] ?? SITE_METADATA.fi;

  return {
    // `default` covers every page that does not set its own title; `template`
    // decorates the ones that eventually do (e.g. "Varaukset | Lyvo").
    title: { default: copy.title, template: "%s | Lyvo" },
    description: copy.description,
    alternates: {
      canonical: `/${locale}`,
      languages: { fi: "/fi", en: "/en", sv: "/sv" },
    },
    openGraph: {
      title: copy.title,
      description: copy.description,
      locale,
      type: "website",
    },
  };
}

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