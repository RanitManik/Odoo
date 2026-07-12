import axios, {
  AxiosInstance,
  AxiosError,
  InternalAxiosRequestConfig,
} from "axios";

// Create a configured Axios instance
export const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000/api",
  withCredentials: true, // Crucial for sending/receiving HTTP-only cookies
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // You can add logic here like attaching custom headers if needed
    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error: AxiosError) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    let errorMessage = "An unexpected error occurred";

    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      const data = error.response.data as any;

      if (data.details && Array.isArray(data.details)) {
        // Handle Zod validation errors nicely
        errorMessage = data.details
          .map((d: any) => `${d.path[0]}: ${d.message}`)
          .join(", ");
      } else if (data.error) {
        errorMessage = data.error;
      }

      // Handle global 401 Unauthorized globally (e.g. redirect to login)
      if (error.response.status === 401 && typeof window !== "undefined") {
        if (
          !window.location.pathname.includes("/login") &&
          !window.location.pathname.includes("/signup")
        ) {
          window.location.href = "/login";
        }
      }
    } else if (error.request) {
      // The request was made but no response was received
      errorMessage = "No response from server. Please check your connection.";
    } else {
      // Something happened in setting up the request that triggered an Error
      errorMessage = error.message;
    }

    // Optionally show a toast for errors globally
    // We conditionally do this so specific components can catch and display their own errors if they prefer
    return Promise.reject(new Error(errorMessage));
  },
);

// Helper function to extract a clean error string
export const extractError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};
