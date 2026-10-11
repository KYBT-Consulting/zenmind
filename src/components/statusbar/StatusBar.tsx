import React from 'react';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Keyboard,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { LAYOUT_OPTIONS } from '../../types/mindmap';

interface StatusBarProps {
  engine: MindMapEngine | null;
  scale: number;
  nodeCount: number;
  onOpenAIDialog: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  engine,
  scale,
  nodeCount,
  onOpenAIDialog,
}) => {
  const currentLayoutId = engine?.getLayout() || 'mindMap';
  const layoutObj = LAYOUT_OPTIONS.find((l) => l.id === currentLayoutId);

  return (
    <footer className="h-7 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-[11px] text-slate-500 font-medium select-none z-20">
      {/* Left Info Badges */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5 text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-xs" />
          <span>{nodeCount} Topics</span>
        </span>

        <span className="h-3 w-px bg-slate-200" />

        <span className="flex items-center gap-1.5 text-slate-600 font-semibold">
          <Layers size={12} className="text-indigo-600" />
          <span>{layoutObj?.name || 'Mind Map'}</span>
        </span>

        <span className="h-3 w-px bg-slate-200" />

        <button
          onClick={onOpenAIDialog}
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors font-medium"
        >
          <Sparkles size={11} />
          <span>AI Assisted</span>
        </button>
      </div>

      {/* Right Controls: Zoom & Fit */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => engine?.fitView()}
          title="Fit Mind Map to Window"
          className="flex items-center gap-1 hover:text-slate-800 transition-colors px-1 py-0.5 rounded hover:bg-slate-100"
        >
          <Maximize2 size={12} />
          <span>Fit</span>
        </button>

        <span className="h-3 w-px bg-slate-200" />

        <div className="flex items-center gap-1">
          <button
            onClick={() => engine?.zoomOut()}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800 transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut size={13} />
          </button>

          <span className="w-10 text-center font-mono font-semibold text-slate-700">
            {scale || 100}%
          </span>

          <button
            onClick={() => engine?.zoomIn()}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800 transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        <span className="h-3 w-px bg-slate-200" />

        <div className="flex items-center gap-1 text-slate-400">
          <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono font-bold">
            Tab
          </kbd>
          <span className="text-[10px]">Child</span>
          <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono font-bold ml-1">
            Enter
          </kbd>
          <span className="text-[10px]">Sibling</span>
        </div>
      </div>
    </footer>
  );
};
