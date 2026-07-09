"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'; // 🗄️ Import Firestore functions
import { auth, db } from '@/config/firebase'; // Ensure 'db' is exported from your firebase config

interface AuthContextType {
  user: User | null;
  isAdmin: boolean; // 🔑 Add isAdmin to the context type
  loading: boolean
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false); // 🕵️‍♂️ Track admin status
  const [loading, setLoading] = useState<boolean>(true);  // Wait for Firebase to check auth status

  useEffect(() => {
  const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
    setUser(currentUser);
    
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          // 1. If the user document exists, check if they are an admin
          setIsAdmin(userDoc.data()?.role === 'admin');
        } else {
          // 2. If the document does NOT exist, create it with default data
          await setDoc(userDocRef, {
            displayName: currentUser.displayName || "New User",
            email: currentUser.email,
            role: "user", // Default role for new sign-ups
            createdAt: serverTimestamp() // Safe Firebase server time 📅
          });
          setIsAdmin(false); // New users default to regular users
        }
      } catch (error) {
        console.error("Error handling user data:", error);
        setIsAdmin(false);
      }
    } else {
      setIsAdmin(false);
    }
    setLoading(false);
  });

  return () => unsubscribe();
}, []);
  const login = async (email: string, password: string) => {
    try {
      console.log("Form values being sent to fire base:", { email, password });
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
  <AuthContext.Provider value={{ user, isAdmin, loading, login, logout }}>
    {!loading && children}
  </AuthContext.Provider>
);
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};