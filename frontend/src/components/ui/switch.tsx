import React from "react";

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "xs" | "sm" | "md";
  className?: string;
  id?: string;
  ariaLabel?: string;
}

const sizeClasses = {
  xs: {
    track: "w-8 h-4",
    thumb: "w-3 h-3",
    translate: "translate-x-4",
  },
  sm: {
    track: "w-10 h-5",
    thumb: "w-4 h-4",
    translate: "translate-x-5",
  },
  md: {
    track: "w-12 h-6",
    thumb: "w-5 h-5",
    translate: "translate-x-6",
  },
};

const Switch: React.FC<SwitchProps> = ({
  checked,
  onChange,
  disabled = false,
  size = "sm",
  className = "",
  id,
  ariaLabel,
}) => {
  const s = sizeClasses[size];
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => !disabled && onChange(!checked)}
      className={
        `relative inline-flex items-center rounded-full transition-colors duration-150 ${s.track} ` +
        (checked ? "bg-blue-600" : "bg-gray-300") +
        (disabled ? " cursor-not-allowed opacity-60" : " cursor-pointer") +
        (className ? ` ${className}` : "")
      }
    >
      <span
        className={
          `inline-block transform rounded-full bg-white shadow transition-transform duration-150 ${s.thumb} ` +
          (checked ? s.translate : "translate-x-1")
        }
      />
    </button>
  );
};

export default Switch;
