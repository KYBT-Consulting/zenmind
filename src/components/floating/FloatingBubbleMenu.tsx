import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus,
  GitFork,
  Trash2,
  FileText,
  Link2,
  CheckSquare,
  Paintbrush,
  Highlighter,
  BadgeAlert,
  Image as ImageIcon,
  Sigma,
  BoxSelect,
  ArrowRight,
  Braces,
  X,
  Check,
} from 'lucide-react';
import katex from 'katex';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';
import { cn, stripHtml } from '../../lib/utils';
import {
  CALLOUT_PRESETS,
  extractLatexFormulas,
  HIGHLIGHT_TINTS,
} from '../../lib/inlineMarkdown';

interface FloatingBubbleMenuProps {
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  isFormatPainterActive?: boolean;
  onOpenNotes?: () => void;
  onOpenImage?: () => void;
  onOpenFormula?: () => void;
  onOpenHyperlink?: () => void;
}

export const FloatingBubbleMenu: React.FC<FloatingBubbleMenuProps> = ({
  engine,
  activeNode,
  isFormatPainterActive = false,
  onOpenNotes,
  onOpenImage,
  onOpenFormula,
  onOpenHyperlink,
}) => {
  const [activePopover, setActivePopover] = useState<'highlight' | 'callout' | 'formula' | null>(
    null
  );
  const [quickFormula, setQuickFormula] = useState('');

  useEffect(() => {
    setActivePopover(null);
  }, [activeNode?.uid]);

  const currentProgress = useMemo(() => {
    if (!activeNode?.icon) return null;
    const pIcon = activeNode.icon.find((i) => i.startsWith('progress_'));
    if (!pIcon) return null;
    const num = parseInt(pIcon.replace('progress_', ''), 10);
    return isNaN(num) ? null : num;
  }, [activeNode?.icon]);

  const nodeFormulas = useMemo(
    () => extractLatexFormulas(activeNode?.text || ''),
    [activeNode?.text]
  );

  const liveFormulaHtml = useMemo(() => {
    const expr = quickFormula.trim() || nodeFormulas[0] || '';
    if (!expr) return '';
    try {
      return katex.renderToString(expr, {
        throwOnError: false,
        displayMode: true,
        trust: false,
      });
    } catch {
      return '';
    }
  }, [quickFormula, nodeFormulas]);

  // After all hooks (hooks must run in the same order on every render)
  if (!activeNode) return null;

  const togglePopover = (name: 'highlight' | 'callout' | 'formula') => {
    setActivePopover((prev) => {
      const next = prev === name ? null : name;
      if (next === 'formula') {
        setQuickFormula(nodeFormulas[0] || 'E = mc^2');
      }
      return next;
    });
  };

  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center gap-2">
      <div className="bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-xl rounded-2xl px-3 py-1.5 flex items-center gap-1.5 animate-in fade-in slide-in-from-top-2 duration-150">
        <span className="text-xs font-bold text-slate-800 max-w-[130px] truncate mr-1.5 pr-2 border-r border-slate-200">
          {stripHtml(activeNode.text) || 'Topic'}
        </span>

        <button
          aria-label="Add Subtopic (Tab)"
          onClick={() => engine?.insertChildNode()}
          title="Add Subtopic (Tab)"
          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors"
        >
          <GitFork size={13} />
          <span>Sub</span>
        </button>

        <button
          aria-label="Add Sibling Topic (Enter)"
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
          aria-label="Toggle Task Checkbox"
          onClick={() => engine?.toggleNodeCheckbox()}
          title="Toggle Task Checkbox"
          className={cn(
            'p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold',
            currentProgress === 100
              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
              : currentProgress !== null
              ? 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <CheckSquare
            size={13}
            className={
              currentProgress === 100
                ? 'text-emerald-600'
                : currentProgress !== null
                ? 'text-indigo-600'
                : ''
            }
          />
          {currentProgress !== null && (
            <span className="text-[10px] font-bold">{currentProgress}%</span>
          )}
        </button>

        {/* Format Painter */}
        <button
          aria-label="Format Painter (Clone Topic Style)"
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

        {/* Text Highlighter Tints */}
        <button
          aria-label="Text Highlighter Tint"
          onClick={() => togglePopover('highlight')}
          title="Text Highlighter Tint (or type ==text==)"
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            activePopover === 'highlight'
              ? 'bg-yellow-100 text-amber-800'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <Highlighter size={13} />
        </button>

        {/* Callout Badges */}
        <button
          aria-label="Callout Badge Preset"
          onClick={() => togglePopover('callout')}
          title="Callout Badge Preset (NOTE, TIP, IMPORTANT, WARNING, CAUTION)"
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            activePopover === 'callout'
              ? 'bg-indigo-100 text-indigo-700'
              : 'text-slate-600 hover:bg-slate-100'
          )}
        >
          <BadgeAlert size={13} />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5" />

        {/* Quick Color Swatches */}
        <div className="flex items-center gap-1">
          {['#0284c7', '#059669', '#7c3aed', '#d97706', '#e11d48', '#ffffff'].map((c) => (
            <button
              aria-label={`Fill color ${c}`}
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
          aria-label="Open Notes Editor"
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
          aria-label="Add Hyperlink"
          onClick={() => onOpenHyperlink?.()}
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
          aria-label="Attach Image"
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
          aria-label="LaTeX Formula Live Popover"
          onClick={() => togglePopover('formula')}
          title="LaTeX Formula Live Preview (or type $formula$ inline)"
          className={cn(
            'p-1.5 rounded-lg transition-colors',
            activePopover === 'formula' || nodeFormulas.length > 0
              ? 'text-fuchsia-700 bg-fuchsia-50 hover:bg-fuchsia-100'
              : 'text-slate-600 hover:text-fuchsia-600 hover:bg-slate-100'
          )}
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
          aria-label="Draw Relationship Arrow"
          onClick={() => engine?.addRelationship()}
          title="Draw Relationship Arrow"
          className="p-1.5 rounded-lg text-slate-600 hover:text-sky-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowRight size={13} />
        </button>

        <button
          aria-label="Add Summary Conclusion Bracket"
          onClick={() => engine?.addSummary('Summary')}
          title="Add Summary Conclusion Bracket"
          className="p-1.5 rounded-lg text-slate-600 hover:text-indigo-600 hover:bg-slate-100 transition-colors"
        >
          <Braces size={13} />
        </button>

        <button
          aria-label="Delete Topic"
          onClick={() => engine?.deleteNode()}
          title="Delete Topic"
          className="p-1.5 hover:bg-red-50 text-red-500 rounded-lg transition-colors ml-0.5"
        >
          <Trash2 size={13} />
        </button>
      </div>

      {/* Text Highlighter Tints Popover */}
      {activePopover === 'highlight' && (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl px-3 py-2 flex items-center gap-2 text-xs animate-in fade-in duration-100">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Highlight Tint:</span>
          {HIGHLIGHT_TINTS.map((tint) => (
            <button
              key={tint.id}
              type="button"
              onClick={() => {
                engine?.setNodeHighlightTint(tint);
                setActivePopover(null);
              }}
              className="px-2 py-0.5 rounded font-semibold border border-slate-200/80 hover:scale-105 transition-transform"
              style={{ backgroundColor: tint.bg, color: tint.text }}
            >
              {tint.label.split(' ')[1] || tint.label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              engine?.setNodeHighlightTint(null);
              setActivePopover(null);
            }}
            className="px-2 py-0.5 rounded text-slate-500 hover:bg-slate-100 border border-slate-200"
          >
            Clear
          </button>
        </div>
      )}

      {/* Callout Badges Popover */}
      {activePopover === 'callout' && (
        <div className="bg-white/95 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl px-3 py-2 flex items-center gap-1.5 text-xs animate-in fade-in duration-100">
          <span className="text-[11px] font-semibold text-slate-500 mr-1">Callout Badge:</span>
          {CALLOUT_PRESETS.map((preset) => (
            <button
              key={preset.type}
              type="button"
              onClick={() => {
                engine?.applyCalloutBadge(preset.type);
                setActivePopover(null);
              }}
              className="px-2 py-0.5 rounded font-bold text-[10px] border transition-transform hover:scale-105"
              style={{
                backgroundColor: preset.badgeBg,
                color: preset.badgeText,
                borderColor: preset.nodeBorder,
              }}
            >
              {preset.type}
            </button>
          ))}
          <button
            type="button"
            onClick={() => {
              engine?.applyCalloutBadge(null);
              setActivePopover(null);
            }}
            className="px-2 py-0.5 rounded text-slate-500 hover:bg-slate-100 border border-slate-200 text-[11px]"
          >
            Clear
          </button>
        </div>
      )}

      {/* Live KaTeX Formula Preview Popover (shown when toggled or when node contains a formula) */}
      {(activePopover === 'formula' || (nodeFormulas.length > 0 && activePopover === null)) && (
        <div className="bg-white/95 backdrop-blur-md border border-fuchsia-200 shadow-lg rounded-xl p-3 w-80 text-xs animate-in fade-in duration-100">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-fuchsia-700 flex items-center gap-1">
              <Sigma size={12} />
              Live KaTeX Formula Preview
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => onOpenFormula?.()}
                className="text-[10px] font-semibold text-indigo-600 hover:underline px-1"
              >
                Presets…
              </button>
              {activePopover === 'formula' && (
                <button
                  type="button"
                  onClick={() => setActivePopover(null)}
                  className="text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {liveFormulaHtml && (
            <div
              className="p-2 rounded-lg bg-slate-50 border border-slate-200/80 flex items-center justify-center overflow-x-auto mb-2"
              dangerouslySetInnerHTML={{ __html: liveFormulaHtml }}
            />
          )}

          {activePopover === 'formula' && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!quickFormula.trim()) return;
                engine?.insertFormula(quickFormula.trim());
                setActivePopover(null);
              }}
              className="flex items-center gap-1.5"
            >
              <input
                type="text"
                value={quickFormula}
                onChange={(e) => setQuickFormula(e.target.value)}
                placeholder="e.g. \int_0^\infty e^{-x} dx"
                className="flex-1 px-2 py-1 text-xs font-mono border border-slate-200 rounded-md focus:outline-none focus:border-fuchsia-500"
              />
              <button
                type="submit"
                className="px-2.5 py-1 rounded-md bg-fuchsia-600 text-white font-semibold hover:bg-fuchsia-700 flex items-center gap-1"
              >
                <Check size={12} />
                Insert
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
