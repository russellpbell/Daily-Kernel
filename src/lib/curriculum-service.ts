import { SupabaseClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';

const CLAUDE_MODEL = process.env.CLAUDE_MODEL || 'claude-haiku-4-5-20251001';

interface SyllabusTopic {
  topic: string;
  description: string;
  order: number;
  difficulty_level: number;  // 1-5
}

interface LessonCard {
  title: string;
  summary: string;
  comprehension_question: string;
  card_type: 'lesson' | 'review' | 'quiz';
}

/**
 * Generate a structured syllabus for a curriculum category.
 * Claude creates a comprehensive learning path from beginner to expert.
 */
export async function generateSyllabus(
  categoryName: string
): Promise<SyllabusTopic[]> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const systemPrompt = `You are an expert curriculum designer. Create structured learning paths that take someone from complete beginner to expert in a given field.

Design the curriculum as a sequence of focused topics, ordered from foundational concepts to advanced material. Each topic should be learnable in a single 2-3 minute card reading.

Group topics into difficulty levels:
- Level 1 (Beginner): Core vocabulary, fundamental concepts, "what is this field?"
- Level 2 (Familiar): Key principles, basic frameworks, "how does this work?"
- Level 3 (Intermediate): Methodologies, interconnections, "why does this matter?"
- Level 4 (Advanced): Edge cases, debates, current frontiers, "what's being researched?"
- Level 5 (Expert): Open problems, synthesis, original thinking, "what's next?"

Aim for 60-100 topics total, roughly distributed as:
- Level 1: 15-20 topics
- Level 2: 15-20 topics
- Level 3: 15-20 topics
- Level 4: 10-15 topics
- Level 5: 5-10 topics`;

  const userPrompt = `Create a comprehensive learning path for: "${categoryName}"

Return a JSON array where each element has:
- "topic": Topic name (concise, 3-8 words)
- "description": What this topic covers (1 sentence)
- "order": Sequential number starting from 1
- "difficulty_level": 1-5

Order them so each topic builds on previous ones. Respond ONLY with a valid JSON array.`;

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    let jsonStr = text.trim();
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1].trim();

    const parsed = JSON.parse(jsonStr);
    if (!Array.isArray(parsed)) throw new Error('Not an array');

    return parsed.map((item: Record<string, unknown>, i: number) => ({
      topic: String(item.topic || `Topic ${i + 1}`),
      description: String(item.description || ''),
      order: Number(item.order || i + 1),
      difficulty_level: Math.min(5, Math.max(1, Number(item.difficulty_level || 1))),
    }));
  } catch (error) {
    console.error('Syllabus generation error:', error);
    // Return a minimal fallback syllabus
    return [
      { topic: `Introduction to ${categoryName}`, description: `Overview of ${categoryName} and why it matters`, order: 1, difficulty_level: 1 },
      { topic: `Core Concepts of ${categoryName}`, description: `Fundamental principles and vocabulary`, order: 2, difficulty_level: 1 },
      { topic: `Key Frameworks in ${categoryName}`, description: `Major models and frameworks used in the field`, order: 3, difficulty_level: 2 },
    ];
  }
}

/**
 * Generate a lesson card for a specific topic in the curriculum.
 * Adapts to user's expertise level and review history.
 */
export async function generateLessonCard(
  categoryName: string,
  topic: string,
  topicDescription: string,
  difficultyLevel: number,
  timesReviewed: number,
  userExpertiseLevel: number = 1
): Promise<LessonCard> {
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

  const isReview = timesReviewed > 0;
  const cardType = isReview ? (timesReviewed >= 3 ? 'quiz' : 'review') : 'lesson';

  const angleForReview = [
    'Teach the core concept clearly and memorably.',
    'Focus on a practical application or real-world example.',
    'Explain how this connects to related concepts in the field.',
    'Present a common misconception and correct it.',
    'Give a deeper technical dive into the mechanism or proof.',
    'Discuss the historical context or discovery of this concept.',
    'Present an edge case or exception that deepens understanding.',
  ];

  const angle = isReview
    ? angleForReview[timesReviewed % angleForReview.length]
    : angleForReview[0];

  const expertiseTone: Record<number, string> = {
    1: 'Use simple, accessible language. Explain all jargon. Use analogies.',
    2: 'Use some technical terms but explain them. Build on basics.',
    3: 'Use domain terminology freely. Focus on nuance and connections.',
    4: 'Be technically precise. Discuss edge cases and debates.',
    5: 'Be maximally technical. Reference frameworks and literature by name.',
  };

  const tone = expertiseTone[Math.min(userExpertiseLevel, difficultyLevel)] || expertiseTone[1];

  let systemPrompt: string;
  let userPrompt: string;

  if (cardType === 'quiz') {
    systemPrompt = `You are a Socratic tutor for Daily Kernel. Create a quiz card that tests understanding of a topic the learner has studied before. ${tone}`;
    userPrompt = `Category: ${categoryName}
Topic: ${topic}
Description: ${topicDescription}
This is review #${timesReviewed + 1}.

Create a quiz card with:
- "title": A question or scenario title (not the topic name)
- "summary": Present a scenario, problem, or question that requires applying knowledge of this topic. Give enough context to reason through it. Don't give the answer - let the reader think.
- "comprehension_question": The specific question they should answer mentally before moving on.

JSON format: {"title": "...", "summary": "...", "comprehension_question": "..."}`;
  } else {
    systemPrompt = `You are a master teacher for Daily Kernel, an app that helps people become experts through daily bite-sized lessons. ${tone}

Your cards should:
- Teach ONE concept clearly in 2-3 sentences
- Include a memorable insight, analogy, or "aha moment"
- End with a thought-provoking question that tests understanding
${isReview ? `\nThis is a review card. ${angle}` : ''}`;

    userPrompt = `Category: ${categoryName}
Topic: ${topic}
Description: ${topicDescription}
Difficulty level: ${difficultyLevel}/5
${isReview ? `Review #${timesReviewed + 1}. Give a FRESH perspective - don't repeat previous explanations.` : 'First time seeing this topic.'}

Create a ${cardType} card:
- "title": Engaging headline for this lesson (not just the topic name)
- "summary": 2-3 sentence teaching content. ${isReview ? 'Highlight a new angle.' : 'Explain the concept clearly.'}
- "comprehension_question": A question the reader should think about (tests understanding, not just recall)

JSON format: {"title": "...", "summary": "...", "comprehension_question": "..."}`;
  }

  try {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{ role: 'user', content: userPrompt }],
      system: systemPrompt,
    });

    const text = message.content[0].type === 'text' ? message.content[0].text : '';
    let jsonStr = text.trim();
    const match = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (match) jsonStr = match[1].trim();

    const parsed = JSON.parse(jsonStr);
    return {
      title: String(parsed.title || topic),
      summary: String(parsed.summary || topicDescription),
      comprehension_question: String(parsed.comprehension_question || 'What did you learn?'),
      card_type: cardType,
    };
  } catch {
    return {
      title: topic,
      summary: topicDescription,
      comprehension_question: 'What is the key takeaway from this topic?',
      card_type: cardType,
    };
  }
}

/**
 * Get or create a learning path for a user's curriculum category.
 */
export async function getOrCreateLearningPath(
  supabase: SupabaseClient,
  userId: string,
  categoryName: string
): Promise<{ id: string; syllabus: SyllabusTopic[]; totalTopics: number }> {
  // Check if path exists
  const { data: existing } = await supabase
    .from('learning_paths')
    .select('id, syllabus, total_topics')
    .eq('user_id', userId)
    .eq('category_name', categoryName)
    .single();

  if (existing) {
    return {
      id: existing.id,
      syllabus: existing.syllabus as SyllabusTopic[],
      totalTopics: existing.total_topics,
    };
  }

  // Generate new syllabus
  const syllabus = await generateSyllabus(categoryName);

  const { data: newPath, error } = await supabase
    .from('learning_paths')
    .insert({
      user_id: userId,
      category_name: categoryName,
      syllabus,
      total_topics: syllabus.length,
    })
    .select('id')
    .single();

  if (error || !newPath) {
    throw new Error(`Failed to create learning path: ${error?.message}`);
  }

  // Initialize progress for all topics
  const progressRows = syllabus.map((topic, index) => ({
    user_id: userId,
    learning_path_id: newPath.id,
    topic_index: index,
    topic_name: topic.topic,
    status: index === 0 ? 'in_progress' : 'pending',
  }));

  await supabase.from('path_progress').insert(progressRows);

  return {
    id: newPath.id,
    syllabus,
    totalTopics: syllabus.length,
  };
}

/**
 * Get the next topics to teach in a curriculum.
 * Returns a mix of new lessons and review cards.
 */
export async function getNextCurriculumCards(
  supabase: SupabaseClient,
  userId: string,
  categoryName: string,
  count: number,
  expertiseLevel: number = 1
): Promise<Array<{
  title: string;
  summary: string;
  source_url: null;
  source_name: string;
  card_type: string;
  topic_index: number;
  comprehension_question: string;
}>> {
  const path = await getOrCreateLearningPath(supabase, userId, categoryName);
  const today = new Date().toISOString();

  // Get topics due for review (spaced repetition)
  const { data: dueReviews } = await supabase
    .from('path_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('learning_path_id', path.id)
    .in('status', ['learned', 'in_progress'])
    .lte('next_review_at', today)
    .order('next_review_at', { ascending: true })
    .limit(Math.ceil(count / 2));

  // Get next new topics (in_progress or first pending)
  const { data: newTopics } = await supabase
    .from('path_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('learning_path_id', path.id)
    .in('status', ['in_progress', 'pending'])
    .order('topic_index', { ascending: true })
    .limit(count);

  // Mix reviews and new topics
  const reviewCards = dueReviews || [];
  const freshCards = (newTopics || []).filter(
    (t: { topic_index: number }) => !reviewCards.some((r: { topic_index: number }) => r.topic_index === t.topic_index)
  );

  // Allocate: prefer reviews (reinforcement), then new lessons
  const reviewCount = Math.min(reviewCards.length, Math.ceil(count * 0.4));
  const newCount = Math.min(freshCards.length, count - reviewCount);

  const selectedReviews = reviewCards.slice(0, reviewCount);
  const selectedNew = freshCards.slice(0, newCount);

  // Generate cards for each topic
  const cards = await Promise.all([
    ...selectedReviews.map(async (progress: { topic_index: number; topic_name: string; times_reviewed: number }) => {
      const topicData = path.syllabus[progress.topic_index];
      const card = await generateLessonCard(
        categoryName,
        progress.topic_name,
        topicData?.description || '',
        topicData?.difficulty_level || 1,
        progress.times_reviewed,
        expertiseLevel
      );
      return {
        title: card.title,
        summary: `${card.summary}\n\n💡 ${card.comprehension_question}`,
        source_url: null as null,
        source_name: `${categoryName} · ${card.card_type === 'quiz' ? 'Quiz' : 'Review'}`,
        card_type: card.card_type,
        topic_index: progress.topic_index,
        comprehension_question: card.comprehension_question,
      };
    }),
    ...selectedNew.map(async (progress: { topic_index: number; topic_name: string; status: string; id: string }) => {
      const topicData = path.syllabus[progress.topic_index];

      // Mark as in_progress if it was pending
      if (progress.status === 'pending') {
        await supabase
          .from('path_progress')
          .update({ status: 'in_progress' })
          .eq('id', progress.id);
      }

      const card = await generateLessonCard(
        categoryName,
        progress.topic_name,
        topicData?.description || '',
        topicData?.difficulty_level || 1,
        0,
        expertiseLevel
      );
      return {
        title: card.title,
        summary: `${card.summary}\n\n💡 ${card.comprehension_question}`,
        source_url: null as null,
        source_name: `${categoryName} · Lesson ${progress.topic_index + 1}`,
        card_type: card.card_type,
        topic_index: progress.topic_index,
        comprehension_question: card.comprehension_question,
      };
    }),
  ]);

  return cards;
}

/**
 * Record that a user has reviewed a curriculum topic.
 * Called when user gives feedback on a curriculum card.
 */
export async function recordTopicReview(
  supabase: SupabaseClient,
  userId: string,
  categoryName: string,
  topicIndex: number,
  action: 'thumbs_up' | 'thumbs_down' | 'skip'
): Promise<void> {
  // Find the learning path
  const { data: path } = await supabase
    .from('learning_paths')
    .select('id')
    .eq('user_id', userId)
    .eq('category_name', categoryName)
    .single();

  if (!path) return;

  // Get current progress
  const { data: progress } = await supabase
    .from('path_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('learning_path_id', path.id)
    .eq('topic_index', topicIndex)
    .single();

  if (!progress) return;

  // Spaced repetition intervals (in days)
  const intervals = [1, 2, 4, 7, 14, 30, 60];

  if (action === 'thumbs_up') {
    const newTimesReviewed = progress.times_reviewed + 1;
    const intervalIdx = Math.min(newTimesReviewed - 1, intervals.length - 1);
    const nextReview = new Date(Date.now() + intervals[intervalIdx] * 86400000).toISOString();

    // Status progression: in_progress -> learned (after 1st review) -> mastered (after 5+ reviews)
    let newStatus = progress.status;
    if (newTimesReviewed >= 5) newStatus = 'mastered';
    else if (newTimesReviewed >= 1) newStatus = 'learned';

    await supabase
      .from('path_progress')
      .update({
        status: newStatus,
        times_reviewed: newTimesReviewed,
        last_reviewed_at: new Date().toISOString(),
        next_review_at: nextReview,
      })
      .eq('id', progress.id);
  } else if (action === 'thumbs_down') {
    // Reset the interval - user doesn't know this yet
    await supabase
      .from('path_progress')
      .update({
        next_review_at: new Date(Date.now() + 86400000).toISOString(), // review again tomorrow
        last_reviewed_at: new Date().toISOString(),
      })
      .eq('id', progress.id);
  }
  // skip: no progress change, just move on
}
