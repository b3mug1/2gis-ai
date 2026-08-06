import { cn } from "@/utils/cn";
import { SearchX, Heart, History, Star } from "lucide-react";

interface EmptyStateProps {
  icon?: "search" | "heart" | "history" | "star";
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

const iconMap = {
  search: SearchX,
  heart: Heart,
  history: History,
  star: Star,
};

export function EmptyState({ icon = "search", title, description, action, className }: EmptyStateProps) {
  const Icon = iconMap[icon];
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-20 px-6 text-center space-y-4",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-brand-500/10 to-purple-500/10 flex items-center justify-center">
        <Icon className="w-8 h-8 text-brand-500/60" />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-base font-semibold">{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}
