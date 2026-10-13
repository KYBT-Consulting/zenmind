import React from 'react';
import { Plus, X } from 'lucide-react';
import { cn } from '../../lib/utils';

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
}

export const TabBar: React.FC<TabBarProps> = ({ tabs, activeId, onSelect, onClose, onNew }) => (
  <div className="flex items-end gap-0.5 px-2 pt-1 bg-slate-100 border-b border-slate-200 overflow-x-auto">
    {tabs.map((tab) => (
      <div
        key={tab.id}
        onClick={() => onSelect(tab.id)}
        onAuxClick={(e) => {
          if (e.button === 1) onClose(tab.id);
        }}
        title={tab.title}
        className={cn(
          'group flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 max-w-[200px] min-w-[100px] rounded-t-lg text-xs cursor-pointer border border-b-0 transition-colors',
          tab.id === activeId
            ? 'bg-white border-slate-200 text-slate-900 font-medium'
            : 'bg-slate-200/60 border-transparent text-slate-600 hover:bg-slate-200'
        )}
      >
        <span className="truncate flex-1">{tab.title || 'Untitled'}</span>
        {tab.dirty && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" title="Unsaved changes" />}
        <button
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
    ))}
    <button
      onClick={onNew}
      title="New Mind Map (Ctrl+N)"
      className="p-1.5 mb-0.5 rounded hover:bg-slate-200 text-slate-600 shrink-0"
    >
      <Plus size={14} />
    </button>
  </div>
);
