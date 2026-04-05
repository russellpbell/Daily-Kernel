import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Daily Kernel',
  description: 'Keep up with your field. Research papers and news summarized into daily cards.',
  openGraph: {
    title: 'Daily Kernel',
    description: 'Keep up with your field. Research papers and news summarized into daily cards.',
    type: 'website',
  },
};

export default function HomePage() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#0f0d2e',
      color: '#e2e8f0',
      fontFamily: '-apple-system, BlinkMacSystemFont, system-ui, sans-serif',
      padding: '2rem',
      textAlign: 'center',
    }}>
      <div style={{ fontSize: '4rem', marginBottom: '1.5rem' }}>🌱</div>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 700, color: 'white', margin: 0 }}>
        Daily Kernel
      </h1>
      <p style={{
        fontSize: '1.1rem',
        color: '#94a3b8',
        maxWidth: '28rem',
        lineHeight: 1.6,
        marginTop: '1rem',
        marginBottom: '2.5rem',
      }}>
        Research papers and news from your fields, summarized into cards
        you can read in a few minutes a day.
      </p>
      <a
        href="https://apps.apple.com/app/daily-kernel/id000000000"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.875rem 2rem',
          borderRadius: '9999px',
          backgroundColor: '#6366f1',
          color: 'white',
          fontWeight: 600,
          fontSize: '1rem',
          textDecoration: 'none',
        }}
      >
        Download on the App Store
      </a>
      <p style={{ marginTop: '2rem', fontSize: '0.8rem', color: '#475569' }}>
        Available on iPhone and iPad · iOS 17+
      </p>
    </div>
  );
}
