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

export default function deepmerge(target, source, options) {
  const customIsMergeable = options?.isMergeableObject;
  const opts = {
    ...options,
    isMergeableObject: customIsMergeable
      ? (val) => isMergeableObject(val) && customIsMergeable(val)
      : isMergeableObject,
  };
  return deepmergeOriginal(target, source, opts);
}

deepmerge.all = function (array, options) {
  const customIsMergeable = options?.isMergeableObject;
  const opts = {
    ...options,
    isMergeableObject: customIsMergeable
      ? (val) => isMergeableObject(val) && customIsMergeable(val)
      : isMergeableObject,
  };
  return deepmergeOriginal.all(array, opts);
};
