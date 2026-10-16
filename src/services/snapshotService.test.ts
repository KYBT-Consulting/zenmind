import { beforeEach, describe, expect, it } from 'vitest';
import { SnapshotService } from './snapshotService';

describe('SnapshotService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  const sampleDoc = (rootText = 'Product Strategy') => ({
    layout: 'mindMap',
    theme: { template: 'default', config: {} },
    root: {
      data: { text: rootText, uid: 'transient-uid-1' },
      children: [
        { data: { text: 'Phase 1', uid: 'transient-uid-2' }, children: [] },
        { data: { text: 'Phase 2', uid: 'transient-uid-3' }, children: [] },
      ],
    },
  });

  it('creates manual snapshots and counts topics accurately', () => {
    const snap = SnapshotService.createSnapshot({
      docId: 'tab-1',
      docTitle: 'Roadmap',
      label: 'Initial baseline',
      isAuto: false,
      data: sampleDoc(),
    });

    expect(snap).not.toBeNull();
    expect(snap?.nodeCount).toBe(3);
    expect(snap?.label).toBe('Initial baseline');

    const list = SnapshotService.getSnapshotsForDoc('tab-1');
    expect(list).toHaveLength(1);
  });

  it('deduplicates consecutive identical auto-snapshots ignoring transient uids', () => {
    const first = SnapshotService.createSnapshot({
      docId: 'tab-1',
      docTitle: 'Roadmap',
      isAuto: true,
      data: sampleDoc('Same Content'),
    });
    expect(first).not.toBeNull();

    const duplicate = SnapshotService.createSnapshot({
      docId: 'tab-1',
      docTitle: 'Roadmap',
      isAuto: true,
      data: {
        ...sampleDoc('Same Content'),
        root: {
          ...sampleDoc('Same Content').root,
          data: { text: 'Same Content', uid: 'different-uid-999' },
        },
      },
    });
    expect(duplicate).toBeNull();
    expect(SnapshotService.getSnapshotsForDoc('tab-1')).toHaveLength(1);
  });

  it('deletes individual snapshots and instantiates sanitized copies', () => {
    const snap = SnapshotService.createSnapshot({
      docId: 'tab-2',
      docTitle: 'Architecture',
      label: 'Checkpoint A',
      data: sampleDoc('System Core'),
    })!;

    const restored = SnapshotService.instantiateSnapshot(snap);
    expect(restored.root.data.text).toBe('System Core');

    SnapshotService.deleteSnapshot(snap.id);
    expect(SnapshotService.getSnapshotsForDoc('tab-2')).toHaveLength(0);
  });
});
