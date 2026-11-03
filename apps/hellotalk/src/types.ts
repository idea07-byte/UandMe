export type CEFRLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2' | 'Native';

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

export interface LearningLanguage {
  lang: Language;
  level: 'Beginner' | 'Intermediate' | 'Advanced' | 'Fluent';
  cefr: CEFRLevel;
  progressPercent: number;
}

export interface User {
  id: string;
  name: string;
  username: string;
  avatar: string;
  bio: string;
  nativeLang: Language;
  learningLangs: LearningLanguage[];
  country: string;
  city: string;
  online: boolean;
  lastActive: string;
  verified: boolean;
  dailyStreak: number;
  helpfulnessScore: number;
  totalCorrectionsGiven: number;
}

export interface SentenceCorrection {
  id: string;
  originalText: string;
  correctedText: string;
  explanation?: string;
  correctedBy: {
    id: string;
    name: string;
    avatar: string;
  };
  createdAt: string;
  helpfulCount: number;
  isHelpfulByMe?: boolean;
}

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderId: string;
  text: string;
  translation?: string;
  transliteration?: string; // Pinyin, Romaji, Furigana
  showTranslation?: boolean;
  showTransliteration?: boolean;
  audioUrl?: string;
  audioDuration?: number;
  correction?: SentenceCorrection;
  timestamp: string;
  isSavedToVocab?: boolean;
}

export interface Conversation {
  id: string;
  partner: User;
  lastMessage?: ChatMessage;
  unreadCount: number;
  updatedAt: string;
}

export interface MomentComment {
  id: string;
  author: User;
  text: string;
  createdAt: string;
  correction?: SentenceCorrection;
}

export interface Moment {
  id: string;
  author: User;
  text: string;
  translation?: string;
  imageUrl?: string;
  audioUrl?: string;
  audioDuration?: number;
  tags: string[];
  langCode: string;
  createdAt: string;
  likesCount: number;
  isLikedByMe: boolean;
  commentsCount: number;
  comments: MomentComment[];
}

export interface VocabCard {
  id: string;
  term: string; // The phrase or sentence
  translation: string;
  sourceText?: string; // Original sentence before correction
  explanation?: string;
  language: Language;
  srsInterval: number; // in days
  srsRepetitions: number;
  easeFactor: number;
  nextReviewDate: string;
  tags: string[];
  createdAt: string;
}

