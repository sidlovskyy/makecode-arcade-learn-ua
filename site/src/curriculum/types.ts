import type { LessonStepVisual } from '../lesson-visuals/types';

export type Difficulty = 'starter' | 'explorer' | 'builder' | 'master';
export type CampaignColor = 'mint' | 'yellow' | 'pink' | 'purple' | 'blue' | 'orange';

export interface LessonStep {
  id: string;
  title: string;
  instruction: string;
  expected: string;
  hint?: string;
  visual: LessonStepVisual;
}

export interface LessonChallenge {
  title: string;
  prompt: string;
  hint?: string;
}

export interface LessonQuiz {
  question: string;
  options: [string, string, ...string[]];
  correctIndex: number;
  explanation: string;
}

export interface Lesson {
  id: string;
  slug: string;
  order: number;
  title: string;
  summary: string;
  durationMinutes: number;
  difficulty: Difficulty;
  concepts: string[];
  prerequisites: string[];
  objective: string;
  steps: LessonStep[];
  challenge: LessonChallenge;
  quiz: LessonQuiz;
  xp: number;
  makeCodeUrl: `https://arcade.makecode.com${string}`;
}

export interface Campaign {
  id: string;
  order: number;
  title: string;
  description: string;
  color: CampaignColor;
  reward: string;
  lessons: Lesson[];
}
