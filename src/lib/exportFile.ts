/** Pure helpers for turning export output into files. No Tauri or DOM side effects. */

export interface ExportFileType {
  /** Label shown in the native save dialog's file-type filter. */
  label: string;
  mime: string;
}

export const EXPORT_FILE_TYPES: Record<string, ExportFileType> = {
  png: { label: 'PNG Image', mime: 'image/png' },
  svg: { label: 'SVG Vector Image', mime: 'image/svg+xml' },
  pdf: { label: 'PDF Document', mime: 'application/pdf' },
  json: { label: 'JSON Tree', mime: 'application/json' },
  md: { label: 'Markdown Document', mime: 'text/markdown' },
  xmind: { label: 'XMind Archive', mime: 'application/vnd.xmind.workbook' },
  opml: { label: 'OPML Outline', mime: 'text/x-opml' },
  mm: { label: 'FreeMind Mind Map', mime: 'application/x-freemind' },
  zenmind: { label: 'ZenMind Mind Map', mime: 'application/json' },
};

export function exportFileType(ext: string): ExportFileType {
  return EXPORT_FILE_TYPES[ext] ?? { label: `${ext.toUpperCase()} File`, mime: 'application/octet-stream' };
}

/**
 * Make a document title safe to use as a file name. Titles can contain path separators
 * and characters that Windows rejects; on desktop a `/` would be read as a directory.
 */
export function toSafeFilename(title: string, fallback = 'mind-map'): string {
  const cleaned = title
    // eslint-disable-next-line no-control-regex
    .replace(/[\\/:*?"<>|\u0000-\u001f]+/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^[.\-\s]+|[.\s]+$/g, '');
  return cleaned || fallback;
}

/**
 * Convert export output to raw bytes. The mind-map exporters return `data:` URLs
 * (FileReader.readAsDataURL); the OPML/FreeMind/ZenMind exporters return plain text.
 */
export function exportContentToBytes(content: string): Uint8Array {
  const match = /^data:([^,]*?),/.exec(content);
  if (!match) return new TextEncoder().encode(content);

  const payload = content.slice(match[0].length);
  if (/;base64$/i.test(match[1])) {
    const binary = atob(payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  }
  return new TextEncoder().encode(decodeURIComponent(payload));
}
