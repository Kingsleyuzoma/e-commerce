"use client";

import React, { useState, useEffect, useRef } from "react";
import { db } from "@/config/firebase";
import { 
  collection, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  doc, 
  updateDoc, 
  deleteDoc, 
  writeBatch 
} from "firebase/firestore";

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
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Live listen to notifications in Firestore
  useEffect(() => {
    let isMounted = true;
    const q = query(
      collection(db, "notifications"),
      orderBy("createdAt", "desc"),
      limit(15)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!isMounted) return;
        const liveNotifications: DbNotification[] = [];
        snapshot.forEach((doc) => {
          liveNotifications.push({
            id: doc.id,
            ...doc.data(),
          } as DbNotification);
        });
        setNotifications(liveNotifications);
      },
      (error) => {
        console.error("Error listening to notifications:", error);
      }
    );

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

  // 🗑️ Delete a single notification
  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // Stops row click / markAsRead from firing
    setDeletingId(id);
    try {
      await deleteDoc(doc(db, "notifications", id));
    } catch (err) {
      console.error("Failed to delete notification:", err);
    } finally {
      setDeletingId(null);
    }
  };

  // 🧹 Delete all notifications
  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to delete all notifications?")) return;
    try {
      const batch = writeBatch(db);
      notifications.forEach((n) => {
        const docRef = doc(db, "notifications", n.id);
        batch.delete(docRef);
      });
      await batch.commit();
    } catch (err) {
      console.error("Failed to clear all notifications:", err);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-500 hover:text-gray-900 focus:outline-none transition-colors rounded-full hover:bg-gray-100 cursor-pointer"
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
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Notifications</h3>
            <div className="flex items-center gap-3">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-blue-600 hover:text-blue-800 font-semibold cursor-pointer"
                >
                  Mark all read
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                >
                  Clear all
                </button>
              )}
            </div>
          </div>

          {/* List of items */}
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
                  className={`group p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-start justify-between gap-3 ${
                    !notification.read ? "bg-blue-50/30 font-medium" : ""
                  }`}
                >
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <span className="text-lg shrink-0 mt-0.5">
                      {notification.type === "order_placed" ? "🛒" : "🔔"}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-gray-900 font-semibold truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="h-2 w-2 rounded-full bg-blue-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-gray-500 mt-0.5 leading-relaxed">
                        {notification.message}
                      </p>
                      {notification.metadata?.grandTotal && (
                        <span className="inline-block mt-2 bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-mono font-bold text-[10px]">
                          Total: ${notification.metadata.grandTotal.toFixed(2)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 🗑️ Delete Button */}
                  <button
                    type="button"
                    disabled={deletingId === notification.id}
                    onClick={(e) => handleDeleteNotification(e, notification.id)}
                    className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors cursor-pointer shrink-0"
                    title="Delete notification"
                  >
                    {deletingId === notification.id ? (
                      <span className="h-3 w-3 block animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
                    ) : (
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    )}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}