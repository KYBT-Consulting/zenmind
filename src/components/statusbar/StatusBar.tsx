import React from 'react';
import {
  Maximize2,
  ZoomIn,
  ZoomOut,
  Layers,
  Sparkles,
  Paintbrush,
  Eye,
  Play,
  X,
  Terminal,
  Keyboard,
  Info,
  UnfoldVertical,
  FoldVertical,
} from 'lucide-react';
import { APP_VERSION } from '../dialogs/AboutDialog';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { LAYOUT_OPTIONS } from '../../types/mindmap';
import { cn } from '../../lib/utils';
import { SlidersHorizontal } from 'lucide-react';

interface StatusBarProps {
  engine: MindMapEngine | null;
  scale: number;
  nodeCount: number;
  isFormatPainterActive?: boolean;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
  showInspector?: boolean;
  onToggleInspector?: () => void;
  onOpenAIDialog: () => void;
  vimMode?: boolean;
  onOpenShortcuts?: () => void;
  onOpenAbout?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  engine,
  scale,
  nodeCount,
  isFormatPainterActive = false,
  showMiniMap = false,
  onToggleMiniMap,
  showInspector = false,
  onToggleInspector,
  onOpenAIDialog,
  vimMode = false,
  onOpenShortcuts,
  onOpenAbout,
}) => {
  const currentLayoutId = engine?.getLayout() || 'mindMap';
  const layoutObj = LAYOUT_OPTIONS.find((l) => l.id === currentLayoutId);

  return (
    <footer className="h-7 bg-white border-t border-slate-200 px-4 flex items-center justify-between text-[11px] text-slate-500 font-medium select-none z-20">
      {/* Left Info Badges */}
      <div className="flex items-center gap-3">
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

        {vimMode && (
          <>
            <span className="h-3 w-px bg-slate-200" />
            <button
              onClick={onOpenShortcuts}
              title="Vim Navigation Active — Click to configure"
              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold hover:bg-emerald-100 transition-colors"
            >
              <Terminal size={10} />
              <span>VIM</span>
            </button>
          </>
        )}

        {/* Format Painter Active Pill */}
        {isFormatPainterActive && (
          <>
            <span className="h-3 w-px bg-slate-200" />
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 animate-pulse text-[10px] font-bold">
              <Paintbrush size={10} />
              <span>Painter Active - Click Topic</span>
              <button aria-label="Cancel Format Painter"
                onClick={() => engine?.endFormatPainter()}
                className="hover:text-amber-950 ml-0.5"
                title="Cancel Format Painter"
              >
                <X size={10} />
              </button>
            </div>
          </>
        )}
      </div>

      {/* Right Controls: Mini-Map, Pitch, Zoom & Shortcuts */}
      <div className="flex items-center gap-3">
        {/* Pitch Mode Button */}
        <button aria-label="Start Presentation Mode"
          onClick={() => engine?.enterPresentationMode()}
          title="Start Presentation Mode"
          className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 transition-colors px-1 py-0.5 rounded hover:bg-indigo-50 font-semibold"
        >
          <Play size={11} className="fill-indigo-600" />
          <span>Pitch</span>
        </button>

        <span className="h-3 w-px bg-slate-200" />

        {/* Mini-Map Toggle */}
        <button aria-label="Toggle Navigator Mini-Map"
          onClick={onToggleMiniMap}
          title="Toggle Navigator Mini-Map"
          className={cn(
            'flex items-center gap-1 px-1 py-0.5 rounded transition-colors',
            showMiniMap
              ? 'bg-indigo-50 text-indigo-700 font-semibold'
              : 'hover:text-slate-800 text-slate-600 hover:bg-slate-100'
          )}
        >
          <Eye size={12} className={showMiniMap ? 'text-indigo-600' : ''} />
          <span>Map</span>
        </button>

        <span className="h-3 w-px bg-slate-200" />

        <button aria-label="Fit Mind Map to Window"
          onClick={() => engine?.fitView()}
          title="Fit Mind Map to Window"
          className="flex items-center gap-1 hover:text-slate-800 transition-colors px-1 py-0.5 rounded hover:bg-slate-100"
        >
          <Maximize2 size={12} />
          <span>Fit</span>
        </button>

        <button aria-label="Expand All Branches"
          onClick={() => engine?.expandAll()}
          title="Expand All Branches"
          className="flex items-center gap-1 hover:text-slate-800 transition-colors px-1 py-0.5 rounded hover:bg-slate-100"
        >
          <UnfoldVertical size={12} />
          <span>Expand</span>
        </button>

        <button aria-label="Collapse All Branches"
          onClick={() => engine?.collapseAll()}
          title="Collapse All Branches"
          className="flex items-center gap-1 hover:text-slate-800 transition-colors px-1 py-0.5 rounded hover:bg-slate-100"
        >
          <FoldVertical size={12} />
          <span>Collapse</span>
        </button>

        <span className="h-3 w-px bg-slate-200" />

        {/* Format Inspector Toggle */}
        <button aria-label="Toggle Format Inspector Sidebar"
          onClick={onToggleInspector}
          title="Toggle Format Inspector Sidebar"
          className={cn(
            'flex items-center gap-1 px-1.5 py-0.5 rounded transition-colors',
            showInspector
              ? 'bg-indigo-50 text-indigo-700 font-semibold'
              : 'hover:text-slate-800 text-slate-600 hover:bg-slate-100'
          )}
        >
          <SlidersHorizontal size={12} className={showInspector ? 'text-indigo-600' : ''} />
          <span>Format</span>
        </button>

        <span className="h-3 w-px bg-slate-200" />

        <div className="flex items-center gap-1">
          <button aria-label="Zoom Out (-)"
            onClick={() => engine?.zoomOut()}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800 transition-colors"
            title="Zoom Out (-)"
          >
            <ZoomOut size={13} />
          </button>

          <span className="w-10 text-center font-mono font-semibold text-slate-700">
            {scale || 100}%
          </span>

          <button aria-label="Zoom In (+)"
            onClick={() => engine?.zoomIn()}
            className="p-1 hover:bg-slate-100 rounded text-slate-600 hover:text-slate-800 transition-colors"
            title="Zoom In (+)"
          >
            <ZoomIn size={13} />
          </button>
        </div>

        <span className="h-3 w-px bg-slate-200" />

        {/* Shortcuts Button */}
        <button
          onClick={onOpenShortcuts}
          title="Keyboard Shortcuts & Vim Mode (?)"
          className="flex items-center gap-1.5 text-slate-500 hover:text-indigo-600 transition-colors px-1 py-0.5 rounded hover:bg-slate-100"
        >
          <Keyboard size={12} />
          <kbd className="px-1 py-0.5 bg-slate-100 border border-slate-200 rounded text-[9px] font-mono font-bold">
            ?
          </kbd>
          <span className="text-[10px]">Shortcuts</span>
        </button>

        <span className="h-3 w-px bg-slate-200" />

        {/* About & Version Pill */}
        <button
          onClick={onOpenAbout}
          title={`About ZenMind v${APP_VERSION}`}
          className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 transition-colors px-1.5 py-0.5 rounded hover:bg-slate-100 font-mono text-[10px] font-semibold cursor-pointer"
        >
          <Info size={11} className="text-indigo-500" />
          <span>v{APP_VERSION}</span>
        </button>
      </div>
    </footer>
  );
};
