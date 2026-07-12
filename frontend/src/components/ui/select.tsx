"use client";

import React, { FC, useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import TextInput from "@/components/ui/input";
import Button from "@/components/ui/button";
import ReactDOM from "react-dom";
import Loader from "@/components/ui/loader";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  selectedOption: Option;
  onChange: (value: Option | null) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  dropdownClassName?: string;
  width?: "sm" | "md" | "full";
  creatable?: boolean;
  loading?: boolean;
  createEditModal?: React.ComponentType<{
    onSave: (newOption: Option) => void;
    onClose: () => void;
    isOpen: boolean;
    nameInputValue: string;
  }>;
  required?: boolean;
  disabled?: boolean;
  readMode?: boolean;
  nonClearable?: boolean;
}

/**
 * Select component allows users to select an option from a dropdown list, with support for creating new options,
 * searching/filtering options, and handling custom modal editing. It offers flexible behavior and appearance.
 *
 * @param {Option[]} options - List of options to be displayed in the dropdown.
 * @param {Option} selectedOption - The currently selected option.
 * @param {(value: Option) => void} onChange - Callback function that is triggered when the selected option changes.
 * @param {string} [label] - Optional label for the select input.
 * @param {string} [placeholder] - Placeholder text displayed in the input field when no value is selected.
 * @param {string} [className] - Additional class names for the root container of the component.
 * @param {string} [inputClassName] - Additional class names for the input field.
 * @param {string} [dropdownClassName] - Additional class names for the dropdown menu.
 * @param {"sm" | "md" | "full"} [width="md"] - Specifies the width of the select component. Can be "sm", "md" (default), or "full".
 * @param {boolean} [creatable=false] - Flag to enable creation of new options from the input field.
 * @param {boolean} [loading=false] - Flag indicating whether the component is in a loading state.
 * @param {React.ComponentType<{ onSave: (newOption: any) => void; onClose: () => void; isOpen: boolean; nameInputValue: string }>} [createEditModal] - Optional modal component used for creating or editing options.
 * @param {boolean} [required=false] - Flag indicating whether the field is required.
 * @param {boolean} [disabled=false] - Flag to disable the input field and dropdown.
 */
const Select: FC<CustomSelectProps> = ({
  options,
  selectedOption,
  onChange,
  label,
  placeholder,
  className = "",
  inputClassName = "",
  dropdownClassName = "",
  width = "full",
  creatable = false,
  loading = false,
  createEditModal: CreateEditModal,
  required = false,
  nonClearable = false,
  disabled = false,
  readMode = false,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // states for the create edit modal
  const [createEditOpen, setCreateEditOpen] = useState(false);

  const allOptions = options;
  const filteredOptions = allOptions?.filter((option) =>
    option.label.toLowerCase().includes(inputValue.toLowerCase()),
  );

  const canCreateNewOption =
    creatable &&
    inputValue.trim() !== "" &&
    !allOptions?.some(
      (option) => option.label.toLowerCase() === inputValue.toLowerCase(),
    );

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        if (creatable && inputValue.trim() !== "" && canCreateNewOption) {
          handleCreateNewOption();
        } else {
          setIsOpen(false);
          setFocusedIndex(-1);
          setInputValue("");
        }
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [creatable, inputValue, canCreateNewOption]);

  const sizeClass =
    {
      sm: "sm:w-64", // Small width
      md: "sm:w-96", // Medium width (default)
      full: "w-full", // Large width
    }[width] || "sm:w-96"; // Fallback to medium if an invalid size is passed

  const handleClearInputValue = () => {
    setInputValue("");
    onChange(null);
    setFocusedIndex(-1);
  };

  const handleToggleDropdown = () => {
    setInputValue("");
    setIsOpen((prev) => !prev);
  };

  const handleSelect = (newValue: any) => {
    onChange(newValue);
    setInputValue("");
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const handleCreateNewOption = () => {
    if (inputValue.trim() !== "") {
      onChange({
        label: inputValue.trim(),
        value: inputValue.trim(),
      });
      setInputValue("");
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  // Functions for CreateEdit Modal

  const handleSaveNewOption = (newOption: any) => {
    handleSelect(newOption.value); // Automatically select the new option
  };

  const handleOpenCreateEditModal = () => {
    setIsOpen(false);
    setCreateEditOpen(true);
  };

  const handleCloseCreateEditModal = () => {
    setCreateEditOpen(false);
    setInputValue("");
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const filteredOptionsCount = filteredOptions.length;
    const creatableOptionIndex =
      creatable && canCreateNewOption ? filteredOptionsCount : -1;
    const createEditIndex =
      CreateEditModal && creatableOptionIndex !== -1
        ? creatableOptionIndex + 1
        : -1;
    const totalOptions =
      filteredOptionsCount +
      (creatableOptionIndex !== -1 ? 1 : 0) +
      (createEditIndex !== -1 ? 1 : 0);

    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setFocusedIndex((prev) => (prev + 1) % totalOptions);
        break;
      case "ArrowUp":
        event.preventDefault();
        setFocusedIndex((prev) => (prev - 1 + totalOptions) % totalOptions);
        break;
      case "Enter":
        event.preventDefault();
        if (
          isOpen &&
          focusedIndex >= 0 &&
          focusedIndex < filteredOptionsCount
        ) {
          // Select an existing filtered option
          handleSelect(filteredOptions[focusedIndex]);
        } else if (
          !loading &&
          focusedIndex >= 0 &&
          focusedIndex === creatableOptionIndex
        ) {
          // Handle creation of a new option
          handleCreateNewOption();
        } else if (
          !loading &&
          focusedIndex >= 0 &&
          focusedIndex === createEditIndex
        ) {
          // Open the create-edit modal
          handleOpenCreateEditModal();
        } else if (!loading && canCreateNewOption && inputValue.trim() !== "") {
          handleCreateNewOption();
        } else {
          handleToggleDropdown();
        }
        break;
      case "Escape":
        setIsOpen(false);
        setInputValue("");
        setFocusedIndex(-1);
        event.stopPropagation(); // Stop the event from reaching the layout handler
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (isOpen && filteredOptions.length > 0) {
      setFocusedIndex(0);
    }
  }, [isOpen, filteredOptions.length]);

  useEffect(() => {
    if (focusedIndex >= 0) {
      const optionElement = document.getElementById(`option-${focusedIndex}`);
      if (optionElement) {
        optionElement.scrollIntoView({
          behavior: "smooth",
          block: "nearest",
        });
      }
    }
  }, [focusedIndex]);

  // Close dropdown on blur, but not when clicking an option
  const handleBlur = (e: React.FocusEvent<any>) => {
    if (!dropdownRef.current?.contains(e.relatedTarget as Node)) {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative ${sizeClass} ${className}`}
      tabIndex={-1}
      onBlur={handleBlur}
    >
      {label && (
        <label
          htmlFor="input-id"
          className="mb-1 block text-xs font-medium text-gray-600"
        >
          {label}
        </label>
      )}
      <div className="relative">
        <TextInput
          autoComplete="off"
          readMode={readMode}
          id="input-id"
          value={inputValue}
          disabled={disabled}
          onChange={(e) => {
            setInputValue(e.target.value);
            setIsOpen(true);
            setFocusedIndex(-1);
          }}
          width={width}
          onClick={(e) => {
            setInputValue("");
            // Only toggle dropdown if the click is outside the dropdown area
            if (!dropdownRef.current?.contains(e.target as Node)) {
              handleToggleDropdown(); // Toggle dropdown on click
            }
          }}
          onFocus={() => {
            setIsOpen(true);
          }}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          aria-expanded={isOpen}
          aria-controls="select-dropdown"
          aria-activedescendant={`option-${focusedIndex}`}
          className={`${nonClearable ? "pr-8" : "pr-16"} ${
            selectedOption?.label && "placeholder:text-gray-950"
          } ${inputClassName}`}
          placeholder={selectedOption?.label || placeholder}
        />
        <div className="absolute top-px right-0 bottom-px">
          {selectedOption?.value &&
            !nonClearable &&
            !loading &&
            !required &&
            !readMode && (
              <Button
                disabled={disabled}
                type="button"
                tabIndex={-1}
                variant="ghost"
                onClick={handleClearInputValue}
                className="group h-full !px-2 !py-0 text-gray-500 transition hover:bg-white hover:text-gray-700 focus:!outline-1 focus:!-outline-offset-0 focus-visible:!outline-1"
                aria-label="Clear selection"
              >
                <X
                  className="stroke-gray-600 group-hover:stroke-gray-800"
                  size={16}
                />
              </Button>
            )}
          {!readMode && (
            <Button
              disabled={disabled}
              type="button"
              variant="ghost"
              tabIndex={-1}
              onClick={() => setIsOpen((prev) => !prev)}
              className="group h-full !px-2 !py-0 text-gray-500 transition hover:bg-gray-200 hover:text-gray-700 focus:!outline-1 focus:!-outline-offset-0 focus-visible:!outline-1"
              aria-label="Toggle dropdown"
              aria-expanded={isOpen ? "true" : "false"}
            >
              <ChevronDown
                className={`transform stroke-gray-600 transition-transform group-hover:stroke-gray-800 ${
                  isOpen ? "rotate-180" : "rotate-0"
                }`}
                size={16}
              />
            </Button>
          )}
        </div>
      </div>
      {isOpen &&
        ReactDOM.createPortal(
          <ul
            style={{
              position: "absolute",
              zIndex: 1000,
              top: dropdownRef.current?.getBoundingClientRect().bottom || 0,
              left: dropdownRef.current?.getBoundingClientRect().left || 0,
              width:
                dropdownRef.current?.getBoundingClientRect().width || "auto",
            }}
            id="select-dropdown"
            role="listbox"
            aria-labelledby="input-id"
            className={`select-dropdown thin-scrollbar absolute right-0 left-0 z-10 mt-2 max-h-40 overflow-auto border border-gray-300 bg-white text-xs shadow-md ${dropdownClassName}`}
            onMouseDown={(e) => e.stopPropagation()}
            tabIndex={-1}
          >
            {filteredOptions.map((option, index) => (
              <li
                id={`option-${index}`}
                role="option"
                key={option.value}
                tabIndex={0}
                onMouseDown={() => {
                  handleSelect(option);
                  setIsOpen(false);
                  setFocusedIndex(-1);
                }}
                aria-selected={option.value === selectedOption?.value}
                className={`group hover:outline-primary cursor-pointer border-b border-b-gray-300 bg-gray-100 px-3 last:border-none hover:border-transparent hover:bg-gray-200 hover:outline-2 hover:-outline-offset-2 hover:outline-none active:bg-gray-300 ${
                  option.value === selectedOption?.value &&
                  "bg-gray-200 hover:bg-gray-300"
                } ${
                  index === focusedIndex &&
                  "outline-primary bg-gray-300 outline-1 -outline-offset-1 outline-none"
                }`}
                title={option.label}
              >
                <div className="flex w-full items-center justify-between gap-2 py-1.5 text-black/70 group-hover:text-black group-data-[selected=true]:border-transparent">
                  <span>{option.label}</span>
                  {option.value === selectedOption?.value && (
                    <Check size={16} className="stroke-gray-600" />
                  )}
                </div>
              </li>
            ))}
            {canCreateNewOption && !loading && (
              <li
                id={`option-${filteredOptions.length}`}
                className={`group hover:outline-primary cursor-pointer truncate bg-gray-100 px-3 py-1.5 hover:bg-gray-200 hover:outline-2 hover:-outline-offset-2 hover:outline-none active:bg-gray-300 ${
                  focusedIndex === filteredOptions.length &&
                  "outline-primary bg-gray-300 outline-1 -outline-offset-1 outline-none"
                } }`}
                onMouseDown={handleCreateNewOption}
                title={inputValue}
              >
                <span>
                  Create{" "}
                  <strong className="font-medium">{`"${inputValue}"`}</strong>
                </span>
              </li>
            )}

            {canCreateNewOption && CreateEditModal && !loading && (
              <li
                id={`option-${
                  filteredOptions.length + (canCreateNewOption ? 1 : 0)
                }`}
                onMouseDown={handleOpenCreateEditModal}
                className={`group hover:outline-primary cursor-pointer truncate border-b border-b-gray-300 bg-gray-100 px-3 py-1.5 last:border-none hover:bg-gray-200 hover:outline-2 hover:-outline-offset-2 hover:outline-none active:bg-gray-300 ${
                  focusedIndex ===
                    filteredOptions.length + (canCreateNewOption ? 1 : 0) &&
                  "outline-primary bg-gray-300 outline-1 -outline-offset-1 outline-none"
                }`}
              >
                <span>
                  Create and Edit{" "}
                  <strong className="font-medium">{`"${inputValue}"`}</strong>
                </span>
              </li>
            )}

            {loading && (
              <li className="flex items-center gap-1 bg-gray-100 px-3 py-1.5 text-gray-600">
                <Loader size="sm" />
                Loading...
              </li>
            )}

            {filteredOptions.length === 0 &&
              !canCreateNewOption &&
              !loading && (
                <li className="bg-gray-100 px-3 py-1.5 text-gray-500">
                  No matching options
                </li>
              )}
          </ul>,
          document.body,
        )}
      {CreateEditModal && (
        <CreateEditModal
          isOpen={createEditOpen}
          nameInputValue={inputValue}
          onSave={handleSaveNewOption}
          onClose={handleCloseCreateEditModal}
        />
      )}
    </div>
  );
};

export default Select;
