/** Path helpers that work for both `/` and `\` separators (desktop paths from the OS dialogs). */

const lastSep = (path: string) => Math.max(path.lastIndexOf('/'), path.lastIndexOf('\\'));

/** File name with extension: `/a/b/Plan.zenmind` → `Plan.zenmind` */
export const fileNameOf = (path: string) => path.slice(lastSep(path) + 1);

/** File name without extension: `/a/b/Plan.v2.zenmind` → `Plan.v2` */
export const baseNameOf = (path: string) => fileNameOf(path).replace(/\.[^.]+$/, '') || fileNameOf(path);

/** Extension including the dot, lowercased: `.zenmind`, or `''` when there is none */
export const extensionOf = (path: string) => /\.[^./\\]+$/.exec(fileNameOf(path))?.[0].toLowerCase() ?? '';

/** A file name in the same folder as `path`: (`/a/Plan.md`, `Plan.zenmind`) → `/a/Plan.zenmind` */
export const siblingPath = (path: string, fileName: string) => path.slice(0, lastSep(path) + 1) + fileName;

/**
 * Formats Save writes natively. Other formats (.md, .xmind, .opml, .mm) are imports:
 * saving them in place would replace the file with ZenMind JSON.
 */
export const isZenMindPath = (path: string) => ['.zenmind', '.json'].includes(extensionOf(path));
