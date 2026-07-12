"use client";
import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  FC,
} from "react";
import Toast from "./toast";

type ToastType =
  "success" | "error" | "info" | "warning" | "neutral" | "promise";

interface ToastMessage {
  id: string;
  message: string;
  variant: ToastType;
  duration?: number;
  actions?: React.ReactNode | (() => Promise<string | void>);
  isLoading?: boolean;
  errorMessage?: string;
}

interface ToastContextType {
  addToast: (toast: Omit<ToastMessage, "id">) => void;
}

let addToastFn: ToastContextType["addToast"];

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
};

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const addToast = (toast: Omit<ToastMessage, "id">) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts([{ id, ...toast }]);

    if (toast.variant === "promise" && typeof toast.actions === "function") {
      const handlePromiseAction = async () => {
        try {
          setToasts((prev) =>
            prev.map((toast) =>
              toast.id === id ? { ...toast, isLoading: true } : toast,
            ),
          );
          const result =
            typeof toast.actions === "function" ? await toast.actions() : null;
          setToasts((prev) =>
            prev.map((toast) =>
              toast.id === id
                ? {
                    ...toast,
                    isLoading: false,
                    message: result || toast.message,
                  }
                : toast,
            ),
          );
        } catch (error: any) {
          setToasts((prev) =>
            prev.map((toast) =>
              toast.id === id
                ? {
                    ...toast,
                    isLoading: false,
                    errorMessage: error?.message || "An error occurred",
                  }
                : toast,
            ),
          );
        }
      };

      handlePromiseAction();
    }
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  addToastFn = addToast;

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed right-4 bottom-4 z-[9999]">
        {toasts.length > 0 && (
          <Toast
            key={toasts[0].id}
            message={toasts[0].message}
            variant={toasts[0].variant}
            actions={toasts[0].actions}
            isLoading={toasts[0].isLoading}
            errorMessage={toasts[0].errorMessage}
            onClose={() => removeToast(toasts[0].id)}
          />
        )}
      </div>
    </ToastContext.Provider>
  );
};

export const toast = {
  dismissAll: () => {
    setTimeout(() => {
      addToastFn = undefined as any;
    }, 0);
  },
  success: (
    message: string,
    duration = 3000,
    actions?: React.ReactNode | (() => Promise<void>),
  ) => addToastFn?.({ message, variant: "success", duration, actions }),
  error: (
    message: string,
    duration = 3000,
    actions?: React.ReactNode | (() => Promise<void>),
  ) => addToastFn?.({ message, variant: "error", duration, actions }),
  info: (
    message: string,
    duration = 3000,
    actions?: React.ReactNode | (() => Promise<void>),
  ) => addToastFn?.({ message, variant: "info", duration, actions }),
  warning: (
    message: string,
    duration = 3000,
    actions?: React.ReactNode | (() => Promise<void>),
  ) => addToastFn?.({ message, variant: "warning", duration, actions }),
  neutral: (
    message: string,
    duration = 3000,
    actions?: React.ReactNode | (() => Promise<void>),
  ) => addToastFn?.({ message, variant: "neutral", duration, actions }),
  promise: (
    actionOrPromise: Promise<any> | (() => Promise<any>),
    {
      loading,
      success,
      error,
    }: {
      loading: string;
      success: (data: any) => string;
      error: (err: any) => string;
    },
  ) => {
    const isActionFunction = typeof actionOrPromise === "function";
    const executeAction = isActionFunction
      ? (actionOrPromise as () => Promise<any>)()
      : (actionOrPromise as Promise<any>);

    addToastFn?.({
      message: loading,
      variant: "promise",
      duration: 0,
      isLoading: true,
      actions: async () => {
        try {
          const data = await executeAction;
          return success(data);
        } catch (err: any) {
          console.error(err);
          throw new Error(error(err));
        }
      },
    });

    return executeAction;
  },
};
