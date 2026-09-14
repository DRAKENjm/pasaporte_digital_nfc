export type UserRole = 'USER' | 'COMMERCE' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl?: string;
  phone?: string;
}

export interface Wallet {
  balance: number;
  currentLevel: 'Bronce' | 'Plata' | 'Oro' | 'Diamante';
  lifetimePoints: number;
}

export interface Reward {
  id: string;
  title: string;
  description: string;
  pointsCost: number;
  stock: number;
  imageUrl?: string;
  commerceId?: string;
  isActive: boolean;
}

export interface Post {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  mediaUrl: string;
  mediaType: 'video' | 'image';
  thumbnailUrl?: string;
  durationSeconds?: number;
  likesCount: number;
  hasLiked?: boolean;
  createdAt: string;
}

export interface VisitValidationResponse {
  success: boolean;
  pointsEarned: number;
  newBalance: number;
  currentLevel: string;
  commerceName: string;
  message: string;
}
