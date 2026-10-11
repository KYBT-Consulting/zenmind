import React, { useState, useRef, useCallback, useEffect } from 'react';
import { MindMapEngine, DEFAULT_INITIAL_DATA } from './engine/MindMapEngine';
import { ActiveNodeInfo } from './types/mindmap';
import { Ribbon } from './components/ribbon/Ribbon';
import { MindMapCanvas } from './components/canvas/MindMapCanvas';
import { FormatInspector } from './components/inspector/FormatInspector';
import { OutlinePanel } from './components/outline/OutlinePanel';
import { FloatingBubbleMenu } from './components/floating/FloatingBubbleMenu';
import { StatusBar } from './components/statusbar/StatusBar';
import { AIDialog } from './components/dialogs/AIDialog';
import { ExportDialog } from './components/dialogs/ExportDialog';

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
  const [aiDialogState, setAiDialogState] = useState<{ isOpen: boolean; mode: 'generate' | 'expand' }>({
    isOpen: false,
    mode: 'generate',
  });
  const [showExportDialog, setShowExportDialog] = useState(false);

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

  // File Save (.zenmind JSON)
  const handleSaveFile = useCallback(() => {
    if (!engine) return;
    const data = engine.getData();
    const payload = {
      version: '1.0.0',
      title: docTitle,
      savedAt: new Date().toISOString(),
      content: data,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${docTitle.trim() || 'mindmap'}.zenmind`;
    a.click();
    URL.revokeObjectURL(url);
  }, [engine, docTitle]);

  // File Open (.zenmind / .json)
  const handleOpenFile = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

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
          <FloatingBubbleMenu engine={engine} activeNode={activeNode} />

          <MindMapCanvas
            onEngineReady={setEngine}
            onActiveNodeChange={setActiveNode}
            onDataChange={setMindMapData}
            onScaleChange={setScale}
            onHistoryChange={({ canUndo, canRedo }) => {
              setCanUndo(canUndo);
              setCanRedo(canRedo);
            }}
            initialData={DEFAULT_INITIAL_DATA}
          />
        </main>

        {/* Right Format Inspector Sidebar */}
        {showInspector && (
          <FormatInspector
            engine={engine}
            activeNode={activeNode}
            onClose={() => setShowInspector(false)}
          />
        )}
      </div>

      {/* Bottom Status Bar */}
      <StatusBar
        engine={engine}
        scale={scale}
        nodeCount={totalNodes}
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
