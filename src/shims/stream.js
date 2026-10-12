// Browser shim for Node.js stream module to prevent Vite externalization errors
export class Stream {
  constructor() {}
  on() { return this; }
  once() { return this; }
  emit() { return false; }
  pipe(dest) { return dest; }
  write() { return true; }
  end() { return true; }
}

export class Readable extends Stream {}
export class Writable extends Stream {}
export class Duplex extends Stream {}
export class Transform extends Stream {}
export class PassThrough extends Transform {}

export default {
  Stream,
  Readable,
  Writable,
  Duplex,
  Transform,
  PassThrough,
};
