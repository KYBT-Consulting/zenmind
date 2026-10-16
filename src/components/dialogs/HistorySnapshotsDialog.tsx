import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  X,
  Camera,
  RotateCcw,
  FilePlus2,
  Trash2,
  Clock,
  Layers,
  Check,
} from 'lucide-react';
import { useDialogA11y } from '../../lib/useDialogA11y';
import { MapSnapshot, SnapshotService } from '../../services/snapshotService';
import { LAYOUT_OPTIONS, THEME_PRESETS } from '../../types/mindmap';
import { MindMapEngine } from '../../engine/MindMapEngine';

interface HistorySnapshotsDialogProps {
  isOpen: boolean;
  docId: string;
  docTitle: string;
  engine: MindMapEngine | null;
  onRestoreToActive: (data: any, label: string) => void;
  onOpenInNewTab: (title: string, data: any) => void;
  onClose: () => void;
}

function stripHtml(text: string): string {
  return String(text || '').replace(/<[^>]*>/g, '').trim();
}

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffSec = Math.round((Date.now() - date.getTime()) / 1000);
  if (diffSec < 10) return 'Just now';
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  return date.toLocaleString();
}

export const HistorySnapshotsDialog: React.FC<HistorySnapshotsDialogProps> = ({
  isOpen,
  docId,
  docTitle,
  engine,
  onRestoreToActive,
  onOpenInNewTab,
  onClose,
}) => {
  const [snapshots, setSnapshots] = useState<MapSnapshot[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [labelInput, setLabelInput] = useState('');
  const [showAllDocs, setShowAllDocs] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  const reloadSnapshots = (selectLatest = false) => {
    const list = showAllDocs
      ? SnapshotService.getAllSnapshots()
      : SnapshotService.getSnapshotsForDoc(docId);
    setSnapshots(list);
    if (selectLatest && list.length > 0) {
      setSelectedId(list[0].id);
    } else if (list.length > 0 && (!selectedId || !list.some((s) => s.id === selectedId))) {
      setSelectedId(list[0].id);
    } else if (list.length === 0) {
      setSelectedId(null);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    reloadSnapshots(true);
    setLabelInput('');
    setJustSaved(false);
  }, [isOpen, docId, showAllDocs]);

  const selectedSnapshot = useMemo(
    () => snapshots.find((s) => s.id === selectedId) || null,
    [snapshots, selectedId]
  );

  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);
  if (!isOpen) return null;

  const handleTakeSnapshot = (e: React.FormEvent) => {
    e.preventDefault();
    if (!engine) return;
    const raw = engine.getData();
    if (!raw) return;

    const created = SnapshotService.createSnapshot({
      docId,
      docTitle,
      label: labelInput.trim() || 'Manual checkpoint',
      isAuto: false,
      data: raw,
    });
    if (created) {
      setLabelInput('');
      setJustSaved(true);
      setTimeout(() => setJustSaved(false), 2000);
      const list = showAllDocs
        ? SnapshotService.getAllSnapshots()
        : SnapshotService.getSnapshotsForDoc(docId);
      setSnapshots(list);
      setSelectedId(created.id);
    }
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    SnapshotService.deleteSnapshot(id);
    reloadSnapshots(false);
  };

  const getLayoutLabel = (layout: string) =>
    LAYOUT_OPTIONS.find((l) => l.id === layout)?.name || layout;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-snapshots-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <History size={17} />
            </div>
            <div>
              <h3 id="history-snapshots-title" className="text-sm font-semibold text-slate-800">
                Version History & Snapshots
              </h3>
              <p className="text-[11px] text-slate-500">
                Create named checkpoints or restore earlier states of &ldquo;{docTitle}&rdquo;
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5 text-xs text-slate-600 cursor-pointer select-none px-2 py-1 rounded hover:bg-slate-100">
              <input
                type="checkbox"
                checked={showAllDocs}
                onChange={(e) => setShowAllDocs(e.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Show all tabs
            </label>
            <button
              onClick={onClose}
              aria-label="Close version history dialog"
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Create Snapshot Bar */}
        <form
          onSubmit={handleTakeSnapshot}
          className="px-5 py-3 bg-indigo-50/50 border-b border-indigo-100 flex flex-wrap items-center gap-2.5"
        >
          <input
            type="text"
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            placeholder="Snapshot label (e.g. Before restructuring Q3 roadmap)..."
            className="flex-1 min-w-[220px] px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500"
          />
          <button
            type="submit"
            disabled={!engine}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 transition-colors shadow-sm"
          >
            {justSaved ? <Check size={14} /> : <Camera size={14} />}
            {justSaved ? 'Snapshot Saved!' : 'Take Snapshot Now'}
          </button>
        </form>

        {/* Body */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Left Timeline List */}
          <div className="w-72 border-r border-slate-100 bg-slate-50/40 overflow-y-auto p-3 space-y-1.5 shrink-0">
            {snapshots.length === 0 ? (
              <div className="text-center py-12 px-3">
                <Clock size={26} className="mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-medium text-slate-600">No snapshots yet</p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Take a manual checkpoint above or keep editing — ZenMind periodically records
                  revisions automatically.
                </p>
              </div>
            ) : (
              snapshots.map((snap) => {
                const active = snap.id === selectedId;
                return (
                  <div
                    key={snap.id}
                    onClick={() => setSelectedId(snap.id)}
                    className={`group relative rounded-lg p-2.5 cursor-pointer border transition-all ${
                      active
                        ? 'bg-white border-indigo-300 shadow-sm ring-1 ring-indigo-500/20'
                        : 'bg-transparent border-transparent hover:bg-white hover:border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                              snap.isAuto ? 'bg-amber-400' : 'bg-indigo-600'
                            }`}
                          />
                          <p className="text-xs font-semibold text-slate-800 truncate">
                            {snap.label}
                          </p>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-0.5 pl-3">
                          {formatRelativeTime(snap.createdAt)} · {snap.nodeCount} topics
                        </p>
                        {showAllDocs && (
                          <p className="text-[10px] text-indigo-600 font-medium mt-0.5 pl-3 truncate">
                            {snap.docTitle}
                          </p>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={(e) => handleDelete(snap.id, e)}
                        title="Delete snapshot"
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Inspector / Preview */}
          <div className="flex-1 p-5 overflow-y-auto flex flex-col justify-between">
            {selectedSnapshot ? (
              <>
                <div>
                  <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                            selectedSnapshot.isAuto
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          }`}
                        >
                          {selectedSnapshot.isAuto ? 'Auto-Snapshot' : 'Manual Checkpoint'}
                        </span>
                        <span className="text-xs text-slate-400">
                          {new Date(selectedSnapshot.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <h4 className="text-base font-semibold text-slate-800 mt-1.5">
                        {selectedSnapshot.label}
                      </h4>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-slate-600">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium">
                        {selectedSnapshot.nodeCount} Topics
                      </span>
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 font-medium">
                        {getLayoutLabel(selectedSnapshot.layout)}
                      </span>
                    </div>
                  </div>

                  {/* Outline Preview */}
                  <div className="mt-4">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 mb-2.5">
                      <Layers size={13} className="text-indigo-500" />
                      Snapshot Structure Preview
                    </div>
                    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 max-h-64 overflow-y-auto">
                      <div className="font-semibold text-sm text-slate-800 mb-2 flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-600" />
                        {stripHtml(selectedSnapshot.data.root?.data?.text || 'Root Topic')}
                      </div>
                      <div className="pl-4 border-l-2 border-indigo-200 space-y-2">
                        {(selectedSnapshot.data.root?.children || []).map((branch, idx) => (
                          <div key={idx} className="text-xs">
                            <div className="font-medium text-slate-700">
                              {stripHtml(branch.data?.text || 'Branch')}
                            </div>
                            {Array.isArray(branch.children) && branch.children.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {branch.children.slice(0, 6).map((leaf, lIdx) => (
                                  <span
                                    key={lIdx}
                                    className="px-2 py-0.5 text-[11px] rounded bg-white border border-slate-200 text-slate-600"
                                  >
                                    {stripHtml(leaf.data?.text || 'Subtopic')}
                                  </span>
                                ))}
                                {branch.children.length > 6 && (
                                  <span className="text-[11px] text-slate-400 px-1">
                                    +{branch.children.length - 6} more
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Restore Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                  <span className="text-[11px] text-slate-400">
                    Restoring replaces the current canvas state (you can still Undo or take a
                    snapshot first).
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const data = SnapshotService.instantiateSnapshot(selectedSnapshot);
                        onOpenInNewTab(
                          `${selectedSnapshot.docTitle} (${selectedSnapshot.label})`,
                          data
                        );
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                    >
                      <FilePlus2 size={14} />
                      Open in New Tab
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const data = SnapshotService.instantiateSnapshot(selectedSnapshot);
                        onRestoreToActive(data, selectedSnapshot.label);
                        onClose();
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      <RotateCcw size={14} />
                      Restore to Current Map
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
                <History size={32} className="text-slate-300 mb-2" />
                <p className="text-sm font-medium text-slate-600">Select a snapshot to inspect</p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Choose any checkpoint on the left to preview its hierarchy and restore it.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
