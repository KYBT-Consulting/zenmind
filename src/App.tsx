import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MindMapEngine, DEFAULT_INITIAL_DATA } from './engine/MindMapEngine';
import { ActiveNodeInfo } from './types/mindmap';
import { Ribbon } from './components/ribbon/Ribbon';
import { MindMapCanvas } from './components/canvas/MindMapCanvas';
import { MiniMapOverlay } from './components/canvas/MiniMapOverlay';
import { FormatInspector, InspectorTab } from './components/inspector/FormatInspector';
import { OutlinePanel } from './components/outline/OutlinePanel';
import { FloatingBubbleMenu } from './components/floating/FloatingBubbleMenu';
import { StatusBar } from './components/statusbar/StatusBar';
import { AIDialog } from './components/dialogs/AIDialog';
import { ExportDialog } from './components/dialogs/ExportDialog';
import { ImageDialog } from './components/dialogs/ImageDialog';
import { FormulaDialog } from './components/dialogs/FormulaDialog';
import { DesktopFileService } from './services/desktopFileService';
import { FolderImportService } from './services/folderImportService';
import { MindMapFormatService } from './services/mindMapFormatService';
import { sanitizeMapData } from './lib/sanitize';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { TabBar } from './components/tabs/TabBar';
import { MobileBottomBar } from './components/mobile/MobileBottomBar';
import { FolderArchive, SlidersHorizontal } from 'lucide-react';

interface TabInfo {
  id: string;
  title: string;
  filePath?: string;
  initialData: any;
  /** Content signature at first render / last save; null until the map has rendered */
  savedJson: string | null;
  /** Title at last save (or creation) */
  savedTitle: string;
  /** Map content differs from savedJson (title changes are checked separately, see isDirty) */
  dirty: boolean;
}

const isDirty = (t: TabInfo) => t.dirty || t.title !== t.savedTitle;

interface TabView {
  activeNode: ActiveNodeInfo | null;
  canUndo: boolean;
  canRedo: boolean;
  scale: number;
  data: any;
}

const EMPTY_VIEW: TabView = { activeNode: null, canUndo: false, canRedo: false, scale: 100, data: DEFAULT_INITIAL_DATA };
const BLANK_MAP = () => ({ data: { text: 'Central Topic', expand: true }, children: [] });

let tabCounter = 0;
const makeTab = (title: string, initialData: any, filePath?: string): TabInfo => ({
  id: `tab-${++tabCounter}`,
  title,
  filePath,
  initialData,
  savedJson: null,
  savedTitle: title,
  dirty: false,
});

export default function App() {
  const [tabs, setTabs] = useState<TabInfo[]>(() => [makeTab('ZenMind Project', DEFAULT_INITIAL_DATA)]);
  const [activeId, setActiveId] = useState(() => tabs[0].id);
  const [engines, setEngines] = useState<Record<string, MindMapEngine>>({});
  const [views, setViews] = useState<Record<string, TabView>>({});
  const [showOutline, setShowOutline] = useState(false);
  const [showInspector, setShowInspector] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('node');
  const [inspectorTabRequest, setInspectorTabRequest] = useState(0);
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showFormulaDialog, setShowFormulaDialog] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);

  const [aiDialogState, setAiDialogState] = useState<{ isOpen: boolean; mode: 'generate' | 'expand' }>({
    isOpen: false,
    mode: 'generate',
  });
  const [showExportDialog, setShowExportDialog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active-tab derived values (everything below the tab bar keeps working against one engine)
  const activeTab = tabs.find((t) => t.id === activeId) ?? tabs[0];
  const engine = engines[activeTab.id] ?? null;
  const view = views[activeTab.id] ?? EMPTY_VIEW;
  const { activeNode, canUndo, canRedo, scale, data: mindMapData } = view;
  const docTitle = activeTab.title;
  const currentFilePath = activeTab.filePath;

  const updateTab = useCallback((id: string, patch: Partial<TabInfo>) => {
    setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }, []);

  const updateView = useCallback((id: string, patch: Partial<TabView>) => {
    setViews((prev) => ({ ...prev, [id]: { ...(prev[id] ?? EMPTY_VIEW), ...patch } }));
  }, []);

  const setDocTitle = useCallback((title: string) => updateTab(activeTab.id, { title }), [activeTab.id, updateTab]);

  /** Re-derive a tab's dirty flag by comparing current map content with its saved snapshot. */
  const recomputeDirty = (id: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== id || t.savedJson === null) return t;
        const eng = enginesRef.current[id];
        const dirty = eng ? eng.getContentSignature() !== t.savedJson : t.dirty;
        return dirty === t.dirty ? t : { ...t, dirty };
      })
    );
  };

  // Per-tab canvas callbacks (stable per tab id, since MindMapCanvas binds them once at mount)
  const callbacksCache = useRef<Record<string, any>>({});
  const lastActiveNode = useRef<Record<string, string>>({});
  const getCallbacks = (id: string) => {
    if (!callbacksCache.current[id]) {
      callbacksCache.current[id] = {
        onEngineReady: (eng: MindMapEngine) => {
          setEngines((prev) => ({ ...prev, [id]: eng }));
        },
        // Baseline = the map as first rendered (before any possible user edit)
        onFirstRender: (eng: MindMapEngine) => {
          if (!eng.getTreeData()) return; // engine was destroyed (React StrictMode double mount)
          const signature = eng.getContentSignature();
          setTabs((prev) =>
            prev.map((t) => (t.id === id && t.savedJson === null ? { ...t, savedJson: signature } : t))
          );
        },
        onActiveNodeChange: (activeNode: ActiveNodeInfo | null) => {
          // The engine reports on every render; only touch React state when something changed
          const key = JSON.stringify(activeNode);
          if (lastActiveNode.current[id] === key) return;
          lastActiveNode.current[id] = key;
          updateView(id, { activeNode });
        },
        onScaleChange: (scale: number) => updateView(id, { scale }),
        onHistoryChange: ({ canUndo, canRedo }: { canUndo: boolean; canRedo: boolean }) => {
          updateView(id, { canUndo, canRedo });
          // Undo/redo can return the map to its saved state without a data_change event
          recomputeDirty(id);
        },
        onDataChange: (data: any) => {
          updateView(id, { data });
          recomputeDirty(id);
        },
      };
    }
    return callbacksCache.current[id];
  };
  const enginesRef = useRef(engines);
  enginesRef.current = engines;

  // Calculate total topic count from data tree
  const countNodes = useCallback((node: any): number => {
    if (!node) return 0;
    let count = 1;
    if (node.children && Array.isArray(node.children)) {
      for (const child of node.children) {
        count += countNodes(child);
      }
    }
    return count;
  }, []);

  const totalNodes = countNodes(mindMapData);

  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;

  /** Drops the per-tab engine/view/callback entries of a tab that is going away. */
  const forgetTab = (id: string) => {
    delete callbacksCache.current[id];
    delete lastActiveNode.current[id];
    setEngines((prev) => {
      const { [id]: _gone, ...rest } = prev;
      return rest;
    });
    setViews((prev) => {
      const { [id]: _gone, ...rest } = prev;
      return rest;
    });
  };

  /**
   * Opens a map in a new tab. A file that is already open is focused instead (two tabs on one
   * path would overwrite each other on save); a lone pristine untitled tab is replaced.
   */
  const openInNewTab = useCallback((title: string, data: any, filePath?: string) => {
    const current = tabsRef.current;
    const existing = filePath ? current.find((t) => t.filePath === filePath) : undefined;
    if (existing) {
      setActiveId(existing.id);
      return;
    }
    const tab = makeTab(title, sanitizeMapData(data), filePath);
    const only = current.length === 1 ? current[0] : null;
    const replace = !!only && !isDirty(only) && !only.filePath && only.title === 'Untitled Mind Map';
    if (replace) forgetTab(only!.id);
    const next = replace ? [tab] : [...current, tab];
    tabsRef.current = next; // several files can be opened in one tick (multi-drop)
    setTabs(next);
    setActiveId(tab.id);
  }, []);

  const handleNewFile = useCallback(() => {
    openInNewTab('Untitled Mind Map', BLANK_MAP());
  }, [openInNewTab]);

  const handleSelectTab = useCallback((id: string) => {
    setActiveId(id);
    setIsFormatPainterActive(false);
  }, []);

  const handleCloseTab = useCallback(
    (id: string) => {
      const tab = tabs.find((t) => t.id === id);
      if (!tab) return;
      if (isDirty(tab) && !window.confirm(`"${tab.title}" has unsaved changes. Close it anyway?`)) return;
      forgetTab(id);
      const remaining = tabs.filter((t) => t.id !== id);
      if (remaining.length === 0) {
        const fresh = makeTab('Untitled Mind Map', BLANK_MAP());
        setTabs([fresh]);
        setActiveId(fresh.id);
        return;
      }
      setTabs(remaining);
      if (id === activeId) {
        const idx = tabs.findIndex((t) => t.id === id);
        setActiveId(remaining[Math.min(idx, remaining.length - 1)].id);
      }
    },
    [tabs, activeId]
  );

  // File Save (.zenmind JSON) - Native Desktop & Web
  const handleSaveFile = useCallback(async () => {
    if (!engine) return;
    const data = engine.getData();
    const savedTree = engine.getContentSignature();
    const savedTitleAtSave = docTitle;
    const id = activeTab.id;
    const result = await DesktopFileService.saveZenMindFile(data, docTitle, currentFilePath);
    if (result.success) {
      // Saved state is what was written, not whatever the user typed while the dialog was open
      updateTab(id, {
        savedJson: savedTree,
        savedTitle: savedTitleAtSave,
        dirty: enginesRef.current[id]?.getContentSignature() !== savedTree,
        ...(result.filePath ? { filePath: result.filePath } : {}),
      });
    }
  }, [engine, activeTab.id, docTitle, currentFilePath, updateTab]);

  // File Open (.zenmind / .json / .xmind / .md / .opml / .mm) - Native Desktop & Web
  const handleOpenFile = useCallback(async () => {
    if (DesktopFileService.isTauri()) {
      const result = await DesktopFileService.openZenMindFile();
      if (!result.success) {
        if (!result.canceled && result.error) alert('Could not open file: ' + (result.error.message || result.error));
        return;
      }
      try {
        const fileName = result.filePath?.split(/[\\/]/).pop() || 'Untitled';
        const baseName = fileName.replace(/\.[^.]+$/, '');
        // Binary formats (.xmind) go through the File parser; text formats through parseText
        const parsed = result.bytes
          ? await MindMapFormatService.parseFile(new File([result.bytes as BlobPart], fileName))
          : result.content != null
            ? await MindMapFormatService.parseText(result.content, result.filePath || '')
            : null;
        if (parsed?.success && parsed.data) {
          openInNewTab(parsed.title || baseName, parsed.data, result.filePath);
        } else {
          alert(parsed?.error || 'Could not parse mind map file.');
        }
      } catch (err: any) {
        console.error('File parsing error:', err);
        alert('Could not open mind map file.');
      }
      return;
    }
    // Web fallback
    fileInputRef.current?.click();
  }, [openInNewTab]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await MindMapFormatService.parseFile(file);
      if (res.success && res.data) {
        openInNewTab(res.title || file.name.replace(/\.[^.]+$/, ''), res.data);
      } else {
        alert(res.error || 'Could not parse mind map file.');
      }
    } catch (err: any) {
      console.error('File parsing error:', err);
      alert('Could not open mind map file: ' + err.message);
    } finally {
      e.target.value = '';
    }
  };

  // Drag and Drop Mind Map file onto Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes('Files')) {
      setIsDraggingFile(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    if (e.currentTarget.contains(e.relatedTarget as Node)) return;
    setIsDraggingFile(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingFile(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    for (const file of files) {
      try {
        const res = await MindMapFormatService.parseFile(file);
        if (res.success && res.data) {
          openInNewTab(res.title || file.name.replace(/\.[^.]+$/, ''), res.data);
        } else {
          alert(res.error || 'Could not parse dropped file.');
        }
      } catch (err: any) {
        console.error('Drag drop error:', err);
        alert('Failed to import dropped file: ' + err.message);
      }
    }
  };

  // Folder Import (Folder to MindMap)
  const handleImportFolder = useCallback(async () => {
    const res = await FolderImportService.importFolder();
    if (res.success && res.data) {
      openInNewTab(res.folderName ? `${res.folderName} Map` : 'Folder Map', res.data);
    }
  }, [openInNewTab]);

  // Open Notes Tab in Inspector
  const handleOpenNotes = useCallback(() => {
    setInspectorTab('notes');
    setInspectorTabRequest((n) => n + 1);
    setShowInspector(true);
  }, []);

  // Open Tasks Tab in Inspector
  const handleOpenTasks = useCallback(() => {
    setInspectorTab('task');
    setInspectorTabRequest((n) => n + 1);
    setShowInspector(true);
  }, []);

  // Keyboard shortcut listener (global hotkeys)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when user is actively editing text in an input or textarea
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveFile();
      }
      if (DesktopFileService.newMapShortcut().matches(e)) {
        e.preventDefault();
        handleNewFile();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveFile, handleOpenFile, handleNewFile]);

  return (
    <div className="w-full h-screen flex flex-col font-sans text-slate-900 overflow-hidden bg-slate-50 select-none">
      {/* Hidden file input for open action */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".zenmind,.json,.xmind,.md,.markdown,.opml,.mm"
        className="hidden"
        onChange={handleFileSelected}
      />

      {/* Top Ribbon Navigation & Controls */}
      <Ribbon
        engine={engine}
        activeNode={activeNode}
        canUndo={canUndo}
        canRedo={canRedo}
        docTitle={docTitle}
        onDocTitleChange={setDocTitle}
        showOutline={showOutline}
        onToggleOutline={() => setShowOutline(!showOutline)}
        showInspector={showInspector}
        onToggleInspector={() => setShowInspector(!showInspector)}
        onOpenAIDialog={(mode) => setAiDialogState({ isOpen: true, mode })}
        onOpenExportDialog={() => setShowExportDialog(true)}
        onNewFile={handleNewFile}
        onSaveFile={handleSaveFile}
        onOpenFile={handleOpenFile}
        isFormatPainterActive={isFormatPainterActive}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
        onOpenNotes={handleOpenNotes}
        onOpenTasks={handleOpenTasks}
        onOpenStructure={() => {
          setInspectorTab('structure');
          setInspectorTabRequest((n) => n + 1);
          setShowInspector(true);
        }}
        onImportFolder={handleImportFolder}
        onOpenImageDialog={() => setShowImageDialog(true)}
        onOpenFormulaDialog={() => setShowFormulaDialog(true)}
      />

      <TabBar
        tabs={tabs.map((t) => ({ id: t.id, title: t.title, dirty: isDirty(t) }))}
        activeId={activeTab.id}
        onSelect={handleSelectTab}
        onClose={handleCloseTab}
        onNew={handleNewFile}
      />

      {/* Main Workspace Area (Outline, Canvas, Inspector) */}
      <div className="flex-1 flex relative overflow-hidden">
        {/* Left Outline Panel */}
        {showOutline && (
          <OutlinePanel
            engine={engine}
            activeNode={activeNode}
            data={mindMapData}
            onClose={() => setShowOutline(false)}
          />
        )}

        {/* Central Canvas Workspace with Drag & Drop */}
        <main
          className="flex-1 relative h-full w-full"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {/* Drag & Drop Visual Target Overlay */}
          {isDraggingFile && (
            <div className="absolute inset-0 z-50 bg-indigo-600/10 backdrop-blur-xs border-3 border-dashed border-indigo-500 rounded-2xl m-4 flex flex-col items-center justify-center pointer-events-none animate-in fade-in zoom-in-95 duration-150">
              <div className="p-6 bg-white/95 shadow-2xl rounded-2xl flex flex-col items-center gap-2 border border-indigo-100 max-w-sm text-center">
                <div className="w-14 h-14 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <FolderArchive size={28} />
                </div>
                <p className="text-base font-bold text-slate-800">Drop Mind Map to Open</p>
                <p className="text-xs text-slate-500">
                  Accepts .zenmind, .xmind, .md, .opml, .mm, .json files
                </p>
              </div>
            </div>
          )}

          {/* Context Floating Bubble Menu over selected topic */}
          <FloatingBubbleMenu
            engine={engine}
            activeNode={activeNode}
            isFormatPainterActive={isFormatPainterActive}
            onOpenNotes={handleOpenNotes}
            onOpenImage={() => setShowImageDialog(true)}
            onOpenFormula={() => setShowFormulaDialog(true)}
          />

          {tabs.map((tab) => (
            <div
              key={tab.id}
              className={tab.id === activeId ? 'absolute inset-0' : 'absolute inset-0 invisible pointer-events-none'}
            >
              <ErrorBoundary fallbackTitle="Mind Map Canvas encountered an error">
                <MindMapCanvas
                  {...getCallbacks(tab.id)}
                  onFormatPainterChange={tab.id === activeId ? setIsFormatPainterActive : undefined}
                  isFormatPainterActive={isFormatPainterActive && tab.id === activeId}
                  initialData={tab.initialData}
                  isActive={tab.id === activeId}
                />
              </ErrorBoundary>
            </div>
          ))}

          {/* Navigator Mini-Map Overlay */}
          <MiniMapOverlay
            engine={engine}
            isOpen={showMiniMap}
            onClose={() => setShowMiniMap(false)}
          />
        </main>

        {/* Right Format Inspector Sidebar */}
        {showInspector ? (
          <FormatInspector
            engine={engine}
            activeNode={activeNode}
            initialTab={inspectorTab}
            tabRequest={inspectorTabRequest}
            onClose={() => setShowInspector(false)}
            onOpenImageDialog={() => setShowImageDialog(true)}
            onOpenFormulaDialog={() => setShowFormulaDialog(true)}
          />
        ) : (
          /* Sleek Right Docked Tab to Reopen Inspector */
          <button aria-label="Open Format Inspector (Sidebar)"
            onClick={() => setShowInspector(true)}
            title="Open Format Inspector (Sidebar)"
            className="absolute right-0 top-1/2 -translate-y-1/2 z-30 bg-white/95 hover:bg-white border-l border-y border-slate-200/90 shadow-md hover:shadow-xl rounded-l-xl px-2 py-3.5 flex flex-col items-center gap-1.5 text-slate-600 hover:text-indigo-600 transition-all cursor-pointer group"
          >
            <SlidersHorizontal size={14} className="text-indigo-600 group-hover:scale-110 transition-transform" />
            <span className="text-[10px] font-bold tracking-wider [writing-mode:vertical-lr] rotate-180 uppercase text-slate-500 group-hover:text-indigo-600">
              Format
            </span>
          </button>
        )}
      </div>

      {/* Bottom Status Bar (Desktop) */}
      <div className="hidden md:block">
        <StatusBar
          engine={engine}
          scale={scale}
          nodeCount={totalNodes}
          isFormatPainterActive={isFormatPainterActive}
          showMiniMap={showMiniMap}
          onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
          showInspector={showInspector}
          onToggleInspector={() => setShowInspector(!showInspector)}
          onOpenAIDialog={() => setAiDialogState({ isOpen: true, mode: 'generate' })}
        />
      </div>

      {/* Mobile Bottom Navigation Bar (< 768px) */}
      <MobileBottomBar
        engine={engine}
        activeNode={activeNode}
        canUndo={canUndo}
        canRedo={canRedo}
        onToggleOutline={() => setShowOutline(!showOutline)}
        onToggleInspector={() => setShowInspector(!showInspector)}
        onOpenAIDialog={() => setAiDialogState({ isOpen: true, mode: 'generate' })}
      />

      {/* Modals & Dialogs */}
      <AIDialog
        isOpen={aiDialogState.isOpen}
        mode={aiDialogState.mode}
        engine={engine}
        activeNode={activeNode}
        onClose={() => setAiDialogState({ isOpen: false, mode: 'generate' })}
      />

      <ExportDialog
        isOpen={showExportDialog}
        engine={engine}
        docTitle={docTitle}
        onClose={() => setShowExportDialog(false)}
      />

      <ImageDialog
        isOpen={showImageDialog}
        engine={engine}
        activeNode={activeNode}
        onClose={() => setShowImageDialog(false)}
      />

      <FormulaDialog
        isOpen={showFormulaDialog}
        engine={engine}
        activeNode={activeNode}
        onClose={() => setShowFormulaDialog(false)}
      />
    </div>
  );
}
