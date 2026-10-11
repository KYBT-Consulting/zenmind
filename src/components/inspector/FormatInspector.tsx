import React, { useState } from 'react';
import {
  X,
  Palette,
  Square,
  LayoutGrid,
  Type,
  Bold,
  Sliders,
  Check,
  Sparkles,
} from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';
import {
  ActiveNodeInfo,
  LAYOUT_OPTIONS,
  LayoutType,
  SHAPE_OPTIONS,
  ShapeType,
  THEME_PRESETS,
  BranchLineStyle,
} from '../../types/mindmap';
import { cn } from '../../lib/utils';

interface FormatInspectorProps {
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  onClose: () => void;
}

export const FormatInspector: React.FC<FormatInspectorProps> = ({
  engine,
  activeNode,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'node' | 'structure' | 'theme'>('node');

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

  return (
    <aside className="w-72 bg-white border-l border-slate-200 flex flex-col z-20 shadow-lg select-none h-full">
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
          { id: 'node', label: 'Node', icon: Square },
          { id: 'structure', label: 'Structure', icon: LayoutGrid },
          { id: 'theme', label: 'Themes', icon: Palette },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
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
        {/* --- NODE TAB --- */}
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

        {/* --- STRUCTURE TAB --- */}
        {activeTab === 'structure' && (
          <div className="space-y-5">
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
          </div>
        )}

        {/* --- THEMES TAB --- */}
        {activeTab === 'theme' && (
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Curated Theme Styles
            </label>
            <div className="space-y-2">
              {THEME_PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => engine?.setThemePreset(preset.id)}
                  className={cn(
                    'w-full p-3 rounded-xl border text-left transition-all flex items-center justify-between',
                    currentThemeId === preset.id
                      ? 'border-indigo-600 bg-indigo-50/40 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  )}
                >
                  <div>
                    <span className="font-semibold text-slate-800 block">{preset.name}</span>
                    <span className="text-[10px] text-slate-400">Full Palette Harmony</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 rounded-full border border-slate-300 shadow-xs"
                      style={{ backgroundColor: preset.previewColor }}
                    />
                    <div
                      className="w-5 h-5 rounded-full border border-slate-200 shadow-xs"
                      style={{ backgroundColor: preset.previewBg }}
                    />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
