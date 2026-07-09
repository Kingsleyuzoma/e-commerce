"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, googleProvider } from '@/config/firebase';
import { signInWithPopup, createUserWithEmailAndPassword } from "firebase/auth";

export default function SignUpPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  // 📝 Form States
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  // 📥 Handle Input Changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    if (error) setError('');
  };

  // 🏁 Handle Form Submission
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔒 Validation Rules
    if (!formData.fullName || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    try {
      setLoading(true);
      // Firebase: create the user
      await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      alert('Account created successfully!');
      router.push('/');
    } catch (err) {
      console.error('Sign up failed:', err);
      setError('Failed to create account. Email might already be in use');
    } finally {
      setLoading(false);
    }
  };


   const handleGoogleLogin = async () => {
      try {
        await signInWithPopup(auth, googleProvider);
        router.push("/");
      } catch (error) {
        console.error("Google login failed:", error);
        setError("Failed to sign in with Google.");
      }
    };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold text-gray-950 tracking-tight">Create Account</h1>
          <p className="text-sm text-gray-500">Sign up to get started with your shopping journey</p>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="bg-rose-50 text-rose-600 p-3 rounded-xl text-sm font-medium border border-rose-100">
            ⚠️ {error}
          </div>
        )}

        {/* Sign Up Form */}
        <form onSubmit={handleSignUp} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Full Name</label>
            <input 
              type="text" name="fullName" value={formData.fullName} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
              placeholder="Jane Doe"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Email Address</label>
            <input 
              type="email" name="email" value={formData.email} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
              placeholder="jane@example.com"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Password</label>
            <input 
              type="password" name="password" value={formData.password} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Confirm Password</label>
            <input 
              type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleInputChange}
              className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500 focus:bg-white transition-all"
              placeholder="••••••••"
            />
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-gray-950 hover:bg-pink-600 text-white font-semibold py-3 rounded-xl transition-all text-center shadow-md active:scale-[0.99]"
          >
            {loading ? "Signing Up..." : "Sign Up"}
          </button>
          </form>

           <button
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-3 px-4 border border-gray-300 rounded-xl shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-all flex items-center justify-center gap-2 disabled:opacity-50"
        >
          🌐 Sign up with Google
        </button>

        {/* Redirect Link */}
        <p className="text-center text-sm text-gray-500">
          Already have an account?{' '}
          <Link href="/login" className="text-pink-600 font-semibold hover:underline">
            Log In
          </Link>
        </p>

      </div>
    </div>
  );
}