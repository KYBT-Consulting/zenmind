import React, { useState, useEffect } from 'react';
import {
  X,
  Palette,
  Square,
  LayoutGrid,
  Bold,
  Sliders,
  Check,
  CheckSquare,
  FileText,
  Tag,
  Clock,
  AlertCircle,
  Plus,
  Image as ImageIcon,
  Sigma,
  Trash2,
  BoxSelect,
  ArrowRight,
  Braces,
  Layers,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import {
  ActiveNodeInfo,
  LAYOUT_OPTIONS,
  PriorityLevel,
  ProgressLevel,
  SHAPE_OPTIONS,
  THEME_PRESETS,
  BranchLineStyle,
} from '../../types/mindmap';
import { cn } from '../../lib/utils';

export type InspectorTab = 'node' | 'task' | 'notes' | 'structure';

interface FormatInspectorProps {
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  initialTab?: InspectorTab;
  onClose: () => void;
  onOpenImageDialog?: () => void;
  onOpenFormulaDialog?: () => void;
}

export const FormatInspector: React.FC<FormatInspectorProps> = ({
  engine,
  activeNode,
  initialTab = 'node',
  onClose,
  onOpenImageDialog,
  onOpenFormulaDialog,
}) => {
  const [activeTab, setActiveTab] = useState<InspectorTab>(initialTab);
  const [noteContent, setNoteContent] = useState<string>('');
  const [newTagInput, setNewTagInput] = useState<string>('');
  const [outerFrameText, setOuterFrameText] = useState<string>('');

  // Sync note content and outerFrame when activeNode changes
  useEffect(() => {
    setNoteContent(activeNode?.note || '');
    setOuterFrameText(activeNode?.outerFrame?.text || '');
  }, [activeNode?.uid, activeNode?.note, activeNode?.outerFrame?.text]);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const currentLayout = engine?.getLayout() || 'mindMap';
  const currentThemeId = engine?.getThemeId() || 'ocean-breeze';

  const colorPalette = [
    '#0284c7', // Sky
    '#2563eb', // Blue
    '#4f46e5', // Indigo
    '#7c3aed', // Purple
    '#c026d3', // Fuchsia
    '#e11d48', // Rose
    '#ea580c', // Orange
    '#d97706', // Amber
    '#059669', // Emerald
    '#0d9488', // Teal
    '#475569', // Slate
    '#1e293b', // Dark
    '#ffffff', // White
  ];

  const boundaryColorPresets = [
    { name: 'Indigo', stroke: '#4f46e5', fill: 'rgba(79, 70, 229, 0.08)' },
    { name: 'Emerald', stroke: '#059669', fill: 'rgba(5, 150, 105, 0.08)' },
    { name: 'Amber', stroke: '#d97706', fill: 'rgba(217, 119, 6, 0.08)' },
    { name: 'Rose', stroke: '#e11d48', fill: 'rgba(225, 29, 72, 0.08)' },
    { name: 'Sky', stroke: '#0284c7', fill: 'rgba(2, 132, 199, 0.08)' },
    { name: 'Purple', stroke: '#7c3aed', fill: 'rgba(124, 58, 237, 0.08)' },
  ];

  // Helper to determine current priority (1-5)
  const currentPriority = React.useMemo(() => {
    if (!activeNode?.icon) return null;
    const pIcon = activeNode.icon.find((i) => i.startsWith('priority_'));
    if (!pIcon) return null;
    const num = parseInt(pIcon.replace('priority_', ''), 10);
    return isNaN(num) ? null : (num as PriorityLevel);
  }, [activeNode?.icon]);

  // Helper to determine current progress (0-100)
  const currentProgress = React.useMemo(() => {
    if (!activeNode?.icon) return null;
    const pIcon = activeNode.icon.find((i) => i.startsWith('progress_'));
    if (!pIcon) return null;
    const num = parseInt(pIcon.replace('progress_', ''), 10);
    return isNaN(num) ? null : (num as ProgressLevel);
  }, [activeNode?.icon]);

  const handleNoteBlur = () => {
    if (activeNode) {
      engine?.setNodeNote(noteContent);
    }
  };

  const handleAddTag = (e: React.FormEvent) => {
    e.preventDefault();
    const tag = newTagInput.trim();
    if (!tag || !activeNode) return;
    const currentTags = activeNode.tag || [];
    if (!currentTags.includes(tag)) {
      engine?.setNodeTags([...currentTags, tag]);
    }
    setNewTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!activeNode) return;
    const currentTags = (activeNode.tag || []).filter((t) => t !== tagToRemove);
    engine?.setNodeTags(currentTags);
  };

  return (
    <aside className="absolute md:relative inset-y-0 right-0 w-80 max-w-[90vw] bg-white border-l border-slate-200 flex flex-col z-40 shadow-2xl md:shadow-lg select-none h-full animate-in slide-in-from-right duration-200 pb-12 md:pb-0">
      {/* Inspector Header */}
      <div className="h-12 px-4 border-b border-slate-100 flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
          <Sliders size={14} className="text-indigo-600" />
          Format Inspector
        </h3>
        <button
          onClick={onClose}
          className="p-1 hover:bg-slate-100 rounded-md text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100 bg-slate-50/60 p-1 gap-1">
        {[
          { id: 'node', label: 'Style', icon: Square },
          { id: 'task', label: 'Task', icon: CheckSquare },
          { id: 'notes', label: 'Notes', icon: FileText },
          { id: 'structure', label: 'Diagram', icon: LayoutGrid },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as InspectorTab)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all',
                activeTab === tab.id
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              )}
            >
              <Icon size={12} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar text-xs">
        {/* --- STYLE TAB --- */}
        {activeTab === 'node' && (
          <>
            {activeNode ? (
              <div className="space-y-5">
                {/* Active node label banner */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Selected Topic
                  </span>
                  <div className="font-semibold text-slate-800 truncate">
                    {activeNode.text || '(Untitled Topic)'}
                  </div>
                </div>

                {/* Shape Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Shape
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {SHAPE_OPTIONS.map((shape) => (
                      <button
                        key={shape.id}
                        onClick={() => engine?.setNodeShape(shape.id)}
                        className={cn(
                          'px-2.5 py-1.5 rounded-lg border text-left font-medium transition-all',
                          activeNode.shape === shape.id
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 font-semibold shadow-xs'
                            : 'border-slate-200 hover:border-slate-300 text-slate-700'
                        )}
                      >
                        {shape.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Fill Color */}
                <div>
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                    Fill Color
                  </label>
                  <div className="grid grid-cols-6 gap-1.5 mb-2">
                    {colorPalette.map((color) => (
                      <button
                        key={color}
                        onClick={() => {
                          engine?.setNodeStyle('fillColor', color);
                          engine?.setNodeStyle('color', color === '#ffffff' ? '#1e293b' : '#ffffff');
                        }}
                        className="w-7 h-7 rounded-lg border border-slate-200 shadow-xs hover:scale-110 transition-transform relative flex items-center justify-center"
                        style={{ backgroundColor: color }}
                      >
                        {activeNode.fillColor === color && (
                          <Check
                            size={12}
                            className={color === '#ffffff' ? 'text-slate-800' : 'text-white'}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Typography
                  </label>
                  <div className="flex items-center gap-2">
                    {/* Font size */}
                    <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-slate-50">
                      <button
                        onClick={() => {
                          const currentSize = activeNode.fontSize || 14;
                          engine?.setNodeStyle('fontSize', Math.max(10, currentSize - 2));
                        }}
                        className="px-2 py-1 hover:bg-slate-200 text-slate-600"
                      >
                        -
                      </button>
                      <span className="px-2 py-1 text-xs font-semibold text-slate-700 min-w-8 text-center">
                        {activeNode.fontSize || 14}px
                      </span>
                      <button
                        onClick={() => {
                          const currentSize = activeNode.fontSize || 14;
                          engine?.setNodeStyle('fontSize', Math.min(32, currentSize + 2));
                        }}
                        className="px-2 py-1 hover:bg-slate-200 text-slate-600"
                      >
                        +
                      </button>
                    </div>

                    {/* Bold toggle */}
                    <button
                      onClick={() => {
                        const isBold = activeNode.fontWeight === 'bold';
                        engine?.setNodeStyle('fontWeight', isBold ? 'normal' : 'bold');
                      }}
                      className={cn(
                        'p-2 rounded-lg border transition-all',
                        activeNode.fontWeight === 'bold'
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                      )}
                    >
                      <Bold size={14} />
                    </button>
                  </div>
                </div>

                {/* Media Attachments & Math */}
                <div className="pt-3 border-t border-slate-200 space-y-3">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Media & Formulas
                  </label>

                  {activeNode.image ? (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                          <ImageIcon size={13} className="text-blue-600" />
                          Image Attached
                        </span>
                        <button
                          onClick={() => engine?.setNodeImage(null)}
                          className="text-slate-400 hover:text-rose-600 p-1 transition-colors"
                          title="Remove Image"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                      <div className="flex items-center gap-3">
                        <img
                          src={activeNode.image.url}
                          alt="Node Attachment"
                          className="w-12 h-12 object-cover rounded-md border border-slate-200 shadow-xs"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-medium text-slate-600 truncate">
                            {activeNode.image.title || 'Attached Image'}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {activeNode.image.width || 180} × {activeNode.image.height || 120} px
                          </p>
                        </div>
                        <button
                          onClick={() => onOpenImageDialog?.()}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-slate-700 transition-colors"
                        >
                          Edit
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        onClick={() => onOpenImageDialog?.()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
                      >
                        <ImageIcon size={14} className="text-indigo-600" />
                        <span>Attach Image</span>
                      </button>
                      <button
                        onClick={() => onOpenFormulaDialog?.()}
                        className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:border-fuchsia-300 hover:bg-fuchsia-50/50 text-slate-700 text-xs font-semibold transition-all shadow-xs"
                      >
                        <Sigma size={14} className="text-fuchsia-600" />
                        <span>Insert Math</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <Square size={28} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium">No topic selected</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Click on any topic on the canvas to customize its shape, color, and font.
                </p>
              </div>
            )}
          </>
        )}

        {/* --- TASK & STATUS TAB --- */}
        {activeTab === 'task' && (
          <>
            {activeNode ? (
              <div className="space-y-5">
                {/* Checkbox Quick Action */}
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800 block">Task Checkbox</span>
                    <span className="text-[10px] text-slate-400">Toggle completion state</span>
                  </div>
                  <button
                    onClick={() => engine?.toggleNodeCheckbox()}
                    className={cn(
                      'px-3 py-1.5 rounded-lg font-semibold text-xs transition-all flex items-center gap-1.5 shadow-xs',
                      currentProgress === 100
                        ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                        : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    )}
                  >
                    <CheckSquare size={13} />
                    <span>{currentProgress === 100 ? 'Completed' : 'To Do'}</span>
                  </button>
                </div>

                {/* Priority Levels */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Priority Level
                    </label>
                    {currentPriority && (
                      <button
                        onClick={() => engine?.setNodePriority(null)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([1, 2, 3, 4, 5] as PriorityLevel[]).map((level) => {
                      const colors: Record<number, string> = {
                        1: 'bg-rose-500 text-white',
                        2: 'bg-amber-500 text-white',
                        3: 'bg-blue-500 text-white',
                        4: 'bg-slate-500 text-white',
                        5: 'bg-slate-400 text-white',
                      };
                      const isSelected = currentPriority === level;
                      return (
                        <button
                          key={level}
                          onClick={() => engine?.setNodePriority(isSelected ? null : level)}
                          className={cn(
                            'py-1.5 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all',
                            isSelected
                              ? `${colors[level]} border-transparent ring-2 ring-indigo-400 shadow-xs`
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          )}
                        >
                          P{level}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Progress Indicators */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      Task Progress
                    </label>
                    {currentProgress !== null && (
                      <button
                        onClick={() => engine?.setNodeProgress(null)}
                        className="text-[10px] text-red-500 hover:underline"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-5 gap-1.5">
                    {([0, 25, 50, 75, 100] as ProgressLevel[]).map((percent) => {
                      const isSelected = currentProgress === percent;
                      return (
                        <button
                          key={percent}
                          onClick={() => engine?.setNodeProgress(isSelected ? null : percent)}
                          className={cn(
                            'py-1.5 rounded-lg border font-bold text-xs flex flex-col items-center justify-center transition-all',
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-white'
                          )}
                        >
                          {percent}%
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Tip: Click the progress badge on any node to advance it directly!
                  </p>
                </div>

                {/* Tag Badges */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Tags & Labels
                  </label>
                  <form onSubmit={handleAddTag} className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. Sprint 1)..."
                      value={newTagInput}
                      onChange={(e) => setNewTagInput(e.target.value)}
                      className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg font-semibold flex items-center justify-center"
                    >
                      <Plus size={13} />
                    </button>
                  </form>
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {(activeNode.tag || []).map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 text-[11px] font-medium border border-indigo-100"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="hover:text-red-500 transition-colors"
                        >
                          <X size={10} />
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <CheckSquare size={28} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium">No topic selected</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Select a topic to assign priority, task completion, and status tags.
                </p>
              </div>
            )}
          </>
        )}

        {/* --- NOTES TAB (Split-Screen Drawer Editor) --- */}
        {activeTab === 'notes' && (
          <>
            {activeNode ? (
              <div className="space-y-3 h-full flex flex-col">
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    Notes for Topic
                  </span>
                  <div className="font-semibold text-slate-800 truncate">
                    {activeNode.text || '(Untitled Topic)'}
                  </div>
                </div>

                <div className="flex-1 flex flex-col min-h-[260px]">
                  <textarea
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    onBlur={handleNoteBlur}
                    placeholder="Write detailed notes, meeting minutes, Markdown lists, or links here... (Auto-saves on blur)"
                    className="w-full flex-1 min-h-[240px] p-3 rounded-xl border border-slate-200 text-xs font-mono text-slate-800 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 resize-none leading-relaxed"
                  />
                  <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                    <span>{noteContent.length} characters</span>
                    <button
                      onClick={handleNoteBlur}
                      className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded"
                    >
                      Save Note
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 text-center text-slate-400">
                <FileText size={28} className="mx-auto mb-2 opacity-40" />
                <p className="font-medium">No topic selected</p>
                <p className="text-[11px] mt-1 text-slate-400">
                  Select a topic to draft or view docked Markdown notes.
                </p>
              </div>
            )}
          </>
        )}

        {/* --- STRUCTURE & THEME TAB --- */}
        {activeTab === 'structure' && (
          <div className="space-y-6">
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Layout Structures
              </label>
              <div className="space-y-1.5">
                {LAYOUT_OPTIONS.map((layout) => (
                  <button
                    key={layout.id}
                    onClick={() => engine?.setLayout(layout.id)}
                    className={cn(
                      'w-full text-left p-2.5 rounded-xl border transition-all flex flex-col',
                      currentLayout === layout.id
                        ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800">{layout.name}</span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                        {layout.category}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-0.5">{layout.description}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Branch Lines */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Branch Line Style
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['curve', 'straight', 'direct'] as BranchLineStyle[]).map((style) => (
                  <button
                    key={style}
                    onClick={() => engine?.setBranchLineStyle(style)}
                    className="px-2 py-1.5 rounded-lg border border-slate-200 hover:border-indigo-400 font-medium capitalize text-center text-slate-700 bg-white"
                  >
                    {style}
                  </button>
                ))}
              </div>
            </div>

            {/* Themes */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Theme Color Presets
              </label>
              <div className="space-y-2">
                {THEME_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => engine?.setThemePreset(preset.id)}
                    className={cn(
                      'w-full p-2.5 rounded-xl border text-left transition-all flex items-center justify-between',
                      currentThemeId === preset.id
                        ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    )}
                  >
                    <div>
                      <span className="font-semibold text-slate-800 block">{preset.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-4 h-4 rounded-full border border-slate-300 shadow-xs"
                        style={{ backgroundColor: preset.previewColor }}
                      />
                      <div
                        className="w-4 h-4 rounded-full border border-slate-200 shadow-xs"
                        style={{ backgroundColor: preset.previewBg }}
                      />
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Grouping & Annotations (EdrawMind Style) */}
            <div className="pt-4 border-t border-slate-200">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-3">
                Grouping & Annotations
              </label>

              {/* Boundary / Outer Frame */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2.5 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <BoxSelect size={15} className="text-indigo-600" />
                    <span>Boundary Frame</span>
                  </div>
                  {activeNode?.outerFrame ? (
                    <button
                      onClick={() => engine?.removeBoundary()}
                      className="text-[10px] text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 size={11} /> Remove
                    </button>
                  ) : null}
                </div>

                {activeNode?.outerFrame ? (
                  <div className="space-y-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block mb-1">Frame Label</span>
                      <input
                        type="text"
                        value={outerFrameText}
                        onChange={(e) => {
                          setOuterFrameText(e.target.value);
                          engine?.updateBoundary({ text: e.target.value });
                        }}
                        placeholder="Boundary label..."
                        className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 focus:outline-hidden focus:border-indigo-500 bg-white"
                      />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block mb-1">Color Palette</span>
                      <div className="grid grid-cols-6 gap-1.5">
                        {boundaryColorPresets.map((preset) => (
                          <button
                            key={preset.name}
                            onClick={() =>
                              engine?.updateBoundary({
                                strokeColor: preset.stroke,
                                fill: preset.fill,
                              })
                            }
                            title={preset.name}
                            className="w-7 h-7 rounded-lg border flex items-center justify-center transition-transform hover:scale-105 cursor-pointer"
                            style={{
                              backgroundColor: preset.fill,
                              borderColor: preset.stroke,
                            }}
                          >
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: preset.stroke }} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 font-medium block mb-1">Border Line Dash</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: 'none', label: 'Solid' },
                          { id: '5,5', label: 'Dashed' },
                          { id: '2,3', label: 'Dotted' },
                        ].map((dash) => (
                          <button
                            key={dash.id}
                            onClick={() => engine?.updateBoundary({ strokeDasharray: dash.id })}
                            className="px-2 py-1 text-[10px] font-medium rounded-lg border border-slate-200 hover:border-indigo-400 bg-white text-slate-700 cursor-pointer"
                          >
                            {dash.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <p className="text-[11px] text-slate-500 mb-2">
                      Enclose the selected topic and its subtopics inside a highlighted boundary frame.
                    </p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {boundaryColorPresets.slice(0, 4).map((preset) => (
                        <button
                          key={preset.name}
                          onClick={() =>
                            engine?.addBoundary({
                              strokeColor: preset.stroke,
                              fill: preset.fill,
                              radius: 8,
                              strokeDasharray: '5,5',
                            })
                          }
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium hover:opacity-90 transition-all text-slate-700 bg-white cursor-pointer shadow-2xs hover:border-indigo-300"
                        >
                          <div
                            className="w-3 h-3 rounded-full shrink-0"
                            style={{ backgroundColor: preset.stroke }}
                          />
                          <span>{preset.name} Frame</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Relationship Arrow */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2 mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                    <ArrowRight size={15} className="text-sky-600" />
                    <span>Relationship Arrow</span>
                  </div>
                  <button
                    onClick={() => engine?.removeRelationship()}
                    className="text-[10px] text-slate-400 hover:text-red-600 font-medium cursor-pointer"
                    title="Delete highlighted relationship arrow"
                  >
                    Delete Arrow
                  </button>
                </div>
                <p className="text-[11px] text-slate-500">
                  Connect any two arbitrary topics across branches with a draggable bezier curve and text label.
                </p>
                <button
                  onClick={() => engine?.addRelationship()}
                  className="w-full py-1.5 px-3 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <ArrowRight size={13} />
                  <span>Connect Selected Topic</span>
                </button>
              </div>

              {/* Summary Conclusion Bracket */}
              <div className="bg-slate-50/80 rounded-xl p-3 border border-slate-200/80 space-y-2">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-800">
                  <Braces size={15} className="text-indigo-600" />
                  <span>Summary Bracket</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  Groups child topics together with a curly brace bracket and attaches an overarching conclusion node.
                </p>
                <button
                  onClick={() => engine?.addSummary('Key Takeaway')}
                  className="w-full py-1.5 px-3 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Braces size={13} />
                  <span>Add Summary Bracket ({'{'}{'}'})</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
