import { headers } from "next/headers";
import { redirect } from "next/navigation";

const SUPPORTED_LOCALES = ["fi", "en", "sv"] as const;

const resolveLocaleFromReferer = (referer: string | null): string | null => {
  if (!referer) {
    return null;
  }

  try {
    const url = new URL(referer);
    const segments = url.pathname.split("/").filter(Boolean);
    if (segments.length > 0 && SUPPORTED_LOCALES.includes(segments[0] as (typeof SUPPORTED_LOCALES)[number])) {
      return segments[0];
    }
  } catch {
    // Ignore parsing errors and fall back to other detection methods
  }

  return null;
};

const resolveLocaleFromAcceptLanguage = (acceptLanguage: string | null): string | null => {
  if (!acceptLanguage) {
    return null;
  }

  const candidates = acceptLanguage.split(",").map((part) => part.trim().split(";")[0]);
  for (const locale of candidates) {
    const languageCode = locale.split("-")[0];
    if (SUPPORTED_LOCALES.includes(languageCode as (typeof SUPPORTED_LOCALES)[number])) {
      return languageCode;
    }
  }

  return null;
};

export default async function LegacyRideListPage() {
  const headerStore = await headers();
  const refererLocale = resolveLocaleFromReferer(headerStore.get("referer"));
  const detectedLocale = refererLocale ?? resolveLocaleFromAcceptLanguage(headerStore.get("accept-language")) ?? "en";

  redirect(`/${detectedLocale}/rides`);
  return null;
}
