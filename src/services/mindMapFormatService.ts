import MindMap from 'simple-mind-map';
import { stripHtml } from '../lib/utils';

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

    // 1. OPML Outline (.opml) or XML containing <opml>
    if (lowerName.endsWith('.opml') || trimmed.includes('<opml')) {
      try {
        const res = this.parseOpml(trimmed);
        const title = res.title || filenameHint.replace(/\.[^/.]+$/, '') || 'OPML Outline';
        return { success: true, data: res.data, title };
      } catch (err: any) {
        return { success: false, error: 'Failed to parse OPML document: ' + err.message };
      }
    }

    // 2. FreeMind / Freeplane (.mm) or XML containing <map>
    if (lowerName.endsWith('.mm') || (trimmed.startsWith('<map') || trimmed.includes('<map version='))) {
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
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed.content) {
        return {
          success: true,
          data: parsed.content,
          title: parsed.title || filenameHint.replace(/\.[^/.]+$/, ''),
        };
      }
      if (parsed.data) {
        return {
          success: true,
          data: parsed,
          title: parsed.data.text || filenameHint.replace(/\.[^/.]+$/, ''),
        };
      }
    } catch {
      // If JSON parsing fails, fall back to checking if it's markdown text
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
      const noteEl = el.querySelector(':scope > richcontent[TYPE="NOTE"]');
      const note = noteEl ? noteEl.textContent?.trim() : '';

      const children = Array.from(el.children)
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
      return nodeData;
    };

    return parseFreeMindNode(rootNodeEl);
  }

  /**
   * Export mind map data tree to standard OPML 2.0 XML string.
   */
  static exportOpml(treeData: any, title: string = 'ZenMind Map'): string {
    const serializeOutline = (node: any, indent: string = '      '): string => {
      const text = this.escapeXml(stripHtml(node.data?.text || 'Topic'));
      const noteAttr = node.data?.note ? ` _note="${this.escapeXml(node.data.note)}"` : '';
      const children = node.children || [];

      if (children.length === 0) {
        return `${indent}<outline text="${text}"${noteAttr} />\n`;
      }

      let inner = '';
      for (const child of children) {
        inner += serializeOutline(child, indent + '  ');
      }
      return `${indent}<outline text="${text}"${noteAttr}>\n${inner}${indent}</outline>\n`;
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
      const text = this.escapeXml(stripHtml(node.data?.text || 'Topic'));
      const children = node.children || [];

      if (children.length === 0) {
        return `${indent}<node TEXT="${text}"/>\n`;
      }

      let inner = '';
      for (const child of children) {
        inner += serializeNode(child, indent + '  ');
      }
      return `${indent}<node TEXT="${text}">\n${inner}${indent}</node>\n`;
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
