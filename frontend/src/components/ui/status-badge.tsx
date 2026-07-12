import { cn } from "@/lib/utils";

interface StatusBadgeProps {
  status: "active" | "inactive";
}

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
        status === "active"
          ? "bg-green-100 text-green-700"
          : "bg-gray-100 text-gray-700",
      )}
    >
      {status}
    </span>
  );
}
