import { describe, expect, it } from 'vitest';
import { isSafeLink, sanitizeHtml, sanitizeMapData } from './sanitize';

describe('isSafeLink', () => {
  it.each(['https://a.com', 'HTTP://a.com', 'mailto:a@b.c', 'tel:123', '/home/u/a.md', 'relative/path', '#anchor', 'C:\\maps\\a.zenmind'])(
    'allows %s',
    (link) => expect(isSafeLink(link)).toBe(true)
  );

  it.each([
    'javascript:alert(1)',
    '  JaVa\nScRiPt:alert(1)',
    'data:text/html,<script>1</script>',
    'vbscript:x',
    'file:///etc/passwd',
  ])('rejects %s', (link) => expect(isSafeLink(link)).toBe(false));
});

describe('sanitizeHtml', () => {
  it('passes plain text and ordinary formatting through', () => {
    expect(sanitizeHtml('just text')).toBe('just text');
    expect(sanitizeHtml('<p>plain <b>bold</b></p>')).toBe('<p>plain <b>bold</b></p>');
  });

  it('removes scripts, iframes, styles and event handlers', () => {
    expect(sanitizeHtml('<p onclick="x()">hi</p><script>alert(1)</script>')).toBe('<p>hi</p>');
    expect(sanitizeHtml('<img src=x onerror=alert(1)>')).not.toMatch(/onerror/);
    expect(sanitizeHtml('<iframe src="https://evil.com"></iframe><p>x</p>')).toBe('<p>x</p>');
    expect(sanitizeHtml('<style>body{display:none}</style><p>x</p>')).toBe('<p>x</p>');
    expect(sanitizeHtml('<svg onload=alert(1)><circle/></svg>')).not.toMatch(/onload/);
  });

  it('keeps safe links and drops unsafe URLs', () => {
    const out = sanitizeHtml('<a href="javascript:alert(1)">l</a><a href="https://ok.com">ok</a>');
    expect(out).not.toMatch(/javascript:/);
    expect(out).toContain('href="https://ok.com"');
  });

  it('allows inline raster images but not other data URLs', () => {
    expect(sanitizeHtml('<img src="data:image/png;base64,QQ==">')).toContain('data:image/png');
    expect(sanitizeHtml('<img src="data:text/html,hi">')).not.toMatch(/data:/);
    expect(sanitizeHtml('<img src="data:image/svg+xml,hi">')).not.toMatch(/data:/);
  });
});

describe('sanitizeMapData', () => {
  it('cleans text, notes and links on a node tree', () => {
    const map = {
      data: { text: '<img src=x onerror=alert(1)>Root', hyperlink: 'javascript:alert(1)', hyperlinkTitle: 't', note: '<script>x</script>n' },
      children: [{ data: { text: 'ok', hyperlink: 'https://ok.com' }, children: [] }],
    };
    sanitizeMapData(map);
    expect(map.data.text).not.toMatch(/onerror/);
    expect(map.data).not.toHaveProperty('hyperlink');
    expect(map.data).not.toHaveProperty('hyperlinkTitle');
    expect(map.data.note).toBe('n');
    expect(map.children[0].data.hyperlink).toBe('https://ok.com');
  });

  it('handles the {root} document wrapper and summary nodes', () => {
    const doc: any = {
      layout: 'mindMap',
      root: { data: { text: '<b onmouseover=1>r</b>', hyperlink: 'JAVASCRIPT:1', generalization: { text: '<script>1</script>s' } }, children: [] },
    };
    sanitizeMapData(doc);
    expect(doc.root.data.text).toBe('<b>r</b>');
    expect(doc.root.data.hyperlink).toBeUndefined();
    expect(doc.root.data.generalization.text).toBe('s');
  });
});
