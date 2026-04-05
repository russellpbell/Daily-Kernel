export interface User {
  id: string;
  name: string;
  cards_per_briefing: number;
  created_at: string;
}

export interface Category {
  id: string;
  user_id: string;
  name: string;
  weight: number;
  is_active: boolean;
  source_type: 'news' | 'biomedical' | 'stem' | 'academic';
  created_at: string;
}

export interface Briefing {
  id: string;
  user_id: string;
  date: string;
  generated_at: string;
  cards: Card[];
}

export interface Card {
  id: string;
  briefing_id: string;
  category_name: string;
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
  position: number;
  created_at: string;
}

export interface Feedback {
  id: string;
  user_id: string;
  card_id: string;
  action: 'thumbs_up' | 'thumbs_down' | 'skip';
  created_at: string;
}

export interface Streak {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_review_date: string | null;
}

export interface DailyCompletion {
  id: string;
  user_id: string;
  date: string;
  cards_reviewed: number;
  cards_total: number;
}

export interface Stats {
  current_streak: number;
  longest_streak: number;
  total_cards_reviewed: number;
  total_briefings: number;
  category_breakdown: Record<string, { thumbs_up: number; thumbs_down: number; skip: number }>;
}

export interface NewsArticle {
  title: string;
  url: string;
  snippet: string;
  source_name: string;
}

export interface CardSummary {
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ReadingListItem {
  id: string;
  card_id: string | null;
  title: string;
  summary: string;
  source_url: string | null;
  source_name: string | null;
  category_name: string;
  notes: string | null;
  is_read: boolean;
  saved_at: string;
}

export interface KnowledgeEntry {
  id: string;
  category_name: string;
  topic: string;
  times_seen: number;
  first_seen_at: string;
  last_seen_at: string;
  expertise_level: number;
}

export interface UserExpertise {
  category_name: string;
  level: number;
  topics_covered: number;
  cards_reviewed: number;
}

export interface ApiError {
  error: string;
}
