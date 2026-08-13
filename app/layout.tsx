import type { ReactNode } from "react";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { Inter } from "next/font/google";
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ["latin"] });

const SUPPORTED_LOCALES = ["fi", "en", "sv"];
const DEFAULT_LOCALE = "fi";

// Without this every page rendered an empty <title>, so browser tabs and
// bookmarks showed a bare URL and search results had nothing to display.
// Locale layouts override these with translated copy.
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXTAUTH_URL ?? "http://localhost:3000"),
  // No template here: the locale layout owns it. A template at this level would
  // also wrap the locale layout's own title, giving "Lyvo — kimppakyydit | Lyvo".
  title: "Lyvo",
  description: "Lyvo — kimppakyydit Suomessa.",
  icons: { icon: "/images/lyvo-logo.png" },
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  // The locale is a child route segment, so it is not available here directly.
  // The middleware forwards the pathname for exactly this reason.
  const pathname = (await headers()).get("x-pathname") ?? "";
  const candidate = pathname.split("/")[1] ?? "";
  const locale = SUPPORTED_LOCALES.includes(candidate) ? candidate : DEFAULT_LOCALE;

  return (
    <html lang={locale} className={inter.className}>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
