
"use client";

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/config/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  linkUrl: string;
  displayOrder: number;
}

interface HomepageCard {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  buttonText: string;
  linkUrl: string;
  position: 'left' | 'right';
}

export default function HeroManager() {
  // 📑 Tab State (Defaults to Layout Cards)
  const [activeTab, setActiveTab] = useState<'cards' | 'carousel'>('cards');

  // 🎬 Carousel Form & Data State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);

  // 💎 Layout Cards Form & Data State
  const [cardForm, setCardForm] = useState({
    title: '',
    description: '',
    buttonText: '',
    linkUrl: '',
    position: 'left' as 'left' | 'right'
  });
  const [cardImageFile, setCardImageFile] = useState<File | null>(null);
  const [cardUploading, setCardUploading] = useState(false);
  const [cards, setCards] = useState<HomepageCard[]>([]);

  // 📥 Fetch Carousel Slides
  const fetchSlides = async () => {
    try {
      const q = query(collection(db, "heroSlides"), orderBy("displayOrder", "asc"));
      const querySnapshot = await getDocs(q);
      const fetched: Slide[] = [];
      querySnapshot.forEach((doc) => {
        fetched.push({ id: doc.id, ...doc.data() } as Slide);
      });
      setSlides(fetched);
    } catch (err) {
      console.error("Error fetching slides:", err);
    }
  };

  // 📥 Fetch Layout Cards
  const fetchCards = async () => {
    try {
      const q = query(collection(db, "homepageCards"), orderBy("createdAt", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedCards: HomepageCard[] = [];
      querySnapshot.forEach((doc) => {
        fetchedCards.push({ id: doc.id, ...doc.data() } as HomepageCard);
      });
      setCards(fetchedCards);
    } catch (err) {
      console.error("Error fetching cards:", err);
    }
  };

  useEffect(() => {
    fetchSlides();
    fetchCards();
  }, []);

  // 🚀 Handle Carousel Slide Submit
  const handleCarouselSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile) {
      alert("Please select an image file first! 🖼️");
      return;
    }
    setUploading(true);
    try {
      const storageRef = ref(storage, `hero_slides/${Date.now()}_${imageFile.name}`);
      const snapshot = await uploadBytes(storageRef, imageFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "heroSlides"), {
        title,
        subtitle,
        linkUrl: linkUrl || "/",
        imageUrl: downloadUrl,
        displayOrder: parseInt(displayOrder) || 0,
        createdAt: new Date()
      });

      setTitle('');
      setSubtitle('');
      setLinkUrl('');
      setDisplayOrder('0');
      setImageFile(null);
      
      fetchSlides();
      alert("Slide created successfully! 🎉");
    } catch (error) {
      console.error("Error creating slide:", error);
      alert("Failed to upload slide.");
    } finally {
      setUploading(false);
    }
  };

  // 🗑️ Delete Carousel Slide
  const handleCarouselDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this slide?")) {
      await deleteDoc(doc(db, "heroSlides", id));
      fetchSlides();
    }
  };

  // 🚀 Handle Layout Card Submit
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardImageFile) {
      alert("Please select an image for the card! 🖼️");
      return;
    }
    setCardUploading(true);
    try {
      const storageRef = ref(storage, `homepage_cards/${Date.now()}_${cardImageFile.name}`);
      const snapshot = await uploadBytes(storageRef, cardImageFile);
      const downloadUrl = await getDownloadURL(snapshot.ref);

      await addDoc(collection(db, "homepageCards"), {
        title: cardForm.title,
        description: cardForm.description,
        buttonText: cardForm.buttonText || "View Details",
        linkUrl: cardForm.linkUrl || "/",
        position: cardForm.position,
        imageUrl: downloadUrl,
        createdAt: new Date()
      });

      setCardForm({
        title: '',
        description: '',
        buttonText: '',
        linkUrl: '',
        position: 'left'
      });
      setCardImageFile(null);
      
      fetchCards();
      alert("Layout card published successfully! 🎉");
    } catch (error) {
      console.error("Error creating card:", error);
      alert("Failed to upload card.");
    } finally {
      setCardUploading(false);
    }
  };

  // 🗑️ Delete Layout Card
  const handleCardDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this layout card?")) {
      await deleteDoc(doc(db, "homepageCards", id));
      fetchCards();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 rounded-2xl shadow-sm space-y-6">
      <div>
        <h2 className="text-2xl font-extrabold text-gray-900">Homepage Asset Manager 🛠️</h2>
        <p className="text-gray-500 text-sm">Configure your hero banners and surrounding grid content.</p>
      </div>

      {/* 📑 Tab Navigation Controls */}
      <div className="flex space-x-4 border-b border-gray-200 pb-3">
        <button
          onClick={() => setActiveTab('cards')}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition ${
            activeTab === 'cards' 
              ? 'bg-pink-600 text-white shadow-sm' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
           Manage Layout Cards 🎛️
        </button>
        <button
          onClick={() => setActiveTab('carousel')}
          className={`px-4 py-2 font-semibold text-sm rounded-lg transition ${
            activeTab === 'carousel' 
              ? 'bg-slate-700 text-white shadow-sm' 
              : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
          }`}
        >
          Manage Carousel 🎬 
        </button>
      </div>

      {/* 🔄 Tab Content Views */}
      {activeTab === 'cards' ? (
        <div className="space-y-8">
          {/* Create Layout Card Form */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Home page Card</h3>
            <form onSubmit={handleCardSubmit} className="space-y-4 max-w-xl">
              {/* Position Radio Selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Card Position</label>
                <div className="flex space-x-6 bg-gray-50 p-3 rounded-lg border border-gray-200">
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="position" 
                      value="left"
                      checked={cardForm.position === 'left'}
                      onChange={() => setCardForm(prev => ({ ...prev, position: 'left' }))}
                      className="text-pink-600 focus:ring-pink-500 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Left Side (Best Seller) 💎</span>
                  </label>
                  <label className="flex items-center space-x-2 cursor-pointer select-none">
                    <input 
                      type="radio" 
                      name="position" 
                      value="right"
                      checked={cardForm.position === 'right'}
                      onChange={() => setCardForm(prev => ({ ...prev, position: 'right' }))}
                      className="text-pink-600 focus:ring-pink-500 h-4 w-4"
                    />
                    <span className="text-sm font-medium text-gray-700">Right Side (Promo Banner) 🏷️</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Card Title</label>
                <input 
                  type="text" 
                  value={cardForm.title} 
                  onChange={(e) => setCardForm(prev => ({ ...prev, title: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm" 
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea 
                  value={cardForm.description} 
                  onChange={(e) => setCardForm(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm h-20 resize-none" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Button Text</label>
                  <input 
                    type="text" 
                    value={cardForm.buttonText} 
                    onChange={(e) => setCardForm(prev => ({ ...prev, buttonText: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm" 
                    placeholder="e.g., Shop Now"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Button Link URL</label>
                  <input 
                    type="text" 
                    value={cardForm.linkUrl} 
                    onChange={(e) => setCardForm(prev => ({ ...prev, linkUrl: e.target.value }))}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm" 
                    placeholder="e.g., /shop"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Card Display Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setCardImageFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" 
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={cardUploading}
                className="w-full bg-pink-600 text-white font-bold p-3 rounded-md disabled:bg-gray-400 hover:bg-pink-700 transition text-sm"
              >
                {cardUploading ? "Uploading Assets... ⏳" : "Publish Layout Card 🚀"}
              </button>
            </form>
          </div>

          {/* Active Cards List */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Current Active Cards ({cards.length})</h3>
            {cards.length === 0 ? (
              <p className="text-gray-500 text-sm">No layout cards active. Create one above!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cards.map((card) => (
                  <div key={card.id} className="border border-gray-200 rounded-lg p-4 flex gap-4 items-center bg-gray-50">
                    <img src={card.imageUrl} alt={card.title} className="w-20 h-20 object-cover rounded-md bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <p className="font-bold text-sm truncate text-gray-800">{card.title}</p>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          card.position === 'left' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                        }`}>
                          {card.position === 'left' ? 'Left' : 'Right'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 truncate">{card.description}</p>
                    </div>
                    <button onClick={() => handleCardDelete(card.id)} className="text-red-500 hover:text-red-700 font-bold text-sm px-2">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Create Slide Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Create New Hero Slide</h3>
            <form onSubmit={handleCarouselSubmit} className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700">Main Title</label>
                <input 
                  type="text" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm" 
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Subtitle / Description</label>
                <input 
                  type="text" 
                  value={subtitle} 
                  onChange={(e) => setSubtitle(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm" 
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Button Link URL</label>
                  <input 
                    type="text" 
                    value={linkUrl} 
                    placeholder="/shop"
                    onChange={(e) => setLinkUrl(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Display Order</label>
                  <input 
                    type="number" 
                    value={displayOrder} 
                    onChange={(e) => setDisplayOrder(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 p-2 shadow-sm text-sm" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Banner Image File</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" 
                  required
                />
              </div>

              <button 
                type="submit" 
                disabled={uploading}
                className="w-full bg-slate-700 text-white font-bold p-3 rounded-md disabled:bg-gray-400 hover:bg-slate-800 transition text-sm"
              >
                {uploading ? "Uploading Assets... ⏳" : "Publish Slide 🚀"}
              </button>
            </form>
          </div>

          {/* Current Active Slides List */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Current Active Slides ({slides.length})</h3>
            {slides.length === 0 ? (
              <p className="text-gray-500 text-sm">No slides active. Create one above!</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {slides.map((slide) => (
                  <div key={slide.id} className="border border-gray-200 rounded-lg p-4 flex gap-4 items-center bg-gray-50">
                    <img src={slide.imageUrl} alt={slide.title} className="w-20 h-20 object-cover rounded-md bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate text-gray-800">{slide.title}</p>
                      <p className="text-xs text-gray-500 truncate">{slide.subtitle}</p>
                      <span className="inline-block mt-1 bg-white border border-gray-200 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                        Order: {slide.displayOrder}
                      </span>
                    </div>
                    <button onClick={() => handleCarouselDelete(slide.id)} className="text-red-500 hover:text-red-700 font-bold text-sm px-2">🗑️</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}