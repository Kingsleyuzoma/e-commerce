
"use client";

import React, { useState, useEffect } from 'react';
import { db, storage } from '@/config/firebase';
import { collection, addDoc, getDocs, query, orderBy, deleteDoc, doc, updateDoc } from 'firebase/firestore';
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

  // 🎬 Carousel State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState('0');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [editingSlideId, setEditingSlideId] = useState<string | null>(null); // ✏️ Track slider editing

  // 💎 Layout Cards State
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
  const [editingCardId, setEditingCardId] = useState<string | null>(null); // ✏️ Track card editing

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

  // ✏️ Setup Carousel Slide for Editing
  const startEditSlide = (slide: Slide) => {
    setEditingSlideId(slide.id);
    setTitle(slide.title);
    setSubtitle(slide.subtitle);
    setLinkUrl(slide.linkUrl);
    setDisplayOrder(String(slide.displayOrder));
    setImageFile(null); // Keep original image unless new file is uploaded
    setActiveTab('carousel');
  };

  const cancelSlideEdit = () => {
    setEditingSlideId(null);
    setTitle('');
    setSubtitle('');
    setLinkUrl('');
    setDisplayOrder('0');
    setImageFile(null);
  };

  // 🚀 Handle Carousel Slide Submit (Create or Update)
  const handleCarouselSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);
    try {
      let downloadUrl = "";
      
      if (imageFile) {
        const storageRef = ref(storage, `hero_slides/${Date.now()}_${imageFile.name}`);
        const snapshot = await uploadBytes(storageRef, imageFile);
        downloadUrl = await getDownloadURL(snapshot.ref);
      }

      if (editingSlideId) {
        // Update document workflow
        const docRef = doc(db, "heroSlides", editingSlideId);
        const updatePayload: any = {
          title,
          subtitle,
          linkUrl: linkUrl || "/",
          displayOrder: parseInt(displayOrder) || 0,
        };
        if (downloadUrl) updatePayload.imageUrl = downloadUrl;

        await updateDoc(docRef, updatePayload);
        setEditingSlideId(null);
        alert("Slide updated successfully! 🎉");
      } else {
        // Create workflow
        if (!imageFile) {
          alert("Please select an image file first! 🖼️");
          setUploading(false);
          return;
        }
        await addDoc(collection(db, "heroSlides"), {
          title,
          subtitle,
          linkUrl: linkUrl || "/",
          imageUrl: downloadUrl,
          displayOrder: parseInt(displayOrder) || 0,
          createdAt: new Date()
        });
        alert("Slide created successfully! 🎉");
      }

      setTitle('');
      setSubtitle('');
      setLinkUrl('');
      setDisplayOrder('0');
      setImageFile(null);
      fetchSlides();
    } catch (error) {
      console.error("Error saving slide:", error);
      alert("Failed to save slide asset operations.");
    } finally {
      setUploading(false);
    }
  };

  // 🗑️ Delete Carousel Slide
  const handleCarouselDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this slide?")) {
      await deleteDoc(doc(db, "heroSlides", id));
      if (editingSlideId === id) cancelSlideEdit();
      fetchSlides();
    }
  };

  // ✏️ Setup Layout Card for Editing
  const startEditCard = (card: HomepageCard) => {
    setEditingCardId(card.id);
    setCardForm({
      title: card.title,
      description: card.description,
      buttonText: card.buttonText,
      linkUrl: card.linkUrl,
      position: card.position
    });
    setCardImageFile(null); // Keep current image asset unless modified
    setActiveTab('cards');
  };

  const cancelCardEdit = () => {
    setEditingCardId(null);
    setCardForm({
      title: '',
      description: '',
      buttonText: '',
      linkUrl: '',
      position: 'left'
    });
    setCardImageFile(null);
  };

  // 🚀 Handle Layout Card Submit (Create or Update)
  const handleCardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCardUploading(true);
    try {
      let downloadUrl = "";

      if (cardImageFile) {
        const storageRef = ref(storage, `homepage_cards/${Date.now()}_${cardImageFile.name}`);
        const snapshot = await uploadBytes(storageRef, cardImageFile);
        downloadUrl = await getDownloadURL(snapshot.ref);
      }

      if (editingCardId) {
        // Update legacy card entry configurations
        const docRef = doc(db, "homepageCards", editingCardId);
        const updatePayload: any = {
          title: cardForm.title,
          description: cardForm.description,
          buttonText: cardForm.buttonText || "View Details",
          linkUrl: cardForm.linkUrl || "/",
          position: cardForm.position
        };
        if (downloadUrl) updatePayload.imageUrl = downloadUrl;

        await updateDoc(docRef, updatePayload);
        setEditingCardId(null);
        alert("Layout card metadata saved! 🎉");
      } else {
        // Create normal asset workflow mapping bounds
        if (!cardImageFile) {
          alert("Please select an image for the card! 🖼️");
          setCardUploading(false);
          return;
        }
        await addDoc(collection(db, "homepageCards"), {
          title: cardForm.title,
          description: cardForm.description,
          buttonText: cardForm.buttonText || "View Details",
          linkUrl: cardForm.linkUrl || "/",
          position: cardForm.position,
          imageUrl: downloadUrl,
          createdAt: new Date()
        });
        alert("Layout card published successfully! 🎉");
      }

      setCardForm({
        title: '',
        description: '',
        buttonText: '',
        linkUrl: '',
        position: 'left'
      });
      setCardImageFile(null);
      fetchCards();
    } catch (error) {
      console.error("Error storing card assets:", error);
      alert("Failed to push layout payload configurations.");
    } finally {
      setCardUploading(false);
    }
  };

  // 🗑️ Delete Layout Card
  const handleCardDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this layout card?")) {
      await deleteDoc(doc(db, "homepageCards", id));
      if (editingCardId === id) cancelCardEdit();
      fetchCards();
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 rounded-2xl shadow-sm space-y-6 text-sm text-gray-800">
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
          {/* Create/Edit Layout Card Form */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingCardId ? "✏️ Edit Layout Card" : "Create New Home page Card"}
            </h3>
            <form onSubmit={handleCardSubmit} className="space-y-4 max-w-xl">
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
                <label className="block text-sm font-medium text-gray-700">
                  Card Display Image {editingCardId && <span className="text-xs text-gray-400 font-normal">(Leave blank to keep existing)</span>}
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setCardImageFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" 
                  required={!editingCardId}
                />
              </div>

              <div className="flex gap-3">
                {editingCardId && (
                  <button 
                    type="button"
                    onClick={cancelCardEdit}
                    className="flex-1 bg-gray-200 text-gray-700 font-bold p-3 rounded-md hover:bg-gray-300 transition text-sm"
                  >
                    Cancel Action
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={cardUploading}
                  className={`font-bold p-3 rounded-md disabled:bg-gray-400 transition text-sm ${editingCardId ? 'flex-1 bg-amber-500 text-white hover:bg-amber-600' : 'w-full bg-pink-600 text-white hover:bg-pink-700'}`}
                >
                  {cardUploading ? "Saving updates... ⏳" : editingCardId ? "Save Card Updates 💾" : "Publish Layout Card 🚀"}
                </button>
              </div>
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
                  <div key={card.id} className={`border rounded-lg p-4 flex gap-4 items-center bg-gray-50 transition-all ${editingCardId === card.id ? 'ring-2 ring-amber-500 border-transparent bg-amber-50/20' : 'border-gray-200'}`}>
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
                    <div className="flex items-center space-x-1">
                      <button 
                        type="button"
                        onClick={() => startEditCard(card)} 
                        className="text-gray-500 hover:text-amber-600 font-bold text-sm p-2 hover:bg-amber-50 rounded"
                        title="Edit Card"
                      >
                        ✏️
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleCardDelete(card.id)} 
                        className="text-red-500 hover:text-red-700 font-bold text-sm p-2 hover:bg-rose-50 rounded"
                        title="Delete Card"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Create/Edit Slide Form */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">
              {editingSlideId ? "✏️ Edit Hero Slide" : "Create New Hero Slide"}
            </h3>
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
                <label className="block text-sm font-medium text-gray-700">
                  Banner Image File {editingSlideId && <span className="text-xs text-gray-400 font-normal">(Leave blank to keep existing)</span>}
                </label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files ? e.target.files[0] : null)}
                  className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100" 
                  required={!editingSlideId}
                />
              </div>

              <div className="flex gap-3">
                {editingSlideId && (
                  <button 
                    type="button"
                    onClick={cancelSlideEdit}
                    className="flex-1 bg-gray-200 text-gray-700 font-bold p-3 rounded-md hover:bg-gray-300 transition text-sm"
                  >
                    Cancel Action
                  </button>
                )}
                <button 
                  type="submit" 
                  disabled={uploading}
                  className={`font-bold p-3 rounded-md disabled:bg-gray-400 transition text-sm ${editingSlideId ? 'flex-1 bg-amber-500 text-white hover:bg-amber-600' : 'w-full bg-slate-700 text-white hover:bg-slate-800'}`}
                >
                  {uploading ? "Saving updates... ⏳" : editingSlideId ? "Save Slide Updates 💾" : "Publish Slide 🚀"}
                </button>
              </div>
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
                  <div key={slide.id} className={`border rounded-lg p-4 flex gap-4 items-center bg-gray-50 transition-all ${editingSlideId === slide.id ? 'ring-2 ring-amber-500 border-transparent bg-amber-50/20' : 'border-gray-200'}`}>
                    <img src={slide.imageUrl} alt={slide.title} className="w-20 h-20 object-cover rounded-md bg-gray-100" />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate text-gray-800">{slide.title}</p>
                      <p className="text-xs text-gray-500 truncate">{slide.subtitle}</p>
                      <span className="inline-block mt-1 bg-white border border-gray-200 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded">
                        Order: {slide.displayOrder}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <button 
                        type="button"
                        onClick={() => startEditSlide(slide)} 
                        className="text-gray-500 hover:text-amber-600 font-bold text-sm p-2 hover:bg-amber-50 rounded"
                        title="Edit Slide"
                      >
                        ✏️
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleCarouselDelete(slide.id)} 
                        className="text-red-500 hover:text-red-700 font-bold text-sm p-2 hover:bg-rose-50 rounded"
                        title="Delete Slide"
                      >
                        🗑️
                      </button>
                    </div>
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