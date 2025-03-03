export interface UserData {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
  registeredDate: string;
  userSegment: UserSegment;
  churnRisk: number;
  activityScore: number;
}

export type UserSegment = 'power' | 'atrisk' | 'occasional';

export interface PersonaUser {
  id: string;
  name: string;
  email: string;
  lastLogin: string;
  churnRisk: number;
}

export interface Persona {
  id: string;
  name: string;
  segment: UserSegment;
  description: string;
  painPoints: string[];
  goals: string[];
  churnRisk: number;
  image?: string;
  users?: PersonaUser[];
}

export interface UserStory {
  id: string;
  personaId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  acceptanceCriteria: string[];
}

export interface ChurnMetric {
  id: string;
  title: string;
  value: number;
  change: number;
  isPositive: boolean;
  description: string;
}

export interface Insight {
  id: string;
  title: string;
  description: string;
  impact: 'high' | 'medium' | 'low';
  recommendation: string;
  category: 'onboarding' | 'engagement' | 'support' | 'product';
}

export interface FileUploadState {
  isUploading: boolean;
  progress: number;
  error: string | null;
  success: boolean;
}
