import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Parse containedIn typing bug repro',
  description: 'Minimal repro for Parse TypeScript containedIn typing issue on array fields.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
