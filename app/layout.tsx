import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'QA360 — Test Management Platform',
  description: 'AI-powered QA and test management platform with Playwright integration',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
