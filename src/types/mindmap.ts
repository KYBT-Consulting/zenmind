export type LayoutType =
  | 'mindMap'
  | 'logicalStructure'
  | 'logicalStructureLeft'
  | 'organizationStructure'
  | 'catalogOrganization'
  | 'timeline'
  | 'timeline2'
  | 'verticalTimeline'
  | 'verticalTimeline2'
  | 'fishbone'
  | 'fishbone2';

export interface LayoutOption {
  id: LayoutType;
  name: string;
  category: 'Standard' | 'Structure' | 'Timeline' | 'Fishbone';
  description: string;
}

export const LAYOUT_OPTIONS: LayoutOption[] = [
  { id: 'mindMap', name: 'Mind Map (Radial)', category: 'Standard', description: 'Branches radiate outwards to both left and right' },
  { id: 'logicalStructure', name: 'Logic Chart (Right)', category: 'Standard', description: 'Hierarchical tree expanding to the right' },
  { id: 'logicalStructureLeft', name: 'Logic Chart (Left)', category: 'Standard', description: 'Hierarchical tree expanding to the left' },
  { id: 'organizationStructure', name: 'Org Chart (Down)', category: 'Structure', description: 'Top-down organizational hierarchy' },
  { id: 'catalogOrganization', name: 'Catalog Tree', category: 'Structure', description: 'Indented list style tree structure' },
  { id: 'timeline', name: 'Timeline (Horizontal)', category: 'Timeline', description: 'Sequential chronological milestone tree' },
  { id: 'timeline2', name: 'Timeline (Alternating)', category: 'Timeline', description: 'Milestones alternating above and below the axis' },
  { id: 'verticalTimeline', name: 'Vertical Timeline', category: 'Timeline', description: 'Downward vertical flow of events' },
  { id: 'fishbone', name: 'Fishbone Diagram (Left)', category: 'Fishbone', description: 'Ishikawa cause and effect diagram' },
  { id: 'fishbone2', name: 'Fishbone Diagram (Right)', category: 'Fishbone', description: 'Ishikawa cause and effect facing right' },
];

export type ShapeType =
  | 'rectangle'
  | 'roundedRectangle'
  | 'ellipse'
  | 'diamond'
  | 'parallelogram'
  | 'octagonalRectangle'
  | 'outerTriangularRectangle'
  | 'circle';

export interface ShapeOption {
  id: ShapeType;
  name: string;
}

export const SHAPE_OPTIONS: ShapeOption[] = [
  { id: 'roundedRectangle', name: 'Rounded Rectangle' },
  { id: 'rectangle', name: 'Rectangle' },
  { id: 'ellipse', name: 'Oval / Ellipse' },
  { id: 'diamond', name: 'Diamond' },
  { id: 'parallelogram', name: 'Parallelogram' },
  { id: 'octagonalRectangle', name: 'Octagon' },
  { id: 'outerTriangularRectangle', name: 'Tag / Triangular' },
  { id: 'circle', name: 'Circle' },
];

export type BranchLineStyle = 'curve' | 'straight' | 'direct';

export interface ThemePreset {
  id: string;
  name: string;
  previewBg: string;
  previewColor: string;
  previewLine: string;
  config: Record<string, any>;
}

export const THEME_PRESETS: ThemePreset[] = [
  {
    id: 'ocean-breeze',
    name: 'Ocean Breeze',
    previewBg: '#f8fafc',
    previewColor: '#0284c7',
    previewLine: '#0284c7',
    config: {
      backgroundColor: '#f8fafc',
      lineColor: '#0284c7',
      lineStyle: 'curve',
      root: {
        fillColor: '#0284c7',
        color: '#ffffff',
        borderColor: '#0369a1',
        borderWidth: 2,
        fontSize: 18,
        fontWeight: 'bold',
        shape: 'roundedRectangle',
        paddingX: 24,
        paddingY: 12,
      },
      second: {
        fillColor: '#ffffff',
        color: '#0f172a',
        borderColor: '#38bdf8',
        borderWidth: 2,
        fontSize: 14,
        fontWeight: '600',
        shape: 'roundedRectangle',
        paddingX: 16,
        paddingY: 8,
      },
      node: {
        fillColor: '#f0f9ff',
        color: '#0369a1',
        borderColor: '#bae6fd',
        borderWidth: 1,
        fontSize: 12,
        shape: 'roundedRectangle',
        paddingX: 12,
        paddingY: 6,
      },
    },
  },
  {
    id: 'emerald-focus',
    name: 'Emerald Focus',
    previewBg: '#fcfdfa',
    previewColor: '#059669',
    previewLine: '#059669',
    config: {
      backgroundColor: '#fcfdfa',
      lineColor: '#059669',
      lineStyle: 'curve',
      root: {
        fillColor: '#059669',
        color: '#ffffff',
        borderColor: '#047857',
        borderWidth: 2,
        fontSize: 18,
        fontWeight: 'bold',
        shape: 'roundedRectangle',
        paddingX: 24,
        paddingY: 12,
      },
      second: {
        fillColor: '#ffffff',
        color: '#064e3b',
        borderColor: '#34d399',
        borderWidth: 2,
        fontSize: 14,
        fontWeight: '600',
        shape: 'roundedRectangle',
        paddingX: 16,
        paddingY: 8,
      },
      node: {
        fillColor: '#ecfdf5',
        color: '#065f46',
        borderColor: '#a7f3d0',
        borderWidth: 1,
        fontSize: 12,
        shape: 'roundedRectangle',
        paddingX: 12,
        paddingY: 6,
      },
    },
  },
  {
    id: 'violet-creativity',
    name: 'Violet Creative',
    previewBg: '#faf5ff',
    previewColor: '#7c3aed',
    previewLine: '#7c3aed',
    config: {
      backgroundColor: '#faf5ff',
      lineColor: '#7c3aed',
      lineStyle: 'curve',
      root: {
        fillColor: '#7c3aed',
        color: '#ffffff',
        borderColor: '#6d28d9',
        borderWidth: 2,
        fontSize: 18,
        fontWeight: 'bold',
        shape: 'roundedRectangle',
        paddingX: 24,
        paddingY: 12,
      },
      second: {
        fillColor: '#ffffff',
        color: '#4c1d95',
        borderColor: '#c084fc',
        borderWidth: 2,
        fontSize: 14,
        fontWeight: '600',
        shape: 'roundedRectangle',
        paddingX: 16,
        paddingY: 8,
      },
      node: {
        fillColor: '#f5f3ff',
        color: '#5b21b6',
        borderColor: '#ddd6fe',
        borderWidth: 1,
        fontSize: 12,
        shape: 'roundedRectangle',
        paddingX: 12,
        paddingY: 6,
      },
    },
  },
  {
    id: 'graphite-minimal',
    name: 'Graphite Minimal',
    previewBg: '#ffffff',
    previewColor: '#1e293b',
    previewLine: '#64748b',
    config: {
      backgroundColor: '#ffffff',
      lineColor: '#64748b',
      lineStyle: 'straight',
      root: {
        fillColor: '#0f172a',
        color: '#ffffff',
        borderColor: '#334155',
        borderWidth: 2,
        fontSize: 18,
        fontWeight: 'bold',
        shape: 'roundedRectangle',
        paddingX: 24,
        paddingY: 12,
      },
      second: {
        fillColor: '#f8fafc',
        color: '#0f172a',
        borderColor: '#cbd5e1',
        borderWidth: 1.5,
        fontSize: 14,
        fontWeight: '600',
        shape: 'roundedRectangle',
        paddingX: 16,
        paddingY: 8,
      },
      node: {
        fillColor: '#ffffff',
        color: '#334155',
        borderColor: '#e2e8f0',
        borderWidth: 1,
        fontSize: 12,
        shape: 'roundedRectangle',
        paddingX: 12,
        paddingY: 6,
      },
    },
  },
  {
    id: 'solar-warmth',
    name: 'Solar Warmth',
    previewBg: '#fffbeb',
    previewColor: '#d97706',
    previewLine: '#d97706',
    config: {
      backgroundColor: '#fffbeb',
      lineColor: '#d97706',
      lineStyle: 'curve',
      root: {
        fillColor: '#d97706',
        color: '#ffffff',
        borderColor: '#b45309',
        borderWidth: 2,
        fontSize: 18,
        fontWeight: 'bold',
        shape: 'roundedRectangle',
        paddingX: 24,
        paddingY: 12,
      },
      second: {
        fillColor: '#ffffff',
        color: '#78350f',
        borderColor: '#fcd34d',
        borderWidth: 2,
        fontSize: 14,
        fontWeight: '600',
        shape: 'roundedRectangle',
        paddingX: 16,
        paddingY: 8,
      },
      node: {
        fillColor: '#fef3c7',
        color: '#92400e',
        borderColor: '#fde68a',
        borderWidth: 1,
        fontSize: 12,
        shape: 'roundedRectangle',
        paddingX: 12,
        paddingY: 6,
      },
    },
  },
];

export interface ActiveNodeInfo {
  uid: string;
  text: string;
  isRoot: boolean;
  shape?: ShapeType;
  fillColor?: string;
  color?: string;
  borderColor?: string;
  borderWidth?: number;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  note?: string;
  hyperlink?: string;
  tag?: string[];
  icon?: string[];
  customLeft?: number;
  customTop?: number;
  rect?: { left: number; top: number; width: number; height: number };
}

export type PriorityLevel = 1 | 2 | 3 | 4 | 5;
export type ProgressLevel = 0 | 25 | 50 | 75 | 100;

export interface MindMapExportOptions {
  filename?: string;
  format: 'png' | 'svg' | 'pdf' | 'json' | 'md' | 'xmind';
  transparent?: boolean;
}

