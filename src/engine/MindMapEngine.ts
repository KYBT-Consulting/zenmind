import MindMap from 'simple-mind-map';
import {
  ActiveNodeInfo,
  BranchLineStyle,
  LayoutType,
  OuterFrameConfig,
  PriorityLevel,
  ProgressLevel,
  ShapeType,
  THEME_PRESETS,
} from '../types/mindmap';
import { MindMapFormatService } from '../services/mindMapFormatService';
import { stripHtml } from '../lib/utils';

export interface MindMapEngineCallbacks {
  onActiveNodeChange?: (node: ActiveNodeInfo | null) => void;
  onDataChange?: (data: any) => void;
  onScaleChange?: (scale: number) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onFormatPainterChange?: (isActive: boolean) => void;
  onPresentationModeChange?: (isActive: boolean) => void;
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

    // In-place text editing finished or tree re-rendered
    this.mindMap.on('hide_text_edit', () => {
      const active = this.getActiveNode();
      if (active) {
        this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(active));
      }
    });

    this.mindMap.on('node_tree_render_end', () => {
      const active = this.getActiveNode();
      if (active) {
        this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(active));
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

    // Format painter events
    this.mindMap.on('painter_start', () => {
      this.callbacks.onFormatPainterChange?.(true);
    });

    this.mindMap.on('painter_end', () => {
      this.callbacks.onFormatPainterChange?.(false);
    });

    // Presentation mode exit event
    this.mindMap.on('exit_demonstrate', () => {
      this.callbacks.onPresentationModeChange?.(false);
    });

    // Interactive icon click: cycle progress or toggle task state directly on canvas
    this.mindMap.on('node_icon_click', (node: any, iconName: string, event: any) => {
      if (typeof iconName === 'string' && iconName.startsWith('progress_')) {
        event?.stopPropagation?.();
        const cycle = ['progress_0', 'progress_25', 'progress_50', 'progress_75', 'progress_100'];
        const currentIdx = cycle.indexOf(iconName);
        const nextIcon = currentIdx >= 0 && currentIdx < cycle.length - 1 ? cycle[currentIdx + 1] : cycle[0];
        const currentIcons: string[] = (node.getData('icon') || []).filter((i: string) => !i.startsWith('progress_'));
        node.setIcon([...currentIcons, nextIcon]);
        this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(node));
      }
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
      text: stripHtml(data.text || ''),
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
      icon: data.icon || [],
      customLeft: data.customLeft,
      customTop: data.customTop,
      image: data.image
        ? {
            url: data.image,
            title: data.imageTitle || '',
            width: data.imageSize?.width,
            height: data.imageSize?.height,
          }
        : undefined,
      isFloating: !!data.isFloating,
      rect,
      outerFrame: data.outerFrame || undefined,
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

  addBoundary(config?: OuterFrameConfig) {
    const defaultConfig: OuterFrameConfig = {
      radius: 8,
      strokeWidth: 2,
      strokeColor: '#4f46e5',
      strokeDasharray: '5,5',
      fill: 'rgba(79, 70, 229, 0.08)',
      text: '',
      ...config,
    };
    (this.mindMap as any)?.execCommand('ADD_OUTER_FRAME', null, defaultConfig);
    const active = this.getActiveNode();
    if (active) {
      this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(active));
    }
  }

  updateBoundary(config: OuterFrameConfig) {
    if ((this.mindMap as any)?.outerFrame) {
      (this.mindMap as any).outerFrame.updateActiveOuterFrame(config);
    }
    const active = this.getActiveNode();
    if (active) {
      this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(active));
    }
  }

  removeBoundary() {
    if ((this.mindMap as any)?.outerFrame) {
      (this.mindMap as any).outerFrame.removeActiveOuterFrame();
    }
    const node = this.getActiveNode();
    if (node) {
      this.mindMap?.execCommand('SET_NODE_DATA', node, { outerFrame: null });
      (this.mindMap as any)?.outerFrame?.renderOuterFrames?.();
      this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(node));
    }
  }

  addRelationship() {
    this.mindMap?.execCommand('ADD_ASSOCIATIVE_LINE');
  }

  removeRelationship() {
    if ((this.mindMap as any)?.associativeLine) {
      (this.mindMap as any).associativeLine.removeLine();
    }
  }

  getActiveNode(): any {
    return this.mindMap?.renderer?.activeNodeList?.[0] || null;
  }

  setNodeText(text: string) {
    const node = this.getActiveNode();
    if (node) {
      const clean = stripHtml(text);
      if ((this.mindMap as any)?.richText) {
        this.mindMap?.execCommand('SET_NODE_TEXT', node, `<p>${clean}</p>`, true);
      } else {
        this.mindMap?.execCommand('SET_NODE_TEXT', node, clean);
      }
      this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(node));
    }
  }

  setNodeShape(shape: ShapeType) {
    this.mindMap?.execCommand('SET_NODE_SHAPE', shape);
  }

  setNodeStyle(property: string, value: any) {
    this.mindMap?.execCommand('SET_NODE_STYLE', property, value);
  }

  setNodeNote(note: string) {
    const node = this.getActiveNode();
    if (node) {
      node.setNote(note);
    } else {
      this.mindMap?.execCommand('SET_NODE_NOTE', note);
    }
  }

  setNodeHyperlink(link: string, title?: string) {
    const node = this.getActiveNode();
    if (node) {
      node.setHyperlink(link, title || link);
    } else {
      this.mindMap?.execCommand('SET_NODE_HYPERLINK', link, title || link);
    }
  }

  setNodeTags(tags: string[]) {
    const node = this.getActiveNode();
    if (node) {
      node.setTag(tags);
    } else {
      this.mindMap?.execCommand('SET_NODE_TAG', tags);
    }
  }

  setNodePriority(priority: PriorityLevel | null) {
    const node = this.getActiveNode();
    if (!node) return;
    const currentIcons: string[] = (node.getData('icon') || []).filter((i: string) => !i.startsWith('priority_'));
    if (priority !== null) {
      node.setIcon([...currentIcons, `priority_${priority}`]);
    } else {
      node.setIcon(currentIcons);
    }
    this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(node));
  }

  setNodeProgress(progress: ProgressLevel | null) {
    const node = this.getActiveNode();
    if (!node) return;
    const currentIcons: string[] = (node.getData('icon') || []).filter((i: string) => !i.startsWith('progress_'));
    if (progress !== null) {
      node.setIcon([...currentIcons, `progress_${progress}`]);
    } else {
      node.setIcon(currentIcons);
    }
    this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(node));
  }

  toggleNodeCheckbox() {
    const node = this.getActiveNode();
    if (!node) return;
    const icons: string[] = node.getData('icon') || [];
    const currentProgress = icons.find((i: string) => i.startsWith('progress_'));
    if (!currentProgress || currentProgress === 'progress_0') {
      this.setNodeProgress(100);
    } else {
      this.setNodeProgress(0);
    }
  }

  setNodeIcons(icons: string[]) {
    const node = this.getActiveNode();
    if (!node) return;
    node.setIcon(icons);
    this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(node));
  }

  // --- Image Attachments & Inline Resizing ---

  setNodeImage(imgData: { url: string; title?: string; width?: number; height?: number } | null) {
    const node = this.getActiveNode();
    if (!node) return;
    if (imgData && imgData.url) {
      this.mindMap?.execCommand('SET_NODE_IMAGE', node, {
        url: imgData.url,
        title: imgData.title || '',
        width: imgData.width || 180,
        height: imgData.height || 120,
        custom: true,
      });
    } else {
      this.mindMap?.execCommand('SET_NODE_IMAGE', node, { url: '' });
    }
    this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(node));
  }

  // --- Mathematical Formulas (KaTeX) ---

  insertFormula(formula: string) {
    const node = this.getActiveNode();
    if (!node) return;
    this.mindMap?.execCommand('INSERT_FORMULA', formula, [node]);
    this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(node));
  }

  // --- Floating Independent Topics ---

  insertFloatingNode(text: string = 'Floating Idea', pos?: { x: number; y: number }) {
    if (!this.mindMap) return;
    const rootNode = this.mindMap.renderer?.root;
    if (!rootNode) return;

    let x = pos?.x;
    let y = pos?.y;

    if (x === undefined || y === undefined) {
      const rect = rootNode.getRect?.() || { left: 0, top: 0, width: 100, height: 40 };
      x = (rootNode.left || rect.left) + 260;
      y = (rootNode.top || rect.top) - 160;
    }

    const newNodeData = {
      data: {
        text,
        isFloating: true,
        customLeft: x,
        customTop: y,
        shape: 'roundedRectangle',
        fillColor: '#f8fafc',
        color: '#1e293b',
        borderColor: '#94a3b8',
        borderWidth: 2,
      },
      children: [],
    };

    if (!rootNode.nodeData.children) {
      rootNode.nodeData.children = [];
    }
    rootNode.nodeData.children.push(newNodeData);
    this.mindMap.render(() => {
      // Find the created node and activate it
      const allNodes = this.mindMap?.renderer?.nodeList || [];
      const added = allNodes.find((n: any) => n.getData('customLeft') === x && n.getData('customTop') === y);
      if (added) {
        this.mindMap?.renderer?.setNodeActive(added, true);
      }
    });
  }

  screenToCanvasPos(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.mindMap) return { x: clientX, y: clientY };
    return this.mindMap.toPos(clientX, clientY);
  }

  // --- Format Painter (Style Cloner) ---

  startFormatPainter() {
    if (!this.mindMap?.painter) return;
    this.mindMap.painter.startPainter();
  }

  endFormatPainter() {
    if (!this.mindMap?.painter) return;
    this.mindMap.painter.endPainter();
    this.callbacks.onFormatPainterChange?.(false);
  }

  isFormatPainterActive(): boolean {
    return !!this.mindMap?.painter?.isInPainter;
  }

  // --- Presentation / Pitch Mode ---

  enterPresentationMode() {
    if (!this.mindMap?.demonstrate) return;
    this.mindMap.demonstrate.enter();
    this.callbacks.onPresentationModeChange?.(true);
  }

  exitPresentationMode() {
    if (!this.mindMap?.demonstrate) return;
    this.mindMap.demonstrate.exit();
    this.callbacks.onPresentationModeChange?.(false);
  }

  isPresentationMode(): boolean {
    return !!this.mindMap?.demonstrate?.isInDemonstrate;
  }

  // --- Mini-Map Navigator ---

  calculateMiniMap(boxWidth: number, boxHeight: number) {
    if (!this.mindMap?.miniMap) return null;
    return this.mindMap.miniMap.calculationMiniMap(boxWidth, boxHeight);
  }

  miniMapMouseDown(e: any) {
    this.mindMap?.miniMap?.onMousedown?.(e);
  }

  miniMapMouseMove(e: any) {
    this.mindMap?.miniMap?.onMousemove?.(e);
  }

  miniMapMouseUp(e: any) {
    this.mindMap?.miniMap?.onMouseup?.(e);
  }

  // --- Canvas Navigation & Ergonomics ---

  panBy(dx: number, dy: number) {
    if (!this.mindMap?.view) return;
    const currentX = this.mindMap.view.x;
    const currentY = this.mindMap.view.y;
    this.mindMap.view.translateXTo(currentX + dx);
    this.mindMap.view.translateYTo(currentY + dy);
  }

  getViewTransform(): { x: number; y: number; scale: number } {
    return {
      x: this.mindMap?.view?.x || 0,
      y: this.mindMap?.view?.y || 0,
      scale: this.mindMap?.view?.scale || 1,
    };
  }

  resetLayout() {
    this.mindMap?.execCommand('RESET_LAYOUT');
  }

  toggleAutoNumbering(enable: boolean = true) {
    const data = this.getData();
    if (!data) return;

    const stripNumbering = (text: string): string => {
      return text.replace(/^(\d+(\.\d+)*|[A-Z](\.\d+)*)\.?\s+/, '');
    };

    const applyNumbering = (node: any, prefix: string) => {
      if (!node.data) node.data = {};
      const baseText = stripNumbering(node.data.text || '');
      node.data.text = enable && prefix ? `${prefix} ${baseText}` : baseText;
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any, idx: number) => {
          const childPrefix = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
          applyNumbering(child, childPrefix);
        });
      }
    };

    if (data.children && Array.isArray(data.children)) {
      data.children.forEach((child: any, idx: number) => {
        applyNumbering(child, enable ? `${idx + 1}` : '');
      });
    }

    this.setData(data);
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

  async export(
    format: 'png' | 'svg' | 'pdf' | 'json' | 'md' | 'xmind' | 'opml' | 'mm' | 'zenmind',
    filename: string = 'mind-map',
    transparent: boolean = false
  ): Promise<any> {
    if (!this.mindMap) return;

    switch (format) {
      case 'png':
      case 'svg':
      case 'pdf':
      case 'json':
      case 'md':
      case 'xmind': {
        const mm = this.mindMap as any;
        if (typeof mm.export === 'function') {
          return await mm.export(format, true, filename, transparent);
        } else if (mm.export && typeof mm.export[format] === 'function') {
          return await mm.export[format](true, filename, transparent);
        }
        break;
      }
      case 'opml': {
        const data = this.getData();
        const xml = MindMapFormatService.exportOpml(data, filename);
        MindMapFormatService.downloadFile(xml, `${filename}.opml`, 'application/xml');
        return xml;
      }
      case 'mm': {
        const data = this.getData();
        const xml = MindMapFormatService.exportFreeMind(data);
        MindMapFormatService.downloadFile(xml, `${filename}.mm`, 'application/xml');
        return xml;
      }
      case 'zenmind': {
        const data = this.getData();
        const json = JSON.stringify(
          {
            version: '1.0.0',
            title: filename,
            createdAt: new Date().toISOString(),
            content: data,
          },
          null,
          2
        );
        MindMapFormatService.downloadFile(json, `${filename}.zenmind`, 'application/json');
        return json;
      }
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
