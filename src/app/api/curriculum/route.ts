import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { getUserIdFromRequest } from '@/lib/auth';
import { getOrCreateLearningPath } from '@/lib/curriculum-service';

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const supabase = createServiceClient();
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (!category) {
      return NextResponse.json({ error: 'category query param is required' }, { status: 400 });
    }

    // Verify this category belongs to the user and is a curriculum type
    const { data: categoryData } = await supabase
      .from('categories')
      .select('id, source_type')
      .eq('user_id', userId)
      .eq('name', category)
      .single();

    if (!categoryData) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    if (categoryData.source_type !== 'curriculum') {
      return NextResponse.json({ error: 'Category is not a curriculum type' }, { status: 400 });
    }

    // Get or create the learning path
    const path = await getOrCreateLearningPath(supabase, userId, category);

    // Get all progress entries
    const { data: progressEntries } = await supabase
      .from('path_progress')
      .select('id, topic_index, topic_name, status, times_reviewed, last_reviewed_at, next_review_at')
      .eq('user_id', userId)
      .eq('learning_path_id', path.id)
      .order('topic_index', { ascending: true });

    const progress = progressEntries || [];

    // Compute stats
    const stats = {
      completed: progress.filter(p => p.status === 'learned' || p.status === 'mastered').length,
      in_progress: progress.filter(p => p.status === 'in_progress').length,
      mastered: progress.filter(p => p.status === 'mastered').length,
      total: path.totalTopics,
    };

    return NextResponse.json({
      path: {
        id: path.id,
        category_name: category,
        total_topics: path.totalTopics,
        syllabus: path.syllabus,
      },
      progress: progress.map(p => ({
        topic_index: p.topic_index,
        topic_name: p.topic_name,
        status: p.status,
        times_reviewed: p.times_reviewed,
      })),
      stats,
    });
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
