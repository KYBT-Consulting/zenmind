import React, { useState } from 'react';
import {
  List,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  Trash2,
  FileText,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';
import { cn } from '../../lib/utils';

interface OutlineItemProps {
  node: any;
  depth: number;
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
}

const OutlineItem: React.FC<OutlineItemProps> = ({
  node,
  depth,
  engine,
  activeNode,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const isSelected = activeNode?.text === node.data?.text;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group',
          isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setCollapsed(!collapsed);
            }}
            className="p-0.5 rounded hover:bg-slate-200 text-slate-400 group-hover:text-slate-600 transition-colors"
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronDown size={13} />}
          </button>
        ) : (
          <div className="w-3.5" />
        )}

        <span className="text-xs truncate flex-1 font-medium">
          {node.data?.text || '(Untitled Topic)'}
        </span>
      </div>

      {!collapsed && hasChildren && (
        <div className="space-y-0.5">
          {children.map((child: any, idx: number) => (
            <OutlineItem
              key={idx}
              node={child}
              depth={depth + 1}
              engine={engine}
              activeNode={activeNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface OutlinePanelProps {
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  data: any;
  onClose: () => void;
}

export const OutlinePanel: React.FC<OutlinePanelProps> = ({
  engine,
  activeNode,
  data,
  onClose,
}) => {
  return (
    <aside className="absolute md:relative inset-y-0 left-0 w-80 max-w-[90vw] bg-white border-r border-slate-200 flex flex-col z-40 shadow-2xl md:shadow-md select-none h-full animate-in slide-in-from-left duration-200 pb-12 md:pb-0">
      <div className="h-12 px-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <List size={14} className="text-indigo-600" />
          Mind Map Outline
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {data ? (
          <OutlineItem
            node={data}
            depth={0}
            engine={engine}
            activeNode={activeNode}
          />
        ) : (
          <div className="p-4 text-center text-slate-400 text-xs">
            No mind map data loaded
          </div>
        )}
      </div>

      <div className="p-3 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 flex justify-between items-center">
        <span>Synced with Canvas</span>
        <button
          onClick={() => engine?.insertChildNode()}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 font-semibold"
        >
          <Plus size={12} />
          <span>Add Node</span>
        </button>
      </div>
    </aside>
  );
};
