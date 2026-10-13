import { describe, expect, it } from 'vitest';
import { contentSignature } from './contentSignature';

const tree = () => ({
  data: { text: 'Root', uid: 'r' },
  children: [
    { data: { text: 'A', uid: 'a' }, children: [] },
    { data: { text: 'B', uid: 'b' }, children: [] },
  ],
});

describe('contentSignature', () => {
  it('is stable for identical content', () => {
    expect(contentSignature(tree())).toBe(contentSignature(tree()));
  });

  it('changes when text or structure changes', () => {
    const edited = tree();
    edited.children[0].data.text = 'A2';
    expect(contentSignature(edited)).not.toBe(contentSignature(tree()));

    const removed = tree();
    removed.children.pop();
    expect(contentSignature(removed)).not.toBe(contentSignature(tree()));
  });

  it('ignores layout-only `dir` added by the canvas library', () => {
    const withDir: any = tree();
    withDir.children[0].data.dir = 'right';
    withDir.children[1].data.dir = 'left';
    expect(contentSignature(withDir)).toBe(contentSignature(tree()));
  });

  it('treats absent and empty objects/arrays as equal (e.g. imgMap: {})', () => {
    const withEmpty: any = tree();
    withEmpty.data.imgMap = {};
    withEmpty.data.tag = [];
    expect(contentSignature(withEmpty)).toBe(contentSignature(tree()));
  });

  it('still distinguishes non-empty values', () => {
    const withTag: any = tree();
    withTag.data.tag = ['x'];
    expect(contentSignature(withTag)).not.toBe(contentSignature(tree()));
  });
});
