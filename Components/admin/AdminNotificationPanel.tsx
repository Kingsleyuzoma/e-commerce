"use client";

import React, { useState, useEffect } from "react";
import { db } from "@/config/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc 
} from "firebase/firestore";
import Link from "next/link";

interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  read: boolean;
  createdAt?: any;
}

export default function AdminNotifications() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const q = query(
      collection(db, "notifications"), 
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as NotificationItem[];
      setNotifications(docs);
    });

    return () => unsubscribe();
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, "notifications", id), { read: true });
    } catch (err) {
      console.error("Failed to update notification:", err);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
      >
        <span className="text-base">🔔</span>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-gray-100 rounded-2xl shadow-xl z-50 p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-gray-100 pb-2">
            <h3 className="font-bold text-xs text-gray-900">Notifications ({unreadCount} Unread)</h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-xs text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto space-y-2">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 text-center py-4">No notifications yet.</p>
            ) : (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border text-xs space-y-1 transition-colors ${
                    n.read 
                      ? "bg-white border-gray-100 text-gray-500" 
                      : "bg-pink-50/50 border-pink-100 text-gray-900"
                  }`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <span className="font-bold">{n.title}</span>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="text-[10px] text-gray-400 hover:text-rose-500"
                    >
                      Delete
                    </button>
                  </div>

                  <p className="text-[11px] text-gray-600">{n.message}</p>

                  <div className="flex justify-between items-center pt-1 text-[10px] font-bold">
                    {n.link && (
                      <Link
                        href={n.link}
                        onClick={() => {
                          markAsRead(n.id);
                          setIsOpen(false);
                        }}
                        className="text-pink-600 hover:underline"
                      >
                        View Review →
                      </Link>
                    )}

                    {!n.read && (
                      <button
                        onClick={() => markAsRead(n.id)}
                        className="text-gray-400 hover:text-gray-700"
                      >
                        Mark as read
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}