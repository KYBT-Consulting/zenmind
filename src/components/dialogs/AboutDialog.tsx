import React, { useState } from 'react';
import {
  Share2,
  X,
  Info,
  Copy,
  Check,
  Sparkles,
  Cpu,
  ShieldCheck,
  Layers,
} from 'lucide-react';
import pkg from '../../../package.json';
import { DesktopFileService } from '../../services/desktopFileService';
import { useDialogA11y } from '../../lib/useDialogA11y';

export const APP_VERSION = pkg.version || '0.2.5';

interface AboutDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

const RELEASE_HIGHLIGHTS = [
  'Starter Template Gallery (SWOT, PESTEL, Porter 5 Forces, Eisenhower, 5 Whys, Org Chart) + Custom Templates',
  'Spatial Arrow & Vim Modal Navigation (h/j/k/l, o/O, i, x, u, f) with Shortcut Cheat-Sheet (?)',
  'Right-Click Context Menus for topics and canvas + Expand All / Collapse All / Level controls',
  'Interactive Task Progress (0%–100%) & Priority Badges (P1–P5) across Canvas, Outline, and Floating Bar',
  'Inline Markdown shortcuts (**bold**, *italic*, `code`), Highlighter Tints, and Callout Badges',
  'Automatic & Manual Version History Snapshots with 1-click rollback',
  'Smooth Trackpad Pinch-to-Zoom isolated to the infinite Mind Map Canvas',
];

export const AboutDialog: React.FC<AboutDialogProps> = ({ isOpen, onClose }) => {
  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const isDesktop = DesktopFileService.isTauri();
  const runtimeLabel = isDesktop ? 'Tauri v3 Native Desktop' : 'Web Browser / PWA';
  const platformLabel =
    typeof navigator !== 'undefined'
      ? navigator.platform || navigator.userAgent.split(' ')[0] || 'Unknown'
      : 'Unknown';

  const handleCopyVersionInfo = async () => {
    const info = [
      `ZenMind v${APP_VERSION}`,
      `Runtime: ${runtimeLabel}`,
      `Platform: ${platformLabel}`,
      `License: ${pkg.license || 'MIT'}`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(info);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback if clipboard API is unavailable
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/45 backdrop-blur-[2px] p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="about-dialog-title"
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden"
      >
        {/* Header Banner */}
        <div className="relative px-6 py-5 bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/30 border border-white/15">
              <Share2 size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 id="about-dialog-title" className="text-lg font-bold tracking-tight">
                  ZenMind
                </h3>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold rounded-full bg-indigo-500/30 border border-indigo-400/40 text-indigo-200">
                  v{APP_VERSION}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Local-first, open-source visual thinking &amp; mind mapping studio
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close About dialog"
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs text-slate-600">
          {/* Environment & Build Metadata Grid */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Info size={11} className="text-indigo-500" />
                <span>Version</span>
              </div>
              <span className="text-sm font-mono font-bold text-slate-800">v{APP_VERSION}</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <Cpu size={11} className="text-sky-500" />
                <span>Runtime</span>
              </div>
              <span className="text-xs font-semibold text-slate-800 truncate" title={runtimeLabel}>
                {isDesktop ? 'Tauri Desktop' : 'Web App'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col gap-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                <ShieldCheck size={11} className="text-emerald-500" />
                <span>License</span>
              </div>
              <span className="text-xs font-semibold text-slate-800">{pkg.license || 'MIT'} Open Source</span>
            </div>
          </div>

          {/* What's in this release */}
          <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2.5 flex items-center gap-1.5">
              <Sparkles size={13} className="text-indigo-600" />
              <span>What&apos;s New in v{APP_VERSION}</span>
            </h4>
            <ul className="space-y-1.5 text-[11px] text-slate-700">
              {RELEASE_HIGHLIGHTS.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Credits & Architecture */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3.5 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-slate-200/80 text-slate-700 flex items-center justify-center shrink-0">
                <Layers size={15} />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-800">
                  Maintained by KYBT Consulting
                </div>
                <div className="text-[11px] text-slate-500">
                  Built with React 19, TypeScript, Tailwind CSS &amp; Tauri
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleCopyVersionInfo}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors shrink-0 cursor-pointer shadow-2xs"
              title="Copy version and environment details to clipboard"
            >
              {copied ? (
                <>
                  <Check size={12} className="text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied</span>
                </>
              ) : (
                <>
                  <Copy size={12} className="text-slate-500" />
                  <span>Copy Info</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span>Platform: {platformLabel}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
