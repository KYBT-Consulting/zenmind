import React, { useState, useEffect, useRef } from 'react';
import {
  Sigma,
  X,
  Check,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import katex from 'katex';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';
import { stripHtml } from '../../lib/utils';

interface FormulaDialogProps {
  isOpen: boolean;
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  onClose: () => void;
}

const PRESET_FORMULAS = [
  { label: 'Quadratic Formula', formula: 'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}' },
  { label: 'Mass-Energy', formula: 'E = mc^2' },
  { label: 'Pythagorean', formula: 'a^2 + b^2 = c^2' },
  { label: 'Euler\'s Identity', formula: 'e^{i\\pi} + 1 = 0' },
  { label: 'Gaussian Integral', formula: '\\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}' },
  { label: 'Normal Distribution', formula: 'f(x) = \\frac{1}{\\sigma \\sqrt{2\\pi}} e^{-\\frac{1}{2}\\left(\\frac{x-\\mu}{\\sigma}\\right)^2}' },
  { label: 'Summation Series', formula: '\\sum_{k=1}^n k = \\frac{n(n+1)}{2}' },
];

export const FormulaDialog: React.FC<FormulaDialogProps> = ({
  isOpen,
  engine,
  activeNode,
  onClose,
}) => {
  const [formula, setFormula] = useState<string>('E = mc^2');
  const [renderHtml, setRenderHtml] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!formula.trim()) {
      setRenderHtml('');
      setErrorMsg(null);
      return;
    }

    try {
      const html = katex.renderToString(formula, {
        throwOnError: true,
        displayMode: true,
      });
      setRenderHtml(html);
      setErrorMsg(null);
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid LaTeX syntax');
      try {
        // Fallback rendering with error highlighting
        const fallback = katex.renderToString(formula, {
          throwOnError: false,
          displayMode: true,
        });
        setRenderHtml(fallback);
      } catch {
        setRenderHtml('');
      }
    }
  }, [formula]);

  if (!isOpen) return null;

  const handleInsert = () => {
    if (!engine || !formula.trim() || errorMsg) return;
    engine.insertFormula(formula.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Sigma size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Insert LaTeX Math Formula</h3>
              <p className="text-[11px] text-slate-400">Embed mathematical equations rendered via KaTeX</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Preset Formula Chips */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" />
              Formula Presets
            </div>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_FORMULAS.map((item) => (
                <button
                  key={item.label}
                  onClick={() => setFormula(item.formula)}
                  className="px-2.5 py-1 rounded-md text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-colors cursor-pointer border border-transparent hover:border-indigo-200"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* LaTeX Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">LaTeX Expression</label>
              <span className="text-[10px] text-slate-400 font-mono">KaTeX supported</span>
            </div>
            <textarea
              rows={3}
              value={formula}
              onChange={(e) => setFormula(e.target.value)}
              placeholder="e.g. \\frac{a}{b} or E = mc^2"
              className="w-full text-xs font-mono p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50"
            />
          </div>

          {/* Real-time Rendered KaTeX Preview */}
          <div>
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Live Preview
            </div>
            <div
              ref={previewRef}
              className="min-h-[70px] max-h-[140px] overflow-auto p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-900 shadow-xs"
            >
              {renderHtml ? (
                <div dangerouslySetInnerHTML={{ __html: renderHtml }} />
              ) : (
                <div className="text-xs text-slate-400 italic">Enter LaTeX expression to preview equation</div>
              )}
            </div>
            {errorMsg && (
              <p className="text-[11px] text-rose-500 font-medium mt-1 truncate">
                {errorMsg}
              </p>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1">
            <HelpCircle size={12} />
            Target: <span className="font-semibold text-slate-600 truncate max-w-[150px]">{stripHtml(activeNode?.text) || 'Selected Topic'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={handleInsert}
              disabled={!formula.trim() || !!errorMsg}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Check size={14} />
              Insert Formula
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
