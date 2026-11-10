import React, { useCallback, useEffect, useState } from 'react';
import { Download, X, Check, Copy, RotateCw } from 'lucide-react';
import { UpdateService, type UpdateInfo } from '../../services/updateService';
import { DesktopFileService } from '../../services/desktopFileService';

/** Fired by the About dialog's "Check for updates" so this banner shows the result. */
export const UPDATE_FOUND_EVENT = 'zenmind:update-found';

/** Wait a little after launch so the startup check never competes with opening maps. */
const STARTUP_CHECK_DELAY_MS = 5_000;

interface UpdateBannerProps {
  /** Asked before restarting, so unsaved maps aren't lost silently. */
  hasUnsavedChanges: () => boolean;
}

type Phase =
  | { kind: 'idle' }
  | { kind: 'installing'; progress: number | null }
  | { kind: 'error'; message: string };

export const UpdateBanner: React.FC<UpdateBannerProps> = ({ hasUnsavedChanges }) => {
  const [update, setUpdate] = useState<UpdateInfo | null>(null);
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });
  const [showNotes, setShowNotes] = useState(false);
  const [copied, setCopied] = useState(false);

  // Quiet startup check; failures (offline, GitHub down) are logged, never shown
  useEffect(() => {
    if (!UpdateService.isSupported() || !UpdateService.getAutoCheck()) return;
    const timer = setTimeout(() => {
      UpdateService.checkForUpdate()
        .then((info) => info && setUpdate(info))
        .catch((err) => console.warn('Update check failed:', (err as any)?.message ?? err));
    }, STARTUP_CHECK_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  // Manual checks from the About dialog
  useEffect(() => {
    const onFound = (e: Event) => {
      setUpdate((e as CustomEvent<UpdateInfo>).detail);
      setPhase({ kind: 'idle' });
    };
    window.addEventListener(UPDATE_FOUND_EVENT, onFound);
    return () => window.removeEventListener(UPDATE_FOUND_EVENT, onFound);
  }, []);

  const handleInstall = useCallback(async () => {
    if (
      hasUnsavedChanges() &&
      !(await DesktopFileService.confirm(
        'You have unsaved changes. ZenMind will restart to finish the update, and unsaved changes will be lost.\n\nInstall the update anyway?'
      ))
    ) {
      return;
    }
    setPhase({ kind: 'installing', progress: 0 });
    try {
      await UpdateService.installAndRestart((progress) => setPhase({ kind: 'installing', progress }));
    } catch (err: any) {
      setPhase({ kind: 'error', message: err?.message || String(err) });
    }
  }, [hasUnsavedChanges]);

  const handleCopyLink = async () => {
    if (!update) return;
    try {
      await navigator.clipboard.writeText(update.downloadUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable; the link is still shown as selectable text
    }
  };

  if (!update) return null;

  const installing = phase.kind === 'installing';
  const percent = installing && phase.progress !== null ? Math.round(phase.progress * 100) : null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-12 right-4 z-40 w-80 rounded-xl bg-white border border-slate-200 shadow-2xl p-4 text-xs text-slate-600 animate-in fade-in slide-in-from-bottom-2 duration-150"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
          <Download size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-slate-800">Update available</p>
          <p className="mt-0.5">
            ZenMind <span className="font-semibold text-slate-800">{update.version}</span> is ready. You have{' '}
            {update.currentVersion}.
          </p>
        </div>
        {!installing && (
          <button
            aria-label="Dismiss update notice"
            onClick={() => setUpdate(null)}
            className="p-1 -m-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {update.notes && (
        <div className="mt-2">
          <button
            onClick={() => setShowNotes((v) => !v)}
            className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 cursor-pointer"
          >
            {showNotes ? "Hide what's new" : "What's new"}
          </button>
          {showNotes && (
            <p className="mt-1.5 max-h-40 overflow-y-auto whitespace-pre-line rounded-lg bg-slate-50 border border-slate-200/80 p-2 text-[11px] leading-relaxed">
              {update.notes}
            </p>
          )}
        </div>
      )}

      {installing && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <div
              className={`h-full bg-indigo-600 transition-all ${percent === null ? 'w-1/3 animate-pulse' : ''}`}
              style={percent !== null ? { width: `${percent}%` } : undefined}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-slate-500">
            {percent === null
              ? 'Downloading…'
              : percent < 100
                ? `Downloading… ${percent}%`
                : 'Installing, ZenMind will restart…'}
          </p>
        </div>
      )}

      {phase.kind === 'error' && (
        <p role="alert" className="mt-3 rounded-lg bg-red-50 border border-red-200 text-red-700 p-2 text-[11px]">
          Update failed: {phase.message}
        </p>
      )}

      {!installing && update.canInstall && (
        <div className="mt-3 flex justify-end gap-2">
          <button
            onClick={() => setUpdate(null)}
            className="px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            Later
          </button>
          <button
            onClick={handleInstall}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
          >
            {phase.kind === 'error' ? <RotateCw size={13} /> : <Download size={13} />}
            {phase.kind === 'error' ? 'Try again' : 'Install & restart'}
          </button>
        </div>
      )}

      {!installing && !update.canInstall && (
        <div className="mt-3 space-y-2">
          <p>This is the portable version. Download the new portable ZIP from:</p>
          <p className="font-mono text-[10px] break-all select-all rounded bg-slate-50 border border-slate-200/80 p-1.5">
            {update.downloadUrl}
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setUpdate(null)}
              className="px-3 py-1.5 rounded-lg font-semibold text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              Later
            </button>
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm cursor-pointer"
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Copied' : 'Copy link'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
