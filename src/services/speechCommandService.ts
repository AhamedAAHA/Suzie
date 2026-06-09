import { TaskPriority, TaskCategory } from "@/types/task";

export type CommandType =
  | "wake"
  | "brief_day"
  | "show_tasks"
  | "add_task"
  | "complete_task"
  | "tomorrow_plan"
  | "recommend"
  | "show_pending"
  | "unknown";

export interface ParsedTaskCommand {
  type: CommandType;
  taskTitle?: string;
  date?: string;
  time?: string;
  priority?: TaskPriority;
  category?: TaskCategory;
}

const WAKE_RE =
  /^(hey\s+)?(suzi?e?y?|susie?|susy|susee?)\s*[,.]?\s*/i;

export function stripWakePrefix(text: string): string {
  return text.replace(WAKE_RE, "").trim();
}

export function isJustWake(text: string): boolean {
  const stripped = stripWakePrefix(text.toLowerCase().trim());
  return stripped === "";
}

/** Normalize spoken nav phrases: "open the setting" → "open settings" */
export function normalizeVoiceNav(text: string): string {
  return stripWakePrefix(text.toLowerCase().trim())
    .replace(/\bthe\b/g, "")
    .replace(/\bsetting\b/g, "settings")
    .replace(/\bpreference\b/g, "preferences")
    .replace(/\bconfigurations?\b/g, "config")
    .replace(/\s+/g, " ")
    .trim();
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

function parseTime(text: string): string | undefined {
  const m = text.match(/(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i);
  if (!m) return undefined;
  let h = parseInt(m[1]);
  const min = m[2] ? parseInt(m[2]) : 0;
  const mer = m[3]?.toLowerCase();
  if (mer === "pm" && h !== 12) h += 12;
  if (mer === "am" && h === 12) h = 0;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

function parseDate(text: string): string {
  if (/tomorrow/i.test(text)) return tomorrowStr();
  return todayStr();
}

function parsePriority(text: string): TaskPriority | undefined {
  if (/critical|red level|urgent/i.test(text)) return "critical";
  if (/\bhigh\b|priority alpha|important/i.test(text)) return "high";
  if (/\bmedium\b/i.test(text)) return "medium";
  if (/\blow\b/i.test(text)) return "low";
  return undefined;
}

function parseCategory(text: string): TaskCategory {
  if (/linkedin/i.test(text)) return "linkedin";
  if (/project|demo/i.test(text)) return "project";
  if (/stud[yi]|learn/i.test(text)) return "study";
  if (/tomorrow plan|plan tomorrow/i.test(text)) return "tomorrow_plan";
  if (/global|risk|intel/i.test(text)) return "global";
  return "personal";
}

export function parseVoiceCommand(raw: string): ParsedTaskCommand {
  const lower = raw.toLowerCase().trim();
  const stripped = stripWakePrefix(lower);

  if (isJustWake(lower)) return { type: "wake" };

  if (/brief\s+(my\s+)?day|daily brief|good morning|morning brief/i.test(stripped)) {
    return { type: "brief_day" };
  }

  if (/plan\s+(my\s+)?tomorrow|tomorrow\s+plan|next.?day protocol/i.test(stripped)) {
    return { type: "tomorrow_plan" };
  }

  if (/show\s+(my\s+)?tasks?|show\s+operations?|mission\s+queue|task\s+list|open\s+tasks?/i.test(stripped)) {
    return { type: "show_tasks" };
  }

  if (/pending|awaiting\s+execution/i.test(stripped)) {
    return { type: "show_pending" };
  }

  if (/what\s+should\s+i\s+do|do\s+first|recommend|priority\s+task/i.test(stripped)) {
    return { type: "recommend" };
  }

  const completeMatch = stripped.match(
    /mark\s+(.+?)\s+(complete[d]?|done|executed?)/i
  );
  if (completeMatch) {
    return { type: "complete_task", taskTitle: completeMatch[1].trim() };
  }

  if (/add\s+(task|operation)|create\s+task|new\s+task|schedule\s+task/i.test(stripped)) {
    const date = parseDate(stripped);
    const time = parseTime(stripped);
    const priority = parsePriority(stripped);
    const category = parseCategory(stripped);
    const titleMatch = stripped.match(
      /(?:add\s+(?:task|operation)|schedule\s+task|create\s+task)[^:]*:\s*(.+?)(?:\s+at\s+\d|$)/i
    );
    const title = titleMatch?.[1]?.trim() ?? stripped;
    return { type: "add_task", taskTitle: title, date, time, priority, category };
  }

  return { type: "unknown" };
}
