import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Strips HTML tags (e.g. <p>...</p>) and decodes common HTML entities to return clean plain text.
 */
export function stripHtml(input: string = ''): string {
  if (!input || typeof input !== 'string') return '';
  return input
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

const HTML_START = /^\s*<(p|div|span|br|b|i|u|s|strong|em|a|ul|ol|li|h[1-6]|sub|sup|code)[\s>/]/i;

/**
 * Plain text of a topic's text or note. Rich-text topics are stored as HTML and are stripped to
 * text; plain topics are returned as written, so a literal "<Co>" or "a < b" survives.
 */
export function toPlainText(value: string = '', isRich: boolean = false): string {
  if (!value || typeof value !== 'string') return '';
  return isRich || HTML_START.test(value) ? stripHtml(value) : value;
}
