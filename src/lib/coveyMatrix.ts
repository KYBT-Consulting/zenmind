import { CoveyQuadrant } from '../types/mindmap';

export interface CoveyAttributes {
  urgent?: boolean;
  important?: boolean;
  quadrant?: CoveyQuadrant | null;
}

export interface CoveyQuadrantMeta {
  id: CoveyQuadrant;
  code: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  roman: 'I' | 'II' | 'III' | 'IV';
  name: string;
  coveyTheme: string;
  actionLabel: string;
  axisLabel: string;
  urgent: boolean;
  important: boolean;
  description: string;
  svgFill: string;
  bgClass: string;
  textClass: string;
  borderClass: string;
  solidBgClass: string;
  headerBgClass: string;
  ringClass: string;
}

export const COVEY_QUADRANTS: readonly CoveyQuadrantMeta[] = [
  {
    id: 1,
    code: 'Q1',
    roman: 'I',
    name: 'Quadrant I',
    coveyTheme: 'Necessity',
    actionLabel: 'Do First',
    axisLabel: 'Urgent & Important',
    urgent: true,
    important: true,
    description: 'Crises, pressing problems, deadline-driven deliverables',
    svgFill: '#e11d48',
    bgClass: 'bg-rose-50',
    textClass: 'text-rose-700',
    borderClass: 'border-rose-200',
    solidBgClass: 'bg-rose-600',
    headerBgClass: 'bg-rose-50/80',
    ringClass: 'ring-rose-400/30',
  },
  {
    id: 2,
    code: 'Q2',
    roman: 'II',
    name: 'Quadrant II',
    coveyTheme: 'Effectiveness',
    actionLabel: 'Schedule & Focus',
    axisLabel: 'Not Urgent & Important',
    urgent: false,
    important: true,
    description: 'Prevention, capability building, strategic planning, relationships',
    svgFill: '#0d9488',
    bgClass: 'bg-teal-50',
    textClass: 'text-teal-700',
    borderClass: 'border-teal-200',
    solidBgClass: 'bg-teal-600',
    headerBgClass: 'bg-teal-50/80',
    ringClass: 'ring-teal-400/30',
  },
  {
    id: 3,
    code: 'Q3',
    roman: 'III',
    name: 'Quadrant III',
    coveyTheme: 'Distraction',
    actionLabel: 'Delegate',
    axisLabel: 'Urgent & Not Important',
    urgent: true,
    important: false,
    description: 'Interruptions, ad-hoc requests, routine calls & status meetings',
    svgFill: '#d97706',
    bgClass: 'bg-amber-50',
    textClass: 'text-amber-700',
    borderClass: 'border-amber-200',
    solidBgClass: 'bg-amber-500',
    headerBgClass: 'bg-amber-50/80',
    ringClass: 'ring-amber-400/30',
  },
  {
    id: 4,
    code: 'Q4',
    roman: 'IV',
    name: 'Quadrant IV',
    coveyTheme: 'Waste',
    actionLabel: 'Eliminate',
    axisLabel: 'Not Urgent & Not Important',
    urgent: false,
    important: false,
    description: 'Trivia, busywork, time wasters, unfocused activity',
    svgFill: '#64748b',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    borderClass: 'border-slate-300',
    solidBgClass: 'bg-slate-600',
    headerBgClass: 'bg-slate-100/80',
    ringClass: 'ring-slate-400/30',
  },
];

export function isValidCoveyQuadrant(val: unknown): val is CoveyQuadrant {
  return val === 1 || val === 2 || val === 3 || val === 4;
}

export function getCoveyQuadrantMeta(quadrant: CoveyQuadrant): CoveyQuadrantMeta {
  return COVEY_QUADRANTS[quadrant - 1];
}

export function axesToQuadrant(urgent: boolean, important: boolean): CoveyQuadrant {
  if (urgent && important) return 1;
  if (!urgent && important) return 2;
  if (urgent && !important) return 3;
  return 4;
}

/**
 * Resolves a node's normalized Urgency, Importance, and Quadrant (1..4) from raw node data.
 * Nodes without explicit Covey attributes resolve to `{ quadrant: null }` (unassigned), never Q4.
 */
export function resolveCoveyAttributes(
  data?: { urgent?: unknown; important?: unknown; quadrant?: unknown } | null
): { urgent?: boolean; important?: boolean; quadrant: CoveyQuadrant | null } {
  if (!data || typeof data !== 'object') {
    return { quadrant: null };
  }

  const hasUrgent = typeof data.urgent === 'boolean';
  const hasImportant = typeof data.important === 'boolean';

  if (hasUrgent || hasImportant) {
    const urgent = hasUrgent ? (data.urgent as boolean) : false;
    const important = hasImportant ? (data.important as boolean) : false;
    return {
      urgent,
      important,
      quadrant: axesToQuadrant(urgent, important),
    };
  }

  if (isValidCoveyQuadrant(data.quadrant)) {
    const meta = getCoveyQuadrantMeta(data.quadrant);
    return {
      urgent: meta.urgent,
      important: meta.important,
      quadrant: meta.id,
    };
  }

  return { quadrant: null };
}

export function resolveCoveyQuadrant(
  data?: { urgent?: unknown; important?: unknown; quadrant?: unknown } | null
): CoveyQuadrant | null {
  return resolveCoveyAttributes(data).quadrant;
}

/**
 * Computes a clean `node.data` patch when updating either `quadrant` directly or individual
 * `urgent` / `important` axis attributes. Keeps `urgent`, `important`, and `quadrant` in sync.
 */
export function computeCoveyDataPatch(
  current?: { urgent?: unknown; important?: unknown; quadrant?: unknown } | null,
  update?: { urgent?: boolean | null; important?: boolean | null; quadrant?: CoveyQuadrant | null }
): {
  urgent: boolean | undefined;
  important: boolean | undefined;
  quadrant: CoveyQuadrant | undefined;
} {
  if (!update) {
    const resolved = resolveCoveyAttributes(current);
    if (!resolved.quadrant) {
      return { urgent: undefined, important: undefined, quadrant: undefined };
    }
    return {
      urgent: resolved.urgent,
      important: resolved.important,
      quadrant: resolved.quadrant,
    };
  }

  if ('quadrant' in update) {
    if (!update.quadrant || !isValidCoveyQuadrant(update.quadrant)) {
      return { urgent: undefined, important: undefined, quadrant: undefined };
    }
    const meta = getCoveyQuadrantMeta(update.quadrant);
    return {
      urgent: meta.urgent,
      important: meta.important,
      quadrant: meta.id,
    };
  }

  const base = resolveCoveyAttributes(current);
  const nextUrgentRaw = 'urgent' in update ? update.urgent : base.urgent;
  const nextImportantRaw = 'important' in update ? update.important : base.important;

  if (nextUrgentRaw == null && nextImportantRaw == null) {
    return { urgent: undefined, important: undefined, quadrant: undefined };
  }

  const urgent = Boolean(nextUrgentRaw);
  const important = Boolean(nextImportantRaw);
  return {
    urgent,
    important,
    quadrant: axesToQuadrant(urgent, important),
  };
}

/** Concise canvas tag pill label for an assigned Covey quadrant. */
export function formatCoveyCanvasBadge(quadrant: CoveyQuadrant | null | undefined): string {
  if (!quadrant || !isValidCoveyQuadrant(quadrant)) return '';
  const meta = getCoveyQuadrantMeta(quadrant);
  return `${meta.code} · ${meta.axisLabel}`;
}

export interface CoveyMatrixGrouping<T> {
  quadrants: Record<CoveyQuadrant, T[]>;
  unassigned: T[];
  counts: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
    assigned: number;
    unassigned: number;
  };
}

/**
 * Partitions extracted mind map items into Quadrants I–IV and an Unassigned triage list.
 * Pure structural first-level branch headers (with children and no task/date/quadrant metadata)
 * are omitted from the unassigned queue so only actionable topics appear for triage.
 */
export function groupItemsByCoveyQuadrant<
  T extends {
    depth: number;
    hasChildren: boolean;
    progress: number | null;
    priority: number | null;
    startDate?: string;
    endDate?: string;
    quadrant: CoveyQuadrant | null;
  },
>(items: T[]): CoveyMatrixGrouping<T> {
  const quadrants: Record<CoveyQuadrant, T[]> = {
    1: [],
    2: [],
    3: [],
    4: [],
  };
  const unassigned: T[] = [];

  for (const item of items) {
    if (item.quadrant && isValidCoveyQuadrant(item.quadrant)) {
      quadrants[item.quadrant].push(item);
      continue;
    }
    // Skip pure structural top-level branch headers that already contain children
    if (
      item.depth === 1 &&
      item.hasChildren &&
      item.progress === null &&
      item.priority === null &&
      !item.startDate &&
      !item.endDate
    ) {
      continue;
    }
    unassigned.push(item);
  }

  const q1 = quadrants[1].length;
  const q2 = quadrants[2].length;
  const q3 = quadrants[3].length;
  const q4 = quadrants[4].length;

  return {
    quadrants,
    unassigned,
    counts: {
      q1,
      q2,
      q3,
      q4,
      assigned: q1 + q2 + q3 + q4,
      unassigned: unassigned.length,
    },
  };
}
