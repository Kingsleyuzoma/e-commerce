
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { resetUserPassword } from "../actions/auth";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await resetUserPassword(email);
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-sm text-gray-800">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Brand/Logo Placeholder */}
        <span className="text-xl font-black tracking-tight text-gray-950">
          YOUR STORE
        </span>
        <h2 className="mt-6 text-2xl font-black text-gray-950 tracking-tight">
          Reset your password
        </h2>
        <p className="mt-1.5 text-xs text-gray-400 font-medium">
          We will send a secure password recovery link to your inbox.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 border border-gray-100 shadow-sm rounded-2xl sm:px-10">
          {success ? (
            <div className="space-y-6 text-center py-4">
              {/* Success Badge */}
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 mb-2">
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <div>
                <h3 className="font-bold text-gray-950 text-base">Check your email</h3>
                <p className="text-xs text-gray-400 mt-2 leading-relaxed">
                  We sent a password reset link to <strong className="text-gray-700">{email}</strong>. 
                  Please check your spam folder if you do not receive it within a few minutes.
                </p>
              </div>
              <div className="pt-4">
                <Link
                  href="/login"
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 bg-white hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Return to Sign In
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" onSubmit={handleSubmit}>
              {error && (
                <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-[11px] text-red-600 font-medium leading-relaxed">
                  ⚠️ {error}
                </div>
              )}

              <div>
                <label
                  htmlFor="email"
                  className="block text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-2"
                >
                  Email Address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:border-gray-950 transition-colors"
                  />
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-xs font-bold text-white bg-gray-950 hover:bg-gray-900 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
                >
                  {loading ? "Sending link..." : "Send Reset Link"}
                </button>
              </div>

              <div className="text-center pt-2">
                <Link
                  href="/login"
                  className="text-xs text-gray-400 hover:text-gray-950 font-bold transition-colors"
                >
                  ← Back to Login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}