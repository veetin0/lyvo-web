import { ReactNode } from 'react';
import { Inter } from "next/font/google";
import './globals.css';
import Providers from '@/components/Providers';

const inter = Inter({ subsets: ["latin"] });

// No need for locale provider here, it's handled at [locale]/layout

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.className}>
      <head>
        <link rel="icon" href="/images/lyvo-logo.png" type="image/png" />
      </head>
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
