'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged
} from 'firebase/auth';
import { auth, googleProvider } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  isFirstTimeUser: boolean;
  setIsFirstTimeUser: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTimeUser, setIsFirstTimeUser] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
      
      // Reset first-time user flag when user signs in
      if (user) {
        setIsFirstTimeUser(true);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setLoading(true);
      
      // Check if we're in a popup-blocked environment
      if (typeof window !== 'undefined' && window.opener) {
        console.warn('Running in popup context, this might cause issues');
      }
      
      const result = await signInWithPopup(auth, googleProvider);
      
      // Log successful sign in for debugging
      console.log('Successfully signed in:', {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName
      });
      
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/popup-closed-by-user') {
        console.warn('User closed the popup window');
        // Don't throw error for user closing popup
        return;
      } else if (error.code === 'auth/popup-blocked') {
        console.error('Popup was blocked by browser');
        throw new Error('Popup was blocked. Please allow popups for this site and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        console.error('Network error during authentication');
        throw new Error('Network error. Please check your connection and try again.');
      } else if (error.code === 'auth/unauthorized-domain') {
        console.error('Unauthorized domain for authentication');
        throw new Error('Authentication domain not authorized. Please contact support.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await signOut(auth);
      
      // Log successful logout for debugging
      console.log('Successfully signed out');
      
    } catch (error: any) {
      console.error('Error signing out:', error);
      
      // Handle specific error cases
      if (error.code === 'auth/network-request-failed') {
        console.error('Network error during logout');
        throw new Error('Network error during logout. Please check your connection.');
      }
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    signInWithGoogle,
    logout,
    isFirstTimeUser,
    setIsFirstTimeUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
