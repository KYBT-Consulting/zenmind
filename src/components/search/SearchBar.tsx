import React, { useState, useEffect, useRef } from 'react';
import { Search, ChevronUp, ChevronDown, X, Replace, ReplaceAll } from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';

interface SearchBarProps {
  isOpen: boolean;
  engine: MindMapEngine | null;
  onClose: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ isOpen, engine, onClose }) => {
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [matchInfo, setMatchInfo] = useState<{ currentIndex: number; total: number }>({
    currentIndex: -1,
    total: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!engine) return;
    return engine.onSearchInfoChange((info) => {
      setMatchInfo(info);
    });
  }, [engine]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
        inputRef.current?.select();
      }, 20);
      if (query.trim() && engine) {
        engine.search(query);
      }
    } else {
      engine?.endSearch();
    }
  }, [isOpen, engine]);

  if (!isOpen) return null;

  const handleQueryChange = (val: string) => {
    setQuery(val);
    if (!val.trim()) {
      engine?.endSearch();
      setMatchInfo({ currentIndex: -1, total: 0 });
    } else {
      engine?.search(val);
    }
  };

  const handleClose = () => {
    engine?.endSearch();
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleClose();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (!query.trim()) return;
      if (e.shiftKey) {
        engine?.searchPrev();
      } else {
        engine?.search(query);
      }
    }
  };

  const currentDisplay = matchInfo.total > 0 && matchInfo.currentIndex >= 0 ? matchInfo.currentIndex + 1 : 0;

  return (
    <div
      role="region"
      aria-label="Find and Replace"
      onKeyDown={handleKeyDown}
      className="absolute top-3 right-3 z-40 w-80 bg-white/95 backdrop-blur-xs rounded-xl shadow-xl border border-slate-200 p-2.5 select-none animate-in fade-in slide-in-from-top-2 duration-150"
    >
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 flex items-center">
          <Search size={13} className="absolute left-2.5 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Find in mind map..."
            aria-label="Search mind map"
            className="w-full pl-7 pr-14 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
          />
          <span className="absolute right-2 text-[10px] font-mono text-slate-400">
            {query.trim() ? `${currentDisplay}/${matchInfo.total}` : ''}
          </span>
        </div>

        <button
          aria-label="Previous match (Shift+Enter)"
          title="Previous match (Shift+Enter)"
          onClick={() => engine?.searchPrev()}
          disabled={matchInfo.total === 0}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-35 cursor-pointer"
        >
          <ChevronUp size={14} />
        </button>
        <button
          aria-label="Next match (Enter)"
          title="Next match (Enter)"
          onClick={() => (query.trim() ? engine?.search(query) : undefined)}
          disabled={matchInfo.total === 0}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 disabled:opacity-35 cursor-pointer"
        >
          <ChevronDown size={14} />
        </button>
        <button
          aria-label="Toggle Replace"
          title="Toggle Replace"
          onClick={() => setShowReplace((v) => !v)}
          className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
            showReplace ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-slate-100 text-slate-500'
          }`}
        >
          <Replace size={13} />
        </button>
        <button
          aria-label="Close search (Esc)"
          title="Close search (Esc)"
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
        >
          <X size={14} />
        </button>
      </div>

      {showReplace && (
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center gap-1.5">
          <input
            type="text"
            value={replacement}
            onChange={(e) => setReplacement(e.target.value)}
            placeholder="Replace with..."
            aria-label="Replace text"
            className="flex-1 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:border-indigo-500 text-slate-800"
          />
          <button
            aria-label="Replace current match"
            title="Replace current match"
            onClick={() => engine?.replaceCurrent(replacement)}
            disabled={matchInfo.total === 0}
            className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
          >
            Replace
          </button>
          <button
            aria-label="Replace all matches"
            title="Replace all matches"
            onClick={() => engine?.replaceAll(replacement)}
            disabled={matchInfo.total === 0}
            className="px-2 py-1.5 rounded-lg text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-700 disabled:opacity-40 transition-colors flex items-center gap-1 cursor-pointer"
          >
            <ReplaceAll size={12} />
            All
          </button>
        </div>
      )}
    </div>
  );
};
