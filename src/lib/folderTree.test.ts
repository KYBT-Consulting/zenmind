import { describe, expect, it } from 'vitest';
import { buildTreeFromRelativePaths, joinNativePath } from './folderTree';

describe('joinNativePath', () => {
  it('uses the separator the path already uses', () => {
    expect(joinNativePath('/home/u/proj', 'a.txt')).toBe('/home/u/proj/a.txt');
    expect(joinNativePath('C:\\Users\\me\\proj', 'a.txt')).toBe('C:\\Users\\me\\proj\\a.txt');
    expect(joinNativePath('/', 'etc')).toBe('/etc');
  });
});

describe('buildTreeFromRelativePaths', () => {
  const paths = ['proj/readme.md', 'proj/src/main.ts', 'proj/src/lib/util.ts', 'proj/node_modules/x/index.js', 'proj/.git/HEAD'];

  it('builds nested folders and files, skipping ignored directories', () => {
    const { root, rootName, truncated } = buildTreeFromRelativePaths(paths);
    expect(rootName).toBe('proj');
    expect(truncated).toBe(false);
    const names = (root.children || []).map((c) => c.data.text);
    expect(names).toEqual(['📄 readme.md', '📁 src']);
    const src = root.children!.find((c) => c.data.text === '📁 src')!;
    expect(src.children!.map((c) => c.data.text)).toEqual(['📄 main.ts', '📁 lib']);
  });

  it('stops at the entry cap and reports it', () => {
    const many = Array.from({ length: 50 }, (_, i) => `big/file${i}.txt`);
    const { root, truncated } = buildTreeFromRelativePaths(many, 10);
    expect(truncated).toBe(true);
    expect(root.children).toHaveLength(10);
  });
});
