import { LayoutType } from '../types/mindmap';
import { sanitizeMapData } from '../lib/sanitize';

export interface SnapshotNode {
  data?: Record<string, any>;
  children?: SnapshotNode[];
}

export interface MapSnapshot {
  id: string;
  docId: string;
  docTitle: string;
  label: string;
  isAuto: boolean;
  createdAt: string;
  nodeCount: number;
  layout: LayoutType;
  data: {
    layout: LayoutType;
    theme?: any;
    root: SnapshotNode;
  };
}

const SNAPSHOTS_STORAGE_KEY = 'zenmind_snapshots_v1';
const MAX_SNAPSHOTS_PER_DOC = 20;
const MAX_TOTAL_SNAPSHOTS = 80;

function countNodes(node: SnapshotNode | undefined | null): number {
  if (!node) return 0;
  let total = 1;
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      total += countNodes(child);
    }
  }
  return total;
}

function normalizeSnapshotData(rawData: any): {
  layout: LayoutType;
  theme?: any;
  root: SnapshotNode;
} {
  const sanitized = sanitizeMapData(JSON.parse(JSON.stringify(rawData)));
  if (sanitized && sanitized.root) {
    return {
      layout: (sanitized.layout || 'mindMap') as LayoutType,
      theme: sanitized.theme || { template: 'default', config: {} },
      root: sanitized.root,
    };
  }
  return {
    layout: 'mindMap',
    theme: { template: 'default', config: {} },
    root: (sanitized || { data: { text: 'Central Topic' }, children: [] }) as SnapshotNode,
  };
}

function stripTransientFields(node: any): any {
  if (!node || typeof node !== 'object') return node;
  const { uid, ...restData } = node.data || {};
  return {
    data: restData,
    children: Array.isArray(node.children)
      ? node.children.map(stripTransientFields)
      : [],
  };
}

export class SnapshotService {
  static getAllSnapshots(): MapSnapshot[] {
    try {
      const raw = localStorage.getItem(SNAPSHOTS_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      return [];
    }
  }

  static getSnapshotsForDoc(docId: string): MapSnapshot[] {
    return this.getAllSnapshots()
      .filter((s) => s.docId === docId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  static createSnapshot(params: {
    docId: string;
    docTitle: string;
    label?: string;
    isAuto?: boolean;
    data: any;
  }): MapSnapshot | null {
    if (!params.data) return null;
    const normalized = normalizeSnapshotData(params.data);
    const all = this.getAllSnapshots();
    const docSnapshots = all
      .filter((s) => s.docId === params.docId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // If auto-snapshot, skip if identical to most recent snapshot for this document
    if (params.isAuto && docSnapshots.length > 0) {
      const latest = docSnapshots[0];
      const latestFingerprint = JSON.stringify({
        layout: latest.data.layout,
        theme: latest.data.theme,
        root: stripTransientFields(latest.data.root),
      });
      const currentFingerprint = JSON.stringify({
        layout: normalized.layout,
        theme: normalized.theme,
        root: stripTransientFields(normalized.root),
      });
      if (latestFingerprint === currentFingerprint) {
        return null;
      }
    }

    const snapshot: MapSnapshot = {
      id: `snap-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      docId: params.docId,
      docTitle: params.docTitle || 'Untitled Mind Map',
      label:
        params.label?.trim() ||
        (params.isAuto ? 'Auto-saved revision' : 'Manual checkpoint'),
      isAuto: Boolean(params.isAuto),
      createdAt: new Date().toISOString(),
      nodeCount: countNodes(normalized.root),
      layout: normalized.layout,
      data: normalized,
    };

    const otherDocs = all.filter((s) => s.docId !== params.docId);
    const updatedDocSnapshots = [snapshot, ...docSnapshots].slice(0, MAX_SNAPSHOTS_PER_DOC);
    const merged = [...updatedDocSnapshots, ...otherDocs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_TOTAL_SNAPSHOTS);

    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(merged));
    } catch {
      // Ignore quota errors
    }

    return snapshot;
  }

  static deleteSnapshot(id: string): void {
    const filtered = this.getAllSnapshots().filter((s) => s.id !== id);
    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore storage errors
    }
  }

  static clearDocSnapshots(docId: string): void {
    const filtered = this.getAllSnapshots().filter((s) => s.docId !== docId);
    try {
      localStorage.setItem(SNAPSHOTS_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // Ignore storage errors
    }
  }

  static instantiateSnapshot(snapshot: MapSnapshot) {
    const cloned = JSON.parse(JSON.stringify(snapshot.data));
    return sanitizeMapData(cloned);
  }
}
