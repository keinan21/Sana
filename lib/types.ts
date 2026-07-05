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
}
