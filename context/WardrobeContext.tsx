import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ClothingItem, Season, Formality, UserProfile } from '../types';

interface WardrobeContextType {
  items: ClothingItem[];
  profile: UserProfile;
  addItem: (item: ClothingItem) => void;
  deleteItem: (id: string) => void;
  updateProfile: (data: Partial<UserProfile>) => void;
  markAsWorn: (ids: string[]) => void; // New function
  isLoading: boolean;
  tryOnPhoto: string | null; 
  setTryOnPhoto: (base64: string | null) => void;
}

const WardrobeContext = createContext<WardrobeContextType | undefined>(undefined);

const DEFAULT_PROFILE: UserProfile = {
  name: '主人',
  gender: 'Female', // Default to Female as per user feedback context, but user can change
  height: '',
  weight: '',
  avatar: null
};

export const WardrobeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<ClothingItem[]>([]);
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  const [tryOnPhoto, setTryOnPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 从 localStorage 加载
    const storedItems = localStorage.getItem('wardrobe_items_cn');
    if (storedItems) {
      try {
        const parsed: ClothingItem[] = JSON.parse(storedItems);
        // Data Migration: Ensure new fields exist on old items
        const migrated = parsed.map(item => ({
          ...item,
          wearCount: item.wearCount || 0,
          lastWorn: item.lastWorn || undefined
        }));
        setItems(migrated);
      } catch (e) {
        setItems([]); // 出错则置空，不生成假数据
      }
    } else {
      setItems([]); // 默认为空
    }

    const storedProfile = localStorage.getItem('user_profile_cn');
    if (storedProfile) {
        const p = JSON.parse(storedProfile);
        // Ensure gender exists
        if (!p.gender) p.gender = 'Female';
        setProfile(p);
    }

    setIsLoading(false);
  }, []);

  const addItem = (item: ClothingItem) => {
    const newItem = { ...item, wearCount: 0 };
    const updated = [newItem, ...items];
    setItems(updated);
    localStorage.setItem('wardrobe_items_cn', JSON.stringify(updated));
  };

  const deleteItem = (id: string) => {
    const updated = items.filter(i => i.id !== id);
    setItems(updated);
    localStorage.setItem('wardrobe_items_cn', JSON.stringify(updated));
  };

  const markAsWorn = (ids: string[]) => {
    const updated = items.map(item => {
      if (ids.includes(item.id)) {
        return {
          ...item,
          wearCount: (item.wearCount || 0) + 1,
          lastWorn: Date.now()
        };
      }
      return item;
    });
    setItems(updated);
    localStorage.setItem('wardrobe_items_cn', JSON.stringify(updated));
  };

  const updateProfile = (data: Partial<UserProfile>) => {
    const newProfile = { ...profile, ...data };
    setProfile(newProfile);
    localStorage.setItem('user_profile_cn', JSON.stringify(newProfile));
  };

  return (
    <WardrobeContext.Provider value={{ 
      items, 
      profile, 
      addItem, 
      deleteItem, 
      updateProfile,
      markAsWorn,
      tryOnPhoto, 
      setTryOnPhoto,
      isLoading 
    }}>
      {children}
    </WardrobeContext.Provider>
  );
};

export const useWardrobe = () => {
  const context = useContext(WardrobeContext);
  if (!context) {
    throw new Error('useWardrobe must be used within a WardrobeProvider');
  }
  return context;
};