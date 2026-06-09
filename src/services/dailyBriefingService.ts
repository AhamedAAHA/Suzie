import { Task } from "@/types/task";

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function tomorrowStr(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split("T")[0];
}

export function buildDailyBriefingText(userName: string, tasks: Task[]): string {
  const todayTasks = tasks.filter(
    (t) => t.date === todayStr() && t.status !== "completed"
  );
  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const critical = activeTasks.filter((t) => t.priority === "critical");
  const high = activeTasks.filter((t) => t.priority === "high");
  const tomorrowTasks = tasks.filter(
    (t) => t.date === tomorrowStr() && t.status !== "completed"
  );

  const now = new Date();
  const h = now.getHours();
  const greeting =
    h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
  const dayName = now.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = now.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  let text = `${greeting} ${userName}. `;
  text += `Today is ${dayName}, ${dateStr}. `;

  if (todayTasks.length === 0) {
    text += "No active operations detected for today. ";
  } else {
    text += `You have ${todayTasks.length} active operation${
      todayTasks.length > 1 ? "s" : ""
    } scheduled today. `;
  }

  if (critical.length > 0) {
    text += `${critical.length} operation${
      critical.length > 1 ? "s are" : " is"
    } at Red Level: ${critical.map((t) => t.title).join(", ")}. `;
  }

  if (high.length > 0) {
    text += `${high.length} Priority Alpha operation${
      high.length > 1 ? "s" : ""
    }: ${high.map((t) => t.title).join(", ")}. `;
  }

  if (tomorrowTasks.length > 0) {
    text += `${tomorrowTasks.length} operation${
      tomorrowTasks.length > 1 ? "s" : ""
    } queued for tomorrow. `;
  }

  const topTask = [...critical, ...high, ...todayTasks][0];
  if (topTask) {
    text += `Recommended first action: ${topTask.title}.`;
  }

  return text;
}

export function buildActivationGreeting(
  userName: string,
  tasks: Task[]
): string {
  const active = tasks.filter((t) => t.status !== "completed");
  const topFour = active.slice(0, 4);

  let text = `Hi ${userName}. SUZIE is online. `;

  if (active.length === 0) {
    text += "Your mission queue is clear. What do you need to know?";
  } else {
    text += `I can see ${active.length} active operation${
      active.length > 1 ? "s" : ""
    } in your mission queue`;
    if (topFour.length > 0) {
      text += `: ${topFour.map((t) => t.title).join(", ")}`;
    }
    text += ". What do you need to know?";
  }

  return text;
}

export function buildActivationTerminalLines(
  userName: string,
  tasks: Task[]
): string[] {
  const active = tasks.filter((t) => t.status !== "completed");
  const critical = active.filter((t) => t.priority === "critical");
  return [
    "[BOOT] SUZIE CORE INITIALIZED",
    `[VOICE] Identity confirmed: ${userName}`,
    "[MEMORY] Loading personal command list",
    `[TASKS] ${active.length} active operation${active.length !== 1 ? "s" : ""} detected`,
    ...(critical.length > 0
      ? [
          `[ALERT] ${critical.length} RED LEVEL operation${
            critical.length > 1 ? "s" : ""
          } require attention`,
        ]
      : []),
    "[SYSTEM] Awaiting user command",
  ];
}

export function buildTomorrowPlanText(
  userName: string,
  tasks: Task[]
): string {
  const tomorrowTasks = tasks.filter((t) => t.date === tomorrowStr());
  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const critical = activeTasks.filter((t) => t.priority === "critical");
  const high = activeTasks.filter((t) => t.priority === "high");

  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const dayName = tomorrowDate.toLocaleDateString("en-US", { weekday: "long" });
  const dateStr = tomorrowDate.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
  });

  let text = `${userName}, tomorrow's recommended protocol is ready. `;
  text += `${dayName}, ${dateStr}. `;

  if (tomorrowTasks.length > 0) {
    text += `${tomorrowTasks.length} operation${
      tomorrowTasks.length > 1 ? "s" : ""
    } scheduled for tomorrow. `;
  }

  if (critical.length > 0) {
    text += `Complete Red Level operations first: ${critical
      .map((t) => t.title)
      .join(", ")}. `;
  } else if (high.length > 0) {
    text += `Start with Priority Alpha operations: ${high
      .map((t) => t.title)
      .join(", ")}. `;
  }

  return text;
}

export function buildRecommendText(userName: string, tasks: Task[]): string {
  const order: Record<string, number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const active = tasks
    .filter((t) => t.status !== "completed")
    .sort((a, b) => order[a.priority] - order[b.priority]);

  if (active.length === 0) {
    return `No active operations detected, ${userName}. Your mission queue is clear.`;
  }

  const top = active[0];
  return `${userName}, I recommend starting with: ${top.title}. It is classified as ${
    top.priority === "critical"
      ? "Red Level"
      : top.priority === "high"
      ? "Priority Alpha"
      : "Priority Beta"
  } and is currently ${
    top.status === "pending" ? "awaiting execution" : "in progress"
  }.`;
}
