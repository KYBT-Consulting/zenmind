import React, { useState, useMemo } from 'react';
import {
  Kanban,
  Plus,
  Search,
  CheckCircle2,
  Circle,
  Calendar,
  Clock,
  FileText,
  Compass,
  Trash2,
  CornerDownRight,
  SlidersHorizontal,
  Filter,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo, ProgressLevel } from '../../types/mindmap';
import {
  extractKanbanColumns,
  formatTaskDateBadge,
  getTaskDateBadgeColors,
  getTaskDateStatus,
  getTodayDateString,
  TaskItem,
} from '../../lib/taskDates';
import { getCoveyQuadrantMeta } from '../../lib/coveyMatrix';
import { cn, stripHtml } from '../../lib/utils';

type KanbanFilter = 'all' | 'tasks' | 'today' | 'overdue' | 'completed';

interface KanbanViewProps {
  engine: MindMapEngine | null;
  data: any;
  activeNode: ActiveNodeInfo | null;
  onLocateNode: (uid: string) => void;
  onOpenTaskInspector: (uid: string) => void;
}

export const KanbanView: React.FC<KanbanViewProps> = ({
  engine,
  data,
  activeNode,
  onLocateNode,
  onOpenTaskInspector,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<KanbanFilter>('all');
  const [addingCardColUid, setAddingCardColUid] = useState<string | null>(null);
  const [newCardTitle, setNewCardTitle] = useState('');
  const [addingColumn, setAddingColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [editingNodeUid, setEditingNodeUid] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [draggedCardUid, setDraggedCardUid] = useState<string | null>(null);
  const [dragOverColUid, setDragOverColUid] = useState<string | null>(null);
  const [dragOverCardUid, setDragOverCardUid] = useState<string | null>(null);

  const todayStr = getTodayDateString();
  const columns = useMemo(() => extractKanbanColumns(data), [data]);
  const rootTitle = useMemo(() => {
    const root = data?.root ?? data;
    return stripHtml(root?.data?.text || '') || 'Central Topic';
  }, [data]);

  const matchesFilter = (card: TaskItem): boolean => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const inText = card.text.toLowerCase().includes(q);
      const inTags = card.tags.some((t) => t.toLowerCase().includes(q));
      const inBranch = card.branchTitle.toLowerCase().includes(q);
      if (!inText && !inTags && !inBranch) return false;
    }

    const status = getTaskDateStatus(
      {
        startDate: card.startDate,
        endDate: card.endDate,
        startTime: card.startTime,
        endTime: card.endTime,
      },
      card.progress,
      todayStr
    );

    switch (filter) {
      case 'tasks':
        return (
          card.progress !== null ||
          card.priority !== null ||
          Boolean(card.startDate || card.endDate || card.startTime || card.endTime)
        );
      case 'today':
        return status === 'today';
      case 'overdue':
        return status === 'overdue';
      case 'completed':
        return card.progress === 100;
      default:
        return true;
    }
  };

  // Aggregate stats across all cards
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    let overdue = 0;
    let dueToday = 0;
    for (const col of columns) {
      for (const c of col.cards) {
        total++;
        if (c.progress === 100) completed++;
        const st = getTaskDateStatus(c, c.progress, todayStr);
        if (st === 'overdue') overdue++;
        if (st === 'today') dueToday++;
      }
    }
    return { total, completed, overdue, dueToday };
  }, [columns, todayStr]);

  const handleCreateCard = (branchUid: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newCardTitle.trim();
    if (!title || !engine) return;
    engine.addChildNodeWithData(branchUid, {
      text: title,
      icon: ['progress_0'],
    });
    setNewCardTitle('');
    setAddingCardColUid(null);
  };

  const handleCreateColumn = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newColumnTitle.trim();
    if (!title || !engine) return;
    engine.addChildNodeWithData('root', {
      text: title,
      expand: true,
    });
    setNewColumnTitle('');
    setAddingColumn(false);
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

  return (
    <div className="w-full h-full flex flex-col bg-slate-100/80 select-none overflow-hidden">
      {/* Kanban Header Bar */}
      <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
            <Kanban size={17} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800">{rootTitle} — Kanban Board</h2>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                {columns.length} {columns.length === 1 ? 'Branch Column' : 'Branch Columns'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Each first-level branch is a column • Drag cards between columns to reorganize your mind map
            </p>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Stats */}
          <div className="hidden lg:flex items-center gap-2 mr-2 text-[11px] font-semibold">
            <span className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600">
              {stats.completed}/{stats.total} Done
            </span>
            {stats.dueToday > 0 && (
              <span className="px-2 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200">
                {stats.dueToday} Due Today
              </span>
            )}
            {stats.overdue > 0 && (
              <span className="px-2 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                {stats.overdue} Overdue
              </span>
            )}
          </div>

          <div className="relative">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter cards or tags..."
              className="pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 w-44"
            />
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 text-[11px] font-semibold">
            {(
              [
                { id: 'all', label: 'All' },
                { id: 'tasks', label: 'Tasks Only' },
                { id: 'today', label: 'Today' },
                { id: 'overdue', label: 'Overdue' },
                { id: 'completed', label: 'Done' },
              ] as { id: KanbanFilter; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilter(f.id)}
                className={cn(
                  'px-2.5 py-1 rounded-md transition-all cursor-pointer',
                  filter === f.id
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Kanban Columns Horizontal Scroll Area */}
      <div className="flex-1 overflow-x-auto overflow-y-hidden p-5">
        <div className="flex items-start gap-4 h-full min-w-max">
          {columns.map((col) => {
            const visibleCards = col.cards.filter(matchesFilter);
            const completedCount = col.cards.filter((c) => c.progress === 100).length;
            const totalCount = col.cards.length;
            const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isColSelected = activeNode?.uid === col.uid;
            const isDragTarget = dragOverColUid === col.uid;

            return (
              <div
                key={col.uid}
                onDragOver={(e) => {
                  e.preventDefault();
                  if (dragOverColUid !== col.uid) setDragOverColUid(col.uid);
                  // Card dragover stops propagation, so reaching here means the pointer is over the
                  // column itself (not a card): drop appends to this column rather than before a stale card.
                  if (dragOverCardUid !== null) setDragOverCardUid(null);
                }}
                onDragLeave={(e) => {
                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                    setDragOverColUid(null);
                  }
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  const sourceUid = e.dataTransfer.getData('text/zenmind-card-uid') || draggedCardUid;
                  // Dropping a card back onto itself leaves it where it is.
                  if (sourceUid && engine && sourceUid !== dragOverCardUid) {
                    engine.moveNodeToBranch(sourceUid, col.uid, dragOverCardUid || undefined);
                  }
                  setDraggedCardUid(null);
                  setDragOverColUid(null);
                  setDragOverCardUid(null);
                }}
                className={cn(
                  'w-80 shrink-0 max-h-full flex flex-col rounded-2xl bg-slate-200/60 border transition-all',
                  isDragTarget
                    ? 'border-indigo-500 ring-2 ring-indigo-400/30 bg-indigo-50/40'
                    : isColSelected
                    ? 'border-indigo-400 shadow-md'
                    : 'border-slate-200/90'
                )}
              >
                {/* Column Header */}
                <div
                  onClick={() => engine?.selectNodeByUid(col.uid, false)}
                  className="p-3.5 bg-white/90 rounded-t-2xl border-b border-slate-200/80 cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: col.borderColor || col.fillColor || '#4f46e5' }}
                      />
                      {editingNodeUid === col.uid ? (
                        <input
                          type="text"
                          autoFocus
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          onBlur={() => handleCommitEdit(col.uid)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleCommitEdit(col.uid);
                            if (e.key === 'Escape') setEditingNodeUid(null);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="text-xs font-bold text-slate-800 bg-white border border-indigo-400 rounded px-1.5 py-0.5 w-full focus:outline-none"
                        />
                      ) : (
                        <h3
                          onDoubleClick={(e) => {
                            e.stopPropagation();
                            setEditingNodeUid(col.uid);
                            setEditingText(col.title);
                          }}
                          title="Double-click to rename column branch"
                          className="text-xs font-bold text-slate-800 truncate"
                        >
                          {col.title}
                        </h3>
                      )}
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {visibleCards.length}
                      </span>
                      <button
                        type="button"
                        title="Add Task Card to Column"
                        onClick={(e) => {
                          e.stopPropagation();
                          setAddingCardColUid(col.uid);
                          setNewCardTitle('');
                        }}
                        className="p-1 rounded-lg hover:bg-indigo-50 text-slate-500 hover:text-indigo-600 transition-colors cursor-pointer"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Branch Completion Bar */}
                  {totalCount > 0 && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-emerald-500 rounded-full transition-all duration-300"
                          style={{ width: `${completionPct}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {completedCount}/{totalCount}
                      </span>
                    </div>
                  )}
                </div>

                {/* Cards List */}
                <div className="flex-1 overflow-y-auto p-2.5 space-y-2.5 custom-scrollbar">
                  {visibleCards.map((card) => {
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
                          setDraggedCardUid(card.uid);
                          e.dataTransfer.setData('text/zenmind-card-uid', card.uid);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onDragOver={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (dragOverColUid !== col.uid) setDragOverColUid(col.uid);
                          if (dragOverCardUid !== card.uid) setDragOverCardUid(card.uid);
                        }}
                        onDragEnd={() => {
                          setDraggedCardUid(null);
                          setDragOverColUid(null);
                          setDragOverCardUid(null);
                        }}
                        onClick={() => engine?.selectNodeByUid(card.uid, false)}
                        className={cn(
                          'group bg-white rounded-xl p-3 border shadow-2xs hover:shadow-md transition-all cursor-pointer relative',
                          isSelected
                            ? 'border-indigo-500 ring-2 ring-indigo-500/20'
                            : 'border-slate-200/90 hover:border-slate-300',
                          dragOverCardUid === card.uid && draggedCardUid !== card.uid
                            ? 'border-t-2 border-t-indigo-600'
                            : ''
                        )}
                      >
                        {/* Nested Subtopic Parent Breadcrumb */}
                        {card.depth > 2 && card.parentText && (
                          <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400 mb-1 truncate">
                            <CornerDownRight size={10} className="shrink-0" />
                            <span className="truncate">{card.parentText}</span>
                          </div>
                        )}

                        {/* Card Top Row: Checkbox + Title + Quick Actions */}
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
                            {isDone ? <CheckCircle2 size={16} /> : <Circle size={16} />}
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

                          {/* Hover Quick Actions */}
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-opacity shrink-0">
                            <button
                              type="button"
                              title="Edit Dates & Task Properties"
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
                              title="Delete Card"
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

                        {/* Metadata Badges Row: Quadrant, Priority, Progress, Dates, Tags, Notes */}
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {card.quadrant !== null && (
                            <span
                              title={`${getCoveyQuadrantMeta(card.quadrant).name}: ${getCoveyQuadrantMeta(card.quadrant).axisLabel}`}
                              className={cn(
                                'px-1.5 py-0.5 rounded text-[10px] font-bold text-white leading-none',
                                getCoveyQuadrantMeta(card.quadrant).solidBgClass
                              )}
                            >
                              {getCoveyQuadrantMeta(card.quadrant).code}
                            </span>
                          )}

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

                          {dateBadge && dateColors ? (
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
                          ) : (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onOpenTaskInspector(card.uid);
                              }}
                              className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                            >
                              <Calendar size={10} />
                              <span>+ Date</span>
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
                      </div>
                    );
                  })}

                  {visibleCards.length === 0 && addingCardColUid !== col.uid && (
                    <div className="py-8 px-4 text-center rounded-xl border border-dashed border-slate-300/80 text-slate-400 text-xs">
                      <p>No cards in this column</p>
                      <button
                        type="button"
                        onClick={() => {
                          setAddingCardColUid(col.uid);
                          setNewCardTitle('');
                        }}
                        className="mt-2 inline-flex items-center gap-1 text-indigo-600 hover:underline font-semibold cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Add first card</span>
                      </button>
                    </div>
                  )}

                  {/* Inline Add Card Form */}
                  {addingCardColUid === col.uid && (
                    <form
                      onSubmit={(e) => handleCreateCard(col.uid, e)}
                      className="bg-white p-2.5 rounded-xl border border-indigo-300 shadow-sm space-y-2"
                    >
                      <input
                        type="text"
                        autoFocus
                        value={newCardTitle}
                        onChange={(e) => setNewCardTitle(e.target.value)}
                        placeholder="Task title..."
                        className="w-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none"
                      />
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setAddingCardColUid(null)}
                          className="px-2 py-1 rounded text-[11px] font-medium text-slate-500 hover:bg-slate-100 cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-1 rounded bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold cursor-pointer"
                        >
                          Add Card
                        </button>
                      </div>
                    </form>
                  )}
                </div>

                {/* Column Footer Add Button */}
                {addingCardColUid !== col.uid && (
                  <button
                    type="button"
                    onClick={() => {
                      setAddingCardColUid(col.uid);
                      setNewCardTitle('');
                    }}
                    className="m-2 p-2 rounded-xl hover:bg-white/80 text-slate-600 hover:text-indigo-600 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus size={14} />
                    <span>Add Task</span>
                  </button>
                )}
              </div>
            );
          })}

          {/* Add New Branch Column */}
          <div className="w-72 shrink-0">
            {addingColumn ? (
              <form
                onSubmit={handleCreateColumn}
                className="bg-white p-3.5 rounded-2xl border border-indigo-300 shadow-md space-y-2.5"
              >
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  New Branch Column
                </span>
                <input
                  type="text"
                  autoFocus
                  value={newColumnTitle}
                  onChange={(e) => setNewColumnTitle(e.target.value)}
                  placeholder="Column / Branch title..."
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    type="button"
                    onClick={() => setAddingColumn(false)}
                    className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold cursor-pointer"
                  >
                    Create Column
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setAddingColumn(true);
                  setNewColumnTitle('');
                }}
                className="w-full py-3.5 px-4 rounded-2xl border-2 border-dashed border-slate-300 hover:border-indigo-400 bg-white/50 hover:bg-white text-slate-600 hover:text-indigo-600 text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Plus size={15} />
                <span>Add Branch Column</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
