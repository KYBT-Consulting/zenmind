/**
 * Sanitising for mind map content that comes from outside (imported files, AI output, user input).
 * Node text and notes are rendered as HTML by the canvas, so imported files must not be able to
 * smuggle in script-capable markup or `javascript:` links.
 */

const SAFE_LINK_SCHEMES = new Set(['http', 'https', 'mailto', 'tel']);

/** True for http(s)/mailto/tel URLs and scheme-less values (relative or filesystem paths). */
export function isSafeLink(link: string): boolean {
  // Browsers ignore whitespace/control characters inside the scheme ("java\nscript:")
  const compact = link.replace(/[\u0000-\u0020\u007f-\u009f]/g, '');
  const match = /^([a-z][a-z0-9+.-]*):/i.exec(compact);
  if (!match) return true;
  const scheme = match[1].toLowerCase();
  // A single letter is a Windows drive ("C:\\maps"), not a URL scheme
  return scheme.length === 1 || SAFE_LINK_SCHEMES.has(scheme);
}

const DROP_ELEMENTS = 'script,iframe,frame,frameset,object,embed,link,meta,base,style,form,applet';
const URL_ATTRS = ['href', 'src', 'xlink:href', 'action', 'formaction', 'data', 'poster'];

/** Strips scripts, event handlers and unsafe URLs from an HTML fragment. Plain text passes through unchanged. */
export function sanitizeHtml(html: string): string {
  if (typeof html !== 'string' || !html.includes('<')) return html;
  // DOMParser builds an inert document: nothing is executed or fetched while we clean it
  const doc = new DOMParser().parseFromString(html, 'text/html');
  doc.body.querySelectorAll(DROP_ELEMENTS).forEach((el) => el.remove());
  doc.body.querySelectorAll('*').forEach((el) => {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      if (name.startsWith('on') || name === 'srcdoc') {
        el.removeAttribute(attr.name);
      } else if (URL_ATTRS.includes(name)) {
        const value = attr.value;
        // Inline images are fine; everything else must be a safe link
        const isDataImage = name === 'src' && /^\s*data:image\/(png|jpe?g|gif|webp);/i.test(value);
        if (!isDataImage && !isSafeLink(value)) el.removeAttribute(attr.name);
      }
    }
  });
  return doc.body.innerHTML;
}

function sanitizeNodeData(data: any) {
  if (!data || typeof data !== 'object') return;
  if (typeof data.text === 'string') data.text = sanitizeHtml(data.text);
  else if (data.text == null) data.text = '';
  if (typeof data.note === 'string') data.note = sanitizeHtml(data.note);
  if (typeof data.hyperlink === 'string' && !isSafeLink(data.hyperlink)) {
    delete data.hyperlink;
    delete data.hyperlinkTitle;
  }
  if (typeof data.hyperlinkTitle === 'string') data.hyperlinkTitle = sanitizeHtml(data.hyperlinkTitle);
  // Summary (generalization) nodes carry their own text
  const gen = data.generalization;
  if (Array.isArray(gen)) gen.forEach(sanitizeNodeData);
  else sanitizeNodeData(gen);
}

function sanitizeTree(node: any, depth = 0) {
  if (!node || typeof node !== 'object' || depth > 200) return;
  sanitizeNodeData(node.data);
  if (Array.isArray(node.children)) node.children.forEach((c: any) => sanitizeTree(c, depth + 1));
}

/** Sanitises a whole map (node tree, or the {root, ...} document wrapper) in place and returns it. */
export function sanitizeMapData<T>(data: T): T {
  const anyData = data as any;
  sanitizeTree(anyData?.root ?? anyData);
  return data;
}
