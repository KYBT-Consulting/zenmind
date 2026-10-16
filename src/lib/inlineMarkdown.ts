export interface HighlightTint {
  id: string;
  label: string;
  bg: string;
  text: string;
}

export const HIGHLIGHT_TINTS: HighlightTint[] = [
  { id: 'yellow', label: 'Sunny Yellow', bg: '#fef08a', text: '#1e293b' },
  { id: 'mint', label: 'Mint Green', bg: '#bbf7d0', text: '#064e3b' },
  { id: 'sky', label: 'Sky Blue', bg: '#bae6fd', text: '#0c4a6e' },
  { id: 'rose', label: 'Rose Pink', bg: '#fecdd3', text: '#881337' },
  { id: 'lavender', label: 'Lavender', bg: '#ddd6fe', text: '#4c1d95' },
];

export type CalloutType = 'NOTE' | 'TIP' | 'IMPORTANT' | 'WARNING' | 'CAUTION';

export interface CalloutPreset {
  type: CalloutType;
  label: string;
  badgeBg: string;
  badgeText: string;
  nodeFill: string;
  nodeBorder: string;
  nodeText: string;
}

export const CALLOUT_PRESETS: CalloutPreset[] = [
  {
    type: 'NOTE',
    label: 'Note',
    badgeBg: '#dbeafe',
    badgeText: '#1d4ed8',
    nodeFill: '#eff6ff',
    nodeBorder: '#3b82f6',
    nodeText: '#1e3a8a',
  },
  {
    type: 'TIP',
    label: 'Tip',
    badgeBg: '#d1fae5',
    badgeText: '#047857',
    nodeFill: '#ecfdf5',
    nodeBorder: '#10b981',
    nodeText: '#065f46',
  },
  {
    type: 'IMPORTANT',
    label: 'Important',
    badgeBg: '#ede9fe',
    badgeText: '#6d28d9',
    nodeFill: '#f5f3ff',
    nodeBorder: '#8b5cf6',
    nodeText: '#4c1d95',
  },
  {
    type: 'WARNING',
    label: 'Warning',
    badgeBg: '#fef3c7',
    badgeText: '#b45309',
    nodeFill: '#fffbeb',
    nodeBorder: '#f59e0b',
    nodeText: '#78350f',
  },
  {
    type: 'CAUTION',
    label: 'Caution',
    badgeBg: '#ffe4e6',
    badgeText: '#be123c',
    nodeFill: '#fff1f2',
    nodeBorder: '#f43f5e',
    nodeText: '#881337',
  },
];

function renderCalloutBadgeHtml(type: CalloutType): string {
  const preset = CALLOUT_PRESETS.find((c) => c.type === type) || CALLOUT_PRESETS[0];
  return `<span data-zenmind-callout="${preset.type}" style="background-color:${preset.badgeBg};color:${preset.badgeText};padding:1px 6px;border-radius:4px;font-weight:bold;font-size:11px;">[${preset.type}]</span>`;
}

/**
 * Transforms inline Markdown syntax inside text segments of HTML (leaving HTML tags intact):
 * - `**bold**` -> `<strong>bold</strong>`
 * - `*italic*` -> `<em>italic</em>`
 * - `` `code` `` -> `<code ...>code</code>`
 * - `~~strike~~` -> `<s>strike</s>`
 * - `==highlight==` -> `<span style="background-color:#fef08a;...">highlight</span>`
 * - `[!NOTE]`, `[!TIP]`, `[!IMPORTANT]`, `[!WARNING]`, `[!CAUTION]` -> styled callout badge
 */
export function applyInlineMarkdown(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // Split by HTML tags so we only transform text nodes, never attributes inside tags
  const parts = html.split(/(<[^>]+>)/g);
  let insideCodeTag = 0;

  return parts
    .map((segment) => {
      if (segment.startsWith('<') && segment.endsWith('>')) {
        const lower = segment.toLowerCase();
        if (lower.startsWith('<code')) insideCodeTag++;
        else if (lower.startsWith('</code')) insideCodeTag = Math.max(0, insideCodeTag - 1);
        return segment;
      }
      if (insideCodeTag > 0 || !segment) return segment;

      let out = segment;

      // Callout shortcodes: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
      out = out.replace(
        /\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]/gi,
        (_m, kind: string) => renderCalloutBadgeHtml(kind.toUpperCase() as CalloutType)
      );

      // Inline code: `code`
      out = out.replace(
        /`([^`\n]+)`/g,
        '<code style="background-color:rgba(15,23,42,0.08);padding:1px 4px;border-radius:4px;font-family:monospace;">$1</code>'
      );

      // Bold: **bold**
      out = out.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');

      // Italic: *italic* (not preceded/followed by *)
      out = out.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

      // Strikethrough: ~~strike~~
      out = out.replace(/~~([^~\n]+)~~/g, '<s>$1</s>');

      // Highlighter: ==highlight==
      out = out.replace(
        /==([^=\n]+)==/g,
        '<span data-zenmind-highlight="yellow" style="background-color:#fef08a;color:#1e293b;padding:0 3px;border-radius:3px;">$1</span>'
      );

      return out;
    })
    .join('');
}

/**
 * Applies (or clears when `tint` is null) a highlighter background tint on the node's HTML content.
 */
export function applyTextHighlightTint(html: string, tint: HighlightTint | null): string {
  const raw = String(html || '');
  // Strip any previous full-node zenmind highlight wrapper
  const stripped = raw.replace(
    /<span[^>]*data-zenmind-highlight="[^"]*"[^>]*>([\s\S]*?)<\/span>/gi,
    '$1'
  );
  if (!tint) return stripped;

  const spanOpen = `<span data-zenmind-highlight="${tint.id}" style="background-color:${tint.bg};color:${tint.text};padding:0 4px;border-radius:3px;">`;
  if (/^<p[^>]*>[\s\S]*<\/p>$/i.test(stripped.trim())) {
    return stripped.replace(/^<p([^>]*)>([\s\S]*)<\/p>$/i, `<p$1>${spanOpen}$2</span></p>`);
  }
  return `<p>${spanOpen}${stripped}</span></p>`;
}

/**
 * Extracts LaTeX formulas from a node's rich-text HTML (`ql-formula` data-value, `<annotation>`, or `$...$`).
 */
export function extractLatexFormulas(html: string): string[] {
  if (!html || typeof html !== 'string') return [];
  const formulas: string[] = [];

  // 1. data-value="..." on .ql-formula
  const dataValRegex = /class="[^"]*ql-formula[^"]*"[^>]*data-value="([^"]+)"/gi;
  let match: RegExpExecArray | null;
  while ((match = dataValRegex.exec(html)) !== null) {
    const decoded = match[1]
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"');
    if (decoded.trim() && !formulas.includes(decoded.trim())) {
      formulas.push(decoded.trim());
    }
  }

  // 2. <annotation encoding="application/x-tex">...</annotation>
  const annotationRegex = /<annotation[^>]*encoding="application\/x-tex"[^>]*>([\s\S]*?)<\/annotation>/gi;
  while ((match = annotationRegex.exec(html)) !== null) {
    const tex = match[1].trim();
    if (tex && !formulas.includes(tex)) {
      formulas.push(tex);
    }
  }

  // 3. Raw $...$ inline delimiters
  const rawDollarRegex = /\$([^$\n]+)\$/g;
  while ((match = rawDollarRegex.exec(html)) !== null) {
    const tex = match[1].trim();
    if (tex && !formulas.includes(tex)) {
      formulas.push(tex);
    }
  }

  return formulas;
}
