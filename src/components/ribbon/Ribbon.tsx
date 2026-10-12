import React, { useState } from 'react';
import {
  FolderOpen,
  Save,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  GitFork,
  ArrowRightCircle,
  LayoutGrid,
  Palette,
  Sparkles,
  Download,
  List,
  SlidersHorizontal,
  Maximize2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Square,
  Circle,
  Type,
  Link2,
  FileText,
  Tag,
  Share2,
  Braces,
  BoxSelect,
  Split,
  ChevronDown,
  Paintbrush,
  CheckSquare,
  Play,
  Eye,
  FolderTree,
  ListOrdered,
  Image as ImageIcon,
  Sigma,
  Layers,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import {
  ActiveNodeInfo,
  LAYOUT_OPTIONS,
  LayoutType,
  SHAPE_OPTIONS,
  ShapeType,
  THEME_PRESETS,
} from '../../types/mindmap';
import { cn } from '../../lib/utils';

export type RibbonTab = 'home' | 'insert' | 'pageStyle' | 'view' | 'ai' | 'export';

interface RibbonProps {
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  canUndo: boolean;
  canRedo: boolean;
  docTitle: string;
  onDocTitleChange: (title: string) => void;
  showOutline: boolean;
  onToggleOutline: () => void;
  showInspector: boolean;
  onToggleInspector: () => void;
  onOpenAIDialog: (mode: 'generate' | 'expand') => void;
  onOpenExportDialog: () => void;
  onSaveFile: () => void;
  onOpenFile: () => void;
  isFormatPainterActive?: boolean;
  showMiniMap?: boolean;
  onToggleMiniMap?: () => void;
  onOpenNotes?: () => void;
  onOpenTasks?: () => void;
  onImportFolder?: () => void;
  onOpenImageDialog?: () => void;
  onOpenFormulaDialog?: () => void;
}

export const Ribbon: React.FC<RibbonProps> = ({
  engine,
  activeNode,
  canUndo,
  canRedo,
  docTitle,
  onDocTitleChange,
  showOutline,
  onToggleOutline,
  showInspector,
  onToggleInspector,
  onOpenAIDialog,
  onOpenExportDialog,
  onSaveFile,
  onOpenFile,
  isFormatPainterActive = false,
  showMiniMap = false,
  onToggleMiniMap,
  onOpenNotes,
  onOpenTasks,
  onImportFolder,
  onOpenImageDialog,
  onOpenFormulaDialog,
}) => {
  const [activeTab, setActiveTab] = useState<RibbonTab>('home');
  const [showLayoutMenu, setShowLayoutMenu] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showShapeMenu, setShowShapeMenu] = useState(false);

  const tabs: { id: RibbonTab; label: string }[] = [
    { id: 'home', label: 'Home' },
    { id: 'insert', label: 'Insert' },
    { id: 'pageStyle', label: 'Page Style' },
    { id: 'view', label: 'View' },
    { id: 'ai', label: 'AI Assistant' },
    { id: 'export', label: 'Export' },
  ];

  const currentLayout = engine?.getLayout() || 'mindMap';
  const currentThemeId = engine?.getThemeId() || 'ocean-breeze';

  return (
    <div className="w-full bg-white border-b border-slate-200 select-none shadow-sm z-30 flex flex-col">
      {/* Top Brand & Quick Access Bar */}
      <div className="h-10 px-4 flex items-center justify-between border-b border-slate-100 bg-slate-50/70">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center shadow-sm">
              <Share2 size={13} className="text-white" />
            </div>
            <span className="font-bold text-sm tracking-tight text-slate-800">ZenMind</span>
          </div>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          {/* Document Title (Editable) */}
          <input
            type="text"
            value={docTitle}
            onChange={(e) => onDocTitleChange(e.target.value)}
            className="text-xs font-medium text-slate-700 bg-transparent hover:bg-white focus:bg-white px-2 py-1 rounded border border-transparent hover:border-slate-200 focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 outline-none transition-all max-w-xs"
            placeholder="Untitled Mind Map"
          />
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => engine?.undo()}
            disabled={!canUndo}
            title="Undo (Ctrl+Z)"
            className={cn(
              'p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors',
              !canUndo && 'opacity-40 cursor-not-allowed hover:bg-transparent'
            )}
          >
            <Undo2 size={15} />
          </button>
          <button
            onClick={() => engine?.redo()}
            disabled={!canRedo}
            title="Redo (Ctrl+Y)"
            className={cn(
              'p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors',
              !canRedo && 'opacity-40 cursor-not-allowed hover:bg-transparent'
            )}
          >
            <Redo2 size={15} />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            onClick={onSaveFile}
            title="Save Project (.zenmind)"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <Save size={15} />
          </button>
          <button
            onClick={onOpenFile}
            title="Open Project"
            className="p-1.5 rounded hover:bg-slate-200 text-slate-600 transition-colors"
          >
            <FolderOpen size={15} />
          </button>

          <div className="h-4 w-px bg-slate-200 mx-1" />

          <button
            onClick={onToggleOutline}
            title="Toggle Outline View"
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all',
              showOutline
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                : 'hover:bg-slate-200 text-slate-600'
            )}
          >
            <List size={14} />
            <span>Outline</span>
          </button>

          <button
            onClick={onToggleInspector}
            title="Toggle Format Inspector"
            className={cn(
              'flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium transition-all',
              showInspector
                ? 'bg-indigo-50 text-indigo-600 border border-indigo-200'
                : 'hover:bg-slate-200 text-slate-600'
            )}
          >
            <SlidersHorizontal size={14} />
            <span>Format</span>
          </button>

          <button
            onClick={() => onOpenAIDialog('generate')}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-md text-xs font-semibold shadow-sm transition-all ml-1"
          >
            <Sparkles size={13} />
            <span>AI Brainstorm</span>
          </button>
        </div>
      </div>

      {/* Ribbon Navigation Tabs */}
      <div className="flex px-4 border-b border-slate-200 bg-white">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'px-4 py-2 text-xs font-semibold tracking-wide transition-all border-b-2',
              activeTab === tab.id
                ? 'border-indigo-600 text-indigo-600 bg-indigo-50/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Ribbon Toolbar Content Area */}
      <div className="h-16 px-4 py-2 flex items-center gap-6 overflow-x-auto bg-slate-50/50">
        {/* --- HOME TAB --- */}
        {activeTab === 'home' && (
          <>
            {/* Topic Operations Group */}
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              <button
                onClick={() => engine?.insertSiblingNode()}
                title="Add Sibling Topic (Enter)"
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
              >
                <Plus size={18} className="text-indigo-600" />
                <span className="text-[10px] font-semibold mt-0.5">Topic</span>
                <span className="text-[9px] text-slate-400 font-mono">Enter</span>
              </button>

              <button
                onClick={() => engine?.insertChildNode()}
                title="Add Subtopic (Tab)"
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
              >
                <GitFork size={18} className="text-sky-600" />
                <span className="text-[10px] font-semibold mt-0.5">Subtopic</span>
                <span className="text-[9px] text-slate-400 font-mono">Tab</span>
              </button>

              <button
                onClick={() => engine?.insertFloatingNode()}
                title="Spawn Independent Floating Topic"
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
              >
                <Layers size={18} className="text-teal-600" />
                <span className="text-[10px] font-semibold mt-0.5">Floating</span>
                <span className="text-[9px] text-slate-400 font-mono">Idea</span>
              </button>

              <button
                onClick={() => engine?.deleteNode()}
                title="Delete Selected Topic (Delete)"
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-200 text-slate-700 transition-all"
              >
                <Trash2 size={18} className="text-red-500" />
                <span className="text-[10px] font-semibold mt-0.5">Delete</span>
                <span className="text-[9px] text-slate-400 font-mono">Del</span>
              </button>

              {/* Format Painter */}
              <button
                onClick={() => {
                  if (isFormatPainterActive) {
                    engine?.endFormatPainter();
                  } else {
                    engine?.startFormatPainter();
                  }
                }}
                title="Format Painter: Click to copy style, then click target topic"
                className={cn(
                  'flex flex-col items-center justify-center px-3 py-1 rounded-lg border transition-all',
                  isFormatPainterActive
                    ? 'bg-amber-100 border-amber-300 text-amber-800 shadow-xs ring-2 ring-amber-400/50'
                    : 'hover:bg-white hover:shadow-xs border-transparent hover:border-slate-200 text-slate-700'
                )}
              >
                <Paintbrush size={18} className={isFormatPainterActive ? 'text-amber-600' : 'text-amber-500'} />
                <span className="text-[10px] font-semibold mt-0.5">Painter</span>
                <span className="text-[9px] text-slate-400 font-mono">{isFormatPainterActive ? 'Active' : 'Copy'}</span>
              </button>
            </div>

            {/* Structure & Layout Dropdown */}
            <div className="relative pr-4 border-r border-slate-200">
              <button
                onClick={() => setShowLayoutMenu(!showLayoutMenu)}
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
              >
                <LayoutGrid size={18} className="text-indigo-600" />
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-semibold">Layout</span>
                  <ChevronDown size={11} className="text-slate-400" />
                </div>
              </button>

              {showLayoutMenu && (
                <div className="absolute top-14 left-0 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Select Diagram Structure
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-1">
                    {LAYOUT_OPTIONS.map((layout) => (
                      <button
                        key={layout.id}
                        onClick={() => {
                          engine?.setLayout(layout.id);
                          setShowLayoutMenu(false);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex flex-col transition-colors',
                          currentLayout === layout.id
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <span className="font-semibold">{layout.name}</span>
                        <span className="text-[10px] text-slate-400">{layout.description}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Themes Dropdown */}
            <div className="relative pr-4 border-r border-slate-200">
              <button
                onClick={() => setShowThemeMenu(!showThemeMenu)}
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
              >
                <Palette size={18} className="text-amber-500" />
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-semibold">Theme</span>
                  <ChevronDown size={11} className="text-slate-400" />
                </div>
              </button>

              {showThemeMenu && (
                <div className="absolute top-14 left-0 w-56 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Color Schemes
                  </div>
                  <div className="space-y-1">
                    {THEME_PRESETS.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => {
                          engine?.setThemePreset(theme.id);
                          setShowThemeMenu(false);
                        }}
                        className={cn(
                          'w-full text-left px-3 py-2 rounded-lg text-xs font-medium flex items-center justify-between transition-colors',
                          currentThemeId === theme.id
                            ? 'bg-indigo-50 text-indigo-700 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        )}
                      >
                        <span>{theme.name}</span>
                        <div
                          className="w-4 h-4 rounded-full border border-slate-300"
                          style={{ backgroundColor: theme.previewColor }}
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Auto Numbering & Align */}
            <div className="flex items-center gap-2 pr-4 border-r border-slate-200">
              <button
                onClick={() => engine?.toggleAutoNumbering(true)}
                title="Hierarchical Numbering (1, 1.1, 1.1.1)"
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
              >
                <ListOrdered size={18} className="text-indigo-600" />
                <span className="text-[10px] font-semibold mt-0.5">Numbering</span>
                <span className="text-[9px] text-slate-400 font-mono">1.1.1</span>
              </button>

              <button
                onClick={() => engine?.resetLayout()}
                title="Reset Layout & Tidy Branch Alignment"
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
              >
                <RotateCcw size={18} className="text-slate-600" />
                <span className="text-[10px] font-semibold mt-0.5">Align</span>
                <span className="text-[9px] text-slate-400 font-mono">Auto</span>
              </button>
            </div>

            {/* Quick Shape Selector */}
            <div className="relative pr-4 border-r border-slate-200">
              <button
                onClick={() => setShowShapeMenu(!showShapeMenu)}
                className="flex flex-col items-center justify-center px-3 py-1 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
              >
                <Square size={18} className="text-emerald-600" />
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[10px] font-semibold">Shape</span>
                  <ChevronDown size={11} className="text-slate-400" />
                </div>
              </button>

              {showShapeMenu && (
                <div className="absolute top-14 left-0 w-48 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 py-1">
                    Topic Shape
                  </div>
                  <div className="space-y-1">
                    {SHAPE_OPTIONS.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => {
                          engine?.setNodeShape(shape.id);
                          setShowShapeMenu(false);
                        }}
                        className="w-full text-left px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-slate-50 text-slate-700 transition-colors"
                      >
                        {shape.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Colors */}
            <div className="flex flex-col justify-center gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Quick Fill</span>
              <div className="flex items-center gap-1">
                {[
                  '#0284c7', // Sky
                  '#059669', // Emerald
                  '#7c3aed', // Purple
                  '#d97706', // Amber
                  '#e11d48', // Rose
                  '#1e293b', // Slate
                  '#ffffff', // White
                ].map((color) => (
                  <button
                    key={color}
                    onClick={() => {
                      engine?.setNodeStyle('fillColor', color);
                      engine?.setNodeStyle('color', color === '#ffffff' ? '#1e293b' : '#ffffff');
                    }}
                    className="w-5 h-5 rounded-md border border-slate-200 hover:scale-125 transition-transform shadow-xs"
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </>
        )}

        {/* --- INSERT TAB --- */}
        {activeTab === 'insert' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => engine?.addSummary()}
              className="flex flex-col items-center justify-center px-4 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <Braces size={18} className="text-indigo-600" />
              <span className="text-[10px] font-semibold mt-1">Summary (Brace)</span>
            </button>

            <button
              onClick={() => engine?.addBoundary()}
              className="flex flex-col items-center justify-center px-4 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <BoxSelect size={18} className="text-purple-600" />
              <span className="text-[10px] font-semibold mt-1">Boundary (Frame)</span>
            </button>

            <button
              onClick={() => engine?.addRelationship()}
              className="flex flex-col items-center justify-center px-4 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <ArrowRightCircle size={18} className="text-sky-600" />
              <span className="text-[10px] font-semibold mt-1">Relationship Line</span>
            </button>

            <button
              onClick={() => engine?.insertFloatingNode()}
              title="Spawn an independent floating topic"
              className="flex flex-col items-center justify-center px-4 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <Layers size={18} className="text-teal-600" />
              <span className="text-[10px] font-semibold mt-1">Floating Topic</span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            <button
              onClick={() => onOpenImageDialog?.()}
              title="Attach and resize image on selected topic"
              className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <ImageIcon size={18} className="text-blue-600" />
              <span className="text-[10px] font-semibold mt-1">Image</span>
            </button>

            <button
              onClick={() => onOpenFormulaDialog?.()}
              title="Insert LaTeX mathematical equation"
              className="flex flex-col items-center justify-center px-3.5 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <Sigma size={18} className="text-fuchsia-600" />
              <span className="text-[10px] font-semibold mt-1">Math Formula</span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            <button
              onClick={() => engine?.toggleNodeCheckbox()}
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <CheckSquare size={18} className="text-emerald-600" />
              <span className="text-[10px] font-semibold mt-1">Task Checkbox</span>
            </button>

            <button
              onClick={() => onOpenNotes?.()}
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <FileText size={18} className="text-amber-600" />
              <span className="text-[10px] font-semibold mt-1">Topic Notes</span>
            </button>

            <button
              onClick={() => {
                const link = prompt('Enter URL hyperlink:', activeNode?.hyperlink || 'https://');
                if (link) engine?.setNodeHyperlink(link);
              }}
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <Link2 size={18} className="text-emerald-600" />
              <span className="text-[10px] font-semibold mt-1">Hyperlink</span>
            </button>

            <div className="h-8 w-px bg-slate-200 mx-1" />

            <button
              onClick={() => onImportFolder?.()}
              title="Import a directory tree into mind map"
              className="flex flex-col items-center justify-center px-3 py-1.5 rounded-lg hover:bg-white hover:shadow-xs border border-transparent hover:border-slate-200 text-slate-700 transition-all"
            >
              <FolderTree size={18} className="text-indigo-600" />
              <span className="text-[10px] font-semibold mt-1">Import Folder</span>
            </button>
          </div>
        )}

        {/* --- PAGE STYLE TAB --- */}
        {activeTab === 'pageStyle' && (
          <div className="flex items-center gap-6">
            {/* Rainbow Lines Toggle */}
            <div className="flex items-center gap-2 pr-6 border-r border-slate-200">
              <button
                onClick={() => engine?.toggleRainbowLines(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-300 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
              >
                <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-r from-red-500 via-green-500 to-blue-500" />
                <span>Rainbow Branches</span>
              </button>
            </div>

            {/* Branch Line Styles */}
            <div className="flex items-center gap-2 pr-6 border-r border-slate-200">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Line Style:
              </span>
              <button
                onClick={() => engine?.setBranchLineStyle('curve')}
                className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-400 rounded-md text-xs font-medium text-slate-700"
              >
                Curved
              </button>
              <button
                onClick={() => engine?.setBranchLineStyle('straight')}
                className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-400 rounded-md text-xs font-medium text-slate-700"
              >
                Straight
              </button>
              <button
                onClick={() => engine?.setBranchLineStyle('direct')}
                className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-400 rounded-md text-xs font-medium text-slate-700"
              >
                Direct
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW TAB --- */}
        {activeTab === 'view' && (
          <div className="flex items-center gap-3">
            {/* Pitch / Presentation Mode */}
            <button
              onClick={() => engine?.enterPresentationMode()}
              className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-lg text-xs font-semibold shadow-xs hover:opacity-95 transition-opacity"
            >
              <Play size={13} className="fill-white" />
              <span>Pitch Presentation</span>
            </button>

            {/* Mini-map Navigator Toggle */}
            <button
              onClick={() => onToggleMiniMap?.()}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1.5 border rounded-lg text-xs font-medium transition-colors shadow-xs',
                showMiniMap
                  ? 'bg-indigo-50 border-indigo-500 text-indigo-700 font-semibold'
                  : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
              )}
            >
              <Eye size={14} className={showMiniMap ? 'text-indigo-600' : 'text-slate-600'} />
              <span>Navigator (Mini-Map)</span>
            </button>

            <div className="h-6 w-px bg-slate-200 mx-1" />

            <button
              onClick={() => engine?.fitView()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 shadow-xs"
            >
              <Maximize2 size={14} className="text-indigo-600" />
              <span>Fit Window</span>
            </button>

            <button
              onClick={() => engine?.resetView()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-xs font-medium text-slate-700 shadow-xs"
            >
              <RotateCcw size={14} className="text-slate-600" />
              <span>Reset (100%)</span>
            </button>

            <button
              onClick={() => engine?.zoomIn()}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs"
              title="Zoom In"
            >
              <ZoomIn size={14} />
            </button>

            <button
              onClick={() => engine?.zoomOut()}
              className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg text-slate-700 shadow-xs"
              title="Zoom Out"
            >
              <ZoomOut size={14} />
            </button>
          </div>
        )}

        {/* --- AI ASSISTANT TAB --- */}
        {activeTab === 'ai' && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => onOpenAIDialog('generate')}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 text-white rounded-lg text-xs font-semibold shadow-sm hover:opacity-95"
            >
              <Sparkles size={14} />
              <span>Generate Map from Topic</span>
            </button>

            <button
              onClick={() => onOpenAIDialog('expand')}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-indigo-200 text-indigo-700 hover:bg-indigo-50 rounded-lg text-xs font-semibold shadow-xs"
            >
              <GitFork size={14} />
              <span>Expand Selected Topic with AI</span>
            </button>
          </div>
        )}

        {/* --- EXPORT TAB --- */}
        {activeTab === 'export' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => engine?.export('png', docTitle || 'mind-map')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
            >
              <Download size={13} className="text-indigo-600" />
              <span>PNG Image</span>
            </button>

            <button
              onClick={() => engine?.export('svg', docTitle || 'mind-map')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
            >
              <Download size={13} className="text-emerald-600" />
              <span>SVG Vector</span>
            </button>

            <button
              onClick={() => engine?.export('pdf', docTitle || 'mind-map')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
            >
              <Download size={13} className="text-red-600" />
              <span>PDF Document</span>
            </button>

            <button
              onClick={() => engine?.export('md', docTitle || 'mind-map')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
            >
              <Download size={13} className="text-slate-600" />
              <span>Markdown (.md)</span>
            </button>

            <button
              onClick={() => engine?.export('json', docTitle || 'mind-map')}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-xs font-semibold text-slate-700 shadow-xs"
            >
              <Download size={13} className="text-amber-600" />
              <span>JSON (.json)</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
