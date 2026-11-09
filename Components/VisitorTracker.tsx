
"use client";

import { useEffect } from "react";
import { db } from "@/config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export default function VisitorTracker() {
  useEffect(() => {
    // Check if we already tracked this session to avoid duplicate hits on page navigation
    const hasTracked = sessionStorage.getItem("femel_visited");
    if (hasTracked) return;

    const trackVisitor = async () => {
      try {
        // Fetch location data based on user's IP
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();

        const visitorData = {
          ip: data.ip || "Unknown",
          city: data.city || "Unknown City",
          region: data.region || "Unknown Region",
          country: data.country_name || "Unknown Country",
          org: data.org || "Unknown ISP",
          userAgent: navigator.userAgent,
          path: window.location.pathname,
          createdAt: serverTimestamp(),
        };

        // Save to Firestore
        await addDoc(collection(db, "visitors"), visitorData);

        // Mark session as tracked
        sessionStorage.setItem("femel_visited", "true");
      } catch (error) {
        console.error("Failed to track visitor location:", error);
      }
    };

    trackVisitor();
  }, []);

  return null; // This component runs silently in the background
}