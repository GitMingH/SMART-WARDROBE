export enum Season {
  Spring = '春',
  Summer = '夏',
  Autumn = '秋',
  Winter = '冬',
  All = '四季通用'
}

export enum Formality {
  Casual = '休闲',
  SmartCasual = '商务休闲',
  Business = '正式商务',
  Formal = '隆重礼服',
  Sport = '运动户外'
}

export interface ClothingItem {
  id: string;
  imageUrl: string; // Base64 or URL
  category: string;
  color: string;
  season: Season;
  formality: Formality;
  description: string;
  dateAdded: number;
  
  // New Analytics Fields
  wearCount?: number;     // Total times worn
  lastWorn?: number;      // Timestamp of last wear
  price?: number;         // For future CPW calculation
}

export interface WeatherData {
  city: string; // Added city
  temperature: number;
  condition: '晴' | '多云' | '雨' | '雪' | '大风' | '阴';
  description: string;
}

export interface OutfitSuggestion {
  selectedItemIds: string[];
  reasoning: string;
}

export interface ShoppingAdvice {
  verdict: '买' | '不买';
  score: number; // 0-100
  reasoning: string;
  suggestions?: string; // New field: What to buy instead?
  similarItemId?: string; // If duplicate
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface UserProfile {
  name: string;
  gender: 'Male' | 'Female' | 'Unisex'; // Critical for style accuracy
  height: string; // e.g. "165"
  weight: string; // e.g. "50"
  avatar: string | null; // Base64
}