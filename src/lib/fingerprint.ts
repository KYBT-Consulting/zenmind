/**
 * Fast, stable fingerprint of a file's raw contents (cyrb53, 53-bit). Used to tell
 * whether a file on disk changed since the app last read or wrote it. Not
 * cryptographic; it only needs to notice edits made elsewhere.
 */
export function fileFingerprint(content: string | Uint8Array): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  const len = content.length;
  for (let i = 0; i < len; i++) {
    const c = typeof content === 'string' ? content.charCodeAt(i) : content[i];
    h1 = Math.imul(h1 ^ c, 2654435761);
    h2 = Math.imul(h2 ^ c, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return `${len.toString(36)}-${(4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36)}`;
}
