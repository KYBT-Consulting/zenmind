import React, { useState, useMemo } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  CheckCircle2,
  Circle,
  Plus,
  Compass,
  AlertTriangle,
  CalendarPlus,
  Search,
  Sparkles,
  X,
  ArrowRight,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';
import {
  addDaysToDateString,
  extractAllTasks,
  formatFullDateHeading,
  formatShortDate,
  formatTaskDateBadge,
  getTaskDateStatus,
  getTodayDateString,
  getWeekDatesAround,
  isTaskOnDate,
  minutesToTimeString,
  parseTimeToMinutes,
  TaskItem,
} from '../../lib/taskDates';
import { cn, stripHtml } from '../../lib/utils';

interface DailyPlannerViewProps {
  engine: MindMapEngine | null;
  data: any;
  activeNode: ActiveNodeInfo | null;
  onLocateNode: (uid: string) => void;
  onOpenTaskInspector: (uid: string) => void;
}

const HOURS = Array.from({ length: 17 }, (_, i) => i + 6); // 06:00 to 22:00

export const DailyPlannerView: React.FC<DailyPlannerViewProps> = ({
  engine,
  data,
  activeNode,
  onLocateNode,
  onOpenTaskInspector,
}) => {
  const todayStr = getTodayDateString();
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [backlogFilter, setBacklogFilter] = useState<'all' | 'tasks'>('all');
  const [backlogSearch, setBacklogSearch] = useState('');
  const [addingHour, setAddingHour] = useState<number | null>(null);
  const [newHourTaskText, setNewHourTaskText] = useState('');
  const [addingAllDay, setAddingAllDay] = useState(false);
  const [newAllDayText, setNewAllDayText] = useState('');
  const [selectedBranchUidForNew, setSelectedBranchUidForNew] = useState<string>('');
  const [dragOverHour, setDragOverHour] = useState<number | null>(null);
  const [dragOverAllDay, setDragOverAllDay] = useState(false);

  const allItems = useMemo(() => extractAllTasks(data), [data]);

  // First-level branches for assigning newly created tasks
  const branches = useMemo(() => {
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

  const weekDays = useMemo(() => getWeekDatesAround(selectedDate, todayStr), [selectedDate, todayStr]);

  // Count scheduled tasks per date for the 7-day strip
  const countTasksForDate = (dateStr: string) => {
    let total = 0;
    let uncompleted = 0;
    for (const item of allItems) {
      if (isTaskOnDate(item, dateStr)) {
        total++;
        if (item.progress !== 100) uncompleted++;
      }
    }
    return { total, uncompleted };
  };

  // Tasks scheduled on selectedDate
  const tasksOnSelectedDate = useMemo(
    () => allItems.filter((item) => isTaskOnDate(item, selectedDate)),
    [allItems, selectedDate]
  );

  // Split into time-blocked (has startTime) vs all-day (no startTime)
  const timeBlockedTasks = useMemo(() => {
    return tasksOnSelectedDate
      .filter((t) => parseTimeToMinutes(t.startTime) !== null)
      .sort((a, b) => (parseTimeToMinutes(a.startTime) ?? 0) - (parseTimeToMinutes(b.startTime) ?? 0));
  }, [tasksOnSelectedDate]);

  const allDayTasks = useMemo(() => {
    return tasksOnSelectedDate.filter((t) => parseTimeToMinutes(t.startTime) === null);
  }, [tasksOnSelectedDate]);

  // Overdue tasks across the map (strictly before today, not 100% done)
  const overdueTasks = useMemo(() => {
    return allItems.filter(
      (t) =>
        getTaskDateStatus(t, t.progress, todayStr) === 'overdue' &&
        !isTaskOnDate(t, selectedDate)
    );
  }, [allItems, todayStr, selectedDate]);

  // Unscheduled backlog items (no startDate and no endDate)
  const unscheduledItems = useMemo(() => {
    return allItems.filter((t) => {
      if (t.startDate || t.endDate) return false;
      // Don't clutter with first-level column headers if they already have children
      if (t.depth === 1 && t.hasChildren && t.progress === null && t.priority === null) {
        return false;
      }
      if (backlogFilter === 'tasks' && t.progress === null && t.priority === null) {
        return false;
      }
      if (backlogSearch.trim()) {
        const q = backlogSearch.toLowerCase();
        return (
          t.text.toLowerCase().includes(q) ||
          t.branchTitle.toLowerCase().includes(q) ||
          t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }
      return true;
    });
  }, [allItems, backlogFilter, backlogSearch]);

  const handleScheduleAtHour = (uid: string, hour: number) => {
    if (!engine) return;
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(Math.min(23, hour + 1)).padStart(2, '0')}:00`;
    engine.setNodeDates(
      {
        startDate: selectedDate,
        endDate: selectedDate,
        startTime,
        endTime,
      },
      uid
    );
  };

  const handleScheduleAllDay = (uid: string) => {
    if (!engine) return;
    engine.setNodeDates(
      {
        startDate: selectedDate,
        endDate: selectedDate,
        startTime: null,
        endTime: null,
      },
      uid
    );
  };

  const handleShiftEndTime = (task: TaskItem, deltaMinutes: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!engine) return;
    const startMins = parseTimeToMinutes(task.startTime) ?? 9 * 60;
    const currentEndMins = parseTimeToMinutes(task.endTime) ?? startMins + 60;
    const nextEndMins = Math.max(startMins + 15, Math.min(23 * 60 + 45, currentEndMins + deltaMinutes));
    engine.setNodeDates(
      {
        endTime: minutesToTimeString(nextEndMins),
      },
      task.uid
    );
  };

  const handleCreateTimeBlockedTask = (hour: number, e: React.FormEvent) => {
    e.preventDefault();
    const title = newHourTaskText.trim();
    if (!title || !engine) return;
    const startTime = `${String(hour).padStart(2, '0')}:00`;
    const endTime = `${String(Math.min(23, hour + 1)).padStart(2, '0')}:00`;
    engine.addChildNodeWithData(defaultBranchUid, {
      text: title,
      icon: ['progress_0'],
      startDate: selectedDate,
      endDate: selectedDate,
      startTime,
      endTime,
    });
    setNewHourTaskText('');
    setAddingHour(null);
  };

  const handleCreateAllDayTask = (e: React.FormEvent) => {
    e.preventDefault();
    const title = newAllDayText.trim();
    if (!title || !engine) return;
    engine.addChildNodeWithData(defaultBranchUid, {
      text: title,
      icon: ['progress_0'],
      startDate: selectedDate,
      endDate: selectedDate,
    });
    setNewAllDayText('');
    setAddingAllDay(false);
  };

  const completedTodayCount = tasksOnSelectedDate.filter((t) => t.progress === 100).length;

  return (
    <div className="w-full h-full flex flex-col bg-slate-100/80 select-none overflow-hidden">
      {/* Top Date Header & 7-Day Strip */}
      <div className="px-5 py-3 bg-white border-b border-slate-200 flex flex-col gap-3 shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
              <Calendar size={17} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold text-slate-800">{formatFullDateHeading(selectedDate)}</h2>
                {selectedDate === todayStr && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                    Today
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                {tasksOnSelectedDate.length === 0
                  ? 'No tasks scheduled for this day yet — drag from the backlog or click any hour slot'
                  : `${completedTodayCount} of ${tasksOnSelectedDate.length} scheduled tasks completed`}
              </p>
            </div>
          </div>

          {/* Date Navigation Controls */}
          <div className="flex items-center gap-2">
            {branches.length > 0 && (
              <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 mr-2">
                <span>New tasks in:</span>
                <select
                  aria-label="Target branch for new tasks"
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

            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                type="button"
                aria-label="Previous Day"
                onClick={() => setSelectedDate(addDaysToDateString(selectedDate, -1))}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                type="button"
                onClick={() => setSelectedDate(todayStr)}
                className={cn(
                  'px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer',
                  selectedDate === todayStr
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:bg-white'
                )}
              >
                Today
              </button>
              <button
                type="button"
                aria-label="Next Day"
                onClick={() => setSelectedDate(addDaysToDateString(selectedDate, 1))}
                className="p-1.5 rounded-lg hover:bg-white text-slate-600 transition-colors cursor-pointer"
              >
                <ChevronRight size={14} />
              </button>
            </div>

            <input
              type="date"
              aria-label="Jump to date"
              value={selectedDate}
              onChange={(e) => {
                if (e.target.value) setSelectedDate(e.target.value);
              }}
              className="px-2.5 py-1 rounded-xl border border-slate-200 text-xs font-medium text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* 7-Day Week Strip */}
        <div className="grid grid-cols-7 gap-1.5">
          {weekDays.map((day) => {
            const isSelected = day.dateStr === selectedDate;
            const { total, uncompleted } = countTasksForDate(day.dateStr);
            return (
              <button
                key={day.dateStr}
                type="button"
                onClick={() => setSelectedDate(day.dateStr)}
                className={cn(
                  'py-1.5 px-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer',
                  isSelected
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                    : day.isToday
                    ? 'bg-indigo-50/70 text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                    : 'bg-slate-50/80 text-slate-700 border-slate-200/80 hover:bg-white'
                )}
              >
                <div className="flex items-center gap-1.5">
                  <span
                    className={cn(
                      'text-[10px] font-bold uppercase',
                      isSelected ? 'text-indigo-200' : 'text-slate-400'
                    )}
                  >
                    {day.dayName}
                  </span>
                  <span className="text-xs font-bold">{day.dayNum}</span>
                </div>
                {total > 0 && (
                  <span
                    className={cn(
                      'px-1.5 py-0.2 rounded-full text-[10px] font-bold',
                      isSelected
                        ? 'bg-white/20 text-white'
                        : uncompleted > 0
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-emerald-100 text-emerald-700'
                    )}
                  >
                    {total}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Split Body: Left Hourly Timeline + Right All-Day & Backlog */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left/Center: Hourly Time-Blocking Schedule */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200 shadow-2xs flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-indigo-600" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Hourly Time Blocks ({timeBlockedTasks.length})
              </h3>
            </div>
            <span className="text-[11px] text-slate-400">
              Drag any task onto an hour slot or click + to schedule
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 custom-scrollbar">
            {HOURS.map((hour) => {
              const hourLabel = `${String(hour).padStart(2, '0')}:00`;
              const slotTasks = timeBlockedTasks.filter((t) => {
                const mins = parseTimeToMinutes(t.startTime);
                return mins !== null && Math.floor(mins / 60) === hour;
              });
              const isDragTarget = dragOverHour === hour;

              return (
                <div
                  key={hour}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (dragOverHour !== hour) setDragOverHour(hour);
                  }}
                  onDragLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                      setDragOverHour(null);
                    }
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const uid = e.dataTransfer.getData('text/zenmind-task-uid');
                    if (uid) {
                      handleScheduleAtHour(uid, hour);
                    }
                    setDragOverHour(null);
                  }}
                  className={cn(
                    'group flex items-start min-h-14 px-3 py-2 transition-colors',
                    isDragTarget ? 'bg-indigo-50/80 ring-1 ring-inset ring-indigo-400' : 'hover:bg-slate-50/70'
                  )}
                >
                  {/* Hour Label */}
                  <div className="w-16 shrink-0 pt-0.5 text-[11px] font-mono font-semibold text-slate-400">
                    {hourLabel}
                  </div>

                  {/* Scheduled Tasks in this Hour */}
                  <div className="flex-1 space-y-1.5 min-w-0">
                    {slotTasks.map((task) => {
                      const isDone = task.progress === 100;
                      const isSelected = activeNode?.uid === task.uid;
                      return (
                        <div
                          key={task.uid}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/zenmind-task-uid', task.uid);
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onClick={() => engine?.selectNodeByUid(task.uid, false)}
                          className={cn(
                            'p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer',
                            isDone
                              ? 'bg-emerald-50/60 border-emerald-200 text-slate-500'
                              : isSelected
                              ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs'
                              : 'bg-indigo-50/40 border-indigo-200/80 hover:border-indigo-300 shadow-2xs'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <button
                              type="button"
                              aria-label={isDone ? 'Mark as To Do' : 'Mark as Completed'}
                              onClick={(e) => {
                                e.stopPropagation();
                                engine?.toggleNodeCheckbox(task.uid);
                              }}
                              className={cn(
                                'shrink-0 transition-colors cursor-pointer',
                                isDone ? 'text-emerald-600' : 'text-indigo-500 hover:text-indigo-700'
                              )}
                            >
                              {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                            </button>

                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span
                                  className={cn(
                                    'text-xs font-bold truncate',
                                    isDone ? 'line-through text-slate-400' : 'text-slate-800'
                                  )}
                                >
                                  {task.text}
                                </span>
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-white/80 text-slate-500 border border-slate-200/70">
                                  {task.branchTitle}
                                </span>
                                {task.priority !== null && (
                                  <span
                                    className={cn(
                                      'px-1 py-0.2 rounded text-[9px] font-bold text-white',
                                      task.priority === 1
                                        ? 'bg-rose-500'
                                        : task.priority === 2
                                        ? 'bg-amber-500'
                                        : 'bg-blue-500'
                                    )}
                                  >
                                    P{task.priority}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 text-[10px] font-semibold text-indigo-600">
                                <span>
                                  {task.startTime}
                                  {task.endTime ? ` – ${task.endTime}` : ''}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Duration & Action Controls */}
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              title="Shorten by 30m"
                              onClick={(e) => handleShiftEndTime(task, -30, e)}
                              className="px-1.5 py-0.5 rounded bg-white/80 hover:bg-white border border-slate-200 text-[10px] font-semibold text-slate-600 cursor-pointer"
                            >
                              -30m
                            </button>
                            <button
                              type="button"
                              title="Extend by 30m"
                              onClick={(e) => handleShiftEndTime(task, 30, e)}
                              className="px-1.5 py-0.5 rounded bg-white/80 hover:bg-white border border-slate-200 text-[10px] font-semibold text-slate-600 cursor-pointer"
                            >
                              +30m
                            </button>
                            <button
                              type="button"
                              title="Move back to All-Day"
                              onClick={(e) => {
                                e.stopPropagation();
                                engine?.setNodeDates({ startTime: null, endTime: null }, task.uid);
                              }}
                              className="p-1 rounded hover:bg-white text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                              <X size={12} />
                            </button>
                            <button
                              type="button"
                              title="Locate on Mind Map"
                              onClick={(e) => {
                                e.stopPropagation();
                                onLocateNode(task.uid);
                              }}
                              className="p-1 rounded hover:bg-white text-slate-400 hover:text-indigo-600 cursor-pointer"
                            >
                              <Compass size={12} />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Quick Add Task at this Hour */}
                    {addingHour === hour ? (
                      <form
                        onSubmit={(e) => handleCreateTimeBlockedTask(hour, e)}
                        className="flex items-center gap-1.5 bg-white p-1.5 rounded-xl border border-indigo-300 shadow-2xs"
                      >
                        <input
                          type="text"
                          autoFocus
                          value={newHourTaskText}
                          onChange={(e) => setNewHourTaskText(e.target.value)}
                          placeholder={`Schedule task at ${hourLabel}...`}
                          className="flex-1 text-xs text-slate-800 px-2 py-0.5 focus:outline-none"
                        />
                        <button
                          type="button"
                          onClick={() => setAddingHour(null)}
                          className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-100 rounded-lg cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 cursor-pointer"
                        >
                          Add
                        </button>
                      </form>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setAddingHour(hour);
                          setNewHourTaskText('');
                        }}
                        className="opacity-0 group-hover:opacity-100 inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 hover:text-indigo-600 py-0.5 px-1.5 rounded hover:bg-indigo-50/60 transition-all cursor-pointer"
                      >
                        <Plus size={12} />
                        <span>Schedule at {hourLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: All-Day Tasks + Overdue + Unscheduled Mind Map Backlog */}
        <div className="lg:col-span-5 flex flex-col gap-4 overflow-hidden">
          {/* All-Day & Due Tasks Card */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!dragOverAllDay) setDragOverAllDay(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                setDragOverAllDay(false);
              }
            }}
            onDrop={(e) => {
              e.preventDefault();
              const uid = e.dataTransfer.getData('text/zenmind-task-uid');
              if (uid) {
                handleScheduleAllDay(uid);
              }
              setDragOverAllDay(false);
            }}
            className={cn(
              'bg-white rounded-2xl border shadow-2xs flex flex-col max-h-[48%] overflow-hidden transition-all',
              dragOverAllDay ? 'border-indigo-500 ring-2 ring-indigo-400/20' : 'border-slate-200'
            )}
          >
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <Calendar size={14} className="text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  All-Day & Multi-Day Tasks ({allDayTasks.length})
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setAddingAllDay(true);
                  setNewAllDayText('');
                }}
                className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Task</span>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
              {addingAllDay && (
                <form
                  onSubmit={handleCreateAllDayTask}
                  className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl border border-indigo-300"
                >
                  <input
                    type="text"
                    autoFocus
                    value={newAllDayText}
                    onChange={(e) => setNewAllDayText(e.target.value)}
                    placeholder="All-day task title..."
                    className="flex-1 text-xs text-slate-800 bg-transparent px-1.5 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setAddingAllDay(false)}
                    className="px-2 py-1 text-[11px] text-slate-500 hover:bg-slate-200 rounded-lg cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-semibold bg-indigo-600 text-white rounded-lg cursor-pointer"
                  >
                    Add
                  </button>
                </form>
              )}

              {allDayTasks.map((task) => {
                const isDone = task.progress === 100;
                const isSelected = activeNode?.uid === task.uid;
                const badge = formatTaskDateBadge(task);
                return (
                  <div
                    key={task.uid}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/zenmind-task-uid', task.uid);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={() => engine?.selectNodeByUid(task.uid, false)}
                    className={cn(
                      'p-2.5 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <button
                        type="button"
                        aria-label={isDone ? 'Mark as To Do' : 'Mark as Completed'}
                        onClick={(e) => {
                          e.stopPropagation();
                          engine?.toggleNodeCheckbox(task.uid);
                        }}
                        className={cn(
                          'shrink-0 cursor-pointer',
                          isDone ? 'text-emerald-600' : 'text-slate-300 hover:text-indigo-600'
                        )}
                      >
                        {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                      </button>
                      <div className="min-w-0 flex-1">
                        <p
                          className={cn(
                            'text-xs font-semibold truncate',
                            isDone ? 'line-through text-slate-400' : 'text-slate-800'
                          )}
                        >
                          {task.text}
                        </p>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                          <span className="truncate">{task.branchTitle}</span>
                          {badge && (
                            <>
                              <span>•</span>
                              <span className="text-amber-700 font-medium">{badge}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        title="Time-block at 09:00"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleAtHour(task.uid, 9);
                        }}
                        className="px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Clock size={10} />
                        <span>9 AM</span>
                      </button>
                      <button
                        type="button"
                        title="Locate on Mind Map"
                        onClick={(e) => {
                          e.stopPropagation();
                          onLocateNode(task.uid);
                        }}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-indigo-600 cursor-pointer"
                      >
                        <Compass size={12} />
                      </button>
                    </div>
                  </div>
                );
              })}

              {allDayTasks.length === 0 && !addingAllDay && (
                <div className="py-5 text-center text-xs text-slate-400">
                  No all-day tasks for {formatShortDate(selectedDate)}.
                </div>
              )}

              {/* Overdue Tasks Alert Section */}
              {overdueTasks.length > 0 && (
                <div className="mt-3 pt-3 border-t border-rose-100 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-rose-600">
                    <AlertTriangle size={12} />
                    <span>Overdue from Earlier Dates ({overdueTasks.length})</span>
                  </div>
                  {overdueTasks.map((task) => (
                    <div
                      key={task.uid}
                      onClick={() => engine?.selectNodeByUid(task.uid, false)}
                      className="p-2 rounded-xl bg-rose-50/70 border border-rose-200 flex items-center justify-between gap-2 text-xs cursor-pointer"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-rose-900 truncate">{task.text}</p>
                        <p className="text-[10px] text-rose-600">
                          {formatTaskDateBadge(task)} • {task.branchTitle}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleAllDay(task.uid);
                        }}
                        className="px-2 py-1 rounded-lg bg-white hover:bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold shrink-0 cursor-pointer"
                      >
                        Move to {selectedDate === todayStr ? 'Today' : formatShortDate(selectedDate)}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Unscheduled Mind Map Backlog Card */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs flex-1 flex flex-col overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex flex-wrap items-center justify-between gap-2 bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2">
                <CalendarPlus size={14} className="text-indigo-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Unscheduled Backlog ({unscheduledItems.length})
                </h3>
              </div>

              <div className="flex items-center gap-1.5">
                <div className="flex bg-slate-200/70 p-0.5 rounded-lg text-[10px] font-semibold">
                  <button
                    type="button"
                    onClick={() => setBacklogFilter('all')}
                    className={cn(
                      'px-2 py-0.5 rounded-md cursor-pointer',
                      backlogFilter === 'all' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                    )}
                  >
                    All Topics
                  </button>
                  <button
                    type="button"
                    onClick={() => setBacklogFilter('tasks')}
                    className={cn(
                      'px-2 py-0.5 rounded-md cursor-pointer',
                      backlogFilter === 'tasks' ? 'bg-white text-slate-800 shadow-2xs' : 'text-slate-500'
                    )}
                  >
                    Tasks Only
                  </button>
                </div>
              </div>
            </div>

            <div className="px-3 pt-2.5 shrink-0">
              <div className="relative">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={backlogSearch}
                  onChange={(e) => setBacklogSearch(e.target.value)}
                  placeholder="Search unscheduled topics to plan..."
                  className="w-full pl-7 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-700 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-1.5 custom-scrollbar">
              {unscheduledItems.map((item) => {
                const isSelected = activeNode?.uid === item.uid;
                return (
                  <div
                    key={item.uid}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('text/zenmind-task-uid', item.uid);
                      e.dataTransfer.effectAllowed = 'move';
                    }}
                    onClick={() => engine?.selectNodeByUid(item.uid, false)}
                    className={cn(
                      'group p-2 rounded-xl border flex items-center justify-between gap-2 transition-all cursor-pointer',
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40'
                        : 'border-slate-200/80 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        {item.priority !== null && (
                          <span className="px-1 py-0.2 rounded bg-rose-500 text-white text-[9px] font-bold">
                            P{item.priority}
                          </span>
                        )}
                        <span className="text-xs font-semibold text-slate-800 truncate">{item.text}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 block truncate">{item.branchTitle}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleAllDay(item.uid);
                        }}
                        className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-indigo-600 text-slate-700 hover:text-white text-[10px] font-semibold transition-colors cursor-pointer"
                      >
                        + Schedule
                      </button>
                      <button
                        type="button"
                        title="Time-block at 09:00"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScheduleAtHour(item.uid, 9);
                        }}
                        className="px-1.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-semibold cursor-pointer"
                      >
                        9 AM
                      </button>
                    </div>
                  </div>
                );
              })}

              {unscheduledItems.length === 0 && (
                <div className="py-8 text-center text-xs text-slate-400">
                  All matching topics have dates assigned!
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
