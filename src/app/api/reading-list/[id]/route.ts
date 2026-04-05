import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const supabase = createServiceClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('reading_list')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (typeof body.is_read === 'boolean') {
      updates.is_read = body.is_read;
    }
    if (typeof body.notes === 'string') {
      updates.notes = body.notes;
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const { data: item, error } = await supabase
      .from('reading_list')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 });
    }

    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const supabase = createServiceClient();

    // Verify ownership
    const { data: existing } = await supabase
      .from('reading_list')
      .select('id, user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 });
    }

    if (existing.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { error } = await supabase
      .from('reading_list')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ error: 'Failed to delete item' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
