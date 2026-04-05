/**
 * Get today's date as a YYYY-MM-DD string in the local timezone.
 */
export function todayString(): string {
  return new Date().toISOString().split('T')[0];
}

/**
 * Format a date string (YYYY-MM-DD or ISO) into a human-readable format.
 * Example: "2026-04-05" -> "April 5, 2026"
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format a date string into a short format.
 * Example: "2026-04-05" -> "Apr 5"
 */
export function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Format a date string into a relative description.
 * Example: today -> "Today", yesterday -> "Yesterday", else formatted date.
 */
export function formatDateRelative(dateStr: string): string {
  const today = todayString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const target = dateStr.split('T')[0];

  if (target === today) return 'Today';
  if (target === yesterdayStr) return 'Yesterday';
  return formatDate(target);
}

/**
 * Format an ISO timestamp into a time string.
 * Example: "2026-04-05T14:30:00Z" -> "2:30 PM"
 */
export function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Check if a date string represents today.
 */
export function isToday(dateStr: string): boolean {
  return dateStr.split('T')[0] === todayString();
}

/**
 * Get an array of the last N days as YYYY-MM-DD strings (most recent first).
 */
export function lastNDays(n: number): string[] {
  const days: string[] = [];
  for (let i = 0; i < n; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

/**
 * Calculate the number of days between two date strings.
 */
export function daysBetween(dateStr1: string, dateStr2: string): number {
  const d1 = new Date(dateStr1.split('T')[0] + 'T00:00:00');
  const d2 = new Date(dateStr2.split('T')[0] + 'T00:00:00');
  const diffMs = Math.abs(d2.getTime() - d1.getTime());
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}
