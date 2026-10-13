import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Settings2,
  Lightbulb,
  Server,
  Cpu,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  ArrowLeft,
  Activity,
} from 'lucide-react';
import {
  AIService,
  AIConfig,
  ENDPOINT_PRESETS,
  AIEndpointPreset,
} from '../../services/aiService';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';
import { cn, stripHtml } from '../../lib/utils';

interface AIDialogProps {
  isOpen: boolean;
  mode: 'generate' | 'expand';
  engine: MindMapEngine | null;
  activeNode: ActiveNodeInfo | null;
  onClose: () => void;
}

export const AIDialog: React.FC<AIDialogProps> = ({
  isOpen,
  mode,
  engine,
  activeNode,
  onClose,
}) => {
  const [topic, setTopic] = useState(
    mode === 'expand' && activeNode ? stripHtml(activeNode.text) : ''
  );
  const [loading, setLoading] = useState(false);
  const [activeView, setActiveView] = useState<'prompt' | 'settings'>('prompt');
  const [config, setConfig] = useState<AIConfig>(() => AIService.getConfig());
  const [testStatus, setTestStatus] = useState<{
    testing: boolean;
    result?: { success: boolean; message: string };
  }>({ testing: false });

  // Reload config when opened
  useEffect(() => {
    if (isOpen) {
      setConfig(AIService.getConfig());
      setTestStatus({ testing: false });
      if (mode === 'expand' && activeNode) {
        setTopic(stripHtml(activeNode.text));
      }
    }
    // Only when opened or the target topic changes: depending on the activeNode object would
    // re-run on every engine update and wipe unsaved settings edits.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, activeNode?.uid]);

  if (!isOpen) return null;

  const handleApplyPreset = (preset: AIEndpointPreset) => {
    setConfig((prev) => ({
      ...prev,
      provider: 'openai-compatible',
      openaiEndpoint: preset.endpoint,
      openaiModel: preset.defaultModel,
    }));
    setTestStatus({ testing: false });
  };

  const handleSaveSettings = () => {
    AIService.saveConfig(config);
    setActiveView('prompt');
  };

  const handleTestConnection = async () => {
    setTestStatus({ testing: true });
    try {
      const res = await AIService.testConnection(config);
      setTestStatus({ testing: false, result: res });
    } catch (err: any) {
      setTestStatus({
        testing: false,
        result: { success: false, message: err.message || 'Test failed' },
      });
    }
  };

  const handleRunAI = async () => {
    if (!topic.trim()) return;
    setLoading(true);

    try {
      if (mode === 'generate') {
        const generatedData = await AIService.generateMindMapFromPrompt(
          topic,
          config
        );
        if (engine && generatedData) {
          engine.setData(generatedData);
          onClose();
        }
      } else {
        // Expand selected topic into subtopics
        const subtopics = await AIService.expandTopic(topic, config);
        if (engine && subtopics && subtopics.length > 0) {
          // Insert under the topic the dialog was opened for (explicit parent: the library only
          // activates new nodes asynchronously, so insert-then-set-text overwrote the parent).
          engine.addChildTopics(subtopics, activeNode?.uid);
          onClose();
        }
      }
    } catch (err: any) {
      console.error('AI generation error:', err);
      alert(`AI Generation failed: ${err.message || 'Please check your API key, endpoint, or network.'}`);
    } finally {
      setLoading(false);
    }
  };

  const currentProviderLabel =
    config.provider === 'gemini'
      ? `Gemini (${config.geminiModel || '2.5-flash'})`
      : `${config.openaiModel || 'Custom'} (${config.openaiEndpoint.replace('https://', '').replace('http://', '').replace('/v1', '')})`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={16} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {activeView === 'settings'
                  ? 'AI Providers & Endpoints'
                  : mode === 'generate'
                  ? 'Generate Mind Map with AI'
                  : 'Expand Topic with AI'}
              </h3>
              <p className="text-[11px] text-slate-400">
                {activeView === 'settings'
                  ? 'Connect Gemini, OpenAI, or Local LLMs (Ollama / LM Studio)'
                  : `Active: ${currentProviderLabel}`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() =>
                setActiveView((v) => (v === 'settings' ? 'prompt' : 'settings'))
              }
              title={activeView === 'settings' ? 'Back to Prompt' : 'AI Settings'}
              className={cn(
                'p-1.5 rounded-lg transition-colors flex items-center gap-1 text-xs font-semibold',
                activeView === 'settings'
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
              )}
            >
              {activeView === 'settings' ? (
                <>
                  <ArrowLeft size={15} />
                  <span>Prompt</span>
                </>
              ) : (
                <>
                  <Settings2 size={15} />
                  <span>Configure</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={17} />
            </button>
          </div>
        </div>

        {/* --- VIEW: PROMPT TAB --- */}
        {activeView === 'prompt' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1.5">
                {mode === 'generate'
                  ? 'What topic would you like to map out?'
                  : `Expand subtopics for "${topic || 'Selected Topic'}"`}
              </label>
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g. Distributed System Architecture, 2026 Marketing Strategy..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all font-medium"
                onKeyDown={(e) => e.key === 'Enter' && handleRunAI()}
                autoFocus
              />
            </div>

            {/* Quick Inspiration Topics */}
            {mode === 'generate' && (
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                  <Lightbulb size={12} className="text-amber-500" />
                  Popular Suggestions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Clean Code Architecture',
                    'SaaS Product Roadmap',
                    'Personal Finance Mastery',
                    'Autonomous Agents 2026',
                  ].map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setTopic(preset)}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-[11px] text-slate-600 font-medium transition-colors border border-slate-200 cursor-pointer"
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Active Model Summary Pill */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-600">Model endpoint:</span>
                <span className="font-semibold text-slate-800 truncate max-w-[200px]">
                  {config.provider === 'gemini'
                    ? 'Google Gemini 2.5 Flash'
                    : `${config.openaiModel} (${config.openaiEndpoint})`}
                </span>
              </div>
              <button
                onClick={() => setActiveView('settings')}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>
        )}

        {/* --- VIEW: SETTINGS TAB (OpenAI / Ollama / Gemini) --- */}
        {activeView === 'settings' && (
          <div className="p-5 space-y-4 overflow-y-auto flex-1 text-xs">
            {/* Provider Switcher */}
            <div>
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
                Select LLM Provider
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() =>
                    setConfig((c) => ({ ...c, provider: 'gemini' }))
                  }
                  className={cn(
                    'p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer',
                    config.provider === 'gemini'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <Sparkles
                    size={18}
                    className={
                      config.provider === 'gemini'
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">
                      Google Gemini
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Gemini 2.5 Flash & Pro
                    </span>
                  </div>
                </button>

                <button
                  onClick={() =>
                    setConfig((c) => ({ ...c, provider: 'openai-compatible' }))
                  }
                  className={cn(
                    'p-3 rounded-xl border text-left flex items-start gap-2.5 transition-all cursor-pointer',
                    config.provider === 'openai-compatible'
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-xs ring-1 ring-indigo-500/20'
                      : 'border-slate-200 hover:bg-slate-50'
                  )}
                >
                  <Server
                    size={18}
                    className={
                      config.provider === 'openai-compatible'
                        ? 'text-indigo-600'
                        : 'text-slate-400'
                    }
                  />
                  <div>
                    <span className="font-bold text-slate-800 block">
                      OpenAI / Local LLMs
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Ollama, LM Studio, Groq, etc.
                    </span>
                  </div>
                </button>
              </div>
            </div>

            {/* Provider Specific Configuration */}
            {config.provider === 'gemini' ? (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Gemini API Key
                  </label>
                  <input
                    type="password"
                    value={config.geminiApiKey}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, geminiApiKey: e.target.value }))
                    }
                    placeholder="Paste AI Studio API Key..."
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-hidden focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Saved locally in browser storage.
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Model Name
                  </label>
                  <input
                    type="text"
                    value={config.geminiModel}
                    onChange={(e) =>
                      setConfig((c) => ({ ...c, geminiModel: e.target.value }))
                    }
                    placeholder="gemini-2.5-flash"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-hidden focus:border-indigo-500"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                {/* 1-Click Endpoint Presets */}
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                    <Cpu size={12} className="text-indigo-500" />
                    Quick Preset Profiles:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {ENDPOINT_PRESETS.map((p) => {
                      const isSelected =
                        config.openaiEndpoint.includes(p.endpoint) ||
                        p.endpoint === config.openaiEndpoint;
                      return (
                        <button
                          key={p.id}
                          onClick={() => handleApplyPreset(p)}
                          className={cn(
                            'px-2.5 py-1 rounded-lg text-[10px] font-semibold border transition-all cursor-pointer',
                            isSelected
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                              : 'bg-white hover:bg-slate-100 text-slate-700 border-slate-200'
                          )}
                        >
                          {p.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                    Endpoint Base URL
                  </label>
                  <input
                    type="text"
                    value={config.openaiEndpoint}
                    onChange={(e) =>
                      setConfig((c) => ({
                        ...c,
                        openaiEndpoint: e.target.value,
                      }))
                    }
                    placeholder="http://localhost:11434/v1 or https://api.openai.com/v1"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-hidden focus:border-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                    Must point to the v1 chat completions base (e.g.{' '}
                    <code>http://localhost:11434/v1</code> for Ollama).
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      Model Identifier
                    </label>
                    <input
                      type="text"
                      value={config.openaiModel}
                      onChange={(e) =>
                        setConfig((c) => ({ ...c, openaiModel: e.target.value }))
                      }
                      placeholder="llama3.2 or gpt-4o-mini"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-hidden focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-700 block mb-1">
                      API Key (Optional for local)
                    </label>
                    <input
                      type="password"
                      value={config.openaiApiKey}
                      onChange={(e) =>
                        setConfig((c) => ({
                          ...c,
                          openaiApiKey: e.target.value,
                        }))
                      }
                      placeholder="Leave blank for Ollama/LM Studio"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-hidden focus:border-indigo-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Test Connection Button & Result */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={handleTestConnection}
                disabled={testStatus.testing}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
              >
                {testStatus.testing ? (
                  <Loader2 size={13} className="animate-spin text-indigo-600" />
                ) : (
                  <Activity size={13} className="text-indigo-600" />
                )}
                <span>Test Connection</span>
              </button>

              <button
                onClick={handleSaveSettings}
                className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold text-xs transition-colors cursor-pointer shadow-xs"
              >
                Save & Apply
              </button>
            </div>

            {testStatus.result && (
              <div
                className={cn(
                  'p-2.5 rounded-xl border flex items-start gap-2 text-[11px] animate-in fade-in duration-150',
                  testStatus.result.success
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                    : 'bg-rose-50 text-rose-800 border-rose-200'
                )}
              >
                {testStatus.result.success ? (
                  <CheckCircle2
                    size={16}
                    className="text-emerald-600 mt-0.5 shrink-0"
                  />
                ) : (
                  <AlertCircle
                    size={16}
                    className="text-rose-600 mt-0.5 shrink-0"
                  />
                )}
                <div className="flex-1 break-words">
                  <p className="font-semibold">
                    {testStatus.result.success
                      ? 'Connection Successful'
                      : 'Connection Failed'}
                  </p>
                  <p className="mt-0.5 opacity-90">{testStatus.result.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          {activeView === 'prompt' ? (
            <button
              onClick={handleRunAI}
              disabled={loading || !topic.trim()}
              className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 size={13} className="animate-spin" />
                  <span>Thinking & Structuring...</span>
                </>
              ) : (
                <>
                  <Sparkles size={13} />
                  <span>
                    {mode === 'generate' ? 'Generate Mind Map' : 'Expand Topic'}
                  </span>
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleSaveSettings}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 transition-all cursor-pointer"
            >
              Done
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
