import { Task, TaskPriority } from "@/types/task";

const STORAGE_KEY = "suzie-mission-queue";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

const DEFAULT_TASKS: Task[] = [
  {
    id: "task-default-1",
    title: "LinkedIn Update",
    description: "Post SUZIE AI project update with demo link.",
    priority: "high",
    status: "pending",
    category: "linkedin",
    date: todayStr(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-default-2",
    title: "Project Demo Review",
    description: "Review SUZIE AI video demo before posting.",
    priority: "critical",
    status: "in_progress",
    category: "project",
    date: todayStr(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-default-3",
    title: "Tomorrow Plan",
    description: "Prepare tomorrow's development and content plan.",
    priority: "medium",
    status: "pending",
    category: "tomorrow_plan",
    date: tomorrowStr(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "task-default-4",
    title: "Global Risk Monitoring",
    description: "Check construction and supply chain risk updates.",
    priority: "medium",
    status: "pending",
    category: "global",
    date: todayStr(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

function saveTasks(tasks: Task[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch {
    // storage unavailable
  }
}

export function getTasks(): Task[] {
  if (typeof window === "undefined") return DEFAULT_TASKS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      saveTasks(DEFAULT_TASKS);
      return DEFAULT_TASKS;
    }
    return JSON.parse(raw) as Task[];
  } catch {
    return DEFAULT_TASKS;
  }
}

export function addTask(
  task: Omit<Task, "id" | "createdAt" | "updatedAt">
): Task {
  const newTask: Task = {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const tasks = getTasks();
  saveTasks([...tasks, newTask]);
  return newTask;
}

export function updateTask(id: string, updates: Partial<Task>): Task | null {
  const tasks = getTasks();
  const idx = tasks.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  const updated: Task = {
    ...tasks[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  tasks[idx] = updated;
  saveTasks(tasks);
  return updated;
}

export function deleteTask(id: string): void {
  saveTasks(getTasks().filter((t) => t.id !== id));
}

export function completeTask(id: string): Task | null {
  return updateTask(id, { status: "completed" });
}

export function getTodayTasks(): Task[] {
  return getTasks().filter(
    (t) => t.date === todayStr() && t.status !== "completed"
  );
}

export function getTomorrowTasks(): Task[] {
  return getTasks().filter((t) => t.date === tomorrowStr());
}

export function getPriorityTasks(): Task[] {
  const order: Record<TaskPriority, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  return getTasks()
    .filter((t) => t.status !== "completed")
    .sort((a, b) => order[a.priority] - order[b.priority]);
}
