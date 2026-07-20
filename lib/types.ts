export type QuestType = 'reflection' | 'essay' | 'link';

export interface Resource {
  platform: string;
  title: string;
  url: string;
}

export interface TodoItem {
  id: string;
  task: string;
  isDone: boolean;
  resources: Resource[];
}

export interface Modul {
  id: string;
  title: string;
  description?: string;
  idealDaysToComplete: number;
  createdAt?: string;
  done: boolean;
  todos: TodoItem[];
  resources?: Resource[];
  type?: QuestType;
  minReflectionLength?: number;
  essayPrompt?: string;
  linkInstructions?: string;
  verificationAnswer?: string;
  verificationResponse?: string;
}

export interface LearningCircuitData {
  id: string;
  title: string;
  targetDescription: string;
  totalEstimatedWeeks: number;
  createdAt: string;
  moduls: Modul[];
}

export interface Task {
  id: string;
  text: string;
  isCompleted: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  idealDaysToComplete: number;
  createdAt?: string;
  tasks: Task[];
  isVerified: boolean;
  learningLinks: Resource[];
  type: QuestType | null;
  minReflectionLength?: number;
  essayPrompt?: string;
  linkInstructions?: string;
  verificationAnswer?: string;
  verificationResponse?: string;
}
