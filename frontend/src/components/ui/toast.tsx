// @ts-nocheck
import React, { forwardRef, ReactNode, useState, useEffect } from "react";
import {
  CircleCheck,
  X,
  Info,
  AlertTriangle,
  LoaderCircle,
} from "lucide-react";
import { IoMdCloseCircle } from "react-icons/io";

interface ToastProps {
  message: string;
  variant?: "success" | "error" | "info" | "warning" | "neutral" | "promise";
  size?: "xs" | "sm" | "md" | "lg";
  duration?: number;
  onClose?: () => void;
  className?: string;
  actions?: ReactNode | (() => Promise<string | void>);
  isLoading?: boolean;
  errorMessage?: string;
}

const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      message,
      variant = "info",
      size = "sm",
      onClose,
      className = "",
      actions,
      isLoading = false,
      errorMessage,
      duration = 3000,
    },
    ref,
  ) => {
    const [visible, setVisible] = useState(true);
    const [actionError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(false);

    useEffect(() => {
      if (duration && duration > 0 && !isLoading) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, isLoading]);

    const handleClose = () => {
      setVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300);
    };

    // Render actions based on type
    const renderActions = () => {
      if (isLoading && variant == "promise") {
        return <LoaderCircle size={25} className="animate-spin text-black" />;
      } else if (!isLoading && !errorMessage && variant == "promise")
        return <CircleCheck size={25} color="white" fill="green" />;
      else if (errorMessage && !isLoading && variant == "promise")
        return <IoMdCloseCircle size={25} color="white" fill="red" />;
      return null;
    };

    // Card background per variant (with colored backgrounds like the reference image)
    const cardBg: Record<string, string> = {
      success: "bg-green-700 text-white border border-green-800",
      error: "bg-red-600 text-white border border-red-700",
      info: "bg-blue-600 text-white border border-blue-700",
      warning: "bg-yellow-700 text-white border border-yellow-800",
      neutral: "bg-gray-700 text-white border border-gray-800",
      promise: "bg-white text-black border border-gray-400",
    };

    // Icon per variant (using lucide-react icons)
    const variantIcons: Record<string, ReactNode> = {
      success: (
        <span className="flex items-center justify-center rounded-full bg-green-100">
          <CircleCheck className="h-5 w-5 text-green-600" strokeWidth={2} />
        </span>
      ),
      error: (
        <span className="flex items-center justify-center rounded-full bg-red-100">
          <X className="h-5 w-5 text-red-500" strokeWidth={2} />
        </span>
      ),
      info: (
        <span className="flex items-center justify-center rounded-full bg-blue-100">
          <Info className="h-5 w-5 text-blue-500" strokeWidth={2} />
        </span>
      ),
      warning: (
        <span className="flex items-center justify-center rounded-full bg-yellow-100">
          <AlertTriangle className="h-5 w-5 text-yellow-700" strokeWidth={2} />
        </span>
      ),
      neutral: null,
      promise: null,
    };

    return (
      <div
        ref={ref}
        className={`fixed right-4 bottom-4 left-4 isolation-auto z-[2147483647] flex w-fit max-w-[500px] min-w-[340px] items-stretch overflow-hidden rounded-lg shadow-md ${
          visible
            ? "animate-in fade-in slide-in-from-bottom-5 duration-300"
            : "animate-out fade-out slide-out-to-bottom-5 duration-300"
        } ${cardBg[variant]} ${className}`}
        style={{ position: "fixed", zIndex: 2147483647 }}
      >
        {/* Icon */}
        {variant !== "promise" && variant !== "neutral" && (
          <div className="flex items-center py-1 pl-3">
            {variantIcons[variant]}
          </div>
        )}
        {/* Loader/Promise icons */}
        {(variant === "promise" || variant === "neutral") && (
          <div className="flex items-center py-2 pl-3">{renderActions()}</div>
        )}
        {/* Message */}
        <div className="flex min-w-0 flex-1 flex-col px-2 py-2">
          {/* Message display with consistent 3-line clamping for all variants */}
          {!errorMessage && !actionError && (
            <div className="flex flex-1 flex-col justify-center">
              <div
                className={`text-sm ${variant === "promise" ? "text-black" : "text-white"} ${expanded ? "break-words whitespace-pre-line" : "overflow-hidden break-words text-ellipsis"}`}
                style={
                  !expanded
                    ? {
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }
                    : {}
                }
                title={message}
              >
                {message}
              </div>
              {/* Expand/Collapse button justified to end */}
              {message && message.length > 120 && (
                <div className="mt-1 flex justify-end">
                  <button
                    className={`text-xs font-bold underline ${variant === "promise" ? "text-black" : "text-white"}`}
                    onClick={() => setExpanded((prev) => !prev)}
                    type="button"
                    tabIndex={0}
                  >
                    {expanded ? "Show less" : "Show more"}
                  </button>
                </div>
              )}
            </div>
          )}
          {errorMessage && (
            <div className="flex flex-1 flex-col justify-center">
              <div
                className={`text-sm ${variant === "promise" ? "text-red-700" : "text-white"} ${expanded ? "break-words whitespace-pre-line" : "overflow-hidden break-words text-ellipsis"}`}
                style={
                  !expanded
                    ? {
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }
                    : {}
                }
                title={errorMessage}
              >
                {errorMessage}
              </div>
              {/* Expand/Collapse button justified to end */}
              {errorMessage && errorMessage.length > 120 && (
                <div className="mt-1 flex justify-end">
                  <button
                    className={`text-xs font-bold underline ${variant === "promise" ? "text-red-700" : "text-white"}`}
                    onClick={() => setExpanded((prev) => !prev)}
                    type="button"
                    tabIndex={0}
                  >
                    {expanded ? "Show less" : "Show more"}
                  </button>
                </div>
              )}
            </div>
          )}
          {actionError && (
            <div className="flex flex-1 flex-col justify-center">
              <div
                className={`text-sm ${variant === "promise" ? "text-red-700" : "text-white"} ${expanded ? "break-words whitespace-pre-line" : "overflow-hidden break-words text-ellipsis"}`}
                style={
                  !expanded
                    ? {
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }
                    : {}
                }
                title={actionError}
              >
                {actionError}
              </div>
              {/* Expand/Collapse button justified to end */}
              {actionError && actionError.length > 120 && (
                <div className="mt-1 flex justify-end">
                  <button
                    className={`text-xs font-bold underline ${variant === "promise" ? "text-red-700" : "text-white"}`}
                    onClick={() => setExpanded((prev) => !prev)}
                    type="button"
                    tabIndex={0}
                  >
                    {expanded ? "Show less" : "Show more"}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
        {/* Close button */}
        <div className="flex items-start px-2 py-2">
          <button
            className={`cursor-pointer ${variant === "promise" ? "text-black" : "text-white"}`}
            onClick={handleClose}
            aria-label="Close notification"
            disabled={isLoading}
          >
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>
    );
  },
);

Toast.displayName = "Toast";
export default Toast;
