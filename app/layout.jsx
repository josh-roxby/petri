import { Chakra_Petch, Space_Mono } from 'next/font/google';
import { ServiceWorkerRegistrar } from '@/components/shell/ServiceWorkerRegistrar';
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

const DESCRIPTION =
  'Grow mutating compounds. Balance volatility against potency. Harvest what survives.';

export const metadata = {
  title: {
    default: 'Petri',
    template: '%s · Petri',
  },
  description: DESCRIPTION,
  manifest: '/manifest.json',
  applicationName: 'Petri',
  appleWebApp: {
    capable: true,
    title: 'Petri',
    // black-translucent lets the porthole bleed under the notch/status bar,
    // matching the full-bleed dish aesthetic.
    statusBarStyle: 'black-translucent',
  },
  formatDetection: {
    telephone: false,
    email: false,
    address: false,
  },
  openGraph: {
    type: 'website',
    title: 'Petri',
    description: DESCRIPTION,
    siteName: 'Petri',
  },
  twitter: {
    card: 'summary',
    title: 'Petri',
    description: DESCRIPTION,
  },
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
      <body>
        {children}
        <ServiceWorkerRegistrar />
      </body>
    </html>
  );
}
