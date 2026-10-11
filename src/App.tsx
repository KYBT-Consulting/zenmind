import React, { useCallback, useEffect, useState, useRef } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  Background,
  Controls,
  Panel,
  ReactFlowProvider,
  useReactFlow,
  SelectionMode,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import { 
  Plus, 
  Trash2, 
  Undo2, 
  Download, 
  FileJson, 
  FileImage, 
  FileText,
  Keyboard,
  Info,
  Maximize2,
  Save,
  FolderOpen,
  List
} from 'lucide-react';

import { MindMapNode } from './components/MindMapNode';
import { 
  MindMapNodeData, 
  MindMapNode as MindMapNodeType,
  MindMapEdge,
  HORIZONTAL_SPACING,
  VERTICAL_SPACING
} from './types';
import { cn } from './lib/utils';

const nodeTypes = {
  mindmap: MindMapNode,
};

const initialNodes: MindMapNodeType[] = [
  {
    id: 'root',
    type: 'mindmap',
    data: { label: 'New Mind Map', isRoot: true },
    position: { x: 0, y: 0 },
  },
];

const initialEdges: MindMapEdge[] = [];

// Helper to generate IDs
const generateId = () => `node_${Math.random().toString(36).substr(2, 9)}`;

// Helper to get all descendant node IDs
const getAllDescendants = (nodeId: string, nodes: MindMapNodeType[], edges: MindMapEdge[]): string[] => {
  const children = edges.filter((e) => e.source === nodeId).map((e) => e.target);
  let descendants = [...children];
  children.forEach((childId) => {
    descendants = [...descendants, ...getAllDescendants(childId, nodes, edges)];
  });
  return descendants;
};

function MindMap() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [history, setHistory] = useState<{ nodes: MindMapNodeType[]; edges: MindMapEdge[] }[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [importText, setImportText] = useState('');
  const [modalType, setModalType] = useState<'import' | 'export'>('import');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragOffsets = useRef<Record<string, { x: number, y: number }>>({});
  const { screenToFlowPosition, fitView } = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  // Undo implementation
  const saveToHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-20), { nodes: JSON.parse(JSON.stringify(nodes)), edges: JSON.parse(JSON.stringify(edges)) }]);
  }, [nodes, edges]);

  const undo = useCallback(() => {
    if (history.length === 0) return;
    const last = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setNodes(last.nodes);
    setEdges(last.edges);
  }, [history, setNodes, setEdges]);

  // Handle custom node label changes
  useEffect(() => {
    const handleLabelChange = (e: any) => {
      const { id, label } = e.detail;
      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, data: { ...node.data, label } };
          }
          return node;
        })
      );
    };

    window.addEventListener('nodeLabelChange', handleLabelChange);
    
    const handleStyleChange = (e: any) => {
      const { id, color, textColor } = e.detail;
      saveToHistory();
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === id) {
            return { ...node, data: { ...node.data, color, textColor } };
          }
          return node;
        })
      );
    };

    window.addEventListener('nodeStyleChange', handleStyleChange);

    return () => {
      window.removeEventListener('nodeLabelChange', handleLabelChange);
      window.removeEventListener('nodeStyleChange', handleStyleChange);
    };
  }, [saveToHistory, setNodes]);

  const onConnect = useCallback((params: Connection) => setEdges((eds) => addEdge(params, eds)), [setEdges]);

  // Keyboard Shortcuts
  const onKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      const selectedNode = nodes.find((n) => n.selected);

      if (!selectedNode) return;

      // Tab: Create Child
      if (event.key === 'Tab') {
        event.preventDefault();
        saveToHistory();
        const id = generateId();
        
        // Find existing children to calculate Y offset
        const existingChildren = edges.filter(e => e.source === selectedNode.id);
        const yOffset = (existingChildren.length * VERTICAL_SPACING) - ((existingChildren.length * VERTICAL_SPACING) / 2);

        const newNode: MindMapNodeType = {
          id,
          type: 'mindmap',
          data: { label: 'New Child', parentId: selectedNode.id },
          position: {
            x: selectedNode.position.x + HORIZONTAL_SPACING,
            y: selectedNode.position.y + yOffset,
          },
        };
        const newEdge: MindMapEdge = {
          id: `edge_${selectedNode.id}_${id}`,
          source: selectedNode.id,
          target: id,
        };

        setNodes((nds) => nds.concat(newNode).map(n => ({...n, selected: n.id === id})));
        setEdges((eds) => eds.concat(newEdge));
      }

      // Enter: Create Sibling
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        if (selectedNode.data.isRoot) return; // Root has no sibling usually here

        const edgeToParent = edges.find((e) => e.target === selectedNode.id);
        if (!edgeToParent) return;

        saveToHistory();
        const id = generateId();
        const newNode: MindMapNodeType = {
          id,
          type: 'mindmap',
          data: { label: 'New Sibling', parentId: edgeToParent.source },
          position: {
            x: selectedNode.position.x,
            y: selectedNode.position.y + VERTICAL_SPACING,
          },
        };
        const newEdge: MindMapEdge = {
          id: `edge_${edgeToParent.source}_${id}`,
          source: edgeToParent.source,
          target: id,
        };

        setNodes((nds) => nds.concat(newNode).map(n => ({...n, selected: n.id === id})));
        setEdges((eds) => eds.concat(newEdge));
      }

      // Shift+Enter: Collapse/Expand
      if (event.key === 'Enter' && event.shiftKey) {
        event.preventDefault();
        saveToHistory();
        const isCurrentlyCollapsed = !!selectedNode.data.isCollapsed;
        
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === selectedNode.id) {
              return { ...n, data: { ...n.data, isCollapsed: !isCurrentlyCollapsed } };
            }
            return n;
          })
        );

        // We need to recursively hide children. 
        // A simple way is to toggle hidden state on edges and nodes.
        // But for React Flow, it's cleaner to use a "data.hidden" logic or just filter them.
        // For this demo, let's just mark the node data as collapsed and use CSS/Logical filtering if needed.
        // Actually, let's implement a recursive visibility toggle.
      }

      // Ctrl+Z: Undo
      if ((event.ctrlKey || event.metaKey) && event.key === 'z') {
        event.preventDefault();
        undo();
      }

      // Delete: Remove node
      if (event.key === 'Delete' || event.key === 'Backspace') {
        if (selectedNode.data.isRoot) return;
        saveToHistory();
        setNodes((nds) => nds.filter((n) => n.id !== selectedNode.id));
        setEdges((eds) => eds.filter((e) => e.source !== selectedNode.id && e.target !== selectedNode.id));
      }
    },
    [nodes, edges, saveToHistory, setNodes, setEdges, undo]
  );

  useEffect(() => {
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onKeyDown]);

  // Export Logic
  const exportPng = () => {
    if (reactFlowWrapper.current === null) return;
    
    // Fit view first to capture everything
    fitView();
    
    // Wait for fitView to settle
    setTimeout(() => {
      toPng(reactFlowWrapper.current as HTMLElement, {
        backgroundColor: '#f8fafc',
        width: reactFlowWrapper.current?.offsetWidth,
        height: reactFlowWrapper.current?.offsetHeight,
      })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'mind-map.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => {
        console.error('oops, something went wrong!', err);
      });
    }, 100);
  };

  const exportPdf = () => {
    if (reactFlowWrapper.current === null) return;
    
    fitView();
    
    setTimeout(() => {
      toPng(reactFlowWrapper.current as HTMLElement, {
        backgroundColor: '#f8fafc',
      })
      .then((dataUrl) => {
        const doc = new jsPDF('l', 'px', [reactFlowWrapper.current?.offsetWidth || 1200, reactFlowWrapper.current?.offsetHeight || 800]);
        doc.addImage(dataUrl, 'PNG', 0, 0, reactFlowWrapper.current?.offsetWidth || 1200, reactFlowWrapper.current?.offsetHeight || 800);
        doc.save('mind-map.pdf');
      });
    }, 100);
  };

  // File Save/Open Logic
  const saveToFile = () => {
    const data = { nodes, edges };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `mindmap-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const openFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const data = JSON.parse(content);
        if (data.nodes && data.edges) {
          saveToHistory();
          setNodes(data.nodes);
          setEdges(data.edges);
          setTimeout(() => fitView(), 100);
        }
      } catch (err) {
        alert("Could not read mind map file. Please ensure it's a valid JSON.");
      }
    };
    reader.readAsText(file);
    // Reset input so the same file can be selected again
    event.target.value = '';
  };

  // Copy/Paste Logic
  const copyToClipboard = async () => {
    const data = { nodes, edges };
    const json = JSON.stringify(data, null, 2);
    try {
      await navigator.clipboard.writeText(json);
      // Optional: show a toast or brief indicator
    } catch (err) {
      console.warn("Clipboard write failed, showing modal fallback", err);
      setImportText(json);
      setModalType('export');
      setShowImportModal(true);
    }
  };

  const pasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const data = JSON.parse(text);
      if (data.nodes && data.edges) {
        saveToHistory();
        setNodes(data.nodes);
        setEdges(data.edges);
      }
    } catch (e) {
      console.warn("Clipboard read failed or invalid data, showing modal fallback", e);
      setImportText('');
      setModalType('import');
      setShowImportModal(true);
    }
  };

  const handleManualImport = () => {
    try {
      const data = JSON.parse(importText);
      if (data.nodes && data.edges) {
        saveToHistory();
        setNodes(data.nodes);
        setEdges(data.edges);
        setShowImportModal(false);
        setImportText('');
      }
    } catch (e) {
      alert("Invalid Mind Map data. Please check the JSON format.");
    }
  };

  // Filter out collapsed children for rendering
  const getVisibleElements = useCallback(() => {
    const collapsedNodes = new Set<string>();
    nodes.forEach(n => {
      if (n.data.isCollapsed) collapsedNodes.add(n.id);
    });

    const hiddenNodes = new Set<string>();
    
    const findChildren = (parentId: string) => {
      edges.forEach(e => {
        if (e.source === parentId) {
          hiddenNodes.add(e.target);
          findChildren(e.target);
        }
      });
    };

    collapsedNodes.forEach(nodesId => findChildren(nodesId));

    const visibleNodes = nodes.map(n => ({
      ...n,
      hidden: hiddenNodes.has(n.id)
    }));

    const visibleEdges = edges.map(e => ({
      ...e,
      hidden: hiddenNodes.has(e.target) || hiddenNodes.has(e.source)
    }));

    return { visibleNodes, visibleEdges };
  }, [nodes, edges]);

  const { visibleNodes, visibleEdges } = getVisibleElements();

  const onNodeDragStart = useCallback((_: any, node: Node) => {
    // Find all descendants to move them together
    const descendants = getAllDescendants(node.id, nodes, edges);
    const offsets: Record<string, { x: number, y: number }> = {};
    
    descendants.forEach(id => {
      const child = nodes.find(n => n.id === id);
      if (child) {
        offsets[id] = {
          x: child.position.x - node.position.x,
          y: child.position.y - node.position.y
        };
      }
    });
    dragOffsets.current = offsets;
  }, [nodes, edges]);

  const onNodeDrag = useCallback((_: any, node: Node) => {
    const offsets = dragOffsets.current;
    if (Object.keys(offsets).length === 0) return;

    setNodes(nds => nds.map(n => {
      if (offsets[n.id]) {
        return {
          ...n,
          position: {
            x: node.position.x + offsets[n.id].x,
            y: node.position.y + offsets[n.id].y
          }
        };
      }
      return n;
    }));
  }, [setNodes]);

  const onNodeDragStop = useCallback(
    (_: any, draggedNode: Node) => {
      saveToHistory();
      dragOffsets.current = {};

      // Don't allow reparenting the root
      if (draggedNode.id === 'root') return;

      // Check for reparenting: drop the node ON another node to make it a child
      const targetNode = nodes.find(
        (n) => n.id !== draggedNode.id && 
        draggedNode.position.x >= n.position.x &&
        draggedNode.position.x <= n.position.x + 200 &&
        draggedNode.position.y >= n.position.y &&
        draggedNode.position.y <= n.position.y + 80
      );

      if (targetNode && targetNode.id !== (draggedNode.data as any).parentId) {
        // Calculate new automatic position
        const existingChildren = nodes.filter(n => (n.data as any).parentId === targetNode.id);
        const newX = targetNode.position.x + HORIZONTAL_SPACING;
        // If there are children, place it below the last one, otherwise align with parent
        const newY = existingChildren.length > 0 
          ? Math.max(...existingChildren.map(c => c.position.y)) + VERTICAL_SPACING
          : targetNode.position.y;
        
        const deltaX = newX - draggedNode.position.x;
        const deltaY = newY - draggedNode.position.y;
        
        const descendants = getAllDescendants(draggedNode.id, nodes, edges);

        // Update parentId in node data and remove old edge, add new one
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === draggedNode.id) {
              return { 
                ...n, 
                data: { ...n.data, parentId: targetNode.id },
                position: { x: newX, y: newY }
              };
            }
            if (descendants.includes(n.id)) {
              return {
                ...n,
                position: { x: n.position.x + deltaX, y: n.position.y + deltaY }
              };
            }
            return n;
          })
        );

        setEdges((eds) => {
          const filtered = eds.filter((e) => e.target !== draggedNode.id);
          return [
            ...filtered,
            {
              id: `edge_${targetNode.id}_${draggedNode.id}`,
              source: targetNode.id,
              target: draggedNode.id,
            },
          ];
        });
      }
    },
    [nodes, setNodes, setEdges, saveToHistory]
  );

  return (
    <div className="w-full h-screen bg-slate-50 flex flex-col font-sans text-slate-900 overflow-hidden select-none">
      {/* Top Navigation Bar */}
      <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
            <Maximize2 className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-semibold tracking-tight">{nodes.find(n => n.data.isRoot)?.data.label || 'ZenMind Project'}</h1>
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">ZenMind Mind Map</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 rounded-lg p-1 mr-2">
            <button 
              onClick={undo} 
              disabled={history.length === 0}
              className={cn(
                "px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                history.length === 0 ? "text-slate-400 cursor-not-allowed" : "hover:bg-white text-slate-600 hover:text-slate-900 shadow-sm"
              )}
            >
              Undo
            </button>
            <button 
              disabled 
              className="px-3 py-1.5 rounded-md text-xs font-medium text-slate-400 cursor-not-allowed"
            >
              Redo
            </button>
          </div>

          <div className="flex items-center gap-1 mr-4 pr-4 border-r border-slate-200">
            <button 
              onClick={saveToFile}
              title="Save to File"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-all active:scale-95"
            >
              <Save size={18} />
            </button>
            <button 
              onClick={() => fileInputRef.current?.click()}
              title="Open File"
              className="p-2 hover:bg-slate-100 rounded-lg text-slate-600 transition-all active:scale-95"
            >
              <FolderOpen size={18} />
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={openFromFile} 
                accept=".json" 
                className="hidden" 
              />
            </button>
            <button 
              onClick={() => setShowOutline(!showOutline)}
              title="Toggle Outline View"
              className={cn(
                "p-2 rounded-lg transition-all active:scale-95",
                showOutline ? "bg-indigo-50 text-indigo-600" : "hover:bg-slate-100 text-slate-600"
              )}
            >
              <List size={18} />
            </button>
          </div>
          
          {nodes.some(n => n.selected) && (
            <div className="flex items-center gap-1 px-4 border-l border-slate-200">
              {[
                { name: 'Indigo', bg: '#4f46e5', text: '#ffffff' },
                { name: 'Rose', bg: '#e11d48', text: '#ffffff' },
                { name: 'Emerald', bg: '#059669', text: '#ffffff' },
                { name: 'Amber', bg: '#d97706', text: '#ffffff' },
                { name: 'Slate', bg: '#475569', text: '#ffffff' },
                { name: 'White', bg: '#ffffff', text: '#1e293b' },
              ].map((c) => (
                <button
                  key={c.bg}
                  onClick={() => {
                    const selected = nodes.find(n => n.selected);
                    if (selected) {
                      const event = new CustomEvent('nodeStyleChange', { 
                        detail: { 
                          id: selected.id, 
                          color: c.bg, 
                          textColor: c.text 
                        } 
                      });
                      window.dispatchEvent(event);
                    }
                  }}
                  className="w-5 h-5 rounded-full border border-slate-200 hover:scale-125 transition-transform shadow-sm"
                  style={{ backgroundColor: c.bg }}
                  title={c.name}
                />
              ))}
            </div>
          )}

          <div className="flex items-center gap-1">
            <button 
              onClick={exportPng}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-sm transition-all"
            >
              <FileImage size={14} />
              PNG
            </button>
            <button 
              onClick={exportPdf}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-md shadow-indigo-100 transition-all"
            >
              <Download size={14} />
              Export PDF
            </button>
          </div>
        </div>
      </header>

      {/* React Flow Canvas */}
      <main className="flex-1 flex relative bg-[radial-gradient(#e2e8f0_1px,transparent_1px)] [background-size:24px_24px]" ref={reactFlowWrapper}>
        {showOutline && (
          <aside className="w-80 bg-white border-r border-slate-200 flex flex-col z-20 animate-in slide-in-from-left duration-300">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <List size={16} className="text-indigo-600" />
                Outline
              </h2>
              <button 
                onClick={() => setShowOutline(false)}
                className="p-1 hover:bg-slate-100 rounded-md text-slate-400"
              >
                <Plus size={16} className="rotate-45" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <OutlineList 
                nodes={nodes} 
                onSelect={(id) => {
                  setNodes(nds => nds.map(n => ({ ...n, selected: n.id === id })));
                  const node = nodes.find(n => n.id === id);
                  if (node) {
                    const { x, y } = node.position;
                    // Need to access instance to zoom? For now just select.
                  }
                }} 
              />
            </div>
          </aside>
        )}
        
        <div className="flex-1 relative">
          <ReactFlow
          nodes={visibleNodes}
          edges={visibleEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStart={onNodeDragStart}
          onNodeDrag={onNodeDrag}
          onNodeDragStop={onNodeDragStop}
          nodeTypes={nodeTypes}
          selectionMode={SelectionMode.Partial}
          fitView
          snapToGrid
          snapGrid={[12, 12]}
          nodeDragThreshold={5}
          defaultEdgeOptions={{
            type: 'smoothstep',
            animated: true,
            style: { stroke: '#4f46e5', strokeWidth: 2, opacity: 0.8 },
          }}
        >
          <Controls showInteractive={false} className="bg-white border-slate-200 shadow-lg rounded-xl overflow-hidden" />
        </ReactFlow>
</div>

        {/* Keyboard Help Panel */}
        <div className="absolute bottom-8 left-8 bg-white/90 backdrop-blur-md border border-slate-200 p-4 rounded-2xl shadow-2xl w-64 z-10">
          <div className="flex items-center justify-between mb-3 text-slate-400">
            <h4 className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2">
              <Keyboard size={12} />
              Hotkeys
            </h4>
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_8px_rgba(34,197,94,0.6)]"></div>
          </div>
          <div className="space-y-3">
            <HotkeyRow label="New Child" keycap="Tab" />
            <HotkeyRow label="New Sibling" keycap="Enter" />
            <HotkeyRow label="Collapse Node" keycap="Shift + Enter" />
            <HotkeyRow label="Undo Move" keycap="Ctrl + Z" />
          </div>
        </div>

        {/* Action Tooltip */}
        <Panel position="bottom-right" className="m-4">
           <div className="flex gap-2">
            <button onClick={copyToClipboard} className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:bg-white transition-colors">
              <FileJson size={14} className="text-indigo-500" />
              Copy JSON
            </button>
            <button onClick={pasteFromClipboard} className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl shadow-lg border border-slate-200 flex items-center gap-2 text-xs font-semibold text-slate-600 hover:bg-white transition-colors">
              <Plus size={14} className="text-indigo-500" />
              Paste JSON
            </button>
          </div>
        </Panel>
      </main>

      {/* Footer Status Bar */}
      <footer className="h-8 bg-white border-t border-slate-200 px-6 flex items-center justify-between text-[10px] text-slate-400 font-medium">
        <div className="flex gap-6 uppercase tracking-wider">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
            {nodes.length} Nodes
          </span>
          <span>{edges.length} Connections</span>
          <span className="text-green-500">Cloud Sync: Ready</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="hover:text-slate-600 cursor-pointer">Keyboard Settings</span>
          <span className="hover:text-slate-600 cursor-pointer">Shortcuts Map</span>
          <span className="hover:text-slate-600 cursor-pointer font-bold text-slate-500">v1.2.0</span>
        </div>
      </footer>

      {/* Import/Export Modal Fallback */}
      {showImportModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-800">
                  {modalType === 'import' ? 'Import Mind Map' : 'Export Mind Map Data'}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  {modalType === 'import' 
                    ? 'Paste your ZenMind JSON data below to load your project.' 
                    : 'The Clipboard API is restricted in this view. Please copy the data below manually.'}
                </p>
              </div>
              <button 
                onClick={() => setShowImportModal(false)}
                className="p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <Plus size={20} className="text-slate-400 rotate-45" />
              </button>
            </div>
            
            <div className="p-6">
              <textarea
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                readOnly={modalType === 'export'}
                placeholder='{"nodes": [...], "edges": [...]}'
                className="w-full h-64 bg-slate-50 border border-slate-200 rounded-2xl p-4 font-mono text-xs focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none transition-all"
              />
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button 
                onClick={() => setShowImportModal(false)}
                className="px-6 py-2 rounded-xl text-sm font-semibold text-slate-600 hover:bg-slate-100 transition-all"
              >
                Cancel
              </button>
              {modalType === 'import' ? (
                <button 
                  onClick={handleManualImport}
                  className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 transition-all"
                >
                  Import Data
                </button>
              ) : (
                <button 
                  onClick={() => {
                    const el = document.createElement('textarea');
                    el.value = importText;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    alert("Copied to clipboard using fallback method!");
                    setShowImportModal(false);
                  }}
                  className="px-8 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-indigo-100 transition-all"
                >
                  Copy to Clipboard
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function HotkeyRow({ label, keycap }: { label: string, keycap: string }) {
  return (
    <div className="flex justify-between items-center text-xs">
      <span className="text-slate-600">{label}</span>
      <kbd className="px-2 py-1 bg-slate-50 border border-slate-200 rounded text-[9px] font-mono shadow-sm font-bold text-slate-500">{keycap}</kbd>
    </div>
  );
}

interface OutlineNodeProps {
  key?: string | number;
  node: MindMapNodeType;
  nodes: MindMapNodeType[];
  depth: number;
  onSelect: (id: string) => void;
}

function OutlineList({ nodes, onSelect }: { nodes: MindMapNodeType[], onSelect: (id: string) => void }) {
  const rootNode = nodes.find(n => n.data.isRoot);
  if (!rootNode) return null;

  return (
    <div className="space-y-1">
      <OutlineNode node={rootNode} nodes={nodes} depth={0} onSelect={onSelect} />
    </div>
  );
}

function OutlineNode({ node, nodes, depth, onSelect }: OutlineNodeProps) {
  const children = nodes.filter(n => n.data.parentId === node.id);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="select-none">
      <div 
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors group",
          node.selected ? "bg-indigo-50 text-indigo-700" : "hover:bg-slate-50 text-slate-600"
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
        onClick={() => onSelect(node.id)}
      >
        {children.length > 0 ? (
          <button 
            onClick={(e) => {
              e.stopPropagation();
              setIsExpanded(!isExpanded);
            }}
            className="p-0.5 hover:bg-slate-200 rounded text-slate-400 group-hover:text-slate-600"
          >
            <Plus size={10} className={cn("transition-transform", isExpanded && "rotate-45")} />
          </button>
        ) : (
          <div className="w-3" />
        )}
        <span className={cn("text-xs truncate", node.data.isRoot ? "font-bold" : "font-medium")}>
          {node.data.label}
        </span>
      </div>
      
      {isExpanded && children.length > 0 && (
        <div className="mt-0.5">
          {children.map(child => (
            <OutlineNode key={child.id} node={child} nodes={nodes} depth={depth + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <ReactFlowProvider>
      <MindMap />
    </ReactFlowProvider>
  );
}
