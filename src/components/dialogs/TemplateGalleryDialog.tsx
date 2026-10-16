import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutTemplate,
  X,
  Search,
  BookmarkPlus,
  Trash2,
  Sparkles,
  Check,
  FolderKanban,
} from 'lucide-react';
import { useDialogA11y } from '../../lib/useDialogA11y';
import {
  MindMapTemplate,
  TemplateCategory,
  TemplateService,
} from '../../services/templateService';
import { LAYOUT_OPTIONS, THEME_PRESETS } from '../../types/mindmap';
import { MindMapEngine } from '../../engine/MindMapEngine';

interface TemplateGalleryDialogProps {
  isOpen: boolean;
  engine: MindMapEngine | null;
  currentDocTitle: string;
  onSelectTemplate: (title: string, data: any) => void;
  onClose: () => void;
}

const CATEGORIES: ('All' | TemplateCategory)[] = [
  'All',
  'Strategic Planning',
  'Project Management',
  'Engineering & Systems',
  'Organization & Team',
  'My Templates',
];

export const TemplateGalleryDialog: React.FC<TemplateGalleryDialogProps> = ({
  isOpen,
  engine,
  currentDocTitle,
  onSelectTemplate,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<'All' | TemplateCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [templates, setTemplates] = useState<MindMapTemplate[]>([]);
  const [showSaveForm, setShowSaveForm] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setTemplates(TemplateService.getAllTemplates());
    setShowSaveForm(false);
    setCustomName(currentDocTitle || 'My Custom Template');
    setCustomDesc('');
    setSavedNotice(false);
  }, [isOpen, currentDocTitle]);

  const dialogRef = useDialogA11y<HTMLDivElement>(isOpen, onClose);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      if (selectedCategory !== 'All' && t.category !== selectedCategory) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.category.toLowerCase().includes(q)
      );
    });
  }, [templates, selectedCategory, searchQuery]);

  if (!isOpen) return null;

  const handleUseTemplate = (template: MindMapTemplate) => {
    const data = TemplateService.instantiateTemplate(template);
    onSelectTemplate(template.name, data);
    onClose();
  };

  const handleSaveCurrentAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!engine || !customName.trim()) return;
    const data = engine.getData();
    if (!data) return;
    TemplateService.saveCustomTemplate({
      name: customName,
      description: customDesc,
      layout: engine.getLayout(),
      themeId: engine.getThemeId(),
      data,
    });
    setTemplates(TemplateService.getAllTemplates());
    setShowSaveForm(false);
    setSelectedCategory('My Templates');
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  const handleDeleteCustom = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    TemplateService.deleteCustomTemplate(id);
    setTemplates(TemplateService.getAllTemplates());
  };

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-label="Starter Template Gallery"
      tabIndex={-1}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none focus:outline-none"
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
              <LayoutTemplate size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">Starter Template Gallery</h3>
              <p className="text-[11px] text-slate-400">
                Launch structured frameworks in one click or save your own reusable templates
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowSaveForm((v) => !v)}
              disabled={!engine}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 transition-colors cursor-pointer disabled:opacity-40"
            >
              <BookmarkPlus size={14} />
              <span>Save Current Map as Template</span>
            </button>
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Save Current Map as Template Collapsible Banner */}
        {showSaveForm && (
          <form
            onSubmit={handleSaveCurrentAsTemplate}
            className="p-4 bg-indigo-50/60 border-b border-indigo-100 flex flex-col sm:flex-row items-stretch sm:items-end gap-3"
          >
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                Template Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="e.g. Weekly Team Sync"
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
              />
            </div>
            <div className="flex-1">
              <label className="block text-[11px] font-bold text-indigo-900 uppercase tracking-wider mb-1">
                Description
              </label>
              <input
                type="text"
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                placeholder="Brief summary of this template..."
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-indigo-200 bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowSaveForm(false)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-xs transition-colors cursor-pointer"
              >
                <Check size={13} />
                Save Template
              </button>
            </div>
          </form>
        )}

        {savedNotice && (
          <div className="px-4 py-2 bg-emerald-50 border-b border-emerald-200 text-emerald-800 text-xs font-semibold flex items-center gap-1.5">
            <Check size={14} className="text-emerald-600" />
            Saved to &ldquo;My Templates&rdquo;!
          </div>
        )}

        {/* Filter Bar */}
        <div className="px-5 pt-3 pb-2 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-56">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search templates..."
              aria-label="Search templates"
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
            />
          </div>
        </div>

        {/* Template Grid */}
        <div className="flex-1 overflow-y-auto p-5">
          {filteredTemplates.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <FolderKanban size={32} className="mx-auto mb-2 opacity-40" />
              <p className="text-sm font-semibold text-slate-600">No templates found</p>
              <p className="text-xs mt-1">
                {selectedCategory === 'My Templates'
                  ? 'Click "Save Current Map as Template" above to store your own reusable layouts.'
                  : 'Try another category or search term.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {filteredTemplates.map((template) => {
                const preset =
                  THEME_PRESETS.find((p) => p.id === template.themeId) || THEME_PRESETS[0];
                const layoutLabel =
                  LAYOUT_OPTIONS.find((l) => l.id === template.layout)?.name || template.layout;

                return (
                  <div
                    key={template.id}
                    onClick={() => handleUseTemplate(template)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        handleUseTemplate(template);
                      }
                    }}
                    className="group relative rounded-xl border border-slate-200 hover:border-indigo-400 bg-white hover:shadow-lg transition-all p-4 flex flex-col justify-between cursor-pointer text-left"
                  >
                    <div>
                      {/* Mini Visual Header */}
                      <div
                        className="h-16 rounded-lg mb-3 px-3 flex items-center justify-between border border-slate-200/70"
                        style={{ backgroundColor: preset.previewBg }}
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="px-2.5 py-1 rounded-md text-[10px] font-bold text-white shadow-2xs"
                            style={{ backgroundColor: preset.previewColor }}
                          >
                            {template.name.split(' ')[0]}
                          </div>
                          <div className="flex flex-col gap-1">
                            <div
                              className="w-12 h-1.5 rounded-full opacity-60"
                              style={{ backgroundColor: preset.previewLine }}
                            />
                            <div
                              className="w-8 h-1.5 rounded-full opacity-40"
                              style={{ backgroundColor: preset.previewLine }}
                            />
                          </div>
                        </div>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/90 text-slate-600 border border-slate-200/60 shadow-2xs">
                          {layoutLabel}
                        </span>
                      </div>

                      <div className="flex items-start justify-between gap-2">
                        <h4 className="text-xs font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {template.name}
                        </h4>
                        {template.isCustom && (
                          <button
                            type="button"
                            aria-label={`Delete template ${template.name}`}
                            title="Delete custom template"
                            onClick={(e) => handleDeleteCustom(template.id, e)}
                            className="p-1 rounded hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition-colors"
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>

                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                        {template.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-semibold text-slate-400">
                        {template.category}
                      </span>
                      <span className="text-[11px] font-bold text-indigo-600 group-hover:translate-x-0.5 transition-transform inline-flex items-center gap-1">
                        <Sparkles size={11} />
                        Use Template →
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
