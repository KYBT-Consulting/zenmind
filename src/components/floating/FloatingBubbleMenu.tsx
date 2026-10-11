import React from 'react';
import {
  Plus,
  GitFork,
  Trash2,
  Palette,
  Square,
  FileText,
  Link2,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo, SHAPE_OPTIONS } from '../../types/mindmap';

interface FloatingBubbleMenuProps {
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
}

export const FloatingBubbleMenu: React.FC<FloatingBubbleMenuProps> = ({
  engine,
  activeNode,
}) => {
  if (!activeNode) return null;

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl px-3 py-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
      <span className="text-xs font-bold text-slate-800 max-w-[140px] truncate mr-2 pr-2 border-r border-slate-200">
        {activeNode.text || 'Selected Topic'}
      </span>

      <button
        onClick={() => engine?.insertChildNode()}
        title="Add Subtopic (Tab)"
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
      >
        <GitFork size={13} />
        <span>Subtopic</span>
      </button>

      <button
        onClick={() => engine?.insertSiblingNode()}
        title="Add Sibling Topic (Enter)"
        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 text-xs font-semibold transition-colors"
      >
        <Plus size={13} />
        <span>Sibling</span>
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
            className="w-4 h-4 rounded-full border border-slate-300 hover:scale-125 transition-transform"
            style={{ backgroundColor: c }}
          />
        ))}
      </div>

      <div className="h-4 w-px bg-slate-200 mx-0.5" />

      <button
        onClick={() => {
          const note = prompt('Add/Edit note:', activeNode.note || '');
          if (note !== null) engine?.setNodeNote(note);
        }}
        title="Add Note"
        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
      >
        <FileText size={14} />
      </button>

      <button
        onClick={() => {
          const link = prompt('Add/Edit hyperlink URL:', activeNode.hyperlink || 'https://');
          if (link) engine?.setNodeHyperlink(link);
        }}
        title="Add Hyperlink"
        className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
      >
        <Link2 size={14} />
      </button>

      <button
        onClick={() => engine?.deleteNode()}
        title="Delete Topic"
        className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors ml-1"
      >
        <Trash2 size={14} />
      </button>
    </div>
  );
};
