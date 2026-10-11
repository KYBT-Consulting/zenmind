import React, { useEffect, useRef } from 'react';
import { MindMapEngine, MindMapEngineCallbacks } from '../../engine/MindMapEngine';
import { ActiveNodeInfo } from '../../types/mindmap';

interface MindMapCanvasProps {
  onEngineReady: (engine: MindMapEngine) => void;
  onActiveNodeChange: (node: ActiveNodeInfo | null) => void;
  onDataChange: (data: any) => void;
  onScaleChange: (scale: number) => void;
  onHistoryChange: (state: { canUndo: boolean; canRedo: boolean }) => void;
  initialData?: any;
}

export const MindMapCanvas: React.FC<MindMapCanvasProps> = ({
  onEngineReady,
  onActiveNodeChange,
  onDataChange,
  onScaleChange,
  onHistoryChange,
  initialData,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<MindMapEngine | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const callbacks: MindMapEngineCallbacks = {
      onActiveNodeChange,
      onDataChange,
      onScaleChange,
      onHistoryChange,
      onError: (err) => console.error('ZenMind Engine Error:', err),
    };

    const engine = new MindMapEngine(containerRef.current, callbacks, initialData);
    engineRef.current = engine;
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

  return (
    <div
      ref={containerRef}
      className="w-full h-full relative select-none overflow-hidden bg-slate-50 focus:outline-none"
      tabIndex={0}
      id="zenmind-canvas-container"
      style={{ touchAction: 'none' }}
    />
  );
};
