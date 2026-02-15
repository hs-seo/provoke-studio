// Document types
export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  wordCount: number;
  folder?: string;
  tags: string[];
}

// Character types
export interface Character {
  id: string;
  name: string;
  description: string;
  avatar?: string;
  age?: number;
  role?: string;
  personality?: string[];
  background?: string;
  relationships: Relationship[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Relationship {
  characterId: string;
  type: string; // e.g., "friend", "enemy", "family"
  description: string;
}

// Plot types
export interface Plot {
  id: string;
  title: string;
  description: string;
  timeline: PlotPoint[];
  status: 'planning' | 'in-progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
}

export interface PlotPoint {
  id: string;
  title: string;
  description: string;
  order: number;
  completed: boolean;
  associatedCharacters: string[]; // character IDs
  notes?: string;
}

// Scene types
export interface Scene {
  id: string;
  title: string;
  content: string;
  order: number;
  chapterId?: string;
  characters: string[]; // character IDs
  location?: string;
  timeframe?: string;
  status: 'draft' | 'review' | 'final';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Chapter types
export interface Chapter {
  id: string;
  title: string;
  order: number;
  scenes: Scene[];
  wordCount: number;
  status: 'draft' | 'review' | 'final';
  createdAt: Date;
  updatedAt: Date;
}

// Project types
export interface Project {
  id: string;
  name: string;
  description?: string;
  genre?: string;
  targetWordCount?: number;
  currentWordCount: number;
  characters: Character[];
  plots: Plot[];
  chapters: Chapter[];
  createdAt: Date;
  updatedAt: Date;
}

// AI Service types
export type AIProvider = 'claude' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

export interface AIRequest {
  prompt: string;
  context?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface AIResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

// App Settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  focusMode: boolean;
  autoSave: boolean;
  autoSaveInterval: number; // in seconds
  aiConfig?: AIConfig;
}
