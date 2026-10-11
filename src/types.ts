import { Node, Edge } from '@xyflow/react';

export interface MindMapNodeData extends Record<string, unknown> {
  label: string;
  isRoot?: boolean;
  isCollapsed?: boolean;
  parentId?: string;
  color?: string;
  textColor?: string;
}

export type MindMapNode = Node<MindMapNodeData>;
export type MindMapEdge = Edge;

export interface MindMapState {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export interface HistoryItem {
  nodes: MindMapNode[];
  edges: MindMapEdge[];
}

export const NODE_WIDTH = 150;
export const NODE_HEIGHT = 40;
export const HORIZONTAL_SPACING = 250;
export const VERTICAL_SPACING = 80;
