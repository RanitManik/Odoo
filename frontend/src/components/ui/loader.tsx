import { cn } from "@/lib/utils";
import React from "react";

interface LoaderProps {
  size?: "sm" | "md" | "lg"; // Define loader sizes
  className?: string; // Additional classnames
  wrapperClassName?: string;
  label?: string;
}

/**
 * Loader Component:
 * A reusable, accessible, and customizable loader/spinner with optional descriptive text.
 * @param size - Controls the loader's size (sm, md, lg).
 * @param className - Additional classes for custom styling.
 * @param label - Optional text displayed below the loader.
 */
const Loader: React.FC<LoaderProps> = ({
  size = "md",
  className = "",
  wrapperClassName = "",
  label,
}) => {
  const sizeClasses = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-4",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-1",
        wrapperClassName,
      )}
    >
      <div
        className={cn(
          `inline-block animate-spin rounded-full border-solid border-gray-300 border-t-gray-600 ${sizeClasses[size]} ${className}`,
        )}
        role="status"
        aria-label="Loading"
      ></div>
      {label && <span className="text-sm text-gray-600">{label}</span>}
    </div>
  );
};

export default Loader;
