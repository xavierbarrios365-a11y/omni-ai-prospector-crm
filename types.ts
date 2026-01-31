
export enum LeadStatus {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  PROPOSAL = 'PROPOSAL',
  CLOSED = 'CLOSED'
}

export type AIModelPreference = 'auto' | 'pro' | 'flash';

export interface Lead {
  id: string;
  businessName: string;
  website: string;
  industry: string;
  ceoName: string;
  ceoContact: string;
  email?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  phone?: string;
  address?: string;
  contactDepartment?: string;
  status: LeadStatus;
  aiScore: number;
  lastInteraction?: string;
  notes?: string;
  attackPlan?: string;
}

export interface SubLocation {
  name: string;
  count?: number;
  type: 'country' | 'state' | 'municipality' | 'neighborhood';
}

export interface WorkspaceConfig {
  gasUrl: string;
  spaceId?: string;
  calendarId?: string;
}

export interface Task {
  id: string;
  title: string;
  assignee: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  leadId?: string;
  reminderAt?: number;
}

export interface CalendarEvent {
  id: string;
  title: string;
  date: string;
  day?: number;
  type: 'post' | 'email' | 'meeting';
  socialNetwork?: 'Instagram' | 'Facebook' | 'LinkedIn' | 'TikTok' | 'Twitter';
  pillar?: string;
  objective?: string;
  format?: string;
  cta?: string;
  status: 'draft' | 'scheduled' | 'published';
}

export interface StrategyGuide {
  id: string;
  category: string;
  title: string;
  content: string;
  fileUrl?: string;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'Running' | 'Paused' | 'Draft';
  leadsReached: number;
  openRate: string;
  targetIndustry: string;
  description: string;
}

export interface AgentConfig {
  id: string;
  objective: string;
  tone: string;
  status: 'online' | 'offline';
}
