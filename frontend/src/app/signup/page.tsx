"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Input from "@/components/ui/input";
import Button from "@/components/ui/button";
import { api, extractError } from "@/lib/api";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/components/ui/toast-provider";

export default function SignupPage() {
  const router = useRouter();
  const [credentials, setCredentials] = useState({
    name: "",
    email: "",
    password: "",
  });

  const signupMutation = useMutation({
    mutationFn: async (data: typeof credentials) => {
      const res = await api.post("/auth/signup", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Account created successfully!");
      router.push("/dashboard");
    },
    onError: (error) => {
      toast.error(extractError(error));
    },
  });

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate(credentials);
  };

  return (
    <div className="relative min-h-screen w-full bg-white">
      {/* Logo at top-left corner */}
      <Link href="/" className="absolute top-6 left-6 z-10 flex items-center gap-3 transition-transform hover:-translate-y-1">
        <div className="flex h-10 w-10 items-center justify-center rounded-none bg-purple-600 border-2 border-gray-900 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
          <span className="text-xl font-bold text-white">A</span>
        </div>
        <span className="text-2xl font-black tracking-tight text-gray-900">
          AssetFlow
        </span>
      </Link>

      <div className="mx-auto flex min-h-screen w-full items-center">
        <div className="grid w-full grid-cols-1 items-center justify-between md:grid-cols-2">
          {/* Left Section (Form) */}
          <div className="flex min-h-screen w-full flex-col items-center justify-center border-r border-gray-200 bg-[#f8fafc] px-6 sm:px-10">
            <div className="w-full max-w-md pt-12 pb-8">
              <h1 className="font-varela text-3xl font-bold tracking-tight text-gray-900">
                Create an account
              </h1>
              <p className="font-lato mt-2 text-base text-gray-500">
                Enter your details below to join AssetFlow
              </p>

              <form
                onSubmit={handleSignup}
                className="mt-8 flex flex-col gap-5"
              >
                <Input
                  label="Full Name"
                  type="text"
                  disabled={signupMutation.isPending}
                  placeholder="John Doe"
                  name="name"
                  value={credentials.name}
                  id="name"
                  required
                  onChange={(e: any) =>
                    setCredentials({ ...credentials, name: e.target.value })
                  }
                />
                <Input
                  label="Email Address"
                  type="email"
                  disabled={signupMutation.isPending}
                  placeholder="name@example.com"
                  name="email"
                  value={credentials.email}
                  id="email"
                  required
                  onChange={(e: any) =>
                    setCredentials({ ...credentials, email: e.target.value })
                  }
                />
                <Input
                  label="Password"
                  type="password"
                  disabled={signupMutation.isPending}
                  placeholder="Minimum 6 characters"
                  name="password"
                  id="password"
                  value={credentials.password}
                  required
                  onChange={(e: any) =>
                    setCredentials({
                      ...credentials,
                      password: e.target.value,
                    })
                  }
                />

                <Button
                  type="submit"
                  className="mt-4 h-11 w-full text-base shadow-sm"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? "Creating Account..." : "Sign Up"}
                </Button>
              </form>

              <div className="mt-8 text-center text-sm text-gray-600">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="text-primary hover:text-primaryH font-semibold transition-colors"
                >
                  Log in to continue
                </Link>
              </div>
            </div>
          </div>

          {/* Right Section (Visuals) - Hidden on mobile */}
          <div className="relative hidden min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-white px-10 md:flex">
            {/* SVG Grid Background */}
            <svg
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-0 h-full w-full mask-[linear-gradient(to_bottom,white,transparent,white)] fill-gray-300/40 stroke-gray-300/40 opacity-60"
            >
              <defs>
                <pattern
                  id="grid-pattern-login"
                  width="32"
                  height="32"
                  patternUnits="userSpaceOnUse"
                >
                  <path d="M.5 32V.5H32" fill="none"></path>
                </pattern>
              </defs>
              <rect
                width="100%"
                height="100%"
                strokeWidth="0"
                fill="url(#grid-pattern-login)"
              ></rect>
            </svg>

            {/* Decorative blurs */}
            <div className="bg-primary/20 absolute top-1/4 right-1/4 h-64 w-64 animate-pulse rounded-full opacity-70 mix-blend-multiply blur-3xl filter"></div>
            <div className="absolute bottom-1/4 left-1/4 h-72 w-72 rounded-full bg-blue-300/30 opacity-70 mix-blend-multiply blur-3xl filter"></div>

            {/* Content */}
            <div className="relative z-10 max-w-lg rounded-2xl border border-white/50 bg-white/40 p-10 text-center shadow-xl backdrop-blur-md">
              <h2 className="font-varela mb-4 text-3xl leading-tight font-bold text-gray-900">
                Empower your workforce
              </h2>
              <p className="font-lato mb-8 text-lg text-gray-600">
                Join our platform to securely access the tools and equipment you
                need to excel in your daily tasks.
              </p>

              <div className="flex items-center justify-center gap-4 text-sm font-medium text-gray-700">
                <div className="flex items-center justify-center rounded-full bg-white p-3 shadow-sm">
                  <svg
                    className="h-6 w-6 text-green-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    ></path>
                  </svg>
                </div>
                <span>Bank-grade secure authentication</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
