import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

interface FeedItem {
  id: string;
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
  category_name: string;
  timestamp: string;
  source: 'liked' | 'saved' | 'both';
  is_read?: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const filter = searchParams.get('filter'); // 'liked' | 'saved' | null (all)
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 50);

    // We fetch more than `limit` from each source to account for deduplication
    const fetchLimit = limit + 10;

    const likedItems: FeedItem[] = [];
    const savedItems: FeedItem[] = [];

    // Get liked cards (thumbs_up feedback)
    if (filter !== 'saved') {
      let likedQuery = supabase
        .from('feedback')
        .select(`
          card_id,
          action,
          created_at,
          cards!inner(id, category_name, title, summary, source_url, source_name, position, created_at)
        `)
        .eq('user_id', userId)
        .eq('action', 'thumbs_up')
        .order('created_at', { ascending: false })
        .limit(fetchLimit);

      if (cursor) {
        likedQuery = likedQuery.lt('created_at', cursor);
      }

      const { data: likedData } = await likedQuery;

      if (likedData) {
        for (const item of likedData) {
          // The cards relation comes back as an object (inner join guarantees it exists)
          const card = item.cards as unknown as {
            id: string;
            category_name: string;
            title: string;
            summary: string;
            source_url: string | null;
            source_name: string | null;
          };
          likedItems.push({
            id: card.id,
            title: card.title,
            summary: card.summary,
            source_url: card.source_url,
            source_name: card.source_name,
            category_name: card.category_name,
            timestamp: item.created_at,
            source: 'liked',
          });
        }
      }
    }

    // Get saved reading list items
    if (filter !== 'liked') {
      let savedQuery = supabase
        .from('reading_list')
        .select('id, title, summary, source_url, source_name, category_name, saved_at, is_read, notes')
        .eq('user_id', userId)
        .order('saved_at', { ascending: false })
        .limit(fetchLimit);

      if (cursor) {
        savedQuery = savedQuery.lt('saved_at', cursor);
      }

      const { data: savedData } = await savedQuery;

      if (savedData) {
        for (const item of savedData) {
          savedItems.push({
            id: item.id,
            title: item.title,
            summary: item.summary,
            source_url: item.source_url,
            source_name: item.source_name,
            category_name: item.category_name,
            timestamp: item.saved_at,
            source: 'saved',
            is_read: item.is_read,
          });
        }
      }
    }

    // Merge and deduplicate by source_url (or title if no source_url)
    const merged = new Map<string, FeedItem>();

    // Add liked items first
    for (const item of likedItems) {
      const key = item.source_url || `title:${item.title}`;
      merged.set(key, item);
    }

    // Add saved items, marking as 'both' if already present from liked
    for (const item of savedItems) {
      const key = item.source_url || `title:${item.title}`;
      const existing = merged.get(key);
      if (existing) {
        existing.source = 'both';
        existing.is_read = item.is_read;
        // Use the more recent timestamp
        if (item.timestamp > existing.timestamp) {
          existing.timestamp = item.timestamp;
        }
      } else {
        merged.set(key, item);
      }
    }

    // Sort by most recent first and apply limit
    const mergedItems = Array.from(merged.values())
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, limit);

    return NextResponse.json({
      items: mergedItems,
      has_more: mergedItems.length >= limit,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
