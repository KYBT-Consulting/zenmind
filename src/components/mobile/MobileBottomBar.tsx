import React from 'react';
import {
  GitFork,
  Plus,
  Sliders,
  ListTree,
  Maximize2,
  Sparkles,
  Undo2,
  Redo2,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';

interface MobileBottomBarProps {
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  canUndo: boolean;
  canRedo: boolean;
  onToggleOutline: () => void;
  onToggleInspector: () => void;
  onOpenAIDialog: () => void;
}

export const MobileBottomBar: React.FC<MobileBottomBarProps> = ({
  engine,
  activeNode,
  canUndo,
  canRedo,
  onToggleOutline,
  onToggleInspector,
  onOpenAIDialog,
}) => {
  return (
    <nav
      aria-label="Mobile Navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-2xl px-2 py-1.5 flex items-center justify-around select-none"
    >
      {/* Undo / Redo */}
      <div className="flex items-center gap-0.5">
        <button
          onClick={() => engine?.undo()}
          disabled={!canUndo}
          title="Undo"
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo2 size={17} />
        </button>
        <button
          onClick={() => engine?.redo()}
          disabled={!canRedo}
          title="Redo"
          className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo2 size={17} />
        </button>
      </div>

      <div className="h-5 w-px bg-slate-200" />

      {/* Add Subtopic */}
      <button
        onClick={() => engine?.insertChildNode()}
        disabled={!activeNode}
        title="Add Subtopic"
        className="flex flex-col items-center justify-center px-2 py-1 rounded-xl text-indigo-600 hover:bg-indigo-50 disabled:opacity-30"
      >
        <GitFork size={18} />
        <span className="text-[9px] font-semibold mt-0.5">Subtopic</span>
      </button>

      {/* Add Sibling Topic */}
      <button
        onClick={() => engine?.insertSiblingNode()}
        disabled={!activeNode || activeNode.isRoot}
        title="Add Sibling Topic"
        className="flex flex-col items-center justify-center px-2 py-1 rounded-xl text-slate-700 hover:bg-slate-100 disabled:opacity-30"
      >
        <Plus size={18} />
        <span className="text-[9px] font-semibold mt-0.5">Topic</span>
      </button>

      {/* Fit View */}
      <button
        onClick={() => engine?.fitView()}
        title="Fit Map to View"
        className="flex flex-col items-center justify-center px-2 py-1 rounded-xl text-slate-700 hover:bg-slate-100"
      >
        <Maximize2 size={18} />
        <span className="text-[9px] font-semibold mt-0.5">Fit</span>
      </button>

      <div className="h-5 w-px bg-slate-200" />

      {/* Format Inspector Drawer Toggle */}
      <button
        onClick={onToggleInspector}
        title="Format Inspector"
        className="flex flex-col items-center justify-center px-2 py-1 rounded-xl text-slate-700 hover:bg-slate-100"
      >
        <Sliders size={18} />
        <span className="text-[9px] font-semibold mt-0.5">Style</span>
      </button>

      {/* Outline Drawer Toggle */}
      <button
        onClick={onToggleOutline}
        title="Outline Tree"
        className="flex flex-col items-center justify-center px-2 py-1 rounded-xl text-slate-700 hover:bg-slate-100"
      >
        <ListTree size={18} />
        <span className="text-[9px] font-semibold mt-0.5">Outline</span>
      </button>

      {/* AI Expansion Dialog */}
      <button
        onClick={onOpenAIDialog}
        title="AI Idea Generator"
        className="flex flex-col items-center justify-center px-2 py-1 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white shadow-xs hover:opacity-95"
      >
        <Sparkles size={16} />
        <span className="text-[9px] font-bold mt-0.5">AI</span>
      </button>
    </nav>
  );
};
