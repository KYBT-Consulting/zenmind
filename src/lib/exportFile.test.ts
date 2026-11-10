import { describe, expect, it } from 'vitest';
import { exportContentToBytes, exportFileType, toSafeFilename } from './exportFile';

describe('exportContentToBytes', () => {
  it('decodes base64 data URLs from the mind-map exporters', () => {
    // FileReader.readAsDataURL output for the bytes of "%PDF"
    const bytes = exportContentToBytes('data:application/octet-stream;base64,JVBERg==');
    expect(Array.from(bytes)).toEqual([0x25, 0x50, 0x44, 0x46]);
  });

  it('decodes binary payloads byte-for-byte', () => {
    const png = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0xff];
    const dataUrl = 'data:image/png;base64,' + btoa(String.fromCharCode(...png));
    expect(Array.from(exportContentToBytes(dataUrl))).toEqual(png);
  });

  it('decodes percent-encoded data URLs', () => {
    const bytes = exportContentToBytes('data:image/svg+xml,%3Csvg%3E%C3%A9%3C%2Fsvg%3E');
    expect(new TextDecoder().decode(bytes)).toBe('<svg>é</svg>');
  });

  it('encodes plain text (OPML, FreeMind, ZenMind) as UTF-8', () => {
    const bytes = exportContentToBytes('<opml>Café ✓</opml>');
    expect(new TextDecoder().decode(bytes)).toBe('<opml>Café ✓</opml>');
  });
});

describe('toSafeFilename', () => {
  it('replaces path separators and reserved characters', () => {
    expect(toSafeFilename('Q3/Q4 plan: draft?')).toBe('Q3-Q4 plan- draft-');
    expect(toSafeFilename('a\\b<c>|d*"e"')).toBe('a-b-c-d-e-');
  });

  it('strips leading dots so the file is not hidden or a traversal', () => {
    expect(toSafeFilename('../secret')).toBe('secret');
    expect(toSafeFilename('.hidden')).toBe('hidden');
  });

  it('falls back when nothing usable remains', () => {
    expect(toSafeFilename('   ')).toBe('mind-map');
    expect(toSafeFilename('///')).toBe('mind-map');
  });
});

describe('exportFileType', () => {
  it('knows every export format', () => {
    for (const ext of ['png', 'svg', 'pdf', 'json', 'md', 'xmind', 'opml', 'mm', 'zenmind']) {
      expect(exportFileType(ext).mime).not.toBe('application/octet-stream');
    }
  });
});
