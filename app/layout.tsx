import './globals.css';
import type { Metadata } from 'next';
import { TenantProvider } from '@/contexts/TenantContext';

export const metadata: Metadata = {
  title: 'LegalBrain AI — Estate Planning Intelligence',
  description: 'AI-powered legal intelligence platform for solo estate planning attorneys',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Inter:wght@300;400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <TenantProvider>
          {children}
        </TenantProvider>
      </body>
    </html>
  );
}
