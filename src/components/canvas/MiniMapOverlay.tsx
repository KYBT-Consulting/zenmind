import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Eye, EyeOff, Maximize2, X } from 'lucide-react';
import { MindMapEngine } from '../../engine/MindMapEngine';

interface MiniMapOverlayProps {
  engine: MindMapEngine | null;
  isOpen: boolean;
  onClose: () => void;
}

/**
 * The library's minimap SVG has pixel width/height but no viewBox, so CSS scaling would only crop
 * it. Derive a viewBox from the size so the whole map is scaled to fit.
 */
function withViewBox(svgHtml: string): string {
  return svgHtml.replace(/<svg\b([^>]*)>/i, (tag, attrs: string) => {
    if (/\bviewBox=/i.test(attrs)) return tag;
    const w = /\bwidth="([\d.]+)(?:px)?"/i.exec(attrs)?.[1];
    const h = /\bheight="([\d.]+)(?:px)?"/i.exec(attrs)?.[1];
    return w && h ? `<svg${attrs} viewBox="0 0 ${w} ${h}" preserveAspectRatio="none">` : tag;
  });
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
  // Where the map preview sits inside the box: the viewport-box maths assumes it is centred at
  // its own aspect ratio (not stretched over the whole box).
  const [svgBox, setSvgBox] = useState({ left: 0, top: 0, width: BOX_WIDTH, height: BOX_HEIGHT });
  const [isDraggingBox, setIsDraggingBox] = useState(false);

  const updateMiniMap = useCallback(() => {
    if (!engine || !isOpen) return;
    try {
      const res = engine.calculateMiniMap(BOX_WIDTH, BOX_HEIGHT);
      if (res) {
        if (res.svgHTML) {
          setSvgContent(withViewBox(res.svgHTML));
        }
        if (res.viewBoxStyle) {
          setViewBoxStyle(res.viewBoxStyle);
        }
        if (Number.isFinite(res.miniMapBoxLeft) && Number.isFinite(res.miniMapBoxTop)) {
          setSvgBox({
            left: res.miniMapBoxLeft,
            top: res.miniMapBoxTop,
            width: Math.max(1, BOX_WIDTH - 2 * res.miniMapBoxLeft),
            height: Math.max(1, BOX_HEIGHT - 2 * res.miniMapBoxTop),
          });
        }
      }
    } catch (err) {
      // Ignore during rapid canvas transition
    }
  }, [engine, isOpen]);

  // Redraw when the map or the view changes (coalesced), instead of polling on a timer
  useEffect(() => {
    if (!isOpen || !engine) return;

    updateMiniMap();
    let pending: ReturnType<typeof setTimeout> | null = null;
    const schedule = () => {
      if (pending) return;
      pending = setTimeout(() => {
        pending = null;
        updateMiniMap();
      }, 120);
    };
    const unsubscribe = engine.onMapChange(schedule);
    return () => {
      unsubscribe();
      if (pending) clearTimeout(pending);
    };
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
          <button aria-label="Fit to Window"
            onClick={() => engine?.fitView()}
            title="Fit to Window"
            className="p-1 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Maximize2 size={11} />
          </button>
          <button aria-label="Close Navigator"
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
          className="absolute pointer-events-none [&>svg]:w-full [&>svg]:h-full"
          style={svgBox}
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
