'use client';

import { createContext, useContext, useState, ReactNode } from 'react';

type UserProfile = {
  age: number | null;
  educationLevel: string; // "grade4", "highschool", "university", "professional", etc.
  goals: string[];
  preferredDepth: 'light' | 'deep';
  weeklyTime: number;
};

type UserContextType = {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => void;
  currentNode: string | null;
  setCurrentNode: (node: string) => void;
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>({
    age: null,
    educationLevel: 'professional',
    goals: [],
    preferredDepth: 'deep',
    weeklyTime: 5,
  });
  const [currentNode, setCurrentNode] = useState<string | null>(null);

  const updateProfile = (updates: Partial<UserProfile>) => {
    setProfile(prev => ({ ...prev, ...updates }));
  };

  return (
    <UserContext.Provider value={{ profile, updateProfile, currentNode, setCurrentNode }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) throw new Error('useUser must be used within UserProvider');
  return context;
}