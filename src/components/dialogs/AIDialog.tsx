import React, { useState } from 'react';
import {
  Sparkles,
  X,
  Loader2,
  Key,
  HelpCircle,
  Lightbulb,
} from 'lucide-react';
import { AIService } from '../../services/aiService';
import { MindMapEngine } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';

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
    mode === 'expand' && activeNode ? activeNode.text : ''
  );
  const [loading, setLoading] = useState(false);
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [apiKey, setApiKey] = useState(
    localStorage.getItem('zenmind_gemini_api_key') || ''
  );

  if (!isOpen) return null;

  const handleSaveKey = () => {
    if (apiKey.trim()) {
      localStorage.setItem('zenmind_gemini_api_key', apiKey.trim());
    } else {
      localStorage.removeItem('zenmind_gemini_api_key');
    }
    setShowKeyInput(false);
  };

  const handleRunAI = async () => {
    if (!topic.trim()) return;
    setLoading(true);

    try {
      if (mode === 'generate') {
        const generatedData = await AIService.generateMindMapFromPrompt(topic);
        if (engine && generatedData) {
          engine.setData(generatedData);
          onClose();
        }
      } else {
        // Expand selected topic
        const subtopics = await AIService.expandTopic(topic);
        if (engine && subtopics && subtopics.length > 0) {
          // Insert each subtopic as a child
          for (const sub of subtopics) {
            engine.insertChildNode();
            engine.setNodeText(sub);
          }
          onClose();
        }
      }
    } catch (err) {
      console.error('AI generation error:', err);
      alert('AI generation failed. Please check your network or API key.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4 select-none">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-indigo-600 to-sky-500 flex items-center justify-center text-white shadow-xs">
              <Sparkles size={15} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {mode === 'generate' ? 'Generate Mind Map with AI' : 'Expand Topic with AI'}
              </h3>
              <p className="text-[11px] text-slate-400">
                Powered by Gemini 2.5 Flash
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-200 rounded-lg text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
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

          {/* Quick Examples */}
          {mode === 'generate' && (
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5 flex items-center gap-1">
                <Lightbulb size={12} className="text-amber-500" />
                Popular Topics:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {[
                  'Clean Code Architecture',
                  'SaaS Product Roadmap',
                  'Personal Finance Mastery',
                  'Machine Learning Roadmap',
                ].map((preset) => (
                  <button
                    key={preset}
                    onClick={() => setTopic(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-[11px] text-slate-600 font-medium transition-colors border border-slate-200"
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* API Key Toggle Section */}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center gap-1.5 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
            >
              <Key size={12} />
              <span>Configure Custom Gemini API Key</span>
            </button>

            {showKeyInput && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Paste your Google Gemini API Key here"
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>Stored locally in your browser</span>
                  <button
                    onClick={handleSaveKey}
                    className="px-3 py-1 bg-indigo-600 text-white rounded-md font-semibold hover:bg-indigo-700"
                  >
                    Save Key
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleRunAI}
            disabled={loading || !topic.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-indigo-600 to-sky-600 hover:from-indigo-700 hover:to-sky-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-indigo-100 disabled:opacity-50 transition-all"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Thinking & Structuring...</span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>Generate with AI</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
