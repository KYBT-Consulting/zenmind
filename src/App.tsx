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
import { DesktopFileService } from './services/desktopFileService';
import { FolderImportService } from './services/folderImportService';

export default function App() {
  const [engine, setEngine] = useState<MindMapEngine | null>(null);
  const [activeNode, setActiveNode] = useState<ActiveNodeInfo | null>(null);
  const [mindMapData, setMindMapData] = useState<any>(DEFAULT_INITIAL_DATA);
  const [docTitle, setDocTitle] = useState('ZenMind Project');
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [scale, setScale] = useState(100);
  const [showOutline, setShowOutline] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('node');
  const [showMiniMap, setShowMiniMap] = useState(false);
  const [isFormatPainterActive, setIsFormatPainterActive] = useState(false);

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

  // File Open (.zenmind / .json) - Native Desktop & Web
  const handleOpenFile = useCallback(async () => {
    if (DesktopFileService.isTauri()) {
      const result = await DesktopFileService.openZenMindFile();
      if (result.success && result.content) {
        try {
          const parsed = JSON.parse(result.content);
          if (parsed.content) {
            if (parsed.title) setDocTitle(parsed.title);
            engine?.setData(parsed.content);
          } else if (parsed.data) {
            engine?.setData(parsed);
          }
          if (result.filePath) setCurrentFilePath(result.filePath);
        } catch (err) {
          console.error('File parsing error:', err);
          alert('Could not open mind map file.');
        }
      }
      return;
    }
    // Web fallback
    fileInputRef.current?.click();
  }, [engine]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (parsed.content) {
          // ZenMind format
          if (parsed.title) setDocTitle(parsed.title);
          engine?.setData(parsed.content);
        } else if (parsed.data) {
          // Raw simple-mind-map tree format
          engine?.setData(parsed);
        } else {
          alert('Unrecognized mind map file structure.');
        }
      } catch (err) {
        console.error('File parsing error:', err);
        alert('Could not open mind map file. Ensure it is a valid JSON/.zenmind file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
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
        accept=".zenmind,.json"
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

        {/* Central Canvas Workspace */}
        <main className="flex-1 relative h-full w-full">
          {/* Context Floating Bubble Menu over selected topic */}
          <FloatingBubbleMenu
            engine={engine}
            activeNode={activeNode}
            isFormatPainterActive={isFormatPainterActive}
            onOpenNotes={handleOpenNotes}
          />

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
          />
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        engine={engine}
        scale={scale}
        nodeCount={totalNodes}
        isFormatPainterActive={isFormatPainterActive}
        showMiniMap={showMiniMap}
        onToggleMiniMap={() => setShowMiniMap(!showMiniMap)}
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
    </div>
  );
}
