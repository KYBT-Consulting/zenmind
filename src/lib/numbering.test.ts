import { describe, expect, it } from 'vitest';
import { addPrefix, applyNumbering, removePrefix } from './numbering';

const sample = () => ({
  data: { text: 'Root', uid: 'root' },
  children: [
    { data: { text: '2024 roadmap', uid: 'a' }, children: [{ data: { text: 'A new plan', uid: 'a1' }, children: [] }] },
    { data: { text: '<p>Rich <b>text</b></p>', uid: 'b', richText: true }, children: [] },
  ],
});

const texts = (t: any): string[] => [t.data.text, ...(t.children || []).flatMap(texts)];

describe('prefix helpers', () => {
  it('adds the prefix after leading tags', () => {
    expect(addPrefix('Topic', '1')).toBe('1 Topic');
    expect(addPrefix('<p>Topic</p>', '1.2')).toBe('<p>1.2 Topic</p>');
  });

  it('removes only the exact prefix', () => {
    expect(removePrefix('1 Topic', '1')).toBe('Topic');
    expect(removePrefix('<p>1.2 Topic</p>', '1.2')).toBe('<p>Topic</p>');
    expect(removePrefix('2024 roadmap', '1')).toBe('2024 roadmap');
    expect(removePrefix('Topic', undefined)).toBe('Topic');
  });
});

describe('applyNumbering', () => {
  it('numbers topics hierarchically and leaves the root alone', () => {
    const tree = sample();
    applyNumbering(tree, true, new Map());
    expect(texts(tree)).toEqual(['Root', '1 2024 roadmap', '1.1 A new plan', '<p>2 Rich <b>text</b></p>']);
  });

  it('turning numbering off restores the original text, including look-alike numbers', () => {
    const tree = sample();
    const original = texts(tree);
    const applied = applyNumbering(tree, true, new Map());
    applyNumbering(tree, false, applied);
    expect(texts(tree)).toEqual(original);
  });

  it('renumbers without stacking prefixes', () => {
    const tree = sample();
    const first = applyNumbering(tree, true, new Map());
    tree.children.reverse();
    applyNumbering(tree, true, first);
    expect(texts(tree)).toEqual(['Root', '1 <p>Rich <b>text</b></p>'.replace('1 <p>', '<p>1 '), '2 2024 roadmap', '2.1 A new plan']);
  });
});
