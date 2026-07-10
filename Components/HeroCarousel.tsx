
"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/config/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number;
}

export default function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // 🔄 Fetch slides from Firestore
  useEffect(() => {
    const fetchSlides = async () => {
      try {
        const q = query(collection(db, "heroSlides"), orderBy("displayOrder", "asc"));
        const querySnapshot = await getDocs(q);
        const fetchedSlides: Slide[] = [];
        querySnapshot.forEach((doc) => {
          fetchedSlides.push({ id: doc.id, ...doc.data() } as Slide);
        });
        setSlides(fetchedSlides);
      } catch (error) {
        console.error("Error loading hero slides:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSlides();
  }, []);

  // ⏱️ Automatic slide rotation
  useEffect(() => {
    if (slides.length <= 1) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % slides.length);
    }, 5000); // Changes slides every 5 seconds

    return () => clearInterval(interval);
  }, [slides]);

  if (loading) {
    return <div className="h-100 bg-gray-100 animate-pulse rounded-2xl w-full" />;
  }

  if (slides.length === 0) return null;

  return (
    <div className="relative w-full max-w-sm max-auto h-125 overflow-hidden rounded-2xl bg-gray-950 group shadow-md">
      {/* 🎞️ Slides Wrapper */}
      <div 
        className="w-full h-full flex transition-transform duration-700 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)` }}
      >
        {slides.map((slide) => (
          <div key={slide.id} className="w-full h-full shrink-0 relative">
            {/* Background Image */}
            <img 
              src={slide.imageUrl} 
              alt={slide.title} 
              className="absolute inset-0 w-full h-full object-cover opacity-80"
            />
            {/* Dark Overlay for Text Readability */}
            <div className="absolute inset-0 bg-linear-to-r from-gray-950/80 via-gray-950/40 to-transparent" />
            
            {/* Slide Content */}
            <div className="absolute inset-0 flex flex-col justify-center px-8 sm:px-16 max-w-xl text-white space-y-4">
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight drop-shadow-sm animate-in fade-in slide-in-from-left-5 duration-500">
                {slide.title}
              </h1>
              <p className="text-sm sm:text-lg text-gray-200 drop-shadow-sm">
                {slide.subtitle}
              </p>
              <div className="pt-2">
                <Link href={slide.linkUrl}>
                  <button className="bg-pink-600 hover:bg-pink-700 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-md active:scale-[0.98]">
                    Shop Collection →
                  </button>
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 🔘 Navigation Dots */}
      {slides.length > 1 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex gap-2 z-10">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentIndex ? "w-6 bg-pink-600" : "w-2 bg-white/50 hover:bg-white"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}