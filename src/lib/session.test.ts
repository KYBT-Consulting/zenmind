import { describe, expect, it, vi } from 'vitest';
import { detectConflict, planRestore, recoveredTitle, toPersistedTab } from './session';
import { fileFingerprint } from './fingerprint';

const MAP = { root: { data: { text: 'Cached' }, children: [] } };
const tab = (over: Partial<Parameters<typeof toPersistedTab>[0]> = {}) => ({
  title: 'Plan',
  savedTitle: 'Plan',
  filePath: '/home/me/plan.zenmind',
  dirty: false,
  savedJson: 'sig',
  ...over,
});

describe('toPersistedTab (what is written on exit)', () => {
  it('remembers a saved file by path only, never its content', () => {
    const getData = vi.fn(() => MAP);
    expect(toPersistedTab(tab(), getData)).toEqual({
      title: 'Plan',
      savedTitle: 'Plan',
      filePath: '/home/me/plan.zenmind',
    });
    expect(getData).not.toHaveBeenCalled();
  });

  it('caches content for a file tab with unsaved edits', () => {
    expect(toPersistedTab(tab({ dirty: true }), () => MAP)).toMatchObject({
      filePath: '/home/me/plan.zenmind',
      data: MAP,
      dirty: true,
      savedJson: 'sig',
    });
  });

  it('treats an unsaved title change as unsaved work', () => {
    expect(toPersistedTab(tab({ title: 'Plan v2' }), () => MAP)).toMatchObject({ data: MAP });
  });

  it('caches an unsaved new map (no file yet)', () => {
    expect(toPersistedTab(tab({ filePath: undefined, dirty: true }), () => MAP)).toMatchObject({ data: MAP });
  });

  it('forgets a clean map that has no file', () => {
    expect(toPersistedTab(tab({ filePath: undefined }), () => MAP)).toBeNull();
  });
});

describe('planRestore (what happens on launch)', () => {
  it('reopens saved files from disk', () => {
    expect(planRestore([{ title: 'Plan', savedTitle: 'Plan', filePath: '/home/me/plan.zenmind' }])).toEqual([
      { kind: 'disk', title: 'Plan', filePath: '/home/me/plan.zenmind' },
    ]);
  });

  it('ignores the stale cached copy written by older versions for clean file tabs', () => {
    const oldSession = [
      { title: 'Plan', savedTitle: 'Plan', filePath: '/home/me/plan.zenmind', data: MAP, savedJson: 'sig', dirty: false },
    ];
    expect(planRestore(oldSession)).toEqual([{ kind: 'disk', title: 'Plan', filePath: '/home/me/plan.zenmind' }]);
  });

  it('restores unsaved edits from the cache, keeping them marked unsaved', () => {
    const [entry] = planRestore([
      { title: 'Plan', savedTitle: 'Plan', filePath: '/home/me/plan.zenmind', data: MAP, savedJson: 'sig', dirty: true },
    ]);
    expect(entry).toMatchObject({ kind: 'cache', data: MAP, dirty: true, filePath: '/home/me/plan.zenmind' });
  });

  it('drops clean maps with no file and malformed entries', () => {
    expect(
      planRestore([
        { title: 'Scratch', savedTitle: 'Scratch', data: MAP, dirty: false },
        null,
        'junk',
        { title: 'Broken', savedTitle: 'Broken', dirty: true, data: { nope: 1 } },
      ])
    ).toEqual([]);
  });

  it('falls back to the file when unsaved data is unusable', () => {
    expect(
      planRestore([{ title: 'Plan', savedTitle: 'Plan', filePath: '/p.zenmind', dirty: true, data: 'corrupt' }])
    ).toEqual([{ kind: 'disk', title: 'Plan', filePath: '/p.zenmind' }]);
  });

  it('tolerates a missing or invalid session', () => {
    expect(planRestore(undefined)).toEqual([]);
    expect(planRestore({})).toEqual([]);
  });

  it('round-trips: what is saved on exit restores correctly on launch', () => {
    const saved = [
      toPersistedTab(tab(), () => MAP),
      toPersistedTab(tab({ filePath: '/b.zenmind', dirty: true }), () => MAP),
      toPersistedTab(tab({ filePath: undefined }), () => MAP),
    ].filter(Boolean);
    expect(planRestore(saved).map((e) => e.kind)).toEqual(['disk', 'cache']);
  });
});

describe('conflicts between cached unsaved edits and the file on disk', () => {
  it('keeps the edits on the file when the file is unchanged since they began', () => {
    expect(detectConflict('abc', 'abc')).toBe('unchanged');
  });

  it('flags a file edited elsewhere', () => {
    expect(detectConflict('abc', 'xyz')).toBe('changed');
  });

  it('treats an unknown base (sessions from older versions) as a conflict, to be safe', () => {
    expect(detectConflict(undefined, 'xyz')).toBe('changed');
  });

  it('flags a missing or unreadable file', () => {
    expect(detectConflict('abc', null)).toBe('missing');
    expect(detectConflict(undefined, null)).toBe('missing');
  });

  it('names the recovered copy', () => {
    expect(recoveredTitle('Plan')).toBe('Plan - recovered');
  });

  it('carries the fingerprint through save-on-exit and restore', () => {
    const persisted = toPersistedTab(tab({ dirty: true, diskFingerprint: 'fp1' }), () => MAP);
    expect(persisted).toMatchObject({ diskFingerprint: 'fp1' });
    expect(planRestore([persisted])[0]).toMatchObject({ kind: 'cache', diskFingerprint: 'fp1' });
  });

  it('does not keep a fingerprint for clean file tabs (they are reread anyway)', () => {
    expect(toPersistedTab(tab({ diskFingerprint: 'fp1' }), () => MAP)).not.toHaveProperty('diskFingerprint');
  });
});

describe('fileFingerprint', () => {
  it('is stable for the same content and differs on any change', () => {
    const a = '{"version":"1.0.0","content":{"root":{"data":{"text":"Plan"}}}}';
    expect(fileFingerprint(a)).toBe(fileFingerprint(a));
    expect(fileFingerprint(a)).not.toBe(fileFingerprint(a.replace('Plan', 'Plan!')));
    expect(fileFingerprint(a)).not.toBe(fileFingerprint(a.replace('Plan', 'Plbn')));
  });

  it('handles binary files and empty content', () => {
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 255]);
    expect(fileFingerprint(bytes)).toBe(fileFingerprint(new Uint8Array(bytes)));
    expect(fileFingerprint(bytes)).not.toBe(fileFingerprint(new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0, 254])));
    expect(fileFingerprint('')).toMatch(/^0-/);
  });
});
