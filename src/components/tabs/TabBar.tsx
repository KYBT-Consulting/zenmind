import React from 'react';
import { Plus, X, Network, Kanban, Calendar } from 'lucide-react';
import { cn } from '../../lib/utils';
import { DesktopFileService } from '../../services/desktopFileService';
import { WorkspaceViewMode } from '../../types/mindmap';

export interface TabSummary {
  id: string;
  title: string;
  dirty: boolean;
}

interface TabBarProps {
  tabs: TabSummary[];
  activeId: string;
  onSelect: (id: string) => void;
  onClose: (id: string) => void;
  onNew: () => void;
  viewMode?: WorkspaceViewMode;
  onViewModeChange?: (mode: WorkspaceViewMode) => void;
}

export const TabBar: React.FC<TabBarProps> = ({
  tabs,
  activeId,
  onSelect,
  onClose,
  onNew,
  viewMode = 'mindmap',
  onViewModeChange,
}) => {
  const newLabel = `New Mind Map (${DesktopFileService.newMapShortcut().label})`;

  const onTabKeyDown = (e: React.KeyboardEvent, index: number) => {
    const move = (to: number) => {
      e.preventDefault();
      const target = tabs[(to + tabs.length) % tabs.length];
      onSelect(target.id);
      // Roving tabindex: focus follows the selected tab once it re-renders
      requestAnimationFrame(() => document.getElementById(`doc-tab-${target.id}`)?.focus());
    };
    if (e.key === 'ArrowRight') move(index + 1);
    else if (e.key === 'ArrowLeft') move(index - 1);
    else if (e.key === 'Home') move(0);
    else if (e.key === 'End') move(tabs.length - 1);
    else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelect(tabs[index].id);
    } else if (e.key === 'Delete') {
      e.preventDefault();
      onClose(tabs[index].id);
    }
  };

  return (
    <div className="flex items-end gap-0.5 px-2 pt-1 bg-slate-100 border-b border-slate-200 overflow-x-auto">
      <div role="tablist" aria-label="Open mind maps" className="flex items-end gap-0.5">
        {tabs.map((tab, index) => {
          const selected = tab.id === activeId;
          return (
            <div
              key={tab.id}
              id={`doc-tab-${tab.id}`}
              role="tab"
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              onClick={() => onSelect(tab.id)}
              onKeyDown={(e) => onTabKeyDown(e, index)}
              onAuxClick={(e) => {
                if (e.button === 1) onClose(tab.id);
              }}
              title={tab.title}
              className={cn(
                'group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 max-w-[200px] min-w-[100px] rounded-t-lg text-xs cursor-pointer border border-b-0 transition-colors focus-visible:outline-2 focus-visible:outline-indigo-500',
                selected
                  ? 'bg-white border-slate-200 text-slate-900 font-medium'
                  : 'bg-slate-200/60 border-transparent text-slate-600 hover:bg-slate-200'
              )}
            >
              <span className="truncate flex-1">{tab.title || 'Untitled'}</span>
              {tab.dirty && (
                <span
                  className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"
                  role="img"
                  aria-label="Unsaved changes"
                  title="Unsaved changes"
                />
              )}
              <button
                aria-label={`Close ${tab.title || 'Untitled'}`}
                tabIndex={-1}
                onClick={(e) => {
                  e.stopPropagation();
                  onClose(tab.id);
                }}
                title="Close"
                className="p-0.5 rounded hover:bg-slate-300 text-slate-500 shrink-0"
              >
                <X size={12} />
              </button>
            </div>
          );
        })}
      </div>
      <button
        aria-label={newLabel}
        onClick={onNew}
        title={newLabel}
        className="p-1.5 mb-0.5 rounded hover:bg-slate-200 text-slate-600 shrink-0"
      >
        <Plus size={14} />
      </button>

      {onViewModeChange && (
        <div
          role="group"
          aria-label="Workspace View Mode"
          className="ml-auto mb-1 flex items-center bg-slate-200/80 p-0.5 rounded-lg border border-slate-300/60 shrink-0"
        >
          {(
            [
              { id: 'mindmap', label: 'Mind Map', icon: Network },
              { id: 'kanban', label: 'Kanban', icon: Kanban },
              { id: 'planner', label: 'Daily Planner', icon: Calendar },
            ] as { id: WorkspaceViewMode; label: string; icon: React.FC<{ size?: number }> }[]
          ).map((item) => {
            const Icon = item.icon;
            const active = viewMode === item.id;
            return (
              <button
                key={item.id}
                type="button"
                aria-pressed={active}
                onClick={() => onViewModeChange(item.id)}
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold transition-all cursor-pointer',
                  active
                    ? 'bg-white text-indigo-700 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                )}
              >
                <Icon size={12} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
