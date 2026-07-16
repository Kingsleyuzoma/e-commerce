
"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/config/firebase"; // 👈 Adjust if your config path is different (e.g. @/utils/firebase)
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, writeBatch } from "firebase/firestore";

interface DbNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: any;
  metadata?: {
    orderNumber?: string;
    grandTotal?: number;
  };
}

export default function AdminNotificationPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<DbNotification[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live listen to notifications in Firestore
  useEffect(() => {
    let isMounted = true;
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(15)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isMounted) return;
      const liveNotifications: DbNotification[] = [];
      snapshot.forEach((doc) => {
        liveNotifications.push({
          id: doc.id,
          ...doc.data(),
        } as DbNotification);
      });
      setNotifications(liveNotifications);
    }, (error) => {
      console.error("Error listening to notifications:", error);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAsRead = async (id: string) => {
    try {
      const docRef = doc(db, "notifications", id);
      await updateDoc(docRef, { read: true });
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.read);
      if (unread.length === 0) return;

      const batch = writeBatch(db);
      unread.forEach((n) => {
        const docRef = doc(db, "notifications", n.id);
        batch.update(docRef, { read: true });
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to mark all as read:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 focus:outline-none transition-colors rounded-full hover:bg-gray-100"
      >
        <svg
          className="w-6 h-6"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.02 6.02 0 00-4.902-5.903m0 0V4a2 2 0 10-4 0v1.097A6.02 6.02 0 004.902 11v3.159c0 .538-.214 1.055-.595 1.436L3 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Card */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 rounded-xl border border-gray-200 bg-white shadow-lg ring-1 ring-black/5 z-50 text-xs">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-blue-600 hover:text-blue-800 font-semibold"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-10 text-center text-gray-400">
                <span className="text-2xl block mb-2">🎈</span>
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                  className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex gap-3 ${
                    !notification.read ? "bg-blue-50/30 font-medium" : ""
                  }`}
                >
                  <span className="text-lg">
                    {notification.type === "order_placed" ? "🛒" : "🔔"}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 font-semibold truncate">{notification.title}</p>
                    <p className="text-gray-500 mt-0.5 leading-relaxed">{notification.message}</p>
                    {notification.metadata?.grandTotal && (
                      <span className="inline-block mt-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                        Total: ${notification.metadata.grandTotal.toFixed(2)}
                      </span>
                    )}
                  </div>
                  {!notification.read && (
                    <span className="h-2 w-2 rounded-full bg-blue-500 mt-1.5 flex-shrink-0" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}