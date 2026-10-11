import React, { useState } from 'react';
import {
  Download,
  X,
  FileImage,
  FileCode,
  FileText,
  FileJson,
  Check,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';

interface ExportDialogProps {
  isOpen: boolean;
  engine: MindMapEngine | null;
  docTitle: string;
  onClose: () => void;
}

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  engine,
  docTitle,
  onClose,
}) => {
  const [selectedFormat, setSelectedFormat] = useState<'png' | 'svg' | 'pdf' | 'md' | 'json'>('png');
  const [transparent, setTransparent] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  if (!isOpen) return null;

  const formats = [
    {
      id: 'png',
      label: 'PNG Image',
      desc: 'High resolution raster image for presentations and sharing',
      icon: FileImage,
      color: 'text-indigo-600',
    },
    {
      id: 'svg',
      label: 'SVG Vector',
      desc: 'Scalable vector graphic with crisp resolution at any scale',
      icon: FileCode,
      color: 'text-emerald-600',
    },
    {
      id: 'pdf',
      label: 'PDF Document',
      desc: 'Print-ready PDF document',
      icon: FileText,
      color: 'text-red-600',
    },
    {
      id: 'md',
      label: 'Markdown (.md)',
      desc: 'Hierarchical list formatted in Markdown for Obsidian or Notion',
      icon: FileText,
      color: 'text-slate-700',
    },
    {
      id: 'json',
      label: 'JSON Project',
      desc: 'Full raw data to reload and backup in ZenMind',
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-xs">
              <Download size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Export Mind Map</h3>
              <p className="text-[11px] text-slate-400">Select output format and options</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5 space-y-4">
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
