import { getToken, clearAuth } from "./lib/storage";
import type {
  Briefing,
  Category,
  Stats,
  UserSettings,
} from "./types";

const BASE = "/api";

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearAuth();
    window.location.href = "/login";
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed: ${res.status}`);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export async function login(
  name: string,
  pin: string
): Promise<{ token: string; name: string; user_id: string }> {
  return request("/auth/login", {
    method: "POST",
    body: JSON.stringify({ name, pin }),
  });
}

export async function register(
  name: string,
  pin: string
): Promise<{ token: string; name: string; user_id: string }> {
  return request("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, pin }),
  });
}

export async function getCategories(): Promise<Category[]> {
  return request("/categories/");
}

export async function createCategory(
  name: string,
  weight?: number
): Promise<Category> {
  return request("/categories/", {
    method: "POST",
    body: JSON.stringify({ name, weight: weight ?? 1.0 }),
  });
}

export async function updateCategory(
  id: string,
  data: Partial<Pick<Category, "name" | "weight" | "is_active">>
): Promise<Category> {
  return request(`/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return request(`/categories/${id}`, { method: "DELETE" });
}

export async function getTodayBriefing(): Promise<Briefing> {
  return request<Briefing>("/briefings/today");
}

export async function generateBriefing(): Promise<Briefing> {
  return request("/briefings/generate", { method: "POST" });
}

export async function submitFeedback(
  cardId: string,
  action: "thumbs_up" | "thumbs_down" | "skip"
): Promise<void> {
  return request("/feedback/", {
    method: "POST",
    body: JSON.stringify({ card_id: cardId, action }),
  });
}

export async function getSettings(): Promise<UserSettings> {
  return request("/settings/");
}

export async function updateSettings(
  data: Partial<UserSettings>
): Promise<UserSettings> {
  return request("/settings/", {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function getStats(): Promise<Stats> {
  return request("/stats/");
}
