import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'Daily Kernel',
  description: 'Keep up with your field.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0f0d2e',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
