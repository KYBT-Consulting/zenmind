/**
 * Turn a release body (markdown from CHANGELOG.md, see scripts/release-notes.sh) into
 * plain text for the in-app update notice: no markdown symbols, no redundant
 * "What's new in ZenMind vX" heading, and nothing after the footer divider (links and
 * credits are for the GitHub release page).
 */
export function releaseNotesToPlainText(markdown: string): string {
  const lines = markdown.split(/\r?\n/);
  const footer = lines.findIndex((l) => /^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(l));
  return (footer >= 0 ? lines.slice(0, footer) : lines)
    .filter((l) => !/^#{1,6}\s+What's new in ZenMind\b/i.test(l))
    .map((l) =>
      l
        .replace(/^#{1,6}\s+/, '') // headings
        .replace(/^>\s?/, '') // block quotes
        .replace(/^(\s*)[-*+]\s+/, '$1• ') // bullets
        .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links and images → their text
        .replace(/(\*\*|__)(.+?)\1/g, '$2') // bold
        .replace(/(^|[^*\w])[*_](\S(?:[^*_\n]*\S)?)[*_](?=[^*\w]|$)/g, '$1$2') // italics (no inner edge spaces)
        .replace(/`([^`]+)`/g, '$1') // inline code
    )
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
