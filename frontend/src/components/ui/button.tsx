import React, { forwardRef, ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "size"
> {
  /**
   * Variant of the button.
   */
  variant?:
    | "primary"
    | "secondary"
    | "destructive"
    | "outline"
    | "ghost"
    | "secondary-light";

  /**
   * Size of the button.
   */
  size?: "sm" | "md" | "lg" | "xs";

  /**
   * Additional custom class names.
   */
  className?: string;

  tabindex?: string;
}

/**
 * Button Component:
 * A reusable, styled button component supporting multiple variants and sizes.
 * @param variant - Controls the button's style (primary, secondary, destructive, outline, ghost).
 * @param size - Controls the button's size (xs, sm, md, lg).
 * @param className - Additional classes for custom styling.
 * @param children - The content inside the button (e.g., text or icons).
 */

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      children,
      tabIndex = -1,
      ...props
    },
    ref,
  ) => {
    // Variant styles
    const variantStyles = {
      primary:
        "bg-primary text-white hover:bg-primaryH focus-visible:outline-1 focus-visible:outline-white focus:-outline-offset-[3px] focus:outline-1 focus:outline-white focus:-outline-offset-[3px] active:bg-primaryA",
      secondary:
        "bg-secondary text-white hover:bg-secondaryH focus-visible:outline-1 focus-visible:outline-white focus:-outline-offset-[3px] focus:outline-1 focus:outline-white focus:-outline-offset-[3px] active:bg-secondaryA",
      "secondary-light":
        "bg-gray-200 text-black hover:bg-gray-300 focus-visible:outline-1 focus-visible:outline-primary focus:-outline-offset-[3px] focus:outline-1 focus:outline-primary focus:-outline-offset-[3px] active:bg-gray-300",
      success:
        "bg-green-600 text-white hover:bg-green-700 focus-visible:outline-1 focus-visible:outline-white focus:-outline-offset-[3px] focus:outline-1 focus:outline-white focus:-outline-offset-[3px] active:bg-green-700",
      destructive:
        "bg-destructive text-white hover:bg-destructiveH focus-visible:outline-1 focus-visible:outline-white focus:-outline-offset-[3px] focus:outline-1 focus:outline-white focus:-outline-offset-[3px] active:bg-destructiveA",
      outline:
        "outline outline-1 outline-primary -outline-offset-1 text-primary hover:bg-primary hover:text-white focus-visible:bg-primary focus:text-white focus-visible:text-white focus:bg-primary focus-visible:outline-1 focus-visible:outline-white focus:-outline-offset-[3px] focus:outline-1 focus:outline-white focus:-outline-offset-[3px] active:bg-primaryA",
      ghost:
        "bg-transparent text-primary hover:bg-gray-100 hover:text-primaryH focus-visible:outline-2 focus-visible:outline-primary focus-visible:text-primaryH focus:text-primaryH focus:-outline-offset-0 focus:outline-2 focus:outline-primary focus:-outline-offset-[2px] active:bg-gray-300 active:text-primaryA",
      transparent:
        "bg-transparent text-inherit hover:bg-transparent hover:text-inherit focus-visible:outline-none focus:outline-none active:bg-transparent active:text-inherit",
    };

    // Size styles
    const sizeStyles = {
      xs: "px-1.5 py-0.5 md:px-2 md:py-1 text-xs",
      sm: "px-2 py-1 md:px-3 md:py-1.5 text-sm",
      md: "px-3 py-1.5 md:px-4 md:py-2 text-sm",
      lg: "pt-3 pb-6 px-4 text-left text-sm",
    };

    return (
      <button
        ref={ref} // Pass ref here
        {...props}
        tabIndex={tabIndex}
        className={cn(
          "cursor-pointer leading-none transition focus:outline-none",
          variantStyles[variant],
          sizeStyles[size],
          className,
          {
            "cursor-not-allowed opacity-60": props.disabled,
          },
        )}
      >
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";

export default Button;
