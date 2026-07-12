import React from "react";
import Link from "next/link";
import { cookies } from "next/headers";
import { ArrowRight, Boxes, CalendarDays, ShieldCheck } from "lucide-react";

export default async function LandingPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token");

  const isLoggedIn = !!token;

  return (
    <div className="flex h-[100svh] flex-col bg-[#FAFAFA] font-sans selection:bg-purple-300">
      {/* Navigation */}
      <header className="z-10 flex items-center justify-between border-b-4 border-gray-900 bg-white px-8 py-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
        <div className="flex items-center gap-3">
          <img src="/brand-logo.svg" alt="AssetFlow Logo" className="h-10 w-auto" />
          <span className="text-2xl font-black tracking-tight text-gray-900">
            AssetFlow
          </span>
        </div>
        <nav className="flex items-center gap-4">
          {isLoggedIn ? (
            <Link
              href="/dashboard"
              className="flex items-center gap-2 border-2 border-gray-900 bg-purple-600 px-6 py-2 font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Go to Dashboard <ArrowRight className="h-5 w-5" />
            </Link>
          ) : (
            <Link
              href="/login"
              className="flex items-center gap-2 border-2 border-gray-900 bg-purple-600 px-6 py-2 font-bold text-white shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]"
            >
              Login <ArrowRight className="h-5 w-5" />
            </Link>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative flex flex-1 flex-col items-center justify-center overflow-hidden p-8">
        {/* Decorative Grid Background */}
        <div
          className="absolute inset-0 z-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 2px 2px, black 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />

        <div className="z-10 flex max-w-4xl flex-col items-center text-center">
          <div className="mb-6 inline-flex border-2 border-gray-900 bg-yellow-300 px-4 py-1 text-sm font-black tracking-wider text-gray-900 uppercase shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            Enterprise Asset Management
          </div>
          <h1 className="mb-8 text-5xl leading-tight font-black tracking-tight text-gray-900 md:text-7xl">
            Track, Allocate, <br className="hidden md:block" />
            <span className="bg-purple-600 px-4 text-white">and Maintain.</span>
          </h1>
          <p className="mb-12 max-w-2xl text-lg font-medium text-gray-700 md:text-xl">
            AssetFlow simplifies how organizations manage physical assets and
            shared resources through a centralized, brutally efficient ERP
            platform. No more spreadsheets.
          </p>

          <div className="flex flex-col gap-4 sm:flex-row">
            <Link
              href={isLoggedIn ? "/dashboard" : "/login"}
              className="flex items-center gap-2 border-4 border-gray-900 bg-yellow-300 px-8 py-4 text-lg font-black text-gray-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] transition-transform hover:-translate-y-1 hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] active:translate-y-0 active:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
            >
              {isLoggedIn ? "Open Dashboard" : "Get Started Now"}
              <ArrowRight className="h-6 w-6" />
            </Link>
          </div>
        </div>
      </main>

      {/* Features Banner */}
      <div className="z-10 flex flex-col items-center justify-center gap-8 border-t-4 border-gray-900 bg-white p-8 md:flex-row md:gap-16">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center border-2 border-gray-900 bg-blue-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <Boxes className="h-6 w-6 text-gray-900" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Asset Tracking
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center border-2 border-gray-900 bg-green-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <CalendarDays className="h-6 w-6 text-gray-900" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Resource Booking
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center border-2 border-gray-900 bg-pink-400 shadow-[2px_2px_0px_0px_rgba(0,0,0,1)]">
            <ShieldCheck className="h-6 w-6 text-gray-900" />
          </div>
          <span className="text-lg font-bold text-gray-900">
            Role-Based Auth
          </span>
        </div>
      </div>
    </div>
  );
}
