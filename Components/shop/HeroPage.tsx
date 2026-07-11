"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { db } from '@/config/firebase';
import { collection, getDocs, query } from 'firebase/firestore';
import ProductCard from '@/Components/shop/ProductCard';
import HeroCarousel from '@/Components/HeroCarousel';
import { useAuth } from '@/Context/AuthContext';
import { useCart } from '@/Context/CartContext';

interface HomepageCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  linkUrl: string;
  position: 'left' | 'right';
}

export default function HomePage() {
  const { products } = useCart();
  const { isAdmin } = useAuth();

  // 🗂️ States for the dynamic admin-controlled cards
  const [leftCard, setLeftCard] = useState<HomepageCard | null>(null);
  const [rightCard, setRightCard] = useState<HomepageCard | null>(null);
  const [loadingCards, setLoadingCards] = useState(true);

  // 🔄 Fetch layout cards from Firestore
  useEffect(() => {
    const fetchHomepageCards = async () => {
      try {
        const q = query(collection(db, "homepageCards"));
        const querySnapshot = await getDocs(q);
        
        let left: HomepageCard | null = null;
        let right: HomepageCard | null = null;

        querySnapshot.forEach((doc) => {
          const data = doc.data() as Omit<HomepageCard, 'id'>;
          if (data.position === 'left') {
            left = { id: doc.id, ...data };
          } else if (data.position === 'right') {
            right = { id: doc.id, ...data };
          }
        });

        setLeftCard(left);
        setRightCard(right);
      } catch (error) {
        console.error("Error loading homepage cards:", error);
      } finally {
        setLoadingCards(false);
      }
    };

    fetchHomepageCards();
  }, []);

  return (
    <>
      {/* 🧭 Top Navigation Banner for Admin */}
      {isAdmin && (
        <div className="bg-red-600 text-white p-2 text-center font-bold text-sm shadow-inner">
          ⚠️ Admin Mode Active — Changes made in the dashboard will reflect here instantly.
        </div>
      )}
      
      <main className="min-h-screen bg-gray-50 p-4 sm:p-8">   
        <div className="max-w-7xl mx-auto space-y-10">
          
          {/* 👑 Header Section */}
          <header className="text-center space-y-2">
            <h1 className="text-4xl font-extrabold text-gray-950 tracking-tight">
              Femel Beauty & Apparel 👑
            </h1>
            <p className="text-gray-600 font-medium">Explore our latest arrivals</p>
          </header>

          {/* 🎀 MASTER OVERLAPPING WRAPPER CONTAINER */}
          {/* This wrapper provides the background color that unifies the space between the three blocks */}
          <div className="bg-linear-to-br from-pink-50 to-rose-100/50 p-6 sm:p-8 rounded-3xl shadow-sm border border-pink-100/60">
            
            {/* 🧱 3-Column Equal Layout Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
              
              {/* 💎 Column 1 (Left): Dynamic Best-Seller Card */}
              <div className="w-full">
                {loadingCards ? (
                  <div className="h-125 bg-white/60 animate-pulse rounded-2xl w-full" />
                ) : leftCard ? (
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-125 flex flex-col justify-between transition hover:shadow-md">
                    <div>
                      <span className="bg-pink-100 text-pink-700 text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Best Seller 🔥
                      </span>
                      <h3 className="text-xl font-bold text-gray-950 mt-4 mb-2 truncate">
                        {leftCard.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-4 leading-relaxed">
                        {leftCard.description}
                      </p>
                    </div>
                    
                    <div className="w-full h-44 my-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      <img 
                        src={leftCard.imageUrl} 
                        alt={leftCard.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <Link href={leftCard.linkUrl} passHref>
                      <button className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 rounded-xl transition shadow-sm active:scale-[0.99]">
                        {leftCard.buttonText}
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 h-125 flex items-center justify-center text-center text-gray-400 text-sm shadow-sm">
                    Add a Left Card from Admin Dashboard Panel 💎
                  </div>
                )}
              </div>

              {/* 🎬 Column 2 (Center): Hero Carousel */}
              <div className="w-full h-125 flex">
                <div className="w-full h-full bg-white rounded-2xl p-2 shadow-sm border border-gray-100 flex items-center justify-center">
                  <HeroCarousel />
                </div>
              </div>

              {/* 🏷️ Column 3 (Right): Dynamic Promo Banner */}
              <div className="w-full">
                {loadingCards ? (
                  <div className="h-125 bg-white/60 animate-pulse rounded-2xl w-full" />
                ) : rightCard ? (
                  <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm h-125 flex flex-col justify-between transition hover:shadow-md">
                    <div>
                      <span className="bg-purple-100 text-purple-700 text-xs font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Exclusive Promo 🏷️
                      </span>
                      <h3 className="text-xl font-bold text-gray-950 mt-4 mb-2 truncate">
                        {rightCard.title}
                      </h3>
                      <p className="text-gray-600 text-sm line-clamp-4 leading-relaxed">
                        {rightCard.description}
                      </p>
                    </div>
                    
                    <div className="w-full h-44 my-4 rounded-xl overflow-hidden bg-gray-50 border border-gray-100">
                      <img 
                        src={rightCard.imageUrl} 
                        alt={rightCard.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>

                    <Link href={rightCard.linkUrl} passHref>
                      <button className="w-full bg-purple-700 hover:bg-purple-800 text-white font-semibold py-3 rounded-xl transition shadow-sm active:scale-[0.99]">
                        {rightCard.buttonText}
                      </button>
                    </Link>
                  </div>
                ) : (
                  <div className="bg-white border border-dashed border-gray-200 rounded-2xl p-6 h-125 flex items-center justify-center text-center text-gray-400 text-sm shadow-sm">
                    Add a Right Card from Admin Dashboard Panel 🏷️
                  </div>
                )}
              </div>

            </div>
          </div>
           
          
        </div>
      </main>
    </>
  );
}