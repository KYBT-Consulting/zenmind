import React, { useState, useEffect } from 'react';
import {
  List,
  X,
  ChevronRight,
  ChevronDown,
  Plus,
  CheckCircle2,
  Circle,
  UnfoldVertical,
  FoldVertical,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';
import { cn, stripHtml } from '../../lib/utils';

interface OutlineItemProps {
  node: any;
  depth: number;
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  forceCollapseState: { seq: number; collapsed: boolean } | null;
}

const OutlineItem: React.FC<OutlineItemProps> = ({
  node,
  depth,
  engine,
  activeNode,
  forceCollapseState,
}) => {
  const [collapsed, setCollapsed] = useState(node.data?.expand === false);

  useEffect(() => {
    if (forceCollapseState && depth > 0) {
      setCollapsed(forceCollapseState.collapsed);
    } else if (forceCollapseState && depth === 0) {
      setCollapsed(false);
    }
  }, [forceCollapseState, depth]);

  useEffect(() => {
    if (node.data?.expand !== undefined) {
      setCollapsed(node.data.expand === false);
    }
  }, [node.data?.expand]);
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const uid: string | undefined = node.data?.uid;
  const isSelected = !!uid && uid === activeNode?.uid;
  const icons: string[] = Array.isArray(node.data?.icon) ? node.data.icon : [];
  const priorityIcon = icons.find((i) => typeof i === 'string' && i.startsWith('priority_'));
  const progressIcon = icons.find((i) => typeof i === 'string' && i.startsWith('progress_'));
  const priorityNum = priorityIcon ? parseInt(priorityIcon.replace('priority_', ''), 10) : null;
  const progressNum = progressIcon ? parseInt(progressIcon.replace('progress_', ''), 10) : null;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-1.5 py-1.5 px-2 rounded-lg cursor-pointer transition-colors group',
          isSelected ? 'bg-indigo-50 text-indigo-700 font-semibold' : 'hover:bg-slate-50 text-slate-700'
        )}
        style={{ paddingLeft: `${depth * 14 + 8}px` }}
        role="button"
        tabIndex={0}
        onClick={() => uid && engine?.selectNodeByUid(uid)}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && uid) {
            e.preventDefault();
            engine?.selectNodeByUid(uid);
          }
        }}
      >
        {hasChildren ? (
          <button aria-label={collapsed ? "Expand" : "Collapse"} aria-expanded={!collapsed}
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

        {priorityNum !== null && !isNaN(priorityNum) && (
          <span
            className={cn(
              'px-1 py-0.2 rounded text-[9px] font-bold leading-tight shrink-0 text-white',
              priorityNum === 1
                ? 'bg-rose-500'
                : priorityNum === 2
                ? 'bg-amber-500'
                : priorityNum === 3
                ? 'bg-blue-500'
                : 'bg-slate-500'
            )}
          >
            P{priorityNum}
          </span>
        )}

        {progressNum !== null && !isNaN(progressNum) && (
          <span
            className={cn(
              'inline-flex items-center gap-0.5 px-1 py-0.2 rounded text-[9px] font-bold leading-tight shrink-0',
              progressNum === 100
                ? 'bg-emerald-100 text-emerald-700'
                : progressNum > 0
                ? 'bg-indigo-100 text-indigo-700'
                : 'bg-slate-100 text-slate-600'
            )}
          >
            {progressNum === 100 ? (
              <CheckCircle2 size={10} className="text-emerald-600" />
            ) : (
              <Circle size={10} className="text-current" />
            )}
            <span>{progressNum}%</span>
          </span>
        )}

        <span className="text-xs truncate flex-1 font-medium">
          {stripHtml(node.data?.text) || '(Untitled Topic)'}
        </span>
      </div>

      {!collapsed && hasChildren && (
        <div className="space-y-0.5">
          {children.map((child: any, idx: number) => (
            <OutlineItem
              key={child.data?.uid ?? idx}
              node={child}
              depth={depth + 1}
              engine={engine}
              activeNode={activeNode}
              forceCollapseState={forceCollapseState}
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
  const [forceCollapseState, setForceCollapseState] = useState<{
    seq: number;
    collapsed: boolean;
  } | null>(null);

  return (
    <aside className="absolute md:relative inset-y-0 left-0 w-80 max-w-[90vw] bg-white border-r border-slate-200 flex flex-col z-40 shadow-2xl md:shadow-md select-none h-full animate-in slide-in-from-left duration-200 pb-12 md:pb-0">
      <div className="h-12 px-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <List size={14} className="text-indigo-600" />
          Mind Map Outline
        </h3>
        <div className="flex items-center gap-1">
          <button
            aria-label="Expand All Outline & Map"
            title="Expand All Outline & Map"
            onClick={() => {
              setForceCollapseState((prev) => ({ seq: (prev?.seq ?? 0) + 1, collapsed: false }));
              engine?.expandAll();
            }}
            className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-indigo-600 transition-colors"
          >
            <UnfoldVertical size={14} />
          </button>
          <button
            aria-label="Collapse All Outline & Map"
            title="Collapse All Outline & Map"
            onClick={() => {
              setForceCollapseState((prev) => ({ seq: (prev?.seq ?? 0) + 1, collapsed: true }));
              engine?.collapseAll();
            }}
            className="p-1 hover:bg-slate-100 rounded-md text-slate-500 hover:text-amber-600 transition-colors"
          >
            <FoldVertical size={14} />
          </button>
          <button aria-label="Close outline"
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-1 custom-scrollbar">
        {data ? (
          <OutlineItem
            node={data}
            depth={0}
            engine={engine}
            activeNode={activeNode}
            forceCollapseState={forceCollapseState}
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
