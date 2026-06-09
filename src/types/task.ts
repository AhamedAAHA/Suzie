export type TaskPriority = "critical" | "high" | "medium" | "low";
export type TaskStatus = "pending" | "in_progress" | "completed";
export type TaskCategory =
  | "linkedin"
  | "project"
  | "study"
  | "personal"
  | "tomorrow_plan"
  | "global";

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  category: TaskCategory;
  date: string;   // YYYY-MM-DD
  time?: string;  // HH:MM
  createdAt: string;
  updatedAt: string;
}
