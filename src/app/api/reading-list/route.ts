import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const readFilter = searchParams.get('read');

    let query = supabase
      .from('reading_list')
      .select('*')
      .eq('user_id', userId)
      .order('saved_at', { ascending: false });

    if (readFilter === 'true') {
      query = query.eq('is_read', true);
    } else if (readFilter === 'false') {
      query = query.eq('is_read', false);
    }

    const { data: items, error } = await query;

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch reading list' }, { status: 500 });
    }

    return NextResponse.json({ items: items || [] });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const body = await request.json();
    const { card_id, title, summary, source_url, source_name, category_name } = body;

    if (!title || !summary || !category_name) {
      return NextResponse.json(
        { error: 'title, summary, and category_name are required' },
        { status: 400 }
      );
    }

    // Prevent duplicates by card_id if provided
    if (card_id) {
      const { data: existing } = await supabase
        .from('reading_list')
        .select('id')
        .eq('user_id', userId)
        .eq('card_id', card_id)
        .single();

      if (existing) {
        return NextResponse.json(
          { error: 'This card is already in your reading list' },
          { status: 409 }
        );
      }
    }

    const { data: item, error } = await supabase
      .from('reading_list')
      .insert({
        user_id: userId,
        card_id: card_id || null,
        title,
        summary,
        source_url: source_url || null,
        source_name: source_name || null,
        category_name,
        is_read: false,
        saved_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to save to reading list' }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
