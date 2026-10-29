import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  MindMapEngine,
  MindMapEngineCallbacks,
  ContextMenuEventInfo,
} from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';

interface MindMapCanvasProps {
  onEngineReady: (engine: MindMapEngine) => void;
  onFirstRender?: (engine: MindMapEngine) => void;
  onActiveNodeChange: (node: ActiveNodeInfo | null) => void;
  onDataChange: (data: any) => void;
  onScaleChange: (scale: number) => void;
  onHistoryChange: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onFormatPainterChange?: (isActive: boolean) => void;
  onPresentationModeChange?: (isActive: boolean) => void;
  onContextMenu?: (event: ContextMenuEventInfo) => void;
  isFormatPainterActive?: boolean;
  initialData?: any;
  isActive?: boolean;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  onEngineReady,
  onFirstRender,
  onActiveNodeChange,
  onDataChange,
  onScaleChange,
  onHistoryChange,
  onFormatPainterChange,
  onPresentationModeChange,
  onContextMenu,
  isFormatPainterActive = false,
  initialData,
  isActive = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MindMapEngine | null>(null);

  // Spacebar quick-pan state
  const isSpacePressedRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef({ x: 0, y: 0 });
  const [cursorStyle, setCursorStyle] = useState<string>('default');

  useEffect(() => {
    if (!containerRef.current) return;

    const callbacks: MindMapEngineCallbacks = {
      onActiveNodeChange,
      onDataChange,
      onScaleChange,
      onHistoryChange,
      onFormatPainterChange,
      onPresentationModeChange,
      onContextMenu,
      onFirstRender,
      onError: (err) => console.error('ZenMind Engine Error:', err),
    };

    const engine = new MindMapEngine(containerRef.current, callbacks, initialData);
    engineRef.current = engine;
    engine.setActive(isActive);
    onEngineReady(engine);

    const resizeObserver = new ResizeObserver(() => {
      engine.resize();
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      engine.destroy();
      engineRef.current = null;
    };
  }, []);

  // Tabs stay mounted; only the active one takes keyboard shortcuts and needs a re-measure on show
  const wasActiveRef = useRef(isActive);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.setActive(isActive);
    const justActivated = isActive && !wasActiveRef.current;
    wasActiveRef.current = isActive;
    if (justActivated) {
      engine.resize();
      // Only take focus if nothing else (an input, a dialog) has it
      if (document.activeElement === document.body || document.activeElement === null) {
        containerRef.current?.focus();
      }
    }
  }, [isActive]);

  // Update cursor when Format Painter is active
  useEffect(() => {
    if (isFormatPainterActive) {
      setCursorStyle('copy');
    } else if (!isSpacePressedRef.current && !isPanningRef.current) {
      setCursorStyle('default');
    }
  }, [isFormatPainterActive]);

  // Prevent whole-app browser/WebView pinch-zoom and route trackpad pinch gestures to the active canvas
  useEffect(() => {
    if (!isActive) return;

    let pinchStartScale: number | null = null;

    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        // If wheel event originated outside the mind map container (which already stops propagation),
        // route the zoom directly to the canvas engine.
        if (engineRef.current && containerRef.current && !containerRef.current.contains(e.target as Node)) {
          engineRef.current.zoomByWheelDelta(e.deltaY, e.clientX, e.clientY);
        }
      }
    };

    const handleGestureStart = (e: any) => {
      e.preventDefault();
      if (engineRef.current) {
        pinchStartScale = engineRef.current.getViewTransform().scale;
      }
    };

    const handleGestureChange = (e: any) => {
      e.preventDefault();
      if (engineRef.current && typeof e.scale === 'number') {
        const baseScale = pinchStartScale ?? engineRef.current.getViewTransform().scale;
        engineRef.current.setZoomAt(baseScale * e.scale, e.clientX, e.clientY);
      }
    };

    const handleGestureEnd = (e: any) => {
      e.preventDefault();
      pinchStartScale = null;
    };

    const handleNativeTrackpadPinch = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      if (!detail || !engineRef.current) return;
      if (detail.phase === 'begin') {
        pinchStartScale = engineRef.current.getViewTransform().scale;
      } else if (detail.phase === 'change' && typeof detail.scale === 'number') {
        const baseScale = pinchStartScale ?? engineRef.current.getViewTransform().scale;
        engineRef.current.setZoomAt(baseScale * detail.scale, detail.clientX, detail.clientY);
      } else if (detail.phase === 'end') {
        pinchStartScale = null;
      }
    };

    window.addEventListener('wheel', handleWheel, { passive: false });
    window.addEventListener('gesturestart', handleGestureStart, { passive: false });
    window.addEventListener('gesturechange', handleGestureChange, { passive: false });
    window.addEventListener('gestureend', handleGestureEnd, { passive: false });
    window.addEventListener('zenmind:trackpad-pinch', handleNativeTrackpadPinch);

    return () => {
      window.removeEventListener('wheel', handleWheel);
      window.removeEventListener('gesturestart', handleGestureStart);
      window.removeEventListener('gesturechange', handleGestureChange);
      window.removeEventListener('gestureend', handleGestureEnd);
      window.removeEventListener('zenmind:trackpad-pinch', handleNativeTrackpadPinch);
    };
  }, [isActive]);

  // Spacebar Quick-Pan listeners
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.code === 'Space' && !isSpacePressedRef.current) {
        e.preventDefault();
        isSpacePressedRef.current = true;
        setCursorStyle('grab');
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpacePressedRef.current = false;
        if (!isPanningRef.current) {
          setCursorStyle(isFormatPainterActive ? 'copy' : 'default');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isFormatPainterActive]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    // If Space is held down or Middle mouse click (button === 1), start canvas pan
    if (isSpacePressedRef.current || e.button === 1) {
      e.preventDefault();
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      setCursorStyle('grabbing');
    }
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanningRef.current && engineRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      engineRef.current.panBy(dx, dy);
      panStartRef.current = { x: e.clientX, y: e.clientY };
    }
  }, []);

  const handleMouseUp = useCallback(() => {
    if (isPanningRef.current) {
      isPanningRef.current = false;
      setCursorStyle(isSpacePressedRef.current ? 'grab' : isFormatPainterActive ? 'copy' : 'default');
    }
  }, [isFormatPainterActive]);

  // Double click on empty canvas area spawns an independent floating topic at mouse coordinates
  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    // Check if clicked directly on canvas background (svg container or root element)
    const isBackground =
      target === containerRef.current ||
      target.tagName.toLowerCase() === 'svg' ||
      target.classList.contains('mindMapContainer') ||
      target.id === 'zenmind-canvas-container';

    if (isBackground && engineRef.current) {
      const pos = engineRef.current.screenToCanvasPos(e.clientX, e.clientY);
      engineRef.current.insertFloatingNode('Floating Idea', pos);
    }
  }, []);

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => e.preventDefault()}
      className="w-full h-full relative select-none overflow-hidden bg-slate-50 focus:outline-none"
      tabIndex={0}
      id="zenmind-canvas-container"
      style={{
        touchAction: 'none',
        cursor: cursorStyle,
      }}
    />
  );
};
