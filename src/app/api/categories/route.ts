import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();

    const { data: categories, error } = await supabase
      .from('categories')
      .select('id, name, weight, is_active, source_type')
      .eq('user_id', userId)
      .order('name');

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }

    return NextResponse.json(categories);
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
    const { name, weight, source_type } = body;

    if (!name) {
      return NextResponse.json({ error: 'Category name is required' }, { status: 400 });
    }

    // Check for duplicate name per user
    const { data: existing } = await supabase
      .from('categories')
      .select('id')
      .eq('user_id', userId)
      .eq('name', name)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Category with this name already exists' }, { status: 409 });
    }

    const insertData: { user_id: string; name: string; weight?: number; source_type?: string } = { user_id: userId, name };
    if (weight !== undefined) insertData.weight = weight;
    if (source_type && ['news', 'biomedical', 'stem', 'academic'].includes(source_type)) {
      insertData.source_type = source_type;
    }

    const { data: category, error } = await supabase
      .from('categories')
      .insert(insertData)
      .select('id, name, weight, is_active, source_type')
      .single();

    if (error) {
      return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
    }

    return NextResponse.json(category, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
