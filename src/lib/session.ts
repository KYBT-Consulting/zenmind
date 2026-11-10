/**
 * What the app remembers about open tabs between launches.
 *
 * The cache is only for work that exists nowhere else: map content is stored just for
 * tabs with unsaved changes (crash/close recovery). A tab whose file is saved is
 * remembered by path and reopened from disk on the next launch, so edits made to the
 * file elsewhere (another device, a sync folder, another app) are always picked up.
 */

export interface SessionTabState {
  title: string;
  savedTitle: string;
  filePath?: string;
  dirty: boolean;
  savedJson: string | null;
  /** Fingerprint of the file as last read or written; the base the unsaved edits started from */
  diskFingerprint?: string;
}

export interface PersistedTab {
  title: string;
  savedTitle: string;
  filePath?: string;
  /** Present only for tabs with unsaved changes */
  data?: unknown;
  savedJson?: string | null;
  dirty?: boolean;
  diskFingerprint?: string;
}

export type RestoreEntry =
  | {
      kind: 'cache';
      title: string;
      savedTitle: string;
      filePath?: string;
      data: any;
      savedJson: string | null;
      dirty: boolean;
      diskFingerprint?: string;
    }
  | { kind: 'disk'; title: string; filePath: string };

/** Title for cached unsaved edits that no longer match their file on disk */
export const recoveredTitle = (title: string) => `${title} - recovered`;

/**
 * Compare the file on disk now with the version the cached unsaved edits started from.
 * - `unchanged`: safe to keep the edits attached to the file
 * - `changed`: the file was edited elsewhere (or the base is unknown): open both
 * - `missing`: the file can't be read: keep the edits as a recovered copy
 */
export function detectConflict(
  cachedBase: string | undefined,
  diskNow: string | null
): 'unchanged' | 'changed' | 'missing' {
  if (diskNow === null) return 'missing';
  return cachedBase !== undefined && cachedBase === diskNow ? 'unchanged' : 'changed';
}

export const hasUnsavedChanges = (t: Pick<SessionTabState, 'dirty' | 'title' | 'savedTitle'>) =>
  t.dirty || t.title !== t.savedTitle;

/**
 * Opening a file that is already open in a tab:
 * - `focus`: the file is unchanged since the tab read or saved it; switch to the tab (edits kept)
 * - `reload`: the file changed elsewhere and the tab has no unsaved edits; show the new content
 * - `confirm`: the file changed and the tab has unsaved edits; ask before replacing them
 */
export function decideReopen(
  tab: Pick<SessionTabState, 'dirty' | 'title' | 'savedTitle' | 'diskFingerprint'>,
  diskNow: string | undefined
): 'focus' | 'reload' | 'confirm' {
  if (diskNow !== undefined && tab.diskFingerprint === diskNow) return 'focus';
  return hasUnsavedChanges(tab) ? 'confirm' : 'reload';
}

/**
 * Session entry for one tab, or null when there is nothing worth remembering
 * (a saved-to-nowhere tab without edits). `getData` is only called when needed.
 */
export function toPersistedTab(t: SessionTabState, getData: () => unknown): PersistedTab | null {
  if (hasUnsavedChanges(t)) {
    return {
      title: t.title,
      savedTitle: t.savedTitle,
      filePath: t.filePath,
      data: getData(),
      savedJson: t.savedJson,
      dirty: t.dirty,
      diskFingerprint: t.diskFingerprint,
    };
  }
  if (t.filePath) {
    return { title: t.title, savedTitle: t.savedTitle, filePath: t.filePath };
  }
  return null;
}

const isMapData = (d: any) => !!d && typeof d === 'object' && !!(d.root || d.data);

/**
 * Decide how to bring back each remembered tab. Also handles sessions written by
 * older versions, which cached every tab's content: a clean, file-backed tab from
 * such a session is reopened from disk rather than from its stale copy.
 */
export function planRestore(rawTabs: unknown): RestoreEntry[] {
  if (!Array.isArray(rawTabs)) return [];
  const plan: RestoreEntry[] = [];
  for (const t of rawTabs as any[]) {
    if (!t || typeof t !== 'object') continue;
    const title = typeof t.title === 'string' && t.title ? t.title : 'Untitled Mind Map';
    const savedTitle = typeof t.savedTitle === 'string' ? t.savedTitle : title;
    const filePath = typeof t.filePath === 'string' && t.filePath ? t.filePath : undefined;
    const dirty = !!t.dirty;
    const unsaved = hasUnsavedChanges({ dirty, title, savedTitle });

    if (unsaved && isMapData(t.data)) {
      plan.push({
        kind: 'cache',
        title,
        savedTitle,
        filePath,
        data: t.data,
        savedJson: typeof t.savedJson === 'string' ? t.savedJson : null,
        dirty,
        diskFingerprint: typeof t.diskFingerprint === 'string' ? t.diskFingerprint : undefined,
      });
    } else if (filePath) {
      plan.push({ kind: 'disk', title: savedTitle, filePath });
    }
    // else: a clean tab with no file behind it; nothing to recover
  }
  return plan;
}
