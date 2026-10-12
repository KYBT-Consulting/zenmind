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
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { MobileBottomBar } from './components/mobile/MobileBottomBar';
import { FolderArchive } from 'lucide-react';

export default function App() {
  const [engine, setEngine] = useState<MindMapEngine | null>(null);
  const [activeNode, setActiveNode] = useState<ActiveNodeInfo | null>(null);
  const [mindMapData, setMindMapData] = useState<any>(DEFAULT_INITIAL_DATA);
  const [docTitle, setDocTitle] = useState('ZenMind Project');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [scale, setScale] = useState(100);
  const [showOutline, setShowOutline] = useState(false);
  const [showInspector, setShowInspector] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('node');
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

  const [currentFilePath, setCurrentFilePath] = useState<string | undefined>(undefined);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // File Save (.zenmind JSON) - Native Desktop & Web
  const handleSaveFile = useCallback(async () => {
    if (!engine) return;
    const data = engine.getData();
    const result = await DesktopFileService.saveZenMindFile(data, docTitle, currentFilePath);
    if (result.success && result.filePath) {
      setCurrentFilePath(result.filePath);
    }
  }, [engine, docTitle, currentFilePath]);

  // File Open (.zenmind / .json / .xmind / .md / .opml / .mm) - Native Desktop & Web
  const handleOpenFile = useCallback(async () => {
    if (DesktopFileService.isTauri()) {
      const result = await DesktopFileService.openZenMindFile();
      if (result.success && result.content) {
        try {
          const parsed = await MindMapFormatService.parseText(result.content, result.filePath || '');
          if (parsed.success && parsed.data) {
            if (parsed.title) setDocTitle(parsed.title);
            engine?.setData(parsed.data);
            if (result.filePath) setCurrentFilePath(result.filePath);
          } else {
            alert(parsed.error || 'Could not parse mind map file.');
          }
        } catch (err: any) {
          console.error('File parsing error:', err);
          alert('Could not open mind map file.');
        }
      }
      return;
    }
    // Web fallback
    fileInputRef.current?.click();
  }, [engine]);

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const res = await MindMapFormatService.parseFile(file);
      if (res.success && res.data) {
        if (res.title) setDocTitle(res.title);
        engine?.setData(res.data);
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
    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      const res = await MindMapFormatService.parseFile(file);
      if (res.success && res.data) {
        if (res.title) setDocTitle(res.title);
        engine?.setData(res.data);
      } else {
        alert(res.error || 'Could not parse dropped file.');
      }
    } catch (err: any) {
      console.error('Drag drop error:', err);
      alert('Failed to import dropped file: ' + err.message);
    }
  };

  // Folder Import (Folder to MindMap)
  const handleImportFolder = useCallback(async () => {
    const res = await FolderImportService.importFolder();
    if (res.success && res.data) {
      if (res.folderName) setDocTitle(`${res.folderName} Map`);
      engine?.setData(res.data);
    }
  }, [engine]);

  // Open Notes Tab in Inspector
  const handleOpenNotes = useCallback(() => {
    setInspectorTab('notes');
    setShowInspector(true);
  }, []);

  // Open Tasks Tab in Inspector
  const handleOpenTasks = useCallback(() => {
    setInspectorTab('task');
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'o') {
        e.preventDefault();
        handleOpenFile();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSaveFile, handleOpenFile]);

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
        onSaveFile={handleSaveFile}
        onOpenFile={handleOpenFile}
        isFormatPainterActive={isFormatPainterActive}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
        onOpenNotes={handleOpenNotes}
        onOpenTasks={handleOpenTasks}
        onImportFolder={handleImportFolder}
        onOpenImageDialog={() => setShowImageDialog(true)}
        onOpenFormulaDialog={() => setShowFormulaDialog(true)}
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

          <ErrorBoundary fallbackTitle="Mind Map Canvas encountered an error">
            <MindMapCanvas
              onEngineReady={setEngine}
              onActiveNodeChange={setActiveNode}
              onDataChange={setMindMapData}
              onScaleChange={setScale}
              onHistoryChange={({ canUndo, canRedo }) => {
                setCanUndo(canUndo);
                setCanRedo(canRedo);
              }}
              onFormatPainterChange={setIsFormatPainterActive}
              isFormatPainterActive={isFormatPainterActive}
              initialData={DEFAULT_INITIAL_DATA}
            />
          </ErrorBoundary>

          {/* Navigator Mini-Map Overlay */}
          <MiniMapOverlay
            engine={engine}
            isOpen={showMiniMap}
            onClose={() => setShowMiniMap(false)}
          />
        </main>

        {/* Right Format Inspector Sidebar */}
        {showInspector && (
          <FormatInspector
            engine={engine}
            activeNode={activeNode}
            initialTab={inspectorTab}
            onClose={() => setShowInspector(false)}
            onOpenImageDialog={() => setShowImageDialog(true)}
            onOpenFormulaDialog={() => setShowFormulaDialog(true)}
          />
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
