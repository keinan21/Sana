export type QuestType = 'quiz' | 'reflection' | 'ideation' | 'project';

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
}

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
  idealDaysToComplete: number;
  done: boolean;
  todos: TodoItem[];
  type?: QuestType;
  quizData?: QuizQuestion[];
  minReflectionLength?: number;
  proofInstructions?: string;
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
  tasks: Task[];
  isVerified: boolean;
  learningLinks: Resource[];
  type: QuestType;
  quizData?: QuizQuestion[];
  minReflectionLength?: number;
  proofInstructions?: string;
}
