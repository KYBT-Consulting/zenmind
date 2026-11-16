import React from 'react';
import { Calendar, Kanban, Network } from 'lucide-react';
import { WorkspaceViewMode } from '../../types/mindmap';
import { cn } from '../../lib/utils';

export interface PlannerCounts {
  /** Unfinished tasks scheduled for today */
  dueToday: number;
  /** Unfinished tasks whose end date has passed */
  overdue: number;
}

interface ViewSwitcherProps {
  viewMode: WorkspaceViewMode;
  onChange: (mode: WorkspaceViewMode) => void;
  plannerCounts?: PlannerCounts;
}

const VIEWS: { id: WorkspaceViewMode; label: string; icon: React.FC<{ size?: number }> }[] = [
  { id: 'mindmap', label: 'Mind Map', icon: Network },
  { id: 'kanban', label: 'Kanban', icon: Kanban },
  { id: 'planner', label: 'Daily Planner', icon: Calendar },
];

/** Workspace-level switch between the Mind Map, Kanban and Daily Planner views of the open map. */
export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({ viewMode, onChange, plannerCounts }) => {
  const overdue = plannerCounts?.overdue ?? 0;
  const dueToday = plannerCounts?.dueToday ?? 0;
  const attention = overdue + dueToday;
  const attentionLabel = [
    overdue > 0 ? `${overdue} overdue` : '',
    dueToday > 0 ? `${dueToday} due today` : '',
  ]
    .filter(Boolean)
    .join(', ');

  return (
    <div
      role="group"
      aria-label="Workspace view"
      className="flex items-center gap-0.5 p-0.5 rounded-lg bg-slate-200/70 border border-slate-300/60 shrink-0"
    >
      {VIEWS.map(({ id, label, icon: Icon }) => {
        const active = viewMode === id;
        const showBadge = id === 'planner' && attention > 0;
        return (
          <button
            key={id}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(id)}
            title={showBadge ? `${label} (${attentionLabel})` : label}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer',
              active
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
            )}
          >
            <Icon size={14} />
            {/* Labels give way to icons when the title bar gets tight */}
            <span className="hidden xl:inline">{label}</span>
            {showBadge && (
              <span
                aria-label={attentionLabel}
                className={cn(
                  'min-w-4 px-1 rounded-full text-[10px] font-bold leading-4 text-center',
                  overdue > 0 ? 'bg-rose-500 text-white' : 'bg-amber-400 text-amber-950'
                )}
              >
                {attention}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
