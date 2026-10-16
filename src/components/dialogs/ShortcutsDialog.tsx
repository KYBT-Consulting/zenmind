import React from 'react';
import { Keyboard, X, Terminal } from 'lucide-react';
import { useDialogA11y } from '../../lib/useDialogA11y';

interface ShortcutsDialogProps {
  isOpen: boolean;
  vimMode: boolean;
  onToggleVimMode: (enabled: boolean) => void;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
}

const TOPIC_SHORTCUTS: ShortcutItem[] = [
  { keys: ['Tab', 'Insert'], description: 'Insert child subtopic' },
  { keys: ['Enter'], description: 'Insert sibling topic below' },
  { keys: ['Shift', 'Tab'], description: 'Insert parent topic' },
  { keys: ['Double Click'], description: 'Edit topic text in-place' },
  { keys: ['Delete', 'Backspace'], description: 'Delete selected topic(s)' },
  { keys: ['/'], description: 'Expand or collapse branch children' },
];

const DOCUMENT_SHORTCUTS: ShortcutItem[] = [
  { keys: ['Ctrl', 'F'], description: 'Find & Replace across topics' },
  { keys: ['Ctrl', 'Z'], description: 'Undo last change' },
  { keys: ['Ctrl', 'Y'], description: 'Redo change' },
  { keys: ['Ctrl', 'C'], description: 'Copy selected topic subtree' },
  { keys: ['Ctrl', 'X'], description: 'Cut selected topic subtree' },
  { keys: ['Ctrl', 'V'], description: 'Paste topic subtree' },
];

const NAVIGATION_SHORTCUTS: ShortcutItem[] = [
  { keys: ['←', '↑', '↓', '→'], description: 'Spatial focus navigation between topics' },
  { keys: ['Ctrl', '+ / -'], description: 'Zoom in / Zoom out canvas' },
  { keys: ['?'], description: 'Open Keyboard Shortcuts & Vim dialog' },
  { keys: ['Esc'], description: 'Close active dialog or search bar' },
];

const VIM_SHORTCUTS: ShortcutItem[] = [
  { keys: ['h', 'j', 'k', 'l'], description: 'Navigate Left / Down / Up / Right spatially' },
  { keys: ['o'], description: 'Insert child subtopic on selected node' },
  { keys: ['O'], description: 'Insert sibling topic on selected node' },
  { keys: ['i', 'e'], description: 'Enter inline text edit mode on active node' },
  { keys: ['x'], description: 'Delete selected topic' },
  { keys: ['u'], description: 'Undo last operation' },
  { keys: ['f'], description: 'Fit entire mind map into canvas viewport' },
];

export const ShortcutsDialog: React.FC<ShortcutsDialogProps> = ({
  isOpen,
  vimMode,
  onToggleVimMode,
  onClose,
}) => {
  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const renderSection = (title: string, items: ShortcutItem[], highlight = false) => (
    <div
      className={`rounded-xl border p-4 ${
        highlight
          ? 'border-indigo-200 bg-indigo-50/40'
          : 'border-slate-200 bg-slate-50/50'
      }`}
    >
      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 mb-3 flex items-center justify-between">
        <span>{title}</span>
        {highlight && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              vimMode
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                : 'bg-slate-200 text-slate-600'
            }`}
          >
            {vimMode ? 'Enabled' : 'Disabled'}
          </span>
        )}
      </h4>
      <div className="space-y-2">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-xs">
            <span className="text-slate-600">{item.description}</span>
            <div className="flex items-center gap-1 shrink-0">
              {item.keys.map((k, kIdx) => (
                <React.Fragment key={kIdx}>
                  {kIdx > 0 && <span className="text-[10px] text-slate-400">+</span>}
                  <kbd className="px-1.5 py-0.5 text-[11px] font-mono font-semibold text-slate-700 bg-white border border-slate-300 rounded shadow-[0_1px_0_rgba(0,0,0,0.08)]">
                    {k}
                  </kbd>
                </React.Fragment>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="shortcuts-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center shadow-sm">
              <Keyboard size={17} />
            </div>
            <div>
              <h3 id="shortcuts-dialog-title" className="text-sm font-semibold text-slate-800">
                Keyboard Shortcuts &amp; Vim Mode
              </h3>
              <p className="text-[11px] text-slate-500">
                Navigate, structure, and refactor your mind map without leaving the keyboard
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close keyboard shortcuts dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Vim Mode Toggle Banner */}
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 flex items-center justify-center">
              <Terminal size={16} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold">Vim Modal Navigation</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono">
                  h j k l · o O · i x u f
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                When enabled and not editing text, use single-key Vim bindings to traverse and edit
                nodes rapidly.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={vimMode}
            onClick={() => onToggleVimMode(!vimMode)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
              vimMode ? 'bg-emerald-500' : 'bg-slate-600'
            }`}
          >
            <span
              className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                vimMode ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Grid of Shortcut Sections */}
        <div className="p-5 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-4">
          {renderSection('Topic Creation & Editing', TOPIC_SHORTCUTS)}
          {renderSection('Vim Mode Bindings', VIM_SHORTCUTS, true)}
          {renderSection('Spatial Navigation & View', NAVIGATION_SHORTCUTS)}
          {renderSection('Document & Clipboard', DOCUMENT_SHORTCUTS)}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>
            Tip: Press <kbd className="px-1.5 py-0.5 bg-white border border-slate-300 rounded font-mono text-slate-700">?</kbd> anywhere on the canvas to toggle this cheat-sheet.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-slate-200/80 text-slate-700 hover:bg-slate-300/70 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
