import { describe, expect, it, vi } from 'vitest';

// The real canvas library needs a browser; the format code only uses its Markdown helper.
vi.mock('simple-mind-map', () => ({
  default: {
    markdown: {
      transformMarkdownTo: vi.fn(async (text: string) => ({ data: { text: text.split('\n')[0].replace(/^#+\s*/, '') }, children: [] })),
    },
    xmind: { parseXmindFile: vi.fn() },
  },
}));

import { MindMapFormatService } from './mindMapFormatService';

const richMap = () => ({
  data: { text: 'Root & <Co>', note: 'Root note' },
  children: [
    {
      data: { text: 'Planning', note: 'line one\nline two', hyperlink: 'https://example.com/a?b=1&c=2', tag: ['urgent', 'q4'] },
      children: [{ data: { text: 'Leaf "quoted"' }, children: [] }],
    },
    { data: { text: '<p>Rich <b>text</b></p>', tag: [{ text: 'objtag' }] }, children: [] },
  ],
});

describe('OPML round trip', () => {
  const xml = MindMapFormatService.exportOpml(richMap(), 'My Map');
  const { data } = MindMapFormatService.parseOpml(xml);

  it('exports notes, links and tags', () => {
    expect(xml).toContain('_note="Root note"');
    expect(xml).toContain('url="https://example.com/a?b=1&amp;c=2"');
    expect(xml).toContain('category="urgent,q4"');
  });

  it('keeps text, note, link and tags after re-import', () => {
    expect(data.data.text).toBe('Root & <Co>');
    expect(data.data.note).toBe('Root note');
    const planning = data.children[0];
    expect(planning.data.text).toBe('Planning');
    expect(planning.data.note).toBe('line one\nline two');
    expect(planning.data.hyperlink).toBe('https://example.com/a?b=1&c=2');
    expect(planning.data.tag).toEqual(['urgent', 'q4']);
    expect(planning.children[0].data.text).toBe('Leaf "quoted"');
  });

  it('strips rich-text markup and supports object tags', () => {
    const rich = data.children[1];
    expect(rich.data.text).toBe('Rich text');
    expect(rich.data.tag).toEqual(['objtag']);
  });

  it('does not put raw HTML in notes', () => {
    const out = MindMapFormatService.exportOpml({ data: { text: 'x', note: '<p>hello <b>there</b></p>' }, children: [] });
    expect(out).toContain('_note="hello there"');
  });
});

describe('FreeMind round trip', () => {
  const xml = MindMapFormatService.exportFreeMind(richMap());
  const data = MindMapFormatService.parseFreeMind(xml);

  it('exports notes, links and tags', () => {
    expect(xml).toContain('LINK="https://example.com/a?b=1&amp;c=2"');
    expect(xml).toContain('<richcontent TYPE="NOTE">');
    expect(xml).toContain('NAME="tags" VALUE="urgent,q4"');
  });

  it('keeps text, notes (with line breaks), links and tags after re-import', () => {
    expect(data.data.text).toBe('Root & <Co>');
    expect(data.data.note).toBe('Root note');
    const planning = data.children[0];
    expect(planning.data.note).toBe('line one\nline two');
    expect(planning.data.hyperlink).toBe('https://example.com/a?b=1&c=2');
    expect(planning.data.tag).toEqual(['urgent', 'q4']);
    expect(planning.children[0].data.text).toBe('Leaf "quoted"');
  });

  it('produces well-formed XML for awkward text', () => {
    const awkward = MindMapFormatService.exportFreeMind({ data: { text: 'a & b < c > "d" \'e\'' }, children: [] });
    const parsed = new DOMParser().parseFromString(awkward, 'text/xml');
    expect(parsed.querySelector('parsererror')).toBeNull();
  });
});

describe('parseText format detection', () => {
  it('detects OPML and FreeMind by their root element', async () => {
    const opml = MindMapFormatService.exportOpml(richMap(), 'T');
    expect((await MindMapFormatService.parseText(opml, 'a.txt')).success).toBe(true);
    const mm = MindMapFormatService.exportFreeMind(richMap());
    expect((await MindMapFormatService.parseText(mm, 'a.txt')).success).toBe(true);
  });

  it('does not treat a .zenmind or .md file that merely mentions "<opml" as OPML', async () => {
    const zen = JSON.stringify({ content: { data: { text: 'About <opml> files' }, children: [] } });
    const res = await MindMapFormatService.parseText(zen, 'notes.zenmind');
    expect(res.success).toBe(true);
    expect(res.data.data.text).toBe('About <opml> files');

    const md = await MindMapFormatService.parseText('# Notes about <opml version="2.0"> and <map version="1.0.1">', 'notes.md');
    expect(md.success).toBe(true);
  });
});

describe('JSON import errors', () => {
  it('reports invalid JSON for .zenmind/.json instead of importing garbage', async () => {
    const res = await MindMapFormatService.parseText('{"content": {"data":', 'broken.zenmind');
    expect(res.success).toBe(false);
    expect(res.error).toMatch(/not valid JSON/i);
  });

  it('reports invalid JSON when the content looks like JSON but has an odd extension', async () => {
    const res = await MindMapFormatService.parseText('{ nope', 'map.txt');
    expect(res.success).toBe(false);
  });

  it('rejects JSON that is not a mind map', async () => {
    expect((await MindMapFormatService.parseText('null', 'a.json')).success).toBe(false);
    expect((await MindMapFormatService.parseText('{"hello": 1}', 'a.json')).success).toBe(false);
    expect((await MindMapFormatService.parseText('{"content": {"hello": 1}}', 'a.zenmind')).success).toBe(false);
    expect((await MindMapFormatService.parseText('42', 'a.json')).success).toBe(false);
  });

  it('parses saved .zenmind files with full {layout, root, theme, view} content and exported .json files', async () => {
    const fullDoc = {
      layout: 'logicalStructure',
      root: { data: { text: '<p>Saved Root</p>', richText: true, expand: true }, children: [] },
      theme: { template: 'default', config: {} },
      view: {},
    };
    const zenmindFile = JSON.stringify({
      version: '1.0.0',
      title: 'My Project',
      savedAt: '2026-10-16T00:00:00.000Z',
      content: fullDoc,
    });
    const parsedZen = await MindMapFormatService.parseText(zenmindFile, 'My Project.zenmind');
    expect(parsedZen.success).toBe(true);
    expect(parsedZen.title).toBe('My Project');
    expect(parsedZen.data.root.data.text).toBe('<p>Saved Root</p>');

    const parsedJson = await MindMapFormatService.parseText(JSON.stringify(fullDoc), 'exported.json');
    expect(parsedJson.success).toBe(true);
    expect(parsedJson.title).toBe('Saved Root');
    expect(parsedJson.data.root.data.text).toBe('<p>Saved Root</p>');
  });

  it('still falls back to Markdown for unknown plain-text files', async () => {
    const res = await MindMapFormatService.parseText('# Title\n- item', 'readme.txt');
    expect(res.success).toBe(true);
    expect(res.title).toBe('Imported Document');
  });
});
