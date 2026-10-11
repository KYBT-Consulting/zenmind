import MindMap from 'simple-mind-map';
import {
  ActiveNodeInfo,
  BranchLineStyle,
  LayoutType,
  ShapeType,
  THEME_PRESETS,
} from '../types/mindmap';

export interface MindMapEngineCallbacks {
  onActiveNodeChange?: (node: ActiveNodeInfo | null) => void;
  onDataChange?: (data: any) => void;
  onScaleChange?: (scale: number) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onError?: (error: any) => void;
}

export const DEFAULT_INITIAL_DATA = {
  data: {
    text: 'Central Topic',
    expand: true,
  },
  children: [
    {
      data: {
        text: 'Core Goals',
        expand: true,
      },
      children: [
        { data: { text: 'Performance & Speed' } },
        { data: { text: 'Cross-platform Simplicity' } },
      ],
    },
    {
      data: {
        text: 'Key Features',
        expand: true,
      },
      children: [
        { data: { text: 'EdrawMind-style Ribbon' } },
        { data: { text: 'Outline & Canvas Sync' } },
        { data: { text: 'AI Idea Generation' } },
      ],
    },
    {
      data: {
        text: 'Target Platforms',
        expand: true,
      },
      children: [
        { data: { text: 'Linux Desktop' } },
        { data: { text: 'Windows Desktop' } },
        { data: { text: 'macOS (via CI/CD)' } },
        { data: { text: 'Mobile & Web PWA' } },
      ],
    },
  ],
};

export class MindMapEngine {
  private mindMap: MindMap | null = null;
  private container: HTMLElement;
  private callbacks: MindMapEngineCallbacks;
  private currentLayout: LayoutType = 'mindMap';
  private currentThemeId: string = 'ocean-breeze';
  private rainbowLinesEnabled: boolean = true;

  constructor(container: HTMLElement, callbacks: MindMapEngineCallbacks = {}, initialData?: any) {
    this.container = container;
    this.callbacks = callbacks;
    this.init(initialData || DEFAULT_INITIAL_DATA);
  }

  private init(data: any) {
    const initialTheme = THEME_PRESETS[0];

    this.mindMap = new MindMap({
      el: this.container,
      data,
      layout: this.currentLayout,
      theme: 'default',
      themeConfig: initialTheme.config,
      defaultInsertSecondLevelNodeText: 'Main Topic',
      defaultInsertBelowSecondLevelNodeText: 'Subtopic',
      defaultGeneralizationText: 'Summary',
      fitPadding: 60,
      scaleRatio: 0.15,
      minZoomRatio: 20,
      maxZoomRatio: 400,
      textAutoWrapWidth: 400,
      isShowCreateChildBtnIcon: true,
      enableCtrlKeyNodeSelection: true,
      enableDragModifyNodeWidth: true,
      errorHandler: (code: string, err: any) => {
        console.error('MindMap error:', code, err);
        this.callbacks.onError?.({ code, err });
      },
    });

    this.bindEvents();

    // Trigger initial scale and layout fit
    setTimeout(() => {
      this.fitView();
      if (this.callbacks.onScaleChange && this.mindMap?.view) {
        this.callbacks.onScaleChange(Math.round(this.mindMap.view.scale * 100));
      }
    }, 150);
  }

  private bindEvents() {
    if (!this.mindMap) return;

    // Node active change
    this.mindMap.on('node_active', (node: any, activeList: any[]) => {
      if (!node || !activeList || activeList.length === 0) {
        this.callbacks.onActiveNodeChange?.(null);
        return;
      }
      this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(node));
    });

    // Node click/body click clears active
    this.mindMap.on('draw_click', () => {
      if (this.mindMap?.renderer?.activeNodeList?.length === 0) {
        this.callbacks.onActiveNodeChange?.(null);
      }
    });

    // Data changes
    this.mindMap.on('data_change', (data: any) => {
      this.callbacks.onDataChange?.(data);
    });

    // Zoom/scale changes
    this.mindMap.on('scale', (scale: number) => {
      this.callbacks.onScaleChange?.(Math.round(scale * 100));
    });

    // History changes (undo/redo)
    this.mindMap.on('back_forward', (index: number, length: number) => {
      this.callbacks.onHistoryChange?.({
        canUndo: index > 0,
        canRedo: index < length - 1,
      });
    });
  }

  private extractActiveNodeInfo(node: any): ActiveNodeInfo {
    const data = node.nodeData?.data || {};
    let rect;
    try {
      rect = node.getRect?.();
    } catch {
      rect = undefined;
    }

    return {
      uid: node.uid,
      text: data.text || '',
      isRoot: !!node.isRoot,
      shape: data.shape || node.getStyle?.('shape') || 'roundedRectangle',
      fillColor: data.fillColor || node.getStyle?.('fillColor'),
      color: data.color || node.getStyle?.('color'),
      borderColor: data.borderColor || node.getStyle?.('borderColor'),
      borderWidth: data.borderWidth || node.getStyle?.('borderWidth'),
      fontSize: data.fontSize || node.getStyle?.('fontSize'),
      fontFamily: data.fontFamily || node.getStyle?.('fontFamily'),
      fontWeight: data.fontWeight || node.getStyle?.('fontWeight'),
      fontStyle: data.fontStyle || node.getStyle?.('fontStyle'),
      note: data.note || '',
      hyperlink: data.hyperlink || '',
      tag: data.tag || [],
      rect,
    };
  }

  // --- Node Operations ---

  insertChildNode() {
    this.mindMap?.execCommand('INSERT_CHILD_NODE');
  }

  insertSiblingNode() {
    this.mindMap?.execCommand('INSERT_NODE');
  }

  insertParentNode() {
    this.mindMap?.execCommand('INSERT_PARENT_NODE');
  }

  deleteNode() {
    this.mindMap?.execCommand('REMOVE_NODE');
  }

  addSummary(text: string = 'Summary') {
    this.mindMap?.execCommand('ADD_GENERALIZATION', { text });
  }

  addBoundary() {
    this.mindMap?.execCommand('ADD_OUTER_FRAME');
  }

  addRelationship() {
    this.mindMap?.execCommand('ADD_ASSOCIATIVE_LINE');
  }

  // --- Styling & Properties ---

  setNodeText(text: string) {
    this.mindMap?.execCommand('SET_NODE_TEXT', text);
  }

  setNodeShape(shape: ShapeType) {
    this.mindMap?.execCommand('SET_NODE_SHAPE', shape);
  }

  setNodeStyle(property: string, value: any) {
    this.mindMap?.execCommand('SET_NODE_STYLE', property, value);
  }

  setNodeNote(note: string) {
    this.mindMap?.execCommand('SET_NODE_NOTE', note);
  }

  setNodeHyperlink(link: string, title?: string) {
    this.mindMap?.execCommand('SET_NODE_HYPERLINK', link, title || link);
  }

  setNodeTags(tags: string[]) {
    this.mindMap?.execCommand('SET_NODE_TAG', tags);
  }

  // --- Layout & Theme ---

  setLayout(layout: LayoutType) {
    this.currentLayout = layout;
    this.mindMap?.setLayout(layout);
  }

  getLayout(): LayoutType {
    return this.currentLayout;
  }

  setThemePreset(themeId: string) {
    const preset = THEME_PRESETS.find((t) => t.id === themeId);
    if (!preset || !this.mindMap) return;
    this.currentThemeId = themeId;
    this.mindMap.setThemeConfig(preset.config);
  }

  getThemeId(): string {
    return this.currentThemeId;
  }

  setBranchLineStyle(style: BranchLineStyle) {
    if (!this.mindMap) return;
    this.mindMap.setThemeConfig({ lineStyle: style });
  }

  toggleRainbowLines(enable: boolean) {
    this.rainbowLinesEnabled = enable;
    if (!this.mindMap) return;
    // SimpleMindMap RainbowLines plugin config
    this.mindMap.setThemeConfig({
      enableRainbowLines: enable,
    });
  }

  // --- View & Navigation ---

  zoomIn() {
    this.mindMap?.view.enlarge();
  }

  zoomOut() {
    this.mindMap?.view.narrow();
  }

  setScale(percent: number) {
    this.mindMap?.view.setScale(percent / 100);
  }

  fitView() {
    this.mindMap?.view.fit();
  }

  resetView() {
    this.mindMap?.view.reset();
  }

  // --- History (Undo / Redo) ---

  undo() {
    this.mindMap?.execCommand('BACK');
  }

  redo() {
    this.mindMap?.execCommand('FORWARD');
  }

  // --- Data & Import/Export ---

  getData(): any {
    return this.mindMap?.getData(true) || null;
  }

  setData(data: any) {
    if (!this.mindMap) return;
    this.mindMap.setData(data);
    setTimeout(() => this.fitView(), 100);
  }

  async export(format: 'png' | 'svg' | 'pdf' | 'json' | 'md' | 'xmind', filename: string = 'mind-map', transparent: boolean = false): Promise<any> {
    if (!this.mindMap) return;

    switch (format) {
      case 'png':
        return await this.mindMap.export.png(true, filename, transparent);
      case 'svg':
        return await this.mindMap.export.svg(true, filename);
      case 'pdf':
        return await this.mindMap.export.pdf(true, filename);
      case 'json':
        return await this.mindMap.export.json(true, filename);
      case 'md':
        return await this.mindMap.export.md(true, filename);
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  resize() {
    this.mindMap?.resize();
  }

  destroy() {
    if (this.mindMap) {
      this.mindMap.destroy();
      this.mindMap = null;
    }
  }
}
