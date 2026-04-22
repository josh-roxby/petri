import { Chakra_Petch, Space_Mono } from 'next/font/google';
import './globals.css';

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

const chakraPetch = Chakra_Petch({
  subsets: ['latin'],
  weight: ['300', '500', '600'],
  variable: '--font-chakra-petch',
  display: 'swap',
});

export const metadata = {
  title: 'Petri',
  description:
    'Grow mutating compounds. Balance volatility against potency. Harvest what survives.',
  manifest: '/manifest.json',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#060606',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceMono.variable} ${chakraPetch.variable}`}>
      <body>{children}</body>
    </html>
  );
}
