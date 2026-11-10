import { describe, expect, it } from 'vitest';
import deepmerge from './deepmerge.js';

describe('deepmerge shim', () => {
  it('merges nested plain objects', () => {
    expect(deepmerge({ a: { b: 1 } }, { a: { c: 2 }, d: [1] })).toEqual({ a: { b: 1, c: 2 }, d: [1] });
  });

  // GHSA-gcqx-w48m-w2h4: deepmerge only guards keys that already exist `in` the
  // target, so a null-prototype target or an own `__proto__` key on the target
  // slips through and rewrites the returned object's prototype.
  it('blocks prototype poisoning via a null-prototype target', () => {
    const payload = JSON.parse('{"__proto__": {"polluted": true}}');
    const result = deepmerge(Object.create(null), payload);
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result.polluted).toBeUndefined();
  });

  it('blocks prototype poisoning via an own __proto__ key on the target', () => {
    const target = JSON.parse('{"__proto__": {"polluted": true}, "nested": {"__proto__": {"polluted": true}}}');
    const result = deepmerge(target, { nested: { ok: 1 } });
    expect(Object.getPrototypeOf(result)).toBe(Object.prototype);
    expect(result.polluted).toBeUndefined();
    expect(result.nested.polluted).toBeUndefined();
    expect(result.nested.ok).toBe(1);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('drops constructor/prototype keys and sanitizes deepmerge.all inputs', () => {
    const payload = JSON.parse('{"constructor": {"prototype": {"x": 1}}, "ok": 1}');
    const result = deepmerge.all([Object.create(null), payload, { list: [JSON.parse('{"__proto__": {"y": 1}}')] }]);
    expect(Object.prototype.hasOwnProperty.call(result, 'constructor')).toBe(false);
    expect(result.ok).toBe(1);
    expect(Object.getPrototypeOf(result.list[0])).toBe(Object.prototype);
    expect(result.list[0].y).toBeUndefined();
  });

  it('leaves non-mergeable values (DOM nodes, dates) by reference', () => {
    const date = new Date(0);
    expect(deepmerge({}, { when: date }).when).toBe(date);
  });
});
