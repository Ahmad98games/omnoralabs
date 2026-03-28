import React from 'react';
import type { Metadata } from 'next';
import { Inter, Outfit } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-outfit' });

export const metadata: Metadata = {
  title: {
    default: 'Omnora OS | Industrial Commerce',
    template: '%s | Omnora OS'
  },
  description: 'The high-performance universal commerce operating system.',
  metadataBase: new URL('https://omnora.com'), // Fallback for canonicals
  openGraph: {
    type: 'website',
    siteName: 'Omnora OS',
  },
  twitter: {
    card: 'summary_large_image',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body style={{ margin: 0, padding: 0, background: '#000', color: '#fff' }}>
        {children}
      </body>
    </html>
  );
}
