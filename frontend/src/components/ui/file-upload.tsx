"use client";

import React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";

interface FileUploadProps {
  /**
   * Optional label for the file upload input.
   */
  label?: string;
  /**
   * The current selected file.
   */
  selectedFile: File | null;
  /**
   * Callback to handle when a file is selected.
   * @param file - The selected file.
   */
  onFileSelect: (file: File | null) => void;
  /**
   * Whether the input should be disabled.
   */
  disabled?: boolean;
  /**
   * Optional wrapper class name for the component.
   */
  wrapperClassName?: string;
}

/**
 * A reusable file upload component with preview and customizable label.
 *
 * @param {FileUploadProps} props - The props for the FileUpload component.
 * @returns {React.ReactNode} A styled file upload component.
 *
 * @example
 * <FileUpload
 *   label="Product Image 1"
 *   selectedFile={file}
 *   onFileSelect={(file) => setFile(file)}
 *   disabled={isLoading}
 * />
 */
const FileUpload: React.FC<FileUploadProps> = ({
  label,
  selectedFile,
  onFileSelect,
  disabled = false,
  wrapperClassName = "",
}: FileUploadProps): React.ReactNode => {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null;
    onFileSelect(file);
  };

  return (
    <div
      className={`flex w-full flex-col items-start gap-1 ${wrapperClassName}`}
    >
      {/* Label */}
      {label && (
        <label className="text-xs font-medium text-gray-600">{label}</label>
      )}

      {/* Upload Container */}
      <div className="flex w-[-webkit-fill-available] flex-col items-center justify-center gap-4">
        {selectedFile ? (
          <label
            htmlFor={`fileInput-${label}`}
            className="hover:border-primary max-h-[15em] w-full cursor-pointer overflow-hidden border border-gray-400 bg-white transition hover:border-2 hover:opacity-60 md:h-[11rem] md:w-[11rem]"
          >
            <Image
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              width={140}
              height={140}
              className="aspect-square max-h-[15em] w-full object-cover transition-transform hover:scale-105"
            />
            <input
              type="file"
              id={`fileInput-${label}`}
              accept="image/*"
              disabled={disabled}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        ) : (
          <label
            htmlFor={`fileInput-${label}`}
            className={cn(
              "flex max-h-[15em] w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-[#ABABAB] bg-gray-100 p-2 transition duration-200 hover:bg-gray-200 md:h-[11rem] md:w-[11rem]",
              disabled && "cursor-not-allowed",
            )}
          >
            <div className="flex items-center justify-center">
              <Plus className="h-6 w-6 text-gray-400" />
            </div>
            <p className="text-center text-xs font-normal select-none">
              <span
                className={cn(disabled ? "text-gray-400" : "text-gray-500")}
              >
                Drag your images here, or{" "}
                <span
                  className={cn(
                    disabled
                      ? "cursor-not-allowed text-blue-400"
                      : "cursor-pointer text-blue-600",
                  )}
                >
                  click to browse
                </span>
              </span>
            </p>
            <input
              type="file"
              id={`fileInput-${label}`}
              accept="image/*"
              disabled={disabled}
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
