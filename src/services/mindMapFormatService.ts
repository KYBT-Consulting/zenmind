import MindMap from 'simple-mind-map';
import { toPlainText } from '../lib/utils';

export interface ParseResult {
  success: boolean;
  data?: any;
  title?: string;
  error?: string;
}

export class MindMapFormatService {
  /**
   * Escape XML entities for OPML and FreeMind generation.
   */
  private static escapeXml(unsafe: string): string {
    return (unsafe || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /** Escapes a value for use inside an XML attribute, keeping line breaks (raw newlines would be normalised to spaces). */
  private static escapeAttr(value: string): string {
    return this.escapeXml(value).replace(/\r?\n/g, '&#10;');
  }

  /** Tags are plain strings in older data and `{ text }` objects in newer data. */
  private static tagTexts(tags: any): string[] {
    if (!Array.isArray(tags)) return [];
    return tags
      .map((t) => (typeof t === 'string' ? t : t?.text))
      .filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
      .map((t) => t.replace(/,/g, ' ').trim());
  }

  /**
   * Parse any supported mind map file (.zenmind, .json, .xmind, .md, .opml, .mm).
   */
  static async parseFile(file: File): Promise<ParseResult> {
    const filename = file.name.toLowerCase();

    // 1. XMind format (.xmind)
    if (filename.endsWith('.xmind')) {
      try {
        const data = await MindMap.xmind.parseXmindFile(file);
        const title = file.name.replace(/\.[^/.]+$/, '');
        return { success: true, data, title };
      } catch (err: any) {
        console.error('XMind parse error:', err);
        return { success: false, error: err.message || 'Failed to parse XMind archive' };
      }
    }

    // 2. Read text for JSON, Markdown, OPML, and FreeMind
    const text = await file.text();
    return this.parseText(text, file.name);
  }

  /**
   * Parse text content based on format detection.
   */
  static async parseText(text: string, filenameHint: string = ''): Promise<ParseResult> {
    const trimmed = text.trim();
    const lowerName = filenameHint.toLowerCase();

    // Decide XML formats by file extension, or by the document's root element (never by
    // substring: a JSON/Markdown file may legitimately mention "<opml" in a node's text).
    const rootElement = /^(?:<\?xml[^>]*\?>\s*|<!--[\s\S]*?-->\s*|<!DOCTYPE[^>]*>\s*)*<([A-Za-z][\w:-]*)/.exec(trimmed)?.[1]?.toLowerCase();
    const isKnownTextExt = /\.(md|markdown|zenmind|json)$/.test(lowerName);

    // 1. OPML Outline (.opml) or XML whose root is <opml>
    if (lowerName.endsWith('.opml') || (!isKnownTextExt && rootElement === 'opml')) {
      try {
        const res = this.parseOpml(trimmed);
        const title = res.title || filenameHint.replace(/\.[^/.]+$/, '') || 'OPML Outline';
        return { success: true, data: res.data, title };
      } catch (err: any) {
        return { success: false, error: 'Failed to parse OPML document: ' + err.message };
      }
    }

    // 2. FreeMind / Freeplane (.mm) or XML containing <map>
    if (lowerName.endsWith('.mm') || (!isKnownTextExt && rootElement === 'map')) {
      try {
        const data = this.parseFreeMind(trimmed);
        const title = data.data?.text || filenameHint.replace(/\.[^/.]+$/, '') || 'FreeMind Map';
        return { success: true, data, title };
      } catch (err: any) {
        return { success: false, error: 'Failed to parse FreeMind document: ' + err.message };
      }
    }

    // 3. Markdown (.md) or starting with markdown header / bullet
    if (lowerName.endsWith('.md') || lowerName.endsWith('.markdown')) {
      try {
        const data = await MindMap.markdown.transformMarkdownTo(trimmed);
        const title = filenameHint.replace(/\.[^/.]+$/, '') || 'Markdown Mind Map';
        return { success: true, data, title };
      } catch (err: any) {
        return { success: false, error: 'Failed to parse Markdown: ' + err.message };
      }
    }

    // 4. JSON / ZenMind (.zenmind, .json)
    const looksLikeJson = /\.(zenmind|json)$/.test(lowerName) || /^[\[{]/.test(trimmed);
    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== 'object') {
        return { success: false, error: 'Not a valid mind map file (expected a JSON object).' };
      }
      if (parsed.content && typeof parsed.content === 'object' && (parsed.content.root || parsed.content.data)) {
        return {
          success: true,
          data: parsed.content,
          title: parsed.title || filenameHint.replace(/\.[^/.]+$/, ''),
        };
      }
      if (parsed.root && typeof parsed.root === 'object' && parsed.root.data) {
        return {
          success: true,
          data: parsed,
          title:
            toPlainText(parsed.root.data.text || '', parsed.root.data.richText) ||
            filenameHint.replace(/\.[^/.]+$/, ''),
        };
      }
      if (parsed.data && typeof parsed.data === 'object') {
        return {
          success: true,
          data: parsed,
          title: parsed.data.text || filenameHint.replace(/\.[^/.]+$/, ''),
        };
      }
      return { success: false, error: 'Not a valid mind map file (no map content found).' };
    } catch (err: any) {
      // A file that is meant to be JSON but isn't must say so, not be imported as Markdown text
      if (looksLikeJson) {
        return { success: false, error: `The file is not valid JSON: ${err?.message || 'parse error'}` };
      }
      // Anything else (unknown extension) may be plain Markdown
      try {
        const mdData = await MindMap.markdown.transformMarkdownTo(trimmed);
        if (mdData && mdData.data) {
          return { success: true, data: mdData, title: 'Imported Document' };
        }
      } catch {
        // ignore
      }
    }

    return { success: false, error: 'Unrecognized or unsupported file format.' };
  }

  /**
   * Parse OPML 2.0 XML string into mind map hierarchical tree.
   */
  static parseOpml(xmlString: string): { data: any; title?: string } {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(parserError.textContent || 'Invalid XML');
    }

    const titleEl = doc.querySelector('opml > head > title');
    const title = titleEl?.textContent?.trim() || 'Outline';

    const body = doc.querySelector('opml > body');
    if (!body) {
      throw new Error('Missing <body> tag in OPML document');
    }

    const parseOutlineElement = (el: Element): any => {
      const text = el.getAttribute('text') || el.getAttribute('title') || 'Topic';
      const note = el.getAttribute('_note') || el.getAttribute('description') || '';
      const children = Array.from(el.children)
        .filter((child) => child.tagName.toLowerCase() === 'outline')
        .map(parseOutlineElement);

      const nodeData: any = {
        data: {
          text,
          expand: true,
        },
        children,
      };

      if (note) nodeData.data.note = note;
      const url = el.getAttribute('url');
      if (url) nodeData.data.hyperlink = url;
      const category = el.getAttribute('category');
      if (category) {
        const tags = category.split(',').map((t) => t.trim()).filter(Boolean);
        if (tags.length) nodeData.data.tag = tags;
      }
      return nodeData;
    };

    const topOutlines = Array.from(body.children).filter(
      (el) => el.tagName.toLowerCase() === 'outline'
    );

    if (topOutlines.length === 0) {
      return {
        data: { data: { text: title, expand: true }, children: [] },
        title,
      };
    }

    if (topOutlines.length === 1) {
      return {
        data: parseOutlineElement(topOutlines[0]),
        title,
      };
    }

    // If multiple top-level outlines, create a central root
    return {
      data: {
        data: { text: title, expand: true },
        children: topOutlines.map(parseOutlineElement),
      },
      title,
    };
  }

  /**
   * Parse FreeMind / Freeplane 1.0.1 (.mm) XML into mind map hierarchical tree.
   */
  static parseFreeMind(xmlString: string): any {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlString, 'text/xml');
    const parserError = doc.querySelector('parsererror');
    if (parserError) {
      throw new Error(parserError.textContent || 'Invalid XML');
    }

    const rootNodeEl = doc.querySelector('map > node');
    if (!rootNodeEl) {
      throw new Error('Missing root <node> inside <map> in FreeMind document');
    }

    const parseFreeMindNode = (el: Element): any => {
      const text = el.getAttribute('TEXT') || el.getAttribute('text') || 'Topic';
      const directChildren = Array.from(el.children);

      const noteEl = directChildren.find(
        (c) => c.tagName.toLowerCase() === 'richcontent' && (c.getAttribute('TYPE') || '').toUpperCase() === 'NOTE'
      );
      let note = '';
      if (noteEl) {
        // Notes are <html><body><p>..</p></body></html>: keep paragraph breaks
        const paragraphs = Array.from(noteEl.getElementsByTagName('p'))
          .map((p) => p.textContent?.trim() || '')
          .filter(Boolean);
        note = paragraphs.length ? paragraphs.join('\n') : noteEl.textContent?.trim() || '';
      }

      const tagAttr = directChildren.find(
        (c) => c.tagName.toLowerCase() === 'attribute' && (c.getAttribute('NAME') || '').toLowerCase() === 'tags'
      );
      const tags = (tagAttr?.getAttribute('VALUE') || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);

      const children = directChildren
        .filter((child) => child.tagName.toUpperCase() === 'NODE')
        .map(parseFreeMindNode);

      const nodeData: any = {
        data: {
          text,
          expand: true,
        },
        children,
      };

      if (note) nodeData.data.note = note;
      const link = el.getAttribute('LINK');
      if (link) nodeData.data.hyperlink = link;
      if (tags.length) nodeData.data.tag = tags;
      return nodeData;
    };

    return parseFreeMindNode(rootNodeEl);
  }

  /**
   * Export mind map data tree to standard OPML 2.0 XML string.
   */
  static exportOpml(treeData: any, title: string = 'ZenMind Map'): string {
    const serializeOutline = (node: any, indent: string = '      '): string => {
      const text = this.escapeAttr(toPlainText(node.data?.text || 'Topic', node.data?.richText));
      // _note is plain text by OPML convention; url and category carry the link and tags
      const note = node.data?.note ? toPlainText(node.data.note) : '';
      const tags = this.tagTexts(node.data?.tag);
      const attrs =
        (note ? ` _note="${this.escapeAttr(note)}"` : '') +
        (node.data?.hyperlink ? ` url="${this.escapeAttr(node.data.hyperlink)}"` : '') +
        (tags.length ? ` category="${this.escapeAttr(tags.join(','))}"` : '');
      const children = node.children || [];

      if (children.length === 0) {
        return `${indent}<outline text="${text}"${attrs} />\n`;
      }

      let inner = '';
      for (const child of children) {
        inner += serializeOutline(child, indent + '  ');
      }
      return `${indent}<outline text="${text}"${attrs}>\n${inner}${indent}</outline>\n`;
    };

    const rootNode = treeData.data ? treeData : { data: { text: title }, children: [] };

    return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>${this.escapeXml(title)}</title>
    <dateCreated>${new Date().toUTCString()}</dateCreated>
  </head>
  <body>
${serializeOutline(rootNode)}  </body>
</opml>`;
  }

  /**
   * Export mind map data tree to standard FreeMind 1.0.1 (.mm) XML string.
   */
  static exportFreeMind(treeData: any): string {
    const serializeNode = (node: any, indent: string = '  '): string => {
      const text = this.escapeAttr(toPlainText(node.data?.text || 'Topic', node.data?.richText));
      const link = node.data?.hyperlink ? ` LINK="${this.escapeAttr(node.data.hyperlink)}"` : '';
      const note = node.data?.note ? toPlainText(node.data.note) : '';
      const tags = this.tagTexts(node.data?.tag);
      const children = node.children || [];

      // Notes, tags and child nodes are nested elements
      let inner = '';
      if (note) {
        const paragraphs = note
          .split(/\r?\n/)
          .map((line) => `<p>${this.escapeXml(line)}</p>`)
          .join('');
        inner += `${indent}  <richcontent TYPE="NOTE"><html><head></head><body>${paragraphs}</body></html></richcontent>\n`;
      }
      if (tags.length) {
        inner += `${indent}  <attribute NAME="tags" VALUE="${this.escapeAttr(tags.join(','))}"/>\n`;
      }
      for (const child of children) {
        inner += serializeNode(child, indent + '  ');
      }

      if (!inner) return `${indent}<node TEXT="${text}"${link}/>\n`;
      return `${indent}<node TEXT="${text}"${link}>\n${inner}${indent}</node>\n`;
    };

    const rootNode = treeData.data ? treeData : { data: { text: 'Central Topic' }, children: [] };

    return `<map version="1.0.1">
${serializeNode(rootNode)}</map>`;
  }

  /**
   * Trigger a client-side download of a text or XML string.
   */
  static downloadFile(content: string, filename: string, mimeType: string = 'text/plain') {
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
