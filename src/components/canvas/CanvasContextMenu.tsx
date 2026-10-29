import React, { useEffect, useRef } from 'react';
import {
  Plus,
  GitFork,
  CornerLeftUp,
  Edit3,
  Copy,
  Scissors,
  ClipboardPaste,
  CopyPlus,
  ArrowUp,
  ArrowDown,
  ChevronsUpDown,
  CheckSquare,
  Braces,
  BoxSelect,
  ArrowRightCircle,
  Image as ImageIcon,
  Link2,
  FileText,
  Trash2,
  Layers,
  Maximize2,
  RotateCcw,
  UnfoldVertical,
  FoldVertical,
} from 'lucide-react';
import { MindMapEngine, ContextMenuEventInfo } from '../../engine/MindMapEngine';
import { PriorityLevel, ProgressLevel } from '../../types/mindmap';
import { cn } from '../../lib/utils';

interface CanvasContextMenuProps {
  menu: ContextMenuEventInfo | null;
  engine: MindMapEngine | null;
  onClose: () => void;
  onOpenNotes?: () => void;
  onOpenImageDialog?: () => void;
  onOpenHyperlinkDialog?: () => void;
}

export const CanvasContextMenu: React.FC<CanvasContextMenuProps> = ({
  menu,
  engine,
  onClose,
  onOpenNotes,
  onOpenImageDialog,
  onOpenHyperlinkDialog,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menu) return;

    const handleMouseDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    const handleWheel = () => onClose();

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('wheel', handleWheel, { passive: true });
    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('wheel', handleWheel);
    };
  }, [menu, onClose]);

  if (!menu || !engine) return null;

  const isNode = menu.type === 'node' && !!menu.node;
  const isRoot = !!menu.node?.isRoot;
  const icons = menu.node?.icon || [];
  const currentPriorityIcon = icons.find((i) => i.startsWith('priority_'));
  const currentProgressIcon = icons.find((i) => i.startsWith('progress_'));
  const currentPriority = currentPriorityIcon
    ? (parseInt(currentPriorityIcon.replace('priority_', ''), 10) as PriorityLevel)
    : null;
  const currentProgress = currentProgressIcon
    ? (parseInt(currentProgressIcon.replace('progress_', ''), 10) as ProgressLevel)
    : null;

  // Keep context menu inside viewport boundaries
  const menuWidth = 248;
  const estimatedHeight = isNode ? 470 : 280;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 800;
  const left = Math.max(8, Math.min(menu.clientX, viewportW - menuWidth - 8));
  const top = Math.max(8, Math.min(menu.clientY, viewportH - estimatedHeight - 8));

  const run = (fn: () => void) => {
    fn();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={isNode ? 'Topic context menu' : 'Canvas context menu'}
      onContextMenu={(e) => e.preventDefault()}
      style={{ left: `${left}px`, top: `${top}px`, width: `${menuWidth}px` }}
      className="fixed z-50 bg-white/98 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200/90 py-1.5 text-xs text-slate-700 select-none animate-in fade-in zoom-in-95 duration-100"
    >
      {isNode ? (
        <>
          {/* Topic Structure Actions */}
          <button
            role="menuitem"
            onClick={() => run(() => engine.editActiveNode())}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <Edit3 size={13} className="text-indigo-600" />
              <span>Edit Topic Text</span>
            </span>
            <kbd className="text-[10px] font-mono text-slate-400">DblClick</kbd>
          </button>

          <button
            role="menuitem"
            onClick={() => run(() => engine.insertChildNode())}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <GitFork size={13} className="text-sky-600" />
              <span>Add Subtopic</span>
            </span>
            <kbd className="text-[10px] font-mono text-slate-400">Tab</kbd>
          </button>

          <button
            role="menuitem"
            disabled={isRoot}
            onClick={() => !isRoot && run(() => engine.insertSiblingNode())}
            className={cn(
              'w-full px-3 py-1.5 flex items-center justify-between transition-colors',
              isRoot
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer'
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <Plus size={13} className="text-indigo-600" />
              <span>Add Sibling Topic</span>
            </span>
            <kbd className="text-[10px] font-mono text-slate-400">Enter</kbd>
          </button>

          <button
            role="menuitem"
            disabled={isRoot}
            onClick={() => !isRoot && run(() => engine.insertParentNode())}
            className={cn(
              'w-full px-3 py-1.5 flex items-center justify-between transition-colors',
              isRoot
                ? 'opacity-40 cursor-not-allowed'
                : 'hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer'
            )}
          >
            <span className="flex items-center gap-2 font-medium">
              <CornerLeftUp size={13} className="text-slate-600" />
              <span>Insert Parent Topic</span>
            </span>
            <kbd className="text-[10px] font-mono text-slate-400">Shift+Tab</kbd>
          </button>

          <div className="my-1 border-t border-slate-100" />

          {/* Clipboard & Duplicate */}
          <div className="px-2 py-0.5 grid grid-cols-4 gap-1">
            <button
              role="menuitem"
              onClick={() => run(() => engine.copyNode())}
              title="Copy Topic (Ctrl+C)"
              className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <Copy size={13} className="text-slate-600" />
              <span className="text-[10px] mt-0.5 font-medium">Copy</span>
            </button>

            <button
              role="menuitem"
              disabled={isRoot}
              onClick={() => !isRoot && run(() => engine.cutNode())}
              title="Cut Topic (Ctrl+X)"
              className={cn(
                'flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors',
                isRoot ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700 cursor-pointer'
              )}
            >
              <Scissors size={13} className="text-slate-600" />
              <span className="text-[10px] mt-0.5 font-medium">Cut</span>
            </button>

            <button
              role="menuitem"
              onClick={() => run(() => engine.pasteNode())}
              title="Paste Topic (Ctrl+V)"
              className="flex flex-col items-center justify-center py-1.5 rounded-lg hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
            >
              <ClipboardPaste size={13} className="text-slate-600" />
              <span className="text-[10px] mt-0.5 font-medium">Paste</span>
            </button>

            <button
              role="menuitem"
              disabled={isRoot}
              onClick={() => !isRoot && run(() => engine.duplicateNode())}
              title="Duplicate Topic"
              className={cn(
                'flex flex-col items-center justify-center py-1.5 rounded-lg transition-colors',
                isRoot ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700 cursor-pointer'
              )}
            >
              <CopyPlus size={13} className="text-indigo-600" />
              <span className="text-[10px] mt-0.5 font-medium">Clone</span>
            </button>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {/* Ordering & Fold */}
          <div className="px-2 py-0.5 flex items-center gap-1">
            <button
              role="menuitem"
              disabled={isRoot}
              onClick={() => !isRoot && run(() => engine.moveNodeUp())}
              className={cn(
                'flex-1 px-2 py-1 rounded-lg flex items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                isRoot ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'
              )}
              title="Move Topic Up"
            >
              <ArrowUp size={12} />
              <span>Move Up</span>
            </button>

            <button
              role="menuitem"
              disabled={isRoot}
              onClick={() => !isRoot && run(() => engine.moveNodeDown())}
              className={cn(
                'flex-1 px-2 py-1 rounded-lg flex items-center justify-center gap-1 text-[11px] font-medium transition-colors',
                isRoot ? 'opacity-40 cursor-not-allowed' : 'hover:bg-slate-100 cursor-pointer'
              )}
              title="Move Topic Down"
            >
              <ArrowDown size={12} />
              <span>Move Down</span>
            </button>

            <button
              role="menuitem"
              onClick={() => run(() => engine.toggleNodeExpand())}
              className="px-2 py-1 rounded-lg flex items-center justify-center gap-1 text-[11px] font-medium hover:bg-slate-100 cursor-pointer transition-colors"
              title="Expand / Collapse Subtree (/)"
            >
              <ChevronsUpDown size={12} className="text-indigo-600" />
              <span>Fold</span>
            </button>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {/* Quick Task Progress & Priority */}
          <div className="px-3 py-1 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <CheckSquare size={11} className="text-emerald-600" />
                <span>Task</span>
              </span>
              <div className="flex items-center gap-1">
                {([0, 25, 50, 75, 100] as ProgressLevel[]).map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() =>
                      run(() => engine.setNodeProgress(currentProgress === pct ? null : pct))
                    }
                    className={cn(
                      'px-1.5 py-0.5 rounded text-[10px] font-bold transition-colors cursor-pointer',
                      currentProgress === pct
                        ? 'bg-emerald-600 text-white'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                    )}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Priority
              </span>
              <div className="flex items-center gap-1">
                {([1, 2, 3, 4, 5] as PriorityLevel[]).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() =>
                      run(() => engine.setNodePriority(currentPriority === lvl ? null : lvl))
                    }
                    className={cn(
                      'w-5 h-5 rounded text-[10px] font-bold transition-colors cursor-pointer',
                      currentPriority === lvl
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    )}
                  >
                    P{lvl}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {/* Annotations & Attachments */}
          <div className="px-2 py-0.5 grid grid-cols-3 gap-1">
            <button
              role="menuitem"
              onClick={() => run(() => engine.addSummary())}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"
            >
              <Braces size={12} className="text-indigo-600 shrink-0" />
              <span>Summary</span>
            </button>

            <button
              role="menuitem"
              onClick={() => run(() => engine.addBoundary())}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"
            >
              <BoxSelect size={12} className="text-purple-600 shrink-0" />
              <span>Boundary</span>
            </button>

            <button
              role="menuitem"
              onClick={() => run(() => engine.addRelationship())}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"
            >
              <ArrowRightCircle size={12} className="text-sky-600 shrink-0" />
              <span>Link Line</span>
            </button>

            <button
              role="menuitem"
              onClick={() => run(() => onOpenImageDialog?.())}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"
            >
              <ImageIcon size={12} className="text-blue-600 shrink-0" />
              <span>Image</span>
            </button>

            <button
              role="menuitem"
              onClick={() => run(() => onOpenHyperlinkDialog?.())}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"
            >
              <Link2 size={12} className="text-emerald-600 shrink-0" />
              <span>URL</span>
            </button>

            <button
              role="menuitem"
              onClick={() => run(() => onOpenNotes?.())}
              className="px-2 py-1 rounded-lg hover:bg-slate-100 flex items-center gap-1.5 text-[11px] text-slate-700 cursor-pointer"
            >
              <FileText size={12} className="text-amber-600 shrink-0" />
              <span>Notes</span>
            </button>
          </div>

          <div className="my-1 border-t border-slate-100" />

          {/* Delete */}
          <button
            role="menuitem"
            disabled={isRoot}
            onClick={() => !isRoot && run(() => engine.deleteNode())}
            className={cn(
              'w-full px-3 py-1.5 flex items-center justify-between transition-colors',
              isRoot
                ? 'opacity-40 cursor-not-allowed text-slate-400'
                : 'text-red-600 hover:bg-red-50 cursor-pointer'
            )}
          >
            <span className="flex items-center gap-2 font-semibold">
              <Trash2 size={13} />
              <span>Delete Topic</span>
            </span>
            <kbd className="text-[10px] font-mono text-red-400">Del</kbd>
          </button>
        </>
      ) : (
        /* Canvas Background Context Menu */
        <>
          <button
            role="menuitem"
            onClick={() =>
              run(() => {
                const pos = engine.screenToCanvasPos(menu.clientX, menu.clientY);
                engine.insertFloatingNode('Floating Idea', pos);
              })
            }
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <Layers size={13} className="text-teal-600" />
              <span>New Floating Topic Here</span>
            </span>
            <kbd className="text-[10px] font-mono text-slate-400">DblClick</kbd>
          </button>

          <button
            role="menuitem"
            onClick={() => run(() => engine.pasteNode())}
            className="w-full px-3 py-1.5 flex items-center justify-between hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 font-medium">
              <ClipboardPaste size={13} className="text-indigo-600" />
              <span>Paste Topic</span>
            </span>
            <kbd className="text-[10px] font-mono text-slate-400">Ctrl+V</kbd>
          </button>

          <div className="my-1 border-t border-slate-100" />

          <button
            role="menuitem"
            onClick={() => run(() => engine.expandAll())}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer font-medium"
          >
            <UnfoldVertical size={13} className="text-indigo-600" />
            <span>Expand All Branches</span>
          </button>

          <button
            role="menuitem"
            onClick={() => run(() => engine.collapseAll())}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer font-medium"
          >
            <FoldVertical size={13} className="text-amber-600" />
            <span>Collapse All Branches</span>
          </button>

          <div className="px-3 py-1.5 flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Expand Level
            </span>
            <div className="flex items-center gap-1">
              {[1, 2, 3].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => run(() => engine.expandToLevel(lvl))}
                  className="px-2 py-0.5 rounded bg-slate-100 hover:bg-indigo-100 hover:text-indigo-700 text-slate-700 text-[10px] font-bold transition-colors cursor-pointer"
                >
                  L{lvl}
                </button>
              ))}
            </div>
          </div>

          <div className="my-1 border-t border-slate-100" />

          <button
            role="menuitem"
            onClick={() => run(() => engine.fitView())}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer font-medium"
          >
            <Maximize2 size={13} className="text-indigo-600" />
            <span>Fit Mind Map to View</span>
          </button>

          <button
            role="menuitem"
            onClick={() => run(() => engine.resetView())}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer font-medium"
          >
            <RotateCcw size={13} className="text-slate-600" />
            <span>Reset Zoom (100%)</span>
          </button>

          <button
            role="menuitem"
            onClick={() => run(() => engine.resetLayout())}
            className="w-full px-3 py-1.5 flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-700 transition-colors cursor-pointer font-medium"
          >
            <ChevronsUpDown size={13} className="text-emerald-600" />
            <span>Tidy &amp; Align Layout</span>
          </button>
        </>
      )}
    </div>
  );
};
