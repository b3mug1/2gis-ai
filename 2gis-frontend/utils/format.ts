import { format, formatDistanceToNow, parseISO } from "date-fns";

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy");
}

export function formatDateTime(dateStr: string): string {
  return format(parseISO(dateStr), "MMM d, yyyy 'at' h:mm a");
}

export function timeAgo(dateStr: string): string {
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

export function formatDistance(meters: number | null | undefined): string {
  if (!meters) return "—";
  if (meters < 1000) return `${meters} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatWalkingTime(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  return `${minutes} min walk`;
}

export function formatBudget(kzt: number | null | undefined): string {
  if (!kzt) return "—";
  return `${kzt.toLocaleString()} ₸`;
}

export function formatConfidence(confidence: number): string {
  return `${Math.round(confidence * 100)}%`;
}

export function getPriceLevelEmoji(level: string | null | undefined): string {
  switch (level) {
    case "budget":
      return "₸";
    case "moderate":
      return "₸₸";
    case "premium":
      return "₸₸₸";
    case "luxury":
      return "₸₸₸₸";
    default:
      return "—";
  }
}

export function truncate(str: string, length = 120): string {
  if (str.length <= length) return str;
  return str.slice(0, length) + "…";
}
