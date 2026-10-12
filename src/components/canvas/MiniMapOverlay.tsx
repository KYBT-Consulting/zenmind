import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Eye, EyeOff, Maximize2, X } from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';

interface MiniMapOverlayProps {
  engine: MindMapEngine | null;
  isOpen: boolean;
  onClose: () => void;
}

const BOX_WIDTH = 200;
const BOX_HEIGHT = 130;

export const MiniMapOverlay: React.FC<MiniMapOverlayProps> = ({
  engine,
  isOpen,
  onClose,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgContainerRef = useRef<HTMLDivElement>(null);
  const [viewBoxStyle, setViewBoxStyle] = useState<any>({
    left: '0px',
    top: '0px',
    right: '0px',
    bottom: '0px',
  });
  const [svgContent, setSvgContent] = useState<string>('');
  const [isDraggingBox, setIsDraggingBox] = useState(false);

  const updateMiniMap = useCallback(() => {
    if (!engine || !isOpen) return;
    try {
      const res = engine.calculateMiniMap(BOX_WIDTH, BOX_HEIGHT);
      if (res) {
        if (res.svgHTML) {
          setSvgContent(res.svgHTML);
        }
        if (res.viewBoxStyle) {
          setViewBoxStyle(res.viewBoxStyle);
        }
      }
    } catch (err) {
      // Ignore during rapid canvas transition
    }
  }, [engine, isOpen]);

  useEffect(() => {
    if (!isOpen || !engine) return;

    updateMiniMap();
    const interval = setInterval(updateMiniMap, 400);
    return () => clearInterval(interval);
  }, [isOpen, engine, updateMiniMap]);

  const handleBoxMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setIsDraggingBox(true);
    engine?.miniMapMouseDown(e.nativeEvent);

    const handleMouseMove = (moveEvent: MouseEvent) => {
      engine?.miniMapMouseMove(moveEvent);
      updateMiniMap();
    };

    const handleMouseUp = (upEvent: MouseEvent) => {
      setIsDraggingBox(false);
      engine?.miniMapMouseUp(upEvent);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      updateMiniMap();
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="absolute bottom-4 right-4 z-30 bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200/90 overflow-hidden select-none animate-in fade-in zoom-in-95 duration-150"
      style={{ width: BOX_WIDTH, height: BOX_HEIGHT + 28 }}
    >
      {/* Mini-map Header */}
      <div className="h-7 px-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-[11px] font-semibold text-slate-600">
        <span className="flex items-center gap-1.5">
          <Eye size={12} className="text-indigo-600" />
          <span>Navigator</span>
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={() => engine?.fitView()}
            title="Fit to Window"
            className="p-1 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Maximize2 size={11} />
          </button>
          <button
            onClick={onClose}
            title="Close Navigator"
            className="p-1 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={11} />
          </button>
        </div>
      </div>

      {/* Mini-map Preview Viewport */}
      <div
        className="relative bg-slate-50/70 overflow-hidden cursor-crosshair"
        style={{ width: BOX_WIDTH, height: BOX_HEIGHT }}
      >
        {/* Rendered SVG Miniature */}
        <div
          ref={svgContainerRef}
          className="absolute inset-0 pointer-events-none [&>svg]:w-full [&>svg]:h-full"
          dangerouslySetInnerHTML={{ __html: svgContent }}
        />

        {/* Draggable Viewport Rect */}
        <div
          onMouseDown={handleBoxMouseDown}
          className={`absolute border-2 border-indigo-600 bg-indigo-500/20 rounded cursor-grab active:cursor-grabbing transition-shadow ${
            isDraggingBox ? 'shadow-md border-indigo-700 ring-2 ring-indigo-400/40' : ''
          }`}
          style={{
            left: viewBoxStyle.left || '0px',
            top: viewBoxStyle.top || '0px',
            width: `calc(100% - ${viewBoxStyle.left || '0px'} - ${viewBoxStyle.right || '0px'})`,
            height: `calc(100% - ${viewBoxStyle.top || '0px'} - ${viewBoxStyle.bottom || '0px'})`,
          }}
        />
      </div>
    </div>
  );
};
