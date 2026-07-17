
"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "@/config/firebase"; 
import { useAuth } from "@/Context/AuthContext"; 
import { FcGoogle } from "react-icons/fc";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Helper function to set the middleware authorization cookie
  const setAuthCookie = () => {
    document.cookie = "user_session=authenticated_true; path=/; max-age=86400; SameSite=Strict";
  };

  // Helper function to handle routing after successful authentication
  const handleRedirect = () => {
    const redirectTo = searchParams.get("redirect") || "/";
    router.push(redirectTo);
    router.refresh(); // Tells Next.js to immediately re-evaluate the middleware state
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);    
    setLoading(true);  
    
    try {
      await login(formData.email, formData.password);
      
      // 🍪 Set the secure session cookie for Next middleware tracking
      setAuthCookie();
      
      // 🗺️ Redirect to intended target destination
      handleRedirect();
    } catch (err: any) {
      setError(err.message || "Failed to sign in. Please check your credentials.");
    } finally {
      setLoading(false); 
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      
      // 🍪 Set the secure session cookie for Next middleware tracking
      setAuthCookie();
      
      // 🗺️ Redirect to intended target destination
      handleRedirect();
    } catch (error) {
      console.error("Google login failed:", error);
      setError("Failed to sign in with Google.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">Please sign in to your account</p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-xl text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                placeholder="jane@example.com"
              />
            </div>
            
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-[11px] font-bold text-gray-400 hover:text-gray-950 transition-colors"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                disabled={loading}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-pink-600 hover:bg-pink-700 focus:outline-none transition-all disabled:opacity-50"
          >
            {loading ? "Signing In..." : "Sign In"}
          </button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-200"></div></div>
          <div className="relative flex justify-center text-sm"><span className="px-2 bg-white text-gray-500">Or continue with</span></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <FcGoogle /> Sign in with Google
        </button>
      </div>
    </div>
  );
}