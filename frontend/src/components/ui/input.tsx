"use client";

import { cn } from "@/lib/utils";
import React, {
  forwardRef,
  InputHTMLAttributes,
  useEffect,
  useImperativeHandle,
  useRef,
} from "react";
import ToolTipInfo from "@/components/ui/tooltip";
import { Info } from "lucide-react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string; // Optional label for the input
  wrapperClassName?: string; // Wrapper div's class name
  labelClassName?: string; // Label's class name
  width?: "sm" | "md" | "full"; // Width options for the input
  readMode?: boolean; // Controls View only and Editing mode styles.
  tooltip?: string; // Optional tooltip text to show next to label
  forceFocus?: boolean; // When true, forces the input to focus
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      type = "text",
      value,
      placeholder,
      className = "",
      wrapperClassName = "",
      label,
      labelClassName = "",
      width = "full",
      id,
      onFocus, // User-provided onFocus handler
      onClick, // User-provided onClick handler
      onKeyDown, // User-provided onKeyDown handler
      readMode = false,
      disabled = false,
      tooltip,
      forceFocus = false,
      ...props
    },
    ref,
  ) => {
    // Map width to class names
    const sizeClass =
      {
        sm: "sm:w-64",
        md: "sm:w-96",
        full: "w-full",
      }[width] || "w-full";

    // Internal ref to manage the input element
    const inputRef = useRef<HTMLInputElement>(null);

    // Use useImperativeHandle to expose focus method to parent
    useImperativeHandle(ref, () => inputRef.current!);

    // Handle forceFocus prop
    useEffect(() => {
      if (forceFocus && inputRef.current) {
        inputRef.current.focus();
      }
    }, [forceFocus]);

    // Custom handler to select all text
    const handleSelectAll = (
      e:
        React.FocusEvent<HTMLInputElement> | React.MouseEvent<HTMLInputElement>,
    ) => {
      e.currentTarget.select();
    };

    // Handle Enter key for navigation
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      // Call user-provided onKeyDown handler if exists
      onKeyDown?.(e);
    };

    // Helper function to safely chain handlers
    const chainHandlers =
      <T extends React.SyntheticEvent>(
        userHandler?: (e: T) => void,
        defaultHandler?: (e: T) => void,
      ) =>
      (e: T) => {
        defaultHandler?.(e); // Call the default handler (e.g., select text)
        userHandler?.(e); // Call the user-provided handler
      };

    return (
      <div className={`flex flex-col ${sizeClass} ${wrapperClassName}`}>
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
          disabled={disabled || readMode}
          className={cn(
            `peer text-foreground order-2 w-full rounded-none border-b border-gray-500 bg-white px-2 py-1 text-sm placeholder:text-gray-500 focus:border-transparent focus:outline-2 focus:outline-offset-0 focus:outline-blue-600 disabled:cursor-not-allowed disabled:opacity-60`,
            readMode ? "border-transparent disabled:opacity-100" : "",
            className,
          )}
          aria-invalid="false"
          // Safely chain custom and user-defined handlers
          onFocus={chainHandlers(onFocus, handleSelectAll)}
          onClick={chainHandlers(onClick, handleSelectAll)}
          onKeyDown={handleKeyDown}
          {...props}
        />
        {label && (
          <div className="order-1 mb-1 flex items-center gap-1">
            <label
              htmlFor={id}
              className={`block text-xs font-medium text-gray-600 ${labelClassName}`}
            >
              {label}
            </label>
            {tooltip && (
              <ToolTipInfo
                position="top"
                border={false}
                label={<Info size={10} className="self-start text-gray-600" />}
                details={tooltip}
              />
            )}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "TextInput";

export default Input;
