import { describe, expect, it } from 'vitest';
import { baseNameOf, extensionOf, fileNameOf, isZenMindPath, siblingPath } from './filePaths';

describe('filePaths', () => {
  it('splits Linux/macOS and Windows paths', () => {
    expect(fileNameOf('/home/me/pCloudDrive/Work/Plan.zenmind')).toBe('Plan.zenmind');
    expect(fileNameOf('C:\\Users\\me\\Plan.zenmind')).toBe('Plan.zenmind');
    expect(fileNameOf('Plan.zenmind')).toBe('Plan.zenmind');
  });

  it('strips only the last extension', () => {
    expect(baseNameOf('/a/Plan.v2.zenmind')).toBe('Plan.v2');
    expect(baseNameOf('/a/Untitled Mind Map.zenmind')).toBe('Untitled Mind Map');
    expect(baseNameOf('/a/README')).toBe('README');
    expect(baseNameOf('/a/.hidden')).toBe('.hidden');
  });

  it('reads the extension, lowercased', () => {
    expect(extensionOf('/a/Plan.ZENMIND')).toBe('.zenmind');
    expect(extensionOf('/a.b/README')).toBe('');
  });

  it('builds a path in the same folder', () => {
    expect(siblingPath('/home/me/Work/Plan.md', 'Plan.zenmind')).toBe('/home/me/Work/Plan.zenmind');
    expect(siblingPath('C:\\Work\\Plan.md', 'Plan.zenmind')).toBe('C:\\Work\\Plan.zenmind');
    expect(siblingPath('Plan.md', 'Plan.zenmind')).toBe('Plan.zenmind');
  });

  it('only treats ZenMind/JSON files as safe to save in place', () => {
    expect(isZenMindPath('/a/Plan.zenmind')).toBe(true);
    expect(isZenMindPath('/a/Plan.json')).toBe(true);
    for (const p of ['/a/Plan.md', '/a/Plan.xmind', '/a/Plan.opml', '/a/Plan.mm', '/a/Plan']) {
      expect(isZenMindPath(p)).toBe(false);
    }
  });
});
