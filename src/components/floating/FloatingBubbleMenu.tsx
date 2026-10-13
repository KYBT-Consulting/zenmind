import React from 'react';
import {
  Plus,
  GitFork,
  Trash2,
  FileText,
  Link2,
  CheckSquare,
  Paintbrush,
  Sparkles,
  Image as ImageIcon,
  Sigma,
  BoxSelect,
  ArrowRight,
  Braces,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';
import { cn, stripHtml } from '../../lib/utils';

interface FloatingBubbleMenuProps {
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  isFormatPainterActive?: boolean;
  onOpenNotes?: () => void;
  onOpenImage?: () => void;
  onOpenFormula?: () => void;
}

export const FloatingBubbleMenu: React.FC<FloatingBubbleMenuProps> = ({
  engine,
  activeNode,
  isFormatPainterActive = false,
  onOpenNotes,
  onOpenImage,
  onOpenFormula,
}) => {
  if (!activeNode) return null;

  const currentProgress = React.useMemo(() => {
    if (!activeNode?.icon) return null;
    const pIcon = activeNode.icon.find((i) => i.startsWith('progress_'));
    if (!pIcon) return null;
    const num = parseInt(pIcon.replace('progress_', ''), 10);
    return isNaN(num) ? null : num;
  }, [activeNode?.icon]);

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl px-3 py-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
      <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate mr-1.5 pr-2 border-r border-slate-200">
        {stripHtml(activeNode.text) || 'Topic'}
      </span>

      <button
        onClick={() => engine?.insertChildNode()}
        title="Add Subtopic (Tab)"
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
      >
        <GitFork size={13} />
        <span>Sub</span>
      </button>

      <button
        onClick={() => engine?.insertSiblingNode()}
        title="Add Sibling Topic (Enter)"
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors"
      >
        <Plus size={13} />
        <span>Sibling</span>
      </button>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* Task Checkbox Quick Toggle */}
      <button
        onClick={() => engine?.toggleNodeCheckbox()}
        title="Toggle Task Checkbox"
        className={cn(
          'p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold',
          currentProgress === 100
            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            : 'text-slate-600 hover:bg-slate-100'
        )}
      >
        <CheckSquare size={13} className={currentProgress === 100 ? 'text-emerald-600' : ''} />
      </button>

      {/* Format Painter */}
      <button
        onClick={() => {
          if (isFormatPainterActive) {
            engine?.endFormatPainter();
          } else {
            engine?.startFormatPainter();
          }
        }}
        title="Format Painter (Clone Topic Style)"
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          isFormatPainterActive
            ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-400'
            : 'text-slate-600 hover:bg-slate-100'
        )}
      >
        <Paintbrush size={13} />
      </button>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* Quick Color Swatches */}
      <div className="flex items-center gap-1">
        {['#0284c7', '#059669', '#7c3aed', '#d97706', '#e11d48', '#ffffff'].map((c) => (
          <button
            key={c}
            onClick={() => {
              engine?.setNodeStyle('fillColor', c);
              engine?.setNodeStyle('color', c === '#ffffff' ? '#1e293b' : '#ffffff');
            }}
            className="w-3.5 h-3.5 rounded-full border border-slate-300 hover:scale-125 transition-transform"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* Note Drawer Opener */}
      <button
        onClick={() => onOpenNotes?.()}
        title="Open Notes Editor"
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          activeNode.note
            ? 'text-amber-600 bg-amber-50 hover:bg-amber-100'
            : 'text-slate-600 hover:bg-slate-100'
        )}
      >
        <FileText size={13} />
      </button>

      <button
        onClick={() => {
          const link = prompt('Add/Edit hyperlink URL:', activeNode.hyperlink || 'https://');
          if (link && engine && !engine.setNodeHyperlink(link)) {
            alert('Only http, https, mailto and tel links are allowed.');
          }
        }}
        title="Add Hyperlink"
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          activeNode.hyperlink
            ? 'text-blue-600 bg-blue-50 hover:bg-blue-100'
            : 'text-slate-600 hover:bg-slate-100'
        )}
      >
        <Link2 size={13} />
      </button>

      <button
        onClick={() => onOpenImage?.()}
        title="Attach Image"
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          activeNode.image
            ? 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
            : 'text-slate-600 hover:bg-slate-100'
        )}
      >
        <ImageIcon size={13} />
      </button>

      <button
        onClick={() => onOpenFormula?.()}
        title="Insert LaTeX Formula"
        className="p-1.5 rounded-lg text-slate-600 hover:text-fuchsia-600 hover:bg-slate-100 transition-colors"
      >
        <Sigma size={13} />
      </button>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      {/* Structural Annotations */}
      <button
        onClick={() => {
          if (activeNode.outerFrame) {
            engine?.removeBoundary();
          } else {
            engine?.addBoundary();
          }
        }}
        title={activeNode.outerFrame ? 'Remove Boundary Frame' : 'Add Boundary Frame'}
        className={cn(
          'p-1.5 rounded-lg transition-colors',
          activeNode.outerFrame
            ? 'text-purple-600 bg-purple-50 hover:bg-purple-100'
            : 'text-slate-600 hover:text-purple-600 hover:bg-slate-100'
        )}
      >
        <BoxSelect size={13} />
      </button>

      <button
        onClick={() => engine?.addRelationship()}
        title="Draw Relationship Arrow"
        className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-slate-100 transition-colors"
      >
        <ArrowRight size={13} />
      </button>

      <button
        onClick={() => engine?.addSummary('Summary')}
        title="Add Summary Conclusion Bracket"
        className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
      >
        <Braces size={13} />
      </button>

      <button
        onClick={() => engine?.deleteNode()}
        title="Delete Topic"
        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors ml-0.5"
      >
        <Trash2 size={13} />
      </button>
    </div>
  );
};
