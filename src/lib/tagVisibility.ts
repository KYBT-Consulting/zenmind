/** Which badge and icon kinds the mind map canvas draws on topics. */
export interface TagVisibility {
  /** Covey quadrant badge (Q1–Q4). */
  quadrant: boolean;
  /** Start/end date badge. */
  date: boolean;
  /** User-defined tags, including callout badges. */
  custom: boolean;
  /** Priority icon (1–5). */
  priority: boolean;
  /** Progress icon (0–100%). */
  progress: boolean;
}

export const DEFAULT_TAG_VISIBILITY: TagVisibility = { quadrant: true, date: true, custom: true, priority: true, progress: true };

export const TAG_VISIBILITY_STORAGE_KEY = 'zenmind_tag_visibility';

export function loadTagVisibility(): TagVisibility {
  try {
    const raw = typeof localStorage !== 'undefined' ? localStorage.getItem(TAG_VISIBILITY_STORAGE_KEY) : null;
    if (!raw) return { ...DEFAULT_TAG_VISIBILITY };
    const parsed = JSON.parse(raw);
    return {
      quadrant: parsed?.quadrant !== false,
      date: parsed?.date !== false,
      custom: parsed?.custom !== false,
      priority: parsed?.priority !== false,
      progress: parsed?.progress !== false,
    };
  } catch {
    return { ...DEFAULT_TAG_VISIBILITY };
  }
}

export function saveTagVisibility(visibility: TagVisibility): void {
  try {
    localStorage.setItem(TAG_VISIBILITY_STORAGE_KEY, JSON.stringify(visibility));
  } catch {
    // ignore storage errors
  }
}

export function sameTagVisibility(a: TagVisibility, b: TagVisibility): boolean {
  return (Object.keys(DEFAULT_TAG_VISIBILITY) as (keyof TagVisibility)[]).every((k) => a[k] === b[k]);
}
