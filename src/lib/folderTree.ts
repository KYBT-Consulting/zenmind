export interface FolderNodeData {
  data: {
    text: string;
    expand?: boolean;
    hyperlink?: string;
    tag?: string[];
    note?: string;
  };
  children?: FolderNodeData[];
}

/** Folder names that are never worth mapping. */
export const IGNORED_NAMES = new Set([
  'node_modules',
  '.git',
  '.svn',
  '.vscode',
  '.idea',
  'dist',
  'build',
  'target',
  '.tauri',
  'coverage',
  '.DS_Store',
]);

/** Largest number of files/folders that go into one imported map. */
export const MAX_FOLDER_ENTRIES = 5000;

/** Joins a child name onto a native path using the separator that path already uses. */
export function joinNativePath(parent: string, name: string): string {
  const sep = parent.includes('\\') && !parent.includes('/') ? '\\' : '/';
  return parent.endsWith(sep) ? `${parent}${name}` : `${parent}${sep}${name}`;
}

/**
 * Builds a map from `root/a/b.txt`-style relative paths (the browser's directory picker).
 * Stops adding topics after `maxEntries` and reports that it did.
 */
export function buildTreeFromRelativePaths(
  relativePaths: string[],
  maxEntries = MAX_FOLDER_ENTRIES
): { root: FolderNodeData; rootName: string; truncated: boolean } {
  const rootName = relativePaths[0]?.split('/')[0] || 'Imported Folder';
  const root: FolderNodeData = {
    data: { text: `📁 ${rootName}`, expand: true, tag: ['Directory Map'] },
    children: [],
  };
  const byPath = new Map<string, FolderNodeData>([['', root]]);
  let count = 0;
  let truncated = false;

  outer: for (const relativePath of relativePaths) {
    const parts = relativePath.split('/');
    parts.shift(); // drop the picked folder's own name

    let current = '';
    for (let p = 0; p < parts.length; p++) {
      const part = parts[p];
      if (IGNORED_NAMES.has(part)) break;

      const isFile = p === parts.length - 1;
      const next = current ? `${current}/${part}` : part;

      if (!byPath.has(next)) {
        if (count >= maxEntries) {
          truncated = true;
          break outer;
        }
        count++;
        const node: FolderNodeData = {
          data: { text: isFile ? `📄 ${part}` : `📁 ${part}`, expand: p < 2 },
          children: isFile ? undefined : [],
        };
        const parent = byPath.get(current)!;
        (parent.children ??= []).push(node);
        byPath.set(next, node);
      }
      current = next;
    }
  }
  return { root, rootName, truncated };
}
