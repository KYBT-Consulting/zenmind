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
import { isSafeLink, sanitizeMapData } from '../lib/sanitize';

export interface MindMapEngineCallbacks {
  onActiveNodeChange?: (node: ActiveNodeInfo | null) => void;
  onDataChange?: (data: any) => void;
  onScaleChange?: (scale: number) => void;
  onHistoryChange?: (state: { canUndo: boolean; canRedo: boolean }) => void;
  onFormatPainterChange?: (isActive: boolean) => void;
  onPresentationModeChange?: (isActive: boolean) => void;
  /** Fired once, after the first tree render completes (the map is laid out and stable). */
  onFirstRender?: (engine: MindMapEngine) => void;
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
  private rainbowLinesEnabled: boolean = false;
  private isAutoNumbering: boolean = false;
  private active: boolean = true;
  private hasRenderedOnce: boolean = false;

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
      // Several engines can be mounted at once (tabs); the library listens for
      // keys on window, so only the active engine may react to shortcuts.
      customCheckEnableShortcut: (e: KeyboardEvent) => {
        if (!this.active || !this.mindMap) return false;
        const target = e.target as HTMLElement;
        if (target === document.body) return true;
        return (this.mindMap as any).editNodeClassList?.some((c: string) => target.classList?.contains(c)) ?? false;
      },
      enableFreeDrag: true, // Allows freely dragging nodes and floating topics anywhere on canvas
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
      if (!this.hasRenderedOnce) {
        this.hasRenderedOnce = true;
        this.callbacks.onFirstRender?.(this);
      }
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

  /** Select a node by uid and bring it into view. Returns false if no such node exists. */
  selectNodeByUid(uid: string): boolean {
    const renderer = this.mindMap?.renderer as any;
    const node = renderer?.findNodeByUid?.(uid);
    if (!node) return false;
    renderer.clearActiveNodeList?.();
    renderer.setNodeActive(node, true);
    renderer.moveNodeToCenter?.(node);
    return true;
  }

  /** Add several child topics under a node (by uid, default: the active node) as one undoable step. */
  addChildTopics(texts: string[], parentUid?: string): boolean {
    const renderer = this.mindMap?.renderer as any;
    if (!this.mindMap || !renderer || texts.length === 0) return false;
    const parent = parentUid ? renderer.findNodeByUid?.(parentUid) : this.getActiveNode();
    if (!parent) return false;
    this.mindMap.execCommand('INSERT_MULTI_CHILD_NODE', [parent], texts.map((text) => ({ data: { text } })));
    return true;
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
    const list = this.mindMap?.renderer?.activeNodeList || [];
    if (list.length > 0) {
      list.forEach((node: any) => {
        this.mindMap?.execCommand('SET_NODE_STYLE', node, 'shape', shape);
      });
      const active = this.getActiveNode();
      if (active) {
        this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(active));
      }
    }
  }

  setNodeStyle(property: string, value: any) {
    const list = this.mindMap?.renderer?.activeNodeList || [];
    if (list.length > 0) {
      list.forEach((node: any) => {
        this.mindMap?.execCommand('SET_NODE_STYLE', node, property, value);
      });
      const active = this.getActiveNode();
      if (active) {
        this.callbacks.onActiveNodeChange?.(this.extractActiveNodeInfo(active));
      }
    }
  }

  setNodeNote(note: string) {
    const node = this.getActiveNode();
    if (node) {
      node.setNote(note);
    } else {
      this.mindMap?.execCommand('SET_NODE_NOTE', note);
    }
  }

  /** Returns false (and changes nothing) if the link uses a scheme other than http(s)/mailto/tel. */
  setNodeHyperlink(link: string, title?: string): boolean {
    link = link.trim();
    if (!isSafeLink(link)) return false;
    const node = this.getActiveNode();
    if (node) {
      node.setHyperlink(link, title || link);
    } else {
      this.mindMap?.execCommand('SET_NODE_HYPERLINK', link, title || link);
    }
    return true;
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

    // One undoable command (gives undo, data_change and dirty tracking); explicit data, activated on insert
    this.mindMap.execCommand('INSERT_CHILD_NODE', false, [rootNode], {
      text,
      isFloating: true,
      isActive: true,
      customLeft: x,
      customTop: y,
      shape: 'roundedRectangle',
      fillColor: '#f8fafc',
      color: '#1e293b',
      borderColor: '#94a3b8',
      borderWidth: 2,
    });
  }

  /** Converts viewport client coordinates to graph (draw-space) coordinates, accounting for pan and zoom. */
  screenToCanvasPos(clientX: number, clientY: number): { x: number; y: number } {
    if (!this.mindMap) return { x: clientX, y: clientY };
    const local = this.mindMap.toPos(clientX, clientY);
    const { x, y, scale } = this.getViewTransform();
    return { x: (local.x - x) / scale, y: (local.y - y) / scale };
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
    this.mindMap?.miniMap?.onViewBoxMousedown?.(e);
  }

  miniMapMouseMove(e: any) {
    this.mindMap?.miniMap?.onViewBoxMousemove?.(e);
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

  toggleAutoNumbering(enable?: boolean) {
    const data = this.getTreeData();
    if (!data) return;

    const stripNumbering = (text: string): string => {
      const clean = stripHtml(text);
      return clean.replace(/^(\d+(\.\d+)*|[A-Z](\.\d+)*)\.?\s+/, '');
    };

    const targetState = enable !== undefined ? enable : !this.isAutoNumbering;
    this.isAutoNumbering = targetState;

    const applyNumbering = (node: any, prefix: string) => {
      if (!node.data) node.data = {};
      const baseText = stripNumbering(node.data.text || '');
      const numberedText = targetState && prefix ? `${prefix} ${baseText}` : baseText;
      if (node.data.richText) {
        node.data.text = `<p>${numberedText}</p>`;
      } else {
        node.data.text = numberedText;
      }
      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any, idx: number) => {
          const childPrefix = prefix ? `${prefix}.${idx + 1}` : `${idx + 1}`;
          applyNumbering(child, childPrefix);
        });
      }
    };

    if (data.children && Array.isArray(data.children)) {
      data.children.forEach((child: any, idx: number) => {
        applyNumbering(child, targetState ? `${idx + 1}` : '');
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
    this.mindMap.setThemeConfig({ ...preset.config });
  }

  getThemeId(): string {
    return this.currentThemeId;
  }

  setBranchLineStyle(style: BranchLineStyle) {
    if (!this.mindMap) return;
    // setThemeConfig replaces the whole config, so merge into the current one
    this.mindMap.setThemeConfig({ ...this.mindMap.getCustomThemeConfig(), lineStyle: style });
  }

  toggleRainbowLines(enable: boolean) {
    this.rainbowLinesEnabled = enable;
    const mm = this.mindMap as any;
    if (!mm?.rainbowLines) return;
    // The plugin reads opt.rainbowLinesConfig (not the theme config); an empty colour list uses its defaults
    mm.opt.rainbowLinesConfig = { open: enable, colorsList: [] };
    mm.rainbowLines.updateRainLinesConfig({ open: enable });
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

  /** Full document: {layout, root, theme, view}. Use for saving .zenmind files. */
  getData(): any {
    return this.mindMap?.getData(true) || null;
  }

  /** Just the node tree (root node with children). Use for exports and content comparison. */
  getTreeData(): any {
    return this.mindMap?.getData(false) || null;
  }

  /**
   * Stable string of the map content, for dirty checks. Ignores state the library adds on its own
   * after rendering or editing: `dir` (which side of the root a branch sits on) and empty
   * objects/arrays (e.g. `imgMap: {}`), so "absent" and "empty" compare equal.
   */
  getContentSignature(): string {
    return JSON.stringify(this.getTreeData(), function (this: any, key, value) {
      if (key === 'dir') return undefined;
      const isContainer = value !== null && typeof value === 'object';
      const isEmpty = Array.isArray(value) ? value.length === 0 : isContainer && Object.keys(value).length === 0;
      return isEmpty && !Array.isArray(this) && key !== '' ? undefined : value;
    });
  }

  setData(data: any) {
    if (!this.mindMap) return;
    this.mindMap.setData(sanitizeMapData(data));
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
        const data = this.getTreeData();
        const xml = MindMapFormatService.exportOpml(data, filename);
        MindMapFormatService.downloadFile(xml, `${filename}.opml`, 'application/xml');
        return xml;
      }
      case 'mm': {
        const data = this.getTreeData();
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

  setActive(active: boolean) {
    this.active = active;
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
