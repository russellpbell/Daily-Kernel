'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createBrowserClient } from '@/lib/supabase';
import TopBar from '@/components/TopBar';
import BottomNav from '@/components/BottomNav';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [authed, setAuthed] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserClient(), []);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.replace('/login');
      } else {
        // Ensure profile exists
        try {
          await fetch('/api/auth/ensure-profile', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
              'Content-Type': 'application/json',
            },
          });
        } catch {
          // Profile creation is best-effort on load
        }

        // Check subscription status
        try {
          const subRes = await fetch('/api/subscription/status', {
            headers: { 'Authorization': `Bearer ${session.access_token}` },
          });
          const subData = await subRes.json();
          setSubscriptionStatus(subData.status);

          if (subData.status !== 'active' && subData.status !== 'free_pass' && subData.status !== 'trialing') {
            if (!window.location.pathname.startsWith('/subscribe')) {
              router.replace('/subscribe');
              return;
            }
          }
        } catch {
          // If subscription check fails, allow access (fail open for now)
        }

        setAuthed(true);
      }
    };

    checkAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT') {
        router.replace('/login');
      } else if (session) {
        setAuthed(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [router, supabase]);

  if (!authed) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary-light border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Subscribe page gets a minimal layout (no top bar / bottom nav)
  if (pathname.startsWith('/subscribe')) {
    return <main className="min-h-screen">{children}</main>;
  }

  return (
    <>
      <TopBar />
      <main className="pt-14 pb-16 min-h-screen">{children}</main>
      <BottomNav />
    </>
  );
}
