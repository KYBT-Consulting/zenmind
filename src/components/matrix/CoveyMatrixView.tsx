import React, { useMemo, useState } from 'react';
import {
  Grid2x2,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  FileText,
  Compass,
  Trash2,
  CornerDownRight,
  Sparkles,
  X,
  Inbox,
  PanelRightClose,
  PanelRightOpen,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo, CoveyQuadrant, ProgressLevel } from '../../types/mindmap';
import {
  COVEY_QUADRANTS,
  CoveyQuadrantMeta,
  groupItemsByCoveyQuadrant,
} from '../../lib/coveyMatrix';
import {
  extractAllTasks,
  formatTaskDateBadge,
  getTaskDateBadgeColors,
  getTaskDateStatus,
  getTodayDateString,
  TaskItem,
} from '../../lib/taskDates';
import { cn, stripHtml } from '../../lib/utils';

type MatrixFilter = 'all' | 'active' | 'tasks' | 'attention' | 'completed';

interface CoveyMatrixViewProps {
  engine: MindMapEngine | null;
  data: any;
  activeNode: ActiveNodeInfo | null;
  onLocateNode: (uid: string) => void;
  onOpenTaskInspector: (uid: string) => void;
}

const DRAG_MIME = 'text/zenmind-matrix-uid';

export const CoveyMatrixView: React.FC<CoveyMatrixViewProps> = ({
  engine,
  data,
  activeNode,
  onLocateNode,
  onOpenTaskInspector,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<MatrixFilter>('all');
  const [showUnassigned, setShowUnassigned] = useState(true);
  const [unassignedFilter, setUnassignedFilter] = useState<'all' | 'tasks'>('all');
  const [unassignedSearch, setUnassignedSearch] = useState('');
  const [addingQuadrant, setAddingQuadrant] = useState<CoveyQuadrant | null>(null);
  const [newItemText, setNewItemText] = useState('');
  const [selectedBranchUidForNew, setSelectedBranchUidForNew] = useState<string>('');
  const [editingNodeUid, setEditingNodeUid] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [draggedUid, setDraggedUid] = useState<string | null>(null);
  const [dragOverTarget, setDragOverTarget] = useState<CoveyQuadrant | 'unassigned' | null>(null);

  const todayStr = getTodayDateString();
  const allItems = useMemo(() => extractAllTasks(data), [data]);
  const matrix = useMemo(() => groupItemsByCoveyQuadrant(allItems), [allItems]);

  const branches = useMemo((): { uid: string; title: string }[] => {
    const root = data?.root ?? data;
    if (!root || !Array.isArray(root.children)) return [];
    return root.children
      .filter((b: any) => b?.data?.uid)
      .map((b: any) => ({
        uid: b.data.uid as string,
        title: stripHtml(b.data.text || '') || 'Main Branch',
      }));
  }, [data]);

  const defaultBranchUid =
    selectedBranchUidForNew && branches.some((b) => b.uid === selectedBranchUidForNew)
      ? selectedBranchUidForNew
      : branches[0]?.uid || 'root';

  const matchesMatrixFilter = (item: TaskItem): boolean => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inText = item.text.toLowerCase().includes(q);
      const inTags = item.tags.some((t) => t.toLowerCase().includes(q));
      const inBranch = item.branchTitle.toLowerCase().includes(q);
      if (!inText && !inTags && !inBranch) return false;
    }

    const dateStatus = getTaskDateStatus(
      {
        startDate: item.startDate,
        endDate: item.endDate,
        startTime: item.startTime,
        endTime: item.endTime,
      },
      item.progress,
      todayStr
    );

    switch (filter) {
      case 'active':
        return item.progress !== 100;
      case 'tasks':
        return (
          item.progress !== null ||
          item.priority !== null ||
          Boolean(item.startDate || item.endDate || item.startTime || item.endTime)
        );
      case 'attention':
        return dateStatus === 'today' || dateStatus === 'overdue';
      case 'completed':
        return item.progress === 100;
      default:
        return true;
    }
  };

  const filteredUnassigned = useMemo(() => {
    return matrix.unassigned.filter((item) => {
      if (
        unassignedFilter === 'tasks' &&
        item.progress === null &&
        item.priority === null &&
        !item.startDate &&
        !item.endDate
      ) {
        return false;
      }
      if (unassignedSearch.trim()) {
        const q = unassignedSearch.toLowerCase();
        return (
          item.text.toLowerCase().includes(q) ||
          item.branchTitle.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [matrix.unassigned, unassignedFilter, unassignedSearch]);

  const assignedStats = useMemo(() => {
    let completed = 0;
    for (const qId of [1, 2, 3, 4] as CoveyQuadrant[]) {
      for (const item of matrix.quadrants[qId]) {
        if (item.progress === 100) completed++;
      }
    }
    const q2Share =
      matrix.counts.assigned > 0
        ? Math.round((matrix.counts.q2 / matrix.counts.assigned) * 100)
        : 0;
    return { completed, q2Share };
  }, [matrix]);

  const handleCreateQuadrantItem = (qMeta: CoveyQuadrantMeta, e: React.FormEvent) => {
    e.preventDefault();
    const title = newItemText.trim();
    if (!title || !engine) return;
    engine.addChildNodeWithData(defaultBranchUid, {
      text: title,
      icon: ['progress_0'],
      urgent: qMeta.urgent,
      important: qMeta.important,
      quadrant: qMeta.id,
    });
    setNewItemText('');
    setAddingQuadrant(null);
  };

  const handleCommitEdit = (uid: string) => {
    const trimmed = editingText.trim();
    if (trimmed && engine) {
      engine.setNodeText(trimmed, uid);
    }
    setEditingNodeUid(null);
    setEditingText('');
  };

  const cycleProgress = (card: TaskItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!engine) return;
    const order: ProgressLevel[] = [0, 25, 50, 75, 100];
    const idx = card.progress !== null ? order.indexOf(card.progress) : -1;
    const next = idx >= 0 && idx < order.length - 1 ? order[idx + 1] : 25;
    engine.setNodeProgress(next, card.uid);
  };

  const handleDropOnQuadrant = (quadrant: CoveyQuadrant, e: React.DragEvent) => {
    e.preventDefault();
    const uid = e.dataTransfer.getData(DRAG_MIME) || draggedUid;
    if (uid && engine) {
      engine.setNodeQuadrant(quadrant, uid);
    }
    setDraggedUid(null);
    setDragOverTarget(null);
  };

  const handleDropOnUnassigned = (e: React.DragEvent) => {
    e.preventDefault();
    const uid = e.dataTransfer.getData(DRAG_MIME) || draggedUid;
    if (uid && engine) {
      engine.setNodeQuadrant(null, uid);
    }
    setDraggedUid(null);
    setDragOverTarget(null);
  };

  const renderQuadrantCell = (qMeta: CoveyQuadrantMeta) => {
    const rawItems = matrix.quadrants[qMeta.id];
    const visibleItems = rawItems.filter(matchesMatrixFilter);
    const completedInQuad = rawItems.filter((i) => i.progress === 100).length;
    const isDragOver = dragOverTarget === qMeta.id;

    return (
      <div
        key={qMeta.id}
        onDragOver={(e) => {
          e.preventDefault();
          if (dragOverTarget !== qMeta.id) setDragOverTarget(qMeta.id);
        }}
        onDragLeave={(e) => {
          if (!e.currentTarget.contains(e.relatedTarget as Node)) {
            setDragOverTarget(null);
          }
        }}
        onDrop={(e) => handleDropOnQuadrant(qMeta.id, e)}
        className={cn(
          'flex flex-col rounded-2xl bg-white border shadow-2xs overflow-hidden min-h-56 transition-all',
          isDragOver ? `${qMeta.borderClass} ring-2 ${qMeta.ringClass} ${qMeta.bgClass}` : 'border-slate-200/90'
        )}
      >
        {/* Quadrant Header */}
        <div className={cn('px-3.5 py-2.5 border-b flex items-center justify-between gap-2 shrink-0', qMeta.headerBgClass, qMeta.borderClass)}>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={cn(
                  'px-1.5 py-0.5 rounded-md text-[10px] font-extrabold text-white tracking-wide shrink-0',
                  qMeta.solidBgClass
                )}
              >
                {qMeta.code}
              </span>
              <h3 className="text-xs font-bold text-slate-800 truncate">
                {qMeta.name}: {qMeta.coveyTheme}
              </h3>
              <span
                className={cn(
                  'text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-white/80 border',
                  qMeta.textClass,
                  qMeta.borderClass
                )}
              >
                {qMeta.actionLabel}
              </span>
              {qMeta.id === 2 && (
                <span className="hidden sm:inline-flex items-center gap-0.5 text-[10px] font-bold text-teal-700 bg-teal-100/80 px-1.5 py-0.5 rounded-full">
                  <Sparkles size={10} />
                  Focus Zone
                </span>
              )}
            </div>
            <p className="text-[10px] text-slate-500 truncate mt-0.5">{qMeta.description}</p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="px-1.5 py-0.5 rounded-md bg-white/90 border border-slate-200/80 text-slate-700 text-[10px] font-bold">
              {rawItems.length > 0 ? `${completedInQuad}/${rawItems.length}` : '0'}
            </span>
            <button
              type="button"
              title={`Add item to ${qMeta.name}`}
              onClick={() => {
                setAddingQuadrant(qMeta.id);
                setNewItemText('');
              }}
              className={cn(
                'p-1 rounded-lg bg-white/80 hover:bg-white border border-transparent hover:border-slate-200 transition-colors cursor-pointer',
                qMeta.textClass
              )}
            >
              <Plus size={14} />
            </button>
          </div>
        </div>

        {/* Quadrant Cards Scroll Body */}
        <div className="flex-1 overflow-y-auto p-2.5 space-y-2 custom-scrollbar bg-slate-50/40">
          {addingQuadrant === qMeta.id && (
            <form
              onSubmit={(e) => handleCreateQuadrantItem(qMeta, e)}
              className="bg-white p-2.5 rounded-xl border border-indigo-300 shadow-xs space-y-2"
            >
              <input
                type="text"
                autoFocus
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                placeholder={`New ${qMeta.axisLabel.toLowerCase()} item...`}
                className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
              />
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400 truncate">
                  {qMeta.code} • {qMeta.axisLabel}
                </span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAddingQuadrant(null)}
                    className="px-2 py-1 rounded text-[11px] font-medium text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={cn(
                      'px-2.5 py-1 rounded text-white text-[11px] font-semibold cursor-pointer',
                      qMeta.solidBgClass
                    )}
                  >
                    Add
                  </button>
                </div>
              </div>
            </form>
          )}

          {visibleItems.map((card) => {
            const isSelected = activeNode?.uid === card.uid;
            const isDone = card.progress === 100;
            const dateBadge = formatTaskDateBadge({
              startDate: card.startDate,
              endDate: card.endDate,
              startTime: card.startTime,
              endTime: card.endTime,
            });
            const dateStatus = dateBadge
              ? getTaskDateStatus(
                  {
                    startDate: card.startDate,
                    endDate: card.endDate,
                    startTime: card.startTime,
                    endTime: card.endTime,
                  },
                  card.progress,
                  todayStr
                )
              : null;
            const dateColors = dateBadge ? getTaskDateBadgeColors(dateStatus) : null;

            return (
              <div
                key={card.uid}
                draggable={editingNodeUid !== card.uid}
                onDragStart={(e) => {
                  setDraggedUid(card.uid);
                  e.dataTransfer.setData(DRAG_MIME, card.uid);
                  e.dataTransfer.effectAllowed = 'move';
                }}
                onDragEnd={() => {
                  setDraggedUid(null);
                  setDragOverTarget(null);
                }}
                onClick={() => engine?.selectNodeByUid(card.uid, false)}
                className={cn(
                  'group bg-white rounded-xl p-2.5 border shadow-2xs hover:shadow-sm transition-all cursor-pointer',
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                    : 'border-slate-200/90 hover:border-slate-300'
                )}
              >
                {/* Branch & Subtopic Context Row */}
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mb-1 truncate">
                  <span className="font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded truncate max-w-36">
                    {card.branchTitle}
                  </span>
                  {card.depth > 2 && card.parentText && (
                    <span className="inline-flex items-center gap-0.5 truncate">
                      <CornerDownRight size={10} className="shrink-0" />
                      <span className="truncate">{card.parentText}</span>
                    </span>
                  )}
                </div>

                {/* Title & Quick Actions */}
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    aria-label={isDone ? 'Mark as To Do' : 'Mark as Completed'}
                    onClick={(e) => {
                      e.stopPropagation();
                      engine?.toggleNodeCheckbox(card.uid);
                    }}
                    className={cn(
                      'mt-0.5 shrink-0 transition-colors cursor-pointer',
                      isDone ? 'text-emerald-600' : 'text-slate-300 hover:text-indigo-600'
                    )}
                  >
                    {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {editingNodeUid === card.uid ? (
                      <input
                        type="text"
                        autoFocus
                        value={editingText}
                        onChange={(e) => setEditingText(e.target.value)}
                        onBlur={() => handleCommitEdit(card.uid)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommitEdit(card.uid);
                          if (e.key === 'Escape') setEditingNodeUid(null);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full text-xs font-semibold text-slate-800 border border-indigo-400 rounded px-1.5 py-0.5 focus:outline-none"
                      />
                    ) : (
                      <p
                        onDoubleClick={(e) => {
                          e.stopPropagation();
                          setEditingNodeUid(card.uid);
                          setEditingText(card.text);
                        }}
                        title="Double-click to edit title"
                        className={cn(
                          'text-xs font-semibold leading-snug break-words',
                          isDone ? 'line-through text-slate-400' : 'text-slate-800'
                        )}
                      >
                        {card.text}
                      </p>
                    )}
                  </div>

                  {/* Hover Action Buttons */}
                  <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                    <button
                      type="button"
                      title="Edit Task & Quadrant Attributes"
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenTaskInspector(card.uid);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      <Calendar size={12} />
                    </button>
                    <button
                      type="button"
                      title="Locate on Mind Map"
                      onClick={(e) => {
                        e.stopPropagation();
                        onLocateNode(card.uid);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 cursor-pointer"
                    >
                      <Compass size={12} />
                    </button>
                    <button
                      type="button"
                      title="Unassign from Matrix"
                      onClick={(e) => {
                        e.stopPropagation();
                        engine?.setNodeQuadrant(null, card.uid);
                      }}
                      className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
                    >
                      <X size={12} />
                    </button>
                    <button
                      type="button"
                      title="Delete Topic"
                      onClick={(e) => {
                        e.stopPropagation();
                        engine?.deleteNodeByUid(card.uid);
                      }}
                      className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 cursor-pointer"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                {/* Metadata Badges */}
                {(card.priority !== null ||
                  card.progress !== null ||
                  dateBadge ||
                  card.tags.length > 0 ||
                  card.note) && (
                  <div className="mt-2 flex flex-wrap items-center gap-1.5">
                    {card.priority !== null && (
                      <span
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-none',
                          card.priority === 1
                            ? 'bg-rose-500'
                            : card.priority === 2
                            ? 'bg-amber-500'
                            : card.priority === 3
                            ? 'bg-blue-500'
                            : 'bg-slate-500'
                        )}
                      >
                        P{card.priority}
                      </span>
                    )}

                    {card.progress !== null && (
                      <button
                        type="button"
                        onClick={(e) => cycleProgress(card, e)}
                        title="Click to cycle progress"
                        className={cn(
                          'px-1.5 py-0.5 rounded text-[10px] font-bold leading-none transition-colors cursor-pointer',
                          card.progress === 100
                            ? 'bg-emerald-100 text-emerald-700'
                            : card.progress > 0
                            ? 'bg-indigo-100 text-indigo-700'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        )}
                      >
                        {card.progress}%
                      </button>
                    )}

                    {dateBadge && dateColors && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenTaskInspector(card.uid);
                        }}
                        className={cn(
                          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold border transition-colors cursor-pointer',
                          dateColors.bgClass,
                          dateColors.textClass,
                          dateColors.borderClass
                        )}
                      >
                        <Calendar size={10} />
                        <span>{dateBadge}</span>
                      </button>
                    )}

                    {card.tags.map((t) => (
                      <span
                        key={t}
                        className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-medium"
                      >
                        #{t}
                      </span>
                    ))}

                    {card.note && (
                      <span
                        title={card.note}
                        className="inline-flex items-center gap-0.5 text-[10px] text-slate-400 ml-auto"
                      >
                        <FileText size={11} />
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}

          {visibleItems.length === 0 && addingQuadrant !== qMeta.id && (
            <div className="h-full min-h-28 py-5 px-4 flex flex-col items-center justify-center text-center rounded-xl border border-dashed border-slate-200/90 text-slate-400 text-xs">
              <p className="font-medium text-slate-500">{qMeta.axisLabel}</p>
              <p className="text-[11px] mt-0.5">
                Drag topics here or{' '}
                <button
                  type="button"
                  onClick={() => {
                    setAddingQuadrant(qMeta.id);
                    setNewItemText('');
                  }}
                  className={cn('font-semibold hover:underline cursor-pointer', qMeta.textClass)}
                >
                  add an item
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-100/80 select-none overflow-hidden">
      {/* Top Matrix Header */}
      <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600">
            <Grid2x2 size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {matrix.counts.assigned} Classified
              </span>
              {matrix.counts.assigned > 0 && (
                <span
                  title="Percentage of classified items in Quadrant II (Not Urgent & Important — Effectiveness)"
                  className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200"
                >
                  Q2 Focus: {assignedStats.q2Share}%
                </span>
              )}
              {matrix.counts.assigned > 0 && (
                <span className="hidden xl:inline text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {assignedStats.completed}/{matrix.counts.assigned} Done
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500">
              Assign Urgency &amp; Importance attributes to any topic or drag items across quadrants
            </p>
          </div>
        </div>

        {/* Controls: New Target Branch, Search, Filter, Unassigned Drawer Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {branches.length > 0 && (
            <div className="hidden xl:flex items-center gap-1.5 text-[11px] text-slate-500 mr-1">
              <span>New items in:</span>
              <select
                aria-label="Target branch for new matrix items"
                value={defaultBranchUid}
                onChange={(e) => setSelectedBranchUidForNew(e.target.value)}
                className="px-2 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                {branches.map((b) => (
                  <option key={b.uid} value={b.uid}>
                    {b.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter matrix..."
              className="pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-40"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-[11px] font-semibold">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'active', label: 'Active' },
                { id: 'tasks', label: 'Tasks' },
                { id: 'attention', label: 'Due/Late' },
                { id: 'completed', label: 'Done' },
              ] as { id: MatrixFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-2 py-1 rounded-md transition-all cursor-pointer',
                  filter === f.id
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            aria-pressed={showUnassigned}
            onClick={() => setShowUnassigned((v) => !v)}
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverTarget !== 'unassigned') setDragOverTarget('unassigned');
            }}
            onDragLeave={() => setDragOverTarget(null)}
            onDrop={handleDropOnUnassigned}
            title="Toggle Unassigned Mind Map Topics Triage Panel"
            className={cn(
              'flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer',
              dragOverTarget === 'unassigned'
                ? 'border-indigo-500 bg-indigo-50 text-indigo-700 ring-2 ring-indigo-400/30'
                : showUnassigned
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            )}
          >
            {showUnassigned ? <PanelRightClose size={14} /> : <PanelRightOpen size={14} />}
            <span>Unassigned</span>
            <span
              className={cn(
                'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                showUnassigned ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
              )}
            >
              {matrix.counts.unassigned}
            </span>
          </button>
        </div>
      </div>

      {/* Main Split Workspace: 2x2 Matrix Grid + Optional Unassigned Triage Sidebar */}
      <div className="flex-1 flex gap-4 p-4 overflow-hidden">
        {/* Left/Center: 2x2 Covey Matrix with Urgent/Important Axis Headers */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto md:overflow-hidden">
          {/* Column Axis Headers: URGENT vs NOT URGENT */}
          <div className="hidden md:grid md:grid-cols-2 gap-3 pl-8 mb-2 shrink-0">
            <div className="px-3 py-1.5 rounded-xl bg-rose-50/70 border border-rose-200/70 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700">
                Urgent
              </span>
              <span className="text-[10px] font-medium text-rose-600/80">
                Requires immediate action
              </span>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-teal-50/70 border border-teal-200/70 flex items-center justify-between">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-teal-700">
                Not Urgent
              </span>
              <span className="text-[10px] font-medium text-teal-600/80">
                Proactive &amp; strategic focus
              </span>
            </div>
          </div>

          {/* Matrix Rows: Row 1 = IMPORTANT (Q1, Q2), Row 2 = NOT IMPORTANT (Q3, Q4) */}
          <div className="flex-1 grid grid-cols-1 md:grid-rows-2 gap-3 min-h-0">
            {/* Row 1: IMPORTANT */}
            <div className="flex gap-2 min-h-0">
              <div className="hidden md:flex w-6 shrink-0 rounded-xl bg-teal-50/80 border border-teal-200/70 items-center justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-teal-700 [writing-mode:vertical-lr] rotate-180">
                  Important
                </span>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
                {renderQuadrantCell(COVEY_QUADRANTS[0])}
                {renderQuadrantCell(COVEY_QUADRANTS[1])}
              </div>
            </div>

            {/* Row 2: NOT IMPORTANT */}
            <div className="flex gap-2 min-h-0">
              <div className="hidden md:flex w-6 shrink-0 rounded-xl bg-slate-200/70 border border-slate-300/70 items-center justify-center">
                <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-600 [writing-mode:vertical-lr] rotate-180">
                  Not Important
                </span>
              </div>
              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3 min-h-0">
                {renderQuadrantCell(COVEY_QUADRANTS[2])}
                {renderQuadrantCell(COVEY_QUADRANTS[3])}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Unassigned Topics Triage Queue */}
        {showUnassigned && (
          <aside
            onDragOver={(e) => {
              e.preventDefault();
              if (dragOverTarget !== 'unassigned') setDragOverTarget('unassigned');
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverTarget(null);
              }
            }}
            onDrop={handleDropOnUnassigned}
            className={cn(
              'w-80 xl:w-88 shrink-0 bg-white rounded-2xl border shadow-2xs flex flex-col overflow-hidden transition-all',
              dragOverTarget === 'unassigned'
                ? 'border-indigo-500 ring-2 ring-indigo-400/30 bg-indigo-50/20'
                : 'border-slate-200'
            )}
          >
            <div className="px-3.5 py-3 border-b border-slate-100 flex items-center justify-between gap-2 bg-slate-50/60 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <Inbox size={14} className="text-indigo-600 shrink-0" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 truncate">
                  Unassigned ({filteredUnassigned.length})
                </h3>
              </div>

              <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-semibold shrink-0">
                <button
                  type="button"
                  onClick={() => setUnassignedFilter('all')}
                  className={cn(
                    'px-2 py-0.5 rounded-md cursor-pointer',
                    unassignedFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                  )}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setUnassignedFilter('tasks')}
                  className={cn(
                    'px-2 py-0.5 rounded-md cursor-pointer',
                    unassignedFilter === 'tasks' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                  )}
                >
                  Tasks
                </button>
              </div>
            </div>

            <div className="px-3 pt-2.5 shrink-0">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={unassignedSearch}
                  onChange={(e) => setUnassignedSearch(e.target.value)}
                  placeholder="Search unassigned topics..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {filteredUnassigned.map((item) => {
                const isSelected = activeNode?.uid === item.uid;
                return (
                  <div
                    key={item.uid}
                    draggable
                    onDragStart={(e) => {
                      setDraggedUid(item.uid);
                      e.dataTransfer.setData(DRAG_MIME, item.uid);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onDragEnd={() => {
                      setDraggedUid(null);
                      setDragOverTarget(null);
                    }}
                    onClick={() => engine?.selectNodeByUid(item.uid, false)}
                    className={cn(
                      'p-2.5 rounded-xl border flex flex-col gap-2 transition-all cursor-pointer',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40'
                        : 'border-slate-200/80 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          {item.priority !== null && (
                            <span className="px-1 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold shrink-0">
                              P{item.priority}
                            </span>
                          )}
                          <span className="text-xs font-semibold text-slate-800 break-words">
                            {item.text}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 block truncate mt-0.5">
                          {item.branchTitle}
                        </span>
                      </div>
                      <button
                        type="button"
                        title="Locate on Mind Map"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateNode(item.uid);
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 shrink-0 cursor-pointer"
                      >
                        <Compass size={12} />
                      </button>
                    </div>

                    {/* One-Click Quadrant Triage Buttons */}
                    <div className="grid grid-cols-4 gap-1">
                      {COVEY_QUADRANTS.map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          title={`Assign to ${q.name}: ${q.axisLabel} (${q.actionLabel})`}
                          onClick={(e) => {
                            e.stopPropagation();
                            engine?.setNodeQuadrant(q.id, item.uid);
                          }}
                          className={cn(
                            'py-1 rounded-md text-[10px] font-bold border transition-colors cursor-pointer',
                            q.bgClass,
                            q.textClass,
                            q.borderClass,
                            'hover:opacity-90'
                          )}
                        >
                          {q.code}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}

              {filteredUnassigned.length === 0 && (
                <div className="py-10 px-4 text-center text-xs text-slate-400">
                  <p className="font-semibold text-slate-500">All matching topics are classified!</p>
                  <p className="text-[11px] mt-1">
                    Drag any card back here or click × on a card to unassign it from the matrix.
                  </p>
                </div>
              )}
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
