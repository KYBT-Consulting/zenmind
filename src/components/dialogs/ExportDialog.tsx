import React, { useState } from 'react';
import { useDialogA11y } from '../../lib/useDialogA11y';
import {
  Download,
  X,
  FileImage,
  FileCode,
  FileText,
  FileJson,
  Check,
  FolderArchive,
  ListTree,
  Network,
  Sparkles,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';

interface ExportDialogProps {
  isOpen: boolean;
  engine: MindMapEngine | null;
  docTitle: string;
  onClose: () => void;
}

export type ExportFormatId =
  | 'png'
  | 'svg'
  | 'pdf'
  | 'xmind'
  | 'zenmind'
  | 'md'
  | 'opml'
  | 'mm'
  | 'json';

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  engine,
  docTitle,
  onClose,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormatId>('png');
  const [transparent, setTransparent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);

  if (!isOpen) return null;

  const formats = [
    {
      id: 'png' as ExportFormatId,
      label: 'PNG Image (.png)',
      desc: 'High resolution raster image for presentations and sharing',
      icon: FileImage,
      color: 'text-indigo-600',
    },
    {
      id: 'svg' as ExportFormatId,
      label: 'SVG Vector (.svg)',
      desc: 'Scalable vector graphic with crisp resolution at any scale',
      icon: FileCode,
      color: 'text-emerald-600',
    },
    {
      id: 'pdf' as ExportFormatId,
      label: 'PDF Document (.pdf)',
      desc: 'Print-ready vector PDF document',
      icon: FileText,
      color: 'text-red-600',
    },
    {
      id: 'xmind' as ExportFormatId,
      label: 'XMind Archive (.xmind)',
      desc: 'Compatible with XMind 8, XMind Zen, and modern mind mappers',
      icon: FolderArchive,
      color: 'text-orange-600',
    },
    {
      id: 'zenmind' as ExportFormatId,
      label: 'ZenMind Native (.zenmind)',
      desc: 'Lossless native project file with custom themes, notes, and layout',
      icon: Sparkles,
      color: 'text-violet-600',
    },
    {
      id: 'md' as ExportFormatId,
      label: 'Markdown Outline (.md)',
      desc: 'Hierarchical list formatted in Markdown for Obsidian, Notion, or Logseq',
      icon: FileText,
      color: 'text-slate-700',
    },
    {
      id: 'opml' as ExportFormatId,
      label: 'OPML 2.0 Outline (.opml)',
      desc: 'Standard outline format for MindNode, OmniOutliner, and Workflowy',
      icon: ListTree,
      color: 'text-teal-600',
    },
    {
      id: 'mm' as ExportFormatId,
      label: 'FreeMind / Freeplane (.mm)',
      desc: 'Open XML mind map standard used by FreeMind and Freeplane',
      icon: Network,
      color: 'text-cyan-600',
    },
    {
      id: 'json' as ExportFormatId,
      label: 'JSON Tree (.json)',
      desc: 'Raw structured JSON tree data for developers and pipelines',
      icon: FileJson,
      color: 'text-amber-600',
    },
  ];

  const handleExport = async () => {
    if (!engine) return;
    setIsExporting(true);

    try {
      const filename = docTitle.trim() || 'mind-map';
      await engine.export(selectedFormat, filename, transparent);
      onClose();
    } catch (err) {
      console.error('Export failed:', err);
      alert('Export failed. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Export mind map"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none focus:outline-none"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Download size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Export Mind Map</h3>
              <p className="text-[11px] text-slate-400">Select output format and options</p>
            </div>
          </div>
          <button aria-label="Close"
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          <div className="space-y-2">
            {formats.map((fmt) => {
              const Icon = fmt.icon;
              const isSelected = selectedFormat === fmt.id;
              return (
                <button
                  key={fmt.id}
                  onClick={() => setSelectedFormat(fmt.id as any)}
                  className={`w-full p-3 rounded-xl border text-left flex items-start gap-3 transition-all ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/40 ring-1 ring-indigo-500/20 shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  <Icon size={20} className={`${fmt.color} mt-0.5 shrink-0`} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-slate-800">{fmt.label}</span>
                      {isSelected && <Check size={14} className="text-indigo-600" />}
                    </div>
                    <span className="text-[11px] text-slate-400 mt-0.5 block">{fmt.desc}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {selectedFormat === 'png' && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-600 font-medium">Transparent Background</span>
              <input
                type="checkbox"
                checked={transparent}
                onChange={(e) => setTransparent(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded border-slate-300 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition-all disabled:opacity-50"
          >
            <Download size={14} />
            <span>{isExporting ? 'Exporting...' : 'Export File'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
