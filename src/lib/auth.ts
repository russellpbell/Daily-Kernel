import { NextRequest } from 'next/server';
import { createServiceClient } from './supabase';

// Extract user ID from Supabase auth session via Authorization header
export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);

  const supabase = createServiceClient();
  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return null;

  return user.id;
}

// Ensure a profile exists in our users table for this Supabase auth user
export async function ensureProfile(userId: string, email: string): Promise<void> {
  const supabase = createServiceClient();
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .eq('id', userId)
    .single();

  if (!existing) {
    // Create profile with email as display name (user can change later)
    const displayName = email.split('@')[0];
    await supabase
      .from('users')
      .insert({ id: userId, name: displayName, email });

    // Create initial streak record
    await supabase
      .from('streaks')
      .insert({ user_id: userId, current_streak: 0, longest_streak: 0 });
  }
}
