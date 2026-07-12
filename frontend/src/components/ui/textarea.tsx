"use client";

import React, { forwardRef, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  /**
   * Optional label for the textarea.
   */
  label?: string;
  /**
   * Additional class names for the wrapper div.
   */
  wrapperClassName?: string;
  /**
   * Additional class names for the label element.
   */
  labelClassName?: string;
  /**
   * Additional class names for the textarea element.
   */
  className?: string;
  /**
   * Determines the width of the textarea.
   */
  width?: "sm" | "md" | "full";
  /**
   * Controls View only and Editing mode styles.
   */
  readMode?: boolean;
}

/**
 * A reusable and accessible textarea component for entering multi-line text.
 *
 * @param {TextareaProps} props - The props for the Textarea component.
 * @returns {JSX.Element} A styled and customizable textarea component.
 *
 * @example
 * <Textarea
 *   label="Description"
 *   id="description"
 *   name="description"
 *   rows={5}
 *   placeholder="Enter your description here..."
 *   value={value}
 *   onChange={(e) => setValue(e.target.value)}
 *   readMode={disabled}
 * />
 */
const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      id,
      name,
      rows = 4,
      placeholder = "Enter text...",
      className = "",
      wrapperClassName = "",
      labelClassName = "",
      width = "full",
      disabled = false,
      readMode = false,
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

    return (
      <div className={`group grid ${sizeClass} ${wrapperClassName}`}>
        {label && (
          <label
            htmlFor={id}
            className={`mb-1 block text-xs font-medium text-gray-600 ${labelClassName}`}
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          name={name}
          rows={rows}
          placeholder={placeholder}
          disabled={disabled || readMode}
          className={cn(
            `peer order-2 w-full resize-none scrollbar-thin rounded-none border-b border-gray-500 bg-white px-2 py-1 text-sm text-gray-700 placeholder:text-gray-500 focus:border-transparent focus:ring-2 focus:ring-blue-600 focus:outline-none disabled:opacity-60`,
            readMode ? "border-transparent disabled:opacity-100" : "",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

Textarea.displayName = "Textarea";

export default Textarea;
