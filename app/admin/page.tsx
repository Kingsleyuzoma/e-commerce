"use client";

import React from 'react';
import HeroManager from '@/Components/HeroManager'; 
import CategoryManager from '@/Components/CategoryManager'; 




export default function AdminDashboardHome() {
  return (
    <div className="space-y-8">
      {/* 👋 Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Welcome Back, Admin!</h1>
        <p className="text-sm text-gray-500 mt-1">Manage your store assets and promotions below.</p>
      </div>

      <CategoryManager />

      {/* 🎬 Hero Carousel Management Section */}
      <HeroManager />
    </div>
  );
}