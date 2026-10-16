import React, { useState, useEffect } from 'react';
import { Link2, X, Check, Trash2, ExternalLink } from 'lucide-react';
import { useDialogA11y } from '../../lib/useDialogA11y';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';
import { isSafeLink } from '../../lib/sanitize';
import { stripHtml } from '../../lib/utils';

interface HyperlinkDialogProps {
  isOpen: boolean;
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  onClose: () => void;
}

export const HyperlinkDialog: React.FC<HyperlinkDialogProps> = ({
  isOpen,
  engine,
  activeNode,
  onClose,
}) => {
  const [url, setUrl] = useState('https://');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setUrl(activeNode?.hyperlink || 'https://');
    setTitle(activeNode?.hyperlinkTitle || '');
    setError(null);
  }, [isOpen, activeNode?.uid, activeNode?.hyperlink, activeNode?.hyperlinkTitle]);

  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!engine) return;
    const trimmed = url.trim();
    if (!trimmed) {
      engine.setNodeHyperlink('');
      onClose();
      return;
    }
    if (!isSafeLink(trimmed)) {
      setError('Only http, https, mailto, tel, or relative links are allowed.');
      return;
    }
    if (engine.setNodeHyperlink(trimmed, title.trim() || trimmed)) {
      onClose();
    } else {
      setError('Only http, https, mailto, tel, or relative links are allowed.');
    }
  };

  const handleRemove = () => {
    engine?.setNodeHyperlink('');
    onClose();
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Edit Topic Hyperlink"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none focus:outline-none"
    >
      <form
        onSubmit={handleSave}
        className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150"
      >
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-xs">
              <Link2 size={17} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Topic Hyperlink</h3>
              <p className="text-[11px] text-slate-400">
                Attach a web URL, email, or document path to{' '}
                <span className="font-semibold text-slate-600">
                  {stripHtml(activeNode?.text) || 'Selected Topic'}
                </span>
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        <div className="p-5 space-y-3.5">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              URL or Path
            </label>
            <input
              type="text"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              placeholder="https://example.com or mailto:team@example.com"
              className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Display Tooltip <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project Specification"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-slate-50/50 text-slate-800"
            />
          </div>

          {error && (
            <p className="text-xs text-rose-600 font-medium bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <div>
            {activeNode?.hyperlink && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRemove}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 size={13} />
                  Remove
                </button>
                {/^https?:\/\//i.test(activeNode.hyperlink) && (
                  <a
                    href={activeNode.hyperlink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <ExternalLink size={13} />
                    Open
                  </a>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <Check size={14} />
              Save Link
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};
