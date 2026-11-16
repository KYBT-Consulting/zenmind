import { PriorityLevel, ProgressLevel } from '../types/mindmap';
import { stripHtml } from './utils';

export interface TaskDateInfo {
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
}

export type TaskDateStatus = 'completed' | 'overdue' | 'today' | 'upcoming' | 'scheduled' | null;

export interface TaskItem {
  uid: string;
  text: string;
  branchUid: string;
  branchTitle: string;
  parentUid: string;
  parentText?: string;
  depth: number;
  priority: PriorityLevel | null;
  progress: ProgressLevel | null;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  tags: string[];
  note: string;
  fillColor?: string;
  hasChildren: boolean;
}

export interface KanbanColumn {
  uid: string;
  title: string;
  fillColor?: string;
  borderColor?: string;
  cards: TaskItem[];
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^(?:[01]\d|2[0-3]):[0-5]\d$/;

export function isValidDateString(val?: string | null): val is string {
  if (!val || typeof val !== 'string' || !DATE_RE.test(val)) return false;
  const [y, m, d] = val.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d;
}

export function isValidTimeString(val?: string | null): val is string {
  if (!val || typeof val !== 'string') return false;
  return TIME_RE.test(val);
}

/** Returns local YYYY-MM-DD string for a Date object (defaults to current local date). */
export function getTodayDateString(now: Date = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Adds `days` to a YYYY-MM-DD string and returns the resulting YYYY-MM-DD string. */
export function addDaysToDateString(dateStr: string, days: number): string {
  if (!isValidDateString(dateStr)) return getTodayDateString();
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d + days);
  return getTodayDateString(dt);
}

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];
const SHORT_DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const FULL_DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export function formatShortDate(dateStr?: string, referenceYear?: number): string {
  if (!isValidDateString(dateStr)) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const currentYear = referenceYear ?? new Date().getFullYear();
  const monthName = SHORT_MONTHS[m - 1] || '';
  if (y !== currentYear) {
    return `${monthName} ${d}, ${y}`;
  }
  return `${monthName} ${d}`;
}

export function formatFullDateHeading(dateStr: string): string {
  if (!isValidDateString(dateStr)) return dateStr;
  const [y, m, d] = dateStr.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dayName = FULL_DAYS[dt.getDay()];
  const monthName = FULL_MONTHS[m - 1];
  return `${dayName}, ${monthName} ${d}, ${y}`;
}

export function getWeekDatesAround(
  centerDateStr: string,
  todayStr: string = getTodayDateString()
): { dateStr: string; dayName: string; dayNum: number; monthShort: string; isToday: boolean }[] {
  const base = isValidDateString(centerDateStr) ? centerDateStr : todayStr;
  const [y, m, d] = base.split('-').map(Number);
  const centerDate = new Date(y, m - 1, d);
  // Start on Monday of the week containing centerDate (or Sunday if Sunday)
  const dayOfWeek = centerDate.getDay(); // 0=Sun..6=Sat
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const result = [];
  for (let i = 0; i < 7; i++) {
    const dt = new Date(y, m - 1, d + mondayOffset + i);
    const ds = getTodayDateString(dt);
    result.push({
      dateStr: ds,
      dayName: SHORT_DAYS[dt.getDay()],
      dayNum: dt.getDate(),
      monthShort: SHORT_MONTHS[dt.getMonth()],
      isToday: ds === todayStr,
    });
  }
  return result;
}

/** Formats a concise human-readable date & time label for canvas node badges and UI pills. */
export function formatTaskDateBadge(dates: TaskDateInfo, referenceYear?: number): string {
  const start = isValidDateString(dates.startDate) ? dates.startDate : undefined;
  const end = isValidDateString(dates.endDate) ? dates.endDate : undefined;
  const startTime = isValidTimeString(dates.startTime) ? dates.startTime : undefined;
  const endTime = isValidTimeString(dates.endTime) ? dates.endTime : undefined;

  const timePart =
    startTime && endTime
      ? `${startTime}–${endTime}`
      : startTime
      ? startTime
      : endTime
      ? `by ${endTime}`
      : '';

  if (start && end) {
    if (start === end) {
      const dateLabel = formatShortDate(start, referenceYear);
      return timePart ? `${dateLabel} · ${timePart}` : dateLabel;
    }
    const startLabel = formatShortDate(start, referenceYear);
    const endLabel = formatShortDate(end, referenceYear);
    return timePart ? `${startLabel} → ${endLabel} · ${timePart}` : `${startLabel} → ${endLabel}`;
  }

  if (start) {
    const startLabel = formatShortDate(start, referenceYear);
    return timePart ? `${startLabel} · ${timePart}` : `From ${startLabel}`;
  }

  if (end) {
    const endLabel = formatShortDate(end, referenceYear);
    return timePart ? `Due ${endLabel} · ${timePart}` : `Due ${endLabel}`;
  }

  if (timePart) {
    return timePart;
  }

  return '';
}

/** Determines the schedule urgency/completion status of a task. */
export function getTaskDateStatus(
  dates: TaskDateInfo,
  progress?: number | null,
  todayStr: string = getTodayDateString()
): TaskDateStatus {
  const start = isValidDateString(dates.startDate) ? dates.startDate : undefined;
  const end = isValidDateString(dates.endDate) ? dates.endDate : undefined;
  const hasTime = isValidTimeString(dates.startTime) || isValidTimeString(dates.endTime);

  if (!start && !end && !hasTime) return null;
  if (progress === 100) return 'completed';

  const effectiveEnd = end || start;
  const effectiveStart = start || end;

  if (effectiveEnd && effectiveEnd < todayStr) {
    return 'overdue';
  }

  if (effectiveStart && effectiveEnd && effectiveStart <= todayStr && todayStr <= effectiveEnd) {
    return 'today';
  }

  if (effectiveEnd === todayStr || effectiveStart === todayStr) {
    return 'today';
  }

  const threeDaysOut = addDaysToDateString(todayStr, 3);
  if (effectiveStart && effectiveStart <= threeDaysOut) {
    return 'upcoming';
  }
  if (effectiveEnd && effectiveEnd <= threeDaysOut) {
    return 'upcoming';
  }

  return 'scheduled';
}

export function getTaskDateBadgeColors(status: TaskDateStatus): {
  svgFill: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  label: string;
} {
  switch (status) {
    case 'completed':
      return {
        svgFill: '#059669',
        bgClass: 'bg-emerald-50',
        textClass: 'text-emerald-700',
        borderClass: 'border-emerald-200',
        label: 'Completed',
      };
    case 'overdue':
      return {
        svgFill: '#e11d48',
        bgClass: 'bg-rose-50',
        textClass: 'text-rose-700',
        borderClass: 'border-rose-200',
        label: 'Overdue',
      };
    case 'today':
      return {
        svgFill: '#d97706',
        bgClass: 'bg-amber-50',
        textClass: 'text-amber-700',
        borderClass: 'border-amber-200',
        label: 'Due Today',
      };
    case 'upcoming':
      return {
        svgFill: '#4f46e5',
        bgClass: 'bg-indigo-50',
        textClass: 'text-indigo-700',
        borderClass: 'border-indigo-200',
        label: 'Upcoming',
      };
    default:
      return {
        svgFill: '#0284c7',
        bgClass: 'bg-sky-50',
        textClass: 'text-sky-700',
        borderClass: 'border-sky-200',
        label: 'Scheduled',
      };
  }
}

/** True when `targetDateStr` falls on or between the task's startDate and endDate. */
export function isTaskOnDate(dates: TaskDateInfo, targetDateStr: string): boolean {
  if (!isValidDateString(targetDateStr)) return false;
  const start = isValidDateString(dates.startDate) ? dates.startDate : undefined;
  const end = isValidDateString(dates.endDate) ? dates.endDate : undefined;

  if (start && end) {
    const min = start <= end ? start : end;
    const max = start <= end ? end : start;
    return min <= targetDateStr && targetDateStr <= max;
  }
  if (start) return start === targetDateStr;
  if (end) return end === targetDateStr;
  return false;
}

/** Parses HH:mm to minutes since midnight (0..1439). Returns null if invalid. */
export function parseTimeToMinutes(time?: string | null): number | null {
  if (!isValidTimeString(time)) return null;
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

/** Formats minutes since midnight (0..1439) to HH:mm. */
export function minutesToTimeString(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, Math.round(totalMinutes)));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function parsePriorityFromIcons(icons: any[]): PriorityLevel | null {
  if (!Array.isArray(icons)) return null;
  const p = icons.find((i) => typeof i === 'string' && i.startsWith('priority_'));
  if (!p) return null;
  const num = parseInt(p.replace('priority_', ''), 10);
  return num >= 1 && num <= 5 ? (num as PriorityLevel) : null;
}

function parseProgressFromIcons(icons: any[]): ProgressLevel | null {
  if (!Array.isArray(icons)) return null;
  const p = icons.find((i) => typeof i === 'string' && i.startsWith('progress_'));
  if (!p) return null;
  const num = parseInt(p.replace('progress_', ''), 10);
  return [0, 25, 50, 75, 100].includes(num) ? (num as ProgressLevel) : null;
}

function extractNodeTaskItem(
  node: any,
  branchUid: string,
  branchTitle: string,
  parentUid: string,
  parentText: string | undefined,
  depth: number
): TaskItem | null {
  const data = node?.data;
  if (!data || !data.uid) return null;
  const icons = Array.isArray(data.icon) ? data.icon : [];
  const rawTags = Array.isArray(data.tag) ? data.tag : [];
  const tags = rawTags
    .map((t: any) => (typeof t === 'string' ? t : t?.text || ''))
    .filter(Boolean);

  return {
    uid: data.uid,
    text: stripHtml(data.text || '') || '(Untitled Topic)',
    branchUid,
    branchTitle,
    parentUid,
    parentText,
    depth,
    priority: parsePriorityFromIcons(icons),
    progress: parseProgressFromIcons(icons),
    startDate: isValidDateString(data.startDate) ? data.startDate : undefined,
    endDate: isValidDateString(data.endDate) ? data.endDate : undefined,
    startTime: isValidTimeString(data.startTime) ? data.startTime : undefined,
    endTime: isValidTimeString(data.endTime) ? data.endTime : undefined,
    tags,
    note: data.note || '',
    fillColor: data.fillColor,
    hasChildren: Array.isArray(node.children) && node.children.length > 0,
  };
}

/**
 * Extracts first-level branches as Kanban columns and their descendants as cards.
 */
export function extractKanbanColumns(treeData: any): KanbanColumn[] {
  const root = treeData?.root ?? treeData;
  if (!root || !Array.isArray(root.children)) return [];

  const columns: KanbanColumn[] = [];

  for (const branch of root.children) {
    const branchData = branch?.data || {};
    if (!branchData.uid) continue;
    const branchTitle = stripHtml(branchData.text || '') || '(Untitled Branch)';
    const cards: TaskItem[] = [];

    const walkChildren = (children: any[], parentUid: string, parentLabel: string | undefined, depth: number) => {
      if (!Array.isArray(children)) return;
      for (const child of children) {
        const item = extractNodeTaskItem(child, branchData.uid, branchTitle, parentUid, parentLabel, depth);
        if (item) {
          cards.push(item);
        }
        if (Array.isArray(child.children) && child.children.length > 0) {
          const childText = stripHtml(child?.data?.text || '') || '(Untitled Topic)';
          walkChildren(child.children, child?.data?.uid || parentUid, childText, depth + 1);
        }
      }
    };

    walkChildren(branch.children || [], branchData.uid, undefined, 2);

    columns.push({
      uid: branchData.uid,
      title: branchTitle,
      fillColor: branchData.fillColor,
      borderColor: branchData.borderColor,
      cards,
    });
  }

  return columns;
}

/**
 * Extracts all non-root topics across the map (including first-level branches and deeper descendants)
 * so the Daily Planner can display any node that has dates or can be scheduled.
 */
export function extractAllTasks(treeData: any): TaskItem[] {
  const root = treeData?.root ?? treeData;
  if (!root || !Array.isArray(root.children)) return [];

  const rootUid = root.data?.uid || 'root';
  const items: TaskItem[] = [];

  for (const branch of root.children) {
    const branchData = branch?.data || {};
    if (!branchData.uid) continue;
    const branchTitle = stripHtml(branchData.text || '') || '(Untitled Branch)';

    const branchItem = extractNodeTaskItem(branch, branchData.uid, branchTitle, rootUid, undefined, 1);
    if (branchItem) {
      items.push(branchItem);
    }

    const walkChildren = (children: any[], parentUid: string, parentLabel: string | undefined, depth: number) => {
      if (!Array.isArray(children)) return;
      for (const child of children) {
        const item = extractNodeTaskItem(child, branchData.uid, branchTitle, parentUid, parentLabel, depth);
        if (item) {
          items.push(item);
        }
        if (Array.isArray(child.children) && child.children.length > 0) {
          const childText = stripHtml(child?.data?.text || '') || '(Untitled Topic)';
          walkChildren(child.children, child?.data?.uid || parentUid, childText, depth + 1);
        }
      }
    };

    walkChildren(branch.children || [], branchData.uid, branchTitle, 2);
  }

  return items;
}
