export interface Card {
  id: string;
  category_name: string;
  title: string;
  summary: string;
  source_url: string;
  source_name: string;
  position: number;
  feedback?: "thumbs_up" | "thumbs_down" | "skip" | null;
}

export interface Briefing {
  id: string;
  date: string;
  cards: Card[];
  generated_at: string;
}

export interface Category {
  id: string;
  name: string;
  weight: number;
  is_active: boolean;
}

export interface Stats {
  current_streak: number;
  longest_streak: number;
  last_review_date: string | null;
  monthly_completions: DailyCompletion[];
}

export interface DailyCompletion {
  date: string;
  cards_reviewed: number;
  cards_total: number;
}

export interface UserSettings {
  cards_per_briefing: number;
}
