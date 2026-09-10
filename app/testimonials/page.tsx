"use client";

import React, { useState, useEffect } from "react";
import { db, auth } from "@/config/firebase";
import { 
  collection, 
  addDoc, 
  doc,
  updateDoc,
  deleteDoc,
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy, 
  serverTimestamp,
  getDoc
} from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import Link from "next/link";

interface AdminReply {
  replyText: string;
  repliedAt?: any;
}

interface Testimonial {
  id: string;
  authorId: string;
  authorName: string;
  rating: number;
  comment: string;
  adminReply?: AdminReply;
  createdAt?: any;
}

export default function TestimonialsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [isVerifiedBuyer, setIsVerifiedBuyer] = useState(false);
  const [checkingOrders, setCheckingOrders] = useState(false);

  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Edit Review State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");

  // Admin Reply State
  const [replyingId, setReplyingId] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  // 1. Auth & Admin Role Check
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);

      if (currentUser) {
        setCheckingOrders(true);
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists() && userDoc.data()?.role === "admin") {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }

          const ordersRef = collection(db, "orders");
          const q = query(ordersRef, where("customer.email", "==", currentUser.email));
          const querySnapshot = await getDocs(q);

          setIsVerifiedBuyer(!querySnapshot.empty);
        } catch (err) {
          console.error("Error verifying user status:", err);
        } finally {
          setCheckingOrders(false);
        }
      } else {
        setIsVerifiedBuyer(false);
        setIsAdmin(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // 2. Real-time Testimonials Feed
  useEffect(() => {
    const testimonialsRef = collection(db, "testimonials");
    const q = query(testimonialsRef, orderBy("createdAt", "desc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Testimonial[];
      setTestimonials(docs);
    });

    return () => unsubscribe();
  }, []);

  // 3. Create Review
  // Inside app/testimonials/page.tsx

const handleSubmitReview = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!user || !isVerifiedBuyer) return;

  setSubmitting(true);
  setFeedbackMsg("");

  try {
    const authorName = user.displayName || user.email?.split("@")[0] || "Customer";

    // 1. Save the Testimonial
    await addDoc(collection(db, "testimonials"), {
      authorId: user.uid,
      authorName: authorName,
      rating: Number(rating),
      comment,
      createdAt: serverTimestamp(),
    });

    // 2. 🔔 Trigger Admin Notification
    await addDoc(collection(db, "notifications"), {
      type: "TESTIMONIAL",
      title: "New Testimonial Received!",
      message: `${authorName} left a ${rating}-star review: "${comment.substring(0, 40)}..."`,
      link: "/testimonials",
      read: false,
      createdAt: serverTimestamp(),
    });

    setComment("");
    setFeedbackMsg("Thank you! Your testimonial has been posted.");
  } catch (err) {
    console.error("Error writing testimonial:", err);
    setFeedbackMsg("Failed to post testimonial.");
  } finally {
    setSubmitting(false);
  }
};
  // 4. Update Review (Author)
  const handleUpdateReview = async (testimonialId: string) => {
    try {
      const docRef = doc(db, "testimonials", testimonialId);
      await updateDoc(docRef, {
        rating: Number(editRating),
        comment: editComment,
        updatedAt: serverTimestamp(),
      });
      setEditingId(null);
    } catch (err) {
      console.error("Error updating review:", err);
      alert("Failed to update review.");
    }
  };

  // 5. Submit Admin Reply (Admin Only)
  const handleAdminReplySubmit = async (testimonialId: string) => {
    if (!replyText.trim() || !isAdmin) return;

    setReplySubmitting(true);
    try {
      const docRef = doc(db, "testimonials", testimonialId);
      await updateDoc(docRef, {
        adminReply: {
          replyText: replyText.trim(),
          repliedAt: new Date().toISOString(),
        },
      });

      setReplyText("");
      setReplyingId(null);
    } catch (err) {
      console.error("Error submitting admin reply:", err);
      alert("Failed to post reply.");
    } finally {
      setReplySubmitting(false);
    }
  };

  // 6. Delete Testimonial
  const handleDeleteReview = async (testimonialId: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;

    try {
      await deleteDoc(doc(db, "testimonials", testimonialId));
    } catch (err) {
      console.error("Error deleting review:", err);
      alert("Failed to delete review.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 text-sm p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-black text-gray-950 tracking-tight">Customer Testimonials</h1>
          <p className="text-xs text-gray-500 font-medium mt-1">Read verified reviews from our real shoppers.</p>
        </div>

        {/* --- REVIEW SUBMISSION FORM --- */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
          {authLoading ? (
            <p className="text-xs text-gray-400">Checking authorization status...</p>
          ) : !user ? (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs font-medium">
              Only logged-in customers can leave testimonials.{" "}
              <Link href="/login" className="font-bold underline">Log in here</Link>
            </div>
          ) : checkingOrders ? (
            <p className="text-xs text-gray-400">Verifying purchase history...</p>
          ) : !isVerifiedBuyer ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium">
              ⚠️ You must complete at least one purchase before submitting a review.
            </div>
          ) : (
            <form onSubmit={handleSubmitReview} className="space-y-4">
              <h2 className="text-base font-bold text-gray-900">Write a Review</h2>

              {feedbackMsg && (
                <p className="text-xs font-bold text-emerald-600 bg-emerald-50 p-2.5 rounded-lg border border-emerald-100">
                  {feedbackMsg}
                </p>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Rating</label>
                <select
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs outline-none focus:border-gray-900"
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                  <option value={3}>⭐⭐⭐ (3 Stars)</option>
                  <option value={2}>⭐⭐ (2 Stars)</option>
                  <option value={1}>⭐ (1 Star)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Your Feedback</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tell us about your shopping experience..."
                  required
                  rows={3}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs outline-none focus:border-gray-900"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-gray-900 hover:bg-gray-800 text-white font-bold px-5 py-2.5 rounded-xl text-xs transition-colors disabled:opacity-50"
              >
                {submitting ? "Publishing..." : "Submit Testimonial"}
              </button>
            </form>
          )}
        </div>

        {/* --- REVIEWS DISPLAY LIST --- */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-gray-900">Recent Reviews</h2>
          {testimonials.length === 0 ? (
            <p className="text-xs text-gray-400">No testimonials published yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((t) => {
                const isAuthor = user?.uid === t.authorId;
                const canDelete = isAuthor || isAdmin;

                return (
                  <div key={t.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm space-y-3 flex flex-col justify-between">
                    {editingId === t.id ? (
                      /* Inline Review Edit View */
                      <div className="space-y-3">
                        <select
                          value={editRating}
                          onChange={(e) => setEditRating(Number(e.target.value))}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                        >
                          <option value={5}>⭐⭐⭐⭐⭐ (5 Stars)</option>
                          <option value={4}>⭐⭐⭐⭐ (4 Stars)</option>
                          <option value={3}>⭐⭐⭐ (3 Stars)</option>
                          <option value={2}>⭐⭐ (2 Stars)</option>
                          <option value={1}>⭐ (1 Star)</option>
                        </select>

                        <textarea
                          value={editComment}
                          onChange={(e) => setEditComment(e.target.value)}
                          className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                          rows={2}
                        />

                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateReview(t.id)}
                            className="bg-emerald-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="bg-gray-200 text-gray-700 text-xs font-bold px-3 py-1.5 rounded-lg"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Standard Testimonial Card */
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-bold text-xs text-gray-950">{t.authorName}</span>
                            <span className="text-xs text-amber-500">{"⭐".repeat(t.rating)}</span>
                          </div>
                          <p className="text-xs text-gray-600">{t.comment}</p>
                        </div>

                        {/* Official Store Admin Reply Box */}
                        {t.adminReply && (
                          <div className="bg-gray-50 border-l-2 border-gray-900 p-3 rounded-r-xl space-y-1 mt-2">
                            <div className="flex items-center gap-1.5">
                              <span className="bg-black text-white text-[9px] font-black uppercase px-1.5 py-0.5 rounded">
                                Official Response
                              </span>
                            </div>
                            <p className="text-xs text-gray-700 italic">"{t.adminReply.replyText}"</p>
                          </div>
                        )}

                        {/* Admin Inline Reply Form */}
                        {isAdmin && replyingId === t.id && (
                          <div className="space-y-2 pt-2 border-t border-gray-100">
                            <textarea
                              value={replyText}
                              onChange={(e) => setReplyText(e.target.value)}
                              placeholder="Write store response..."
                              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-xs"
                              rows={2}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAdminReplySubmit(t.id)}
                                disabled={replySubmitting}
                                className="bg-gray-900 text-white text-[11px] font-bold px-3 py-1 rounded-lg disabled:opacity-50"
                              >
                                {replySubmitting ? "Posting..." : "Publish Reply"}
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingId(null);
                                  setReplyText("");
                                }}
                                className="bg-gray-100 text-gray-600 text-[11px] font-bold px-3 py-1 rounded-lg"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Controls */}
                    <div className="flex justify-between items-center pt-2 border-t border-gray-50 text-[11px] font-bold">
                      <div className="flex gap-3">
                        {isAuthor && !editingId && (
                          <button
                            onClick={() => {
                              setEditingId(t.id);
                              setEditRating(t.rating);
                              setEditComment(t.comment);
                            }}
                            className="text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                        )}
                        {canDelete && (
                          <button
                            onClick={() => handleDeleteReview(t.id)}
                            className="text-rose-600 hover:underline"
                          >
                            Delete
                          </button>
                        )}
                      </div>

                      {/* Admin-Only Reply Trigger Button */}
                      {isAdmin && replyingId !== t.id && (
                        <button
                          onClick={() => {
                            setReplyingId(t.id);
                            setReplyText(t.adminReply?.replyText || "");
                          }}
                          className="text-emerald-700 hover:underline"
                        >
                          {t.adminReply ? "Edit Reply" : "💬 Reply as Admin"}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}