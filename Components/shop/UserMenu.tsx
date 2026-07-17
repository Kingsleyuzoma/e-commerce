
"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/Context/AuthContext"; 
import { doc, updateDoc } from "firebase/firestore";
import { db, storage } from "@/config/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth"; // 👈 Added to update Auth profile directly
import Link from "next/link";

export default function UserMenu() {
  const { user, logout } = useAuth(); 
  const [isOpen, setIsOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [localPhotoURL, setLocalPhotoURL] = useState<string | null>(null); // 👈 Instant UI update state
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync the local state image whenever the user object is fully loaded
  useEffect(() => {
    if (user) {
      setLocalPhotoURL(user.photoURL);
    }
  }, [user]);

  // Close dropdown when clicking outside of it
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!user) {
    return (
      <div className="flex items-center space-x-3">
        <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-pink-600 transition-colors">
          Login
        </Link>
        <Link href="/signup" className="bg-pink-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-pink-700 transition-colors shadow-sm">
          Sign Up
        </Link>
      </div>
    );
  }

  // Handle uploading custom profile photo to Firebase Storage
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // 1. Upload file to Firebase Storage
      const storageRef = ref(storage, `profile_pictures/${user.uid}`);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);

      // 2. Update the Firebase Auth User Profile state directly
      await updateProfile(user, { photoURL });

      // 3. Update the user document in Firestore database
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, { photoURL });

      // 4. Update the local React state so it changes in the header INSTANTLY
      setLocalPhotoURL(photoURL);

      alert("Profile picture updated successfully! 🎉");
    } catch (error) {
      console.error("Error uploading image:", error);
      alert("Failed to upload profile image.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* 👤 Trigger Button: User Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 focus:outline-hidden group"
      >
        <div className="relative w-9 h-9 rounded-full overflow-hidden border border-gray-200 shadow-xs group-hover:border-pink-500 transition">
          {localPhotoURL ? (
            <img
              src={localPhotoURL}
              alt={user.displayName || "User profile"}
              className="w-full h-full object-cover"
            />
          ) : (
            // Default Fallback Avatar using user's initial
            <div className="w-full h-full bg-pink-100 text-pink-700 flex items-center justify-center font-bold text-sm uppercase">
              {user.displayName ? user.displayName[0] : (user.email ? user.email[0] : "U")}
            </div>
          )}
        </div>
      </button>

      {/* 📂 Dropdown Menu Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-64 bg-white rounded-2xl shadow-xl border border-gray-100 py-3 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
          
          {/* User Info Header */}
          <div className="px-4 py-2 border-b border-gray-50 flex flex-col space-y-1">
            <span className="font-semibold text-gray-950 text-sm truncate">
              {user.displayName || "My Profile"}
            </span>
            <span className="text-xs text-gray-500 truncate">
              {user.email}
            </span>
          </div>

          {/* Upload Profile Pic Trigger */}
          <div className="px-4 py-2">
            <label className="text-xs font-semibold text-pink-600 hover:text-pink-700 cursor-pointer block">
              {uploading ? "Uploading..." : "📷 Change Profile Picture"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
                disabled={uploading}
              />
            </label>
          </div>

          <div className="border-t border-gray-50 my-1" />

          {/* Logout Action */}
          <button
            onClick={() => {
              logout();
              setIsOpen(false);
            }}
            className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-medium transition"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}