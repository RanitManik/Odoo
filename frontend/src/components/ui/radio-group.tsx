"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface RadioOption {
  label: string;
  value: string;
}

interface RadioGroupProps {
  /**
   * The legend for the radio group, displayed above the options.
   */
  legend: string;
  /**
   * The name attribute for the radio inputs, used to group them.
   */
  name: string;
  /**
   * The options for the radio group, each with a label and value.
   */
  options: RadioOption[];
  /**
   * The currently selected value of the radio group.
   */
  value: string;
  /**
   * Callback function triggered when the selected value changes.
   * @param value - The new selected value.
   */
  onChange: (value: RadioOption) => void;
  /**
   * Additional class names for the wrapper container of the radio group.
   */
  wrapperClassName?: string;
  /**
   * Additional class names for the legend element.
   */
  legendClassName?: string;
  /**
   * Additional class names for the radio input elements.
   */
  inputClassName?: string;
  /**
   * Additional class names for the label elements.
   */
  labelClassName?: string;
  /**
   * Disables all radio inputs in the group.
   */
  disabled?: boolean;
  /**
   * Controls View only and Editing mode styles.
   */
  readMode?: boolean;
}

/**
 * A reusable and accessible radio group component for selecting a single option.
 * Supports a disabled state for all radio inputs.
 *
 * @param {RadioGroupProps} props - The props for the RadioGroup component.
 * @returns {JSX.Element} A styled and customizable radio group component.
 *
 * @example
 * <RadioGroup
 *   legend="Product Type"
 *   name="productType"
 *   options={[
 *     { label: "Material", value: "material" },
 *     { label: "Product", value: "product" },
 *   ]}
 *   value={selectedValue}
 *   onChange={(newValue) => setSelectedValue(newValue)}
 *   disabled={true}
 *   readMode={false}
 * />
 */
const RadioGroup: React.FC<RadioGroupProps> = ({
  legend,
  name,
  options,
  value,
  onChange,
  wrapperClassName = "",
  legendClassName = "text-xs font-medium text-gray-600",
  inputClassName = "h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500",
  labelClassName = "flex items-center gap-2 text-sm text-gray-700",
  disabled = false,
  readMode = false,
}: RadioGroupProps): React.ReactNode => {
  return (
    <fieldset className={`group ${wrapperClassName}`} disabled={disabled}>
      <legend className={cn("mb-1", legendClassName)}>{legend}</legend>
      <div
        className={cn(
          "flex items-center gap-4 border-b border-gray-500 bg-white px-2 py-1 disabled:opacity-60",
          readMode ? "border-transparent disabled:opacity-100" : "",
        )}
      >
        {options.map((option) => (
          <label key={option.value} className={labelClassName}>
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={() => onChange(option)}
              disabled={disabled}
              className={cn(
                inputClassName,
                disabled ? "cursor-not-allowed" : "",
              )}
            />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  );
};

export default RadioGroup;
