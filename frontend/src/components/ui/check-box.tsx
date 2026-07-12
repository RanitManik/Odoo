import React, { InputHTMLAttributes, useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface CheckboxProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelPosition?: "left" | "right";
  className?: string;
  labelClassName?: string;
  wrapperClassName?: string;
  onCheck?: (checked: boolean) => void;
}

const Checkbox: React.FC<CheckboxProps> = ({
  label,
  labelPosition = "right",
  className = "",
  labelClassName = "",
  onCheck,
  checked: controlledChecked,
  defaultChecked,
  ...props
}) => {
  const isControlled = controlledChecked !== undefined;
  const [checked, setChecked] = useState<boolean>(defaultChecked ?? false);

  useEffect(() => {
    if (isControlled) {
      setChecked(controlledChecked!);
    }
  }, [controlledChecked, isControlled]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newChecked = event.target.checked;

    if (!isControlled) {
      setChecked(newChecked);
    }

    if (onCheck) {
      //* UPDATE: Pass the new value instead of the current state
      onCheck(newChecked);
    }
  };

  const inputClassNames =
    "h-4 w-4 cursor-pointer focus:outline-none focus:outline-2 focus:outline-primary focus:-outline-offset-2";
  const labelClassNames = `flex select-none items-center gap-2 px-2 py-1 text-sm ${labelClassName}`;

  return (
    <>
      {label && labelPosition === "left" && (
        <label
          className={cn(`${labelClassNames} justify-between`)}
          htmlFor={props.id}
        >
          {label}
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            className={cn(`${inputClassNames} ${className}`)}
            {...props}
          />
        </label>
      )}

      {label && labelPosition === "right" && (
        <label className={cn(`${labelClassNames}`)} htmlFor={props.id}>
          <input
            type="checkbox"
            checked={checked}
            onChange={handleChange}
            className={cn(`${inputClassNames} ${className}`)}
            {...props}
          />
          {label}
        </label>
      )}

      {!label && (
        <input
          type="checkbox"
          checked={checked}
          onChange={handleChange}
          className={cn(`${inputClassNames} ${className}`)}
          {...props}
        />
      )}
    </>
  );
};

export default Checkbox;
