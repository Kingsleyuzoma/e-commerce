
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

interface AdminMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  read: boolean;
  createdAt: any;
}

export default function AdminMessagesPage() {
  const [messages, setMessages] = useState<AdminMessage[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<AdminMessage | null>(null);

  useEffect(() => {
    const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs: AdminMessage[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as AdminMessage[];
      setMessages(docs);
    });

    return () => unsubscribe();
  }, []);

  const handleSelectMessage = async (msg: AdminMessage) => {
    setSelectedMessage(msg);
    if (!msg.read) {
      try {
        await updateDoc(doc(db, "messages", msg.id), { read: true });
      } catch (err) {
        console.error("Failed to mark message as read:", err);
      }
    }
  };

  const handleDeleteMessage = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this message?")) return;
    try {
      await deleteDoc(doc(db, "messages", id));
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch (err) {
      console.error("Failed to delete message:", err);
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Customer Messages</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Messages List Column */}
        <div className="md:col-span-1 bg-white rounded-xl border border-gray-200 overflow-hidden h-150 flex flex-col">
          <div className="p-4 border-b border-gray-100 font-semibold text-xs text-gray-500 uppercase tracking-wider">
            Inbox ({messages.length})
          </div>
          <div className="overflow-y-auto divide-y divide-gray-100 flex-1">
            {messages.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400">No messages yet.</div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => handleSelectMessage(msg)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    selectedMessage?.id === msg.id ? "bg-blue-50/50" : ""
                  } ${!msg.read ? "font-bold bg-gray-50/80" : ""}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-gray-900 truncate">{msg.name}</span>
                    {!msg.read && <span className="h-2 w-2 rounded-full bg-blue-500" />}
                  </div>
                  <p className="text-xs text-gray-800 font-medium truncate">{msg.subject}</p>
                  <p className="text-[11px] text-gray-500 truncate mt-1">{msg.message}</p>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Selected Message Detail View */}
        <div className="md:col-span-2 bg-white rounded-xl border border-gray-200 p-6 h-150 flex flex-col">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              <div className="flex justify-between items-start border-b border-gray-100 pb-4 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedMessage.subject}</h2>
                  <p className="text-xs text-gray-500 mt-1">
                    From: <span className="font-semibold text-gray-800">{selectedMessage.name}</span> ({selectedMessage.email})
                  </p>
                </div>
                <button
                  onClick={() => handleDeleteMessage(selectedMessage.id)}
                  className="text-xs text-red-600 hover:text-red-800 font-medium cursor-pointer"
                >
                  Delete Message
                </button>
              </div>

              <div className="flex-1 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                {selectedMessage.message}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-100">
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: ${encodeURIComponent(
                    selectedMessage.subject || "Your Inquiry"
                  )}`}
                  className="inline-block px-4 py-2 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Reply via Email ✉️
                </a>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center text-xs text-gray-400">
              Select a message from the inbox to read.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}