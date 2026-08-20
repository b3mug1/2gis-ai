import { MapPin } from "lucide-react";
import { cn } from "@/utils/cn";
import { formatDistance } from "@/utils/format";

interface LocationBadgeProps {
  distance?: number | null;
  walkingTime?: number | null;
  address?: string | null;
  className?: string;
}

export function LocationBadge({ distance, walkingTime, address, className }: LocationBadgeProps) {
  const label = walkingTime
    ? `${walkingTime} min walk`
    : distance
    ? formatDistance(distance)
    : address
    ? address
    : null;

  if (!label) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs text-muted-foreground",
        className
      )}
    >
      <MapPin className="w-3 h-3" />
      {label}
    </span>
  );
}
