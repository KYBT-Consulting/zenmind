/**
 * Stable string of a mind map's content, for dirty checks. Ignores state the canvas library adds
 * on its own after rendering or editing: `dir` (which side of the root a branch sits on) and
 * empty objects/arrays (e.g. `imgMap: {}`), so "absent" and "empty" compare equal.
 */
export function contentSignature(tree: unknown): string {
  return JSON.stringify(tree, function (this: unknown, key, value) {
    if (key === 'dir') return undefined;
    const isContainer = value !== null && typeof value === 'object';
    const isEmpty = Array.isArray(value) ? value.length === 0 : isContainer && Object.keys(value).length === 0;
    return isEmpty && !Array.isArray(this) && key !== '' ? undefined : value;
  });
}
