import React, { useState, useEffect, useRef } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { cn } from '@/src/lib/utils';
import { MindMapNode as MindMapNodeType } from '@/src/types';

export const MindMapNode = ({ data, selected, id }: NodeProps<MindMapNodeType>) => {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState(data.label);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setValue(data.label);
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const onDoubleClick = () => {
    setIsEditing(true);
  };

  const onBlur = () => {
    setIsEditing(false);
    if (value !== data.label) {
      // In a real app, we'd trigger a state update here. 
      // But we'll handle the global state update in the parent.
      // For now, we'll use a custom event or let the parent handle it via node data changes.
      const event = new CustomEvent('nodeLabelChange', { detail: { id, label: value } });
      window.dispatchEvent(event);
    }
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onBlur();
    }
    if (e.key === 'Escape') {
      setValue(data.label);
      setIsEditing(false);
    }
    // Prevent Tab from leaving the input if we want to handle it for child creation
    // However, usually we want Enter/Escape to commit.
    // We'll let the global handler catch Tab if the node is selected but not editing.
    // If editing, Tab should probably also commit.
    if (e.key === 'Tab') {
      onBlur();
    }
  };

  return (
    <div
      className={cn(
        "transition-all duration-300 min-w-[140px] text-center group relative",
        // Root Node Style
        data.isRoot && !data.color && "px-8 py-5 bg-indigo-600 text-white rounded-2xl shadow-xl shadow-indigo-200 ring-4 ring-white z-10 font-bold",
        data.isRoot && data.color && "px-8 py-5 rounded-2xl shadow-xl ring-4 ring-white z-10 font-bold",
        // Branch Node Style (has children)
        !data.isRoot && data.parentId === 'root' && !data.color && "px-6 py-4 bg-white border-2 border-indigo-100 rounded-xl shadow-sm text-slate-800 font-bold text-sm",
        !data.isRoot && data.parentId === 'root' && data.color && "px-6 py-4 border-2 rounded-xl shadow-sm font-bold text-sm",
        // Leaf Node Style
        !data.isRoot && data.parentId !== 'root' && !data.color && "px-4 py-2 bg-indigo-50 border border-indigo-100 rounded-lg text-indigo-700 font-medium text-xs",
        !data.isRoot && data.parentId !== 'root' && data.color && "px-4 py-2 border rounded-lg font-medium text-xs",
        // Selection State
        selected && !data.isRoot && "ring-2 ring-indigo-500 ring-offset-4 shadow-lg scale-105",
        selected && data.isRoot && "ring-4 ring-indigo-300 scale-105",
        // Collapsed indicator
        data.isCollapsed && !data.isRoot && "after:content-['+'] after:absolute after:-bottom-2 after:left-1/2 after:-translate-x-1/2 after:bg-indigo-600 after:text-white after:rounded-full after:w-5 after:h-5 after:flex after:items-center after:justify-center after:text-[12px] after:font-bold after:shadow-lg after:border-2 after:border-white"
      )}
      style={{ 
        backgroundColor: data.color, 
        color: data.textColor,
        borderColor: data.color ? 'transparent' : undefined 
      }}
      onDoubleClick={onDoubleClick}
      id={id}
    >
      <Handle type="target" position={Position.Left} className="opacity-0 group-hover:opacity-100 !bg-indigo-400 !border-white" />
      
      {data.isRoot && <span className="text-[10px] font-bold opacity-60 block uppercase tracking-wider mb-1">Project Goal</span>}
      
      {isEditing ? (
        <input
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={onBlur}
          onKeyDown={onKeyDown}
          className="bg-transparent border-none outline-none text-center w-full focus:ring-0 p-0 font-inherit"
        />
      ) : (
        <div className="truncate max-w-[200px] select-none">
          {data.label}
        </div>
      )}

      <Handle type="source" position={Position.Right} className="opacity-0 group-hover:opacity-100 !bg-indigo-400 !border-white" />
    </div>
  );
};
