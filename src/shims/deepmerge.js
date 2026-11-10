import deepmergeOriginal from 'deepmerge/dist/cjs.js';

export function isMergeableObject(value) {
  if (!value || typeof value !== 'object') return false;
  // Never merge DOM nodes, window, document, or elements with nodeType
  if (value.nodeType !== undefined) return false;
  if (typeof Node !== 'undefined' && value instanceof Node) return false;
  if (typeof window !== 'undefined' && (value === window || value === window.document)) return false;

  const stringValue = Object.prototype.toString.call(value);
  if (
    stringValue === '[object RegExp]' ||
    stringValue === '[object Date]' ||
    value['$$typeof'] === (typeof Symbol === 'function' && Symbol.for ? Symbol.for('react.element') : 0xeac7)
  ) {
    return false;
  }

  if (Array.isArray(value)) return true;
  const proto = Object.getPrototypeOf(value);
  return proto === null || proto === Object.prototype;
}

// Keys that can rewrite an object's prototype chain when copied by assignment.
// deepmerge <= 4.3.1 copies an own `__proto__` key (e.g. from JSON.parse) onto
// the result, poisoning its prototype (GHSA-gcqx-w48m-w2h4). No upstream fix
// exists, so strip these keys from every input before handing it to deepmerge.
const UNSAFE_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

function stripUnsafeKeys(value, isMergeable) {
  if (!isMergeable(value)) return value;
  if (Array.isArray(value)) return value.map((item) => stripUnsafeKeys(item, isMergeable));

  const clean = Object.create(Object.getPrototypeOf(value));
  for (const key of Object.keys(value)) {
    if (UNSAFE_KEYS.has(key)) continue;
    clean[key] = stripUnsafeKeys(value[key], isMergeable);
  }
  for (const sym of Object.getOwnPropertySymbols(value)) {
    if (Object.prototype.propertyIsEnumerable.call(value, sym)) {
      clean[sym] = stripUnsafeKeys(value[sym], isMergeable);
    }
  }
  return clean;
}

function buildOptions(options) {
  const customIsMergeable = options?.isMergeableObject;
  return {
    ...options,
    isMergeableObject: customIsMergeable
      ? (val) => isMergeableObject(val) && customIsMergeable(val)
      : isMergeableObject,
  };
}

export default function deepmerge(target, source, options) {
  const opts = buildOptions(options);
  return deepmergeOriginal(
    stripUnsafeKeys(target, opts.isMergeableObject),
    stripUnsafeKeys(source, opts.isMergeableObject),
    opts,
  );
}

deepmerge.all = function (array, options) {
  const opts = buildOptions(options);
  return deepmergeOriginal.all(
    array.map((item) => stripUnsafeKeys(item, opts.isMergeableObject)),
    opts,
  );
};
