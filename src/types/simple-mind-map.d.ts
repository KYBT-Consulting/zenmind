declare module 'simple-mind-map' {
  export interface MindMapNodeData {
    text: string;
    image?: string;
    imageTitle?: string;
    imageSize?: { width: number; height: number };
    icon?: string[];
    tag?: string[];
    hyperlink?: string;
    hyperlinkTitle?: string;
    note?: string;
    expand?: boolean;
    isActive?: boolean;
    generalization?: { text: string }[];
    richText?: boolean;
    uid?: string;
    shape?: string;
    fillColor?: string;
    color?: string;
    borderColor?: string;
    borderWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    fontStyle?: string;
    lineColor?: string;
    lineWidth?: number;
    lineDasharray?: string;
  }

  export interface MindMapTreeData {
    data: MindMapNodeData;
    children?: MindMapTreeData[];
  }

  export interface NodeInstance {
    uid: string;
    nodeData: {
      data: MindMapNodeData;
      children?: any[];
    };
    isRoot: boolean;
    layerIndex: number;
    width: number;
    height: number;
    left: number;
    top: number;
    parent?: NodeInstance;
    children: NodeInstance[];
    getData(key?: string): any;
    setData(data: Partial<MindMapNodeData>): void;
    setText(text: string, richText?: boolean, resetRichText?: boolean): void;
    setImage(data: any): void;
    setIcon(icons: string[]): void;
    setHyperlink(link: string, title?: string): void;
    setNote(note: string): void;
    setTag(tag: string[]): void;
    setShape(shape: string): void;
    setStyle(prop: string, value: any): void;
    getStyle(prop: string, root?: boolean): any;
    getRect(): { left: number; top: number; right: number; bottom: number; width: number; height: number };
  }

  export interface MindMapOptions {
    el: HTMLElement | null;
    data?: MindMapTreeData | null;
    layout?: string;
    theme?: string;
    themeConfig?: Record<string, any>;
    readonly?: boolean;
    fishboneDeg?: number;
    scaleRatio?: number;
    minZoomRatio?: number;
    maxZoomRatio?: number;
    defaultInsertSecondLevelNodeText?: string;
    defaultInsertBelowSecondLevelNodeText?: string;
    defaultGeneralizationText?: string;
    enableFreeDrag?: boolean;
    watermarkConfig?: Record<string, any>;
    [key: string]: any;
  }

  export default class MindMap {
    static usePlugin(plugin: any): typeof MindMap;
    static xmind: any;
    static markdown: any;
    static iconList: any;
    static constants: any;
    static defaultTheme: any;
    static version: string;

    opt: MindMapOptions;
    el: HTMLElement;
    renderer: {
      root: NodeInstance;
      activeNodeList: NodeInstance[];
      [key: string]: any;
    };
    command: {
      exec(command: string, ...args: any[]): void;
      [key: string]: any;
    };
    view: {
      scale: number;
      x: number;
      y: number;
      fit(): void;
      reset(): void;
      enlarge(ratio?: number): void;
      narrow(ratio?: number): void;
      setScale(scale: number): void;
      translateXTo(x: number): void;
      translateYTo(y: number): void;
      getTransformData(): { scale: number; x: number; y: number };
      setTransformData(data: { scale: number; x: number; y: number }): void;
    };
    painter?: {
      isInPainter: boolean;
      startPainter(): void;
      endPainter(): void;
    };
    demonstrate?: {
      isInDemonstrate: boolean;
      enter(): void;
      exit(): void;
    };
    miniMap?: {
      calculationMiniMap(boxWidth: number, boxHeight: number): any;
      onMousedown(e: any): void;
      onMousemove(e: any): void;
      onMouseup(e: any): void;
    };
    associativeLine?: any;
    outerFrame?: any;
    export: {
      png(isDownload?: boolean, name?: string, transparent?: boolean): Promise<string>;
      svg(isDownload?: boolean, name?: string): Promise<string>;
      pdf(isDownload?: boolean, name?: string): Promise<any>;
      json(isDownload?: boolean, name?: string): Promise<string>;
      md(isDownload?: boolean, name?: string): Promise<string>;
    };

    constructor(options: MindMapOptions);

    on(event: string, callback: (...args: any[]) => void): void;
    off(event: string, callback: (...args: any[]) => void): void;
    emit(event: string, ...args: any[]): void;

    execCommand(name: string, ...args: any[]): void;
    getData(withConfig?: boolean): MindMapTreeData;
    setData(data: MindMapTreeData): void;
    setFullData(data: { data: MindMapTreeData; [key: string]: any }): void;
    getFullData(): { data: MindMapTreeData; [key: string]: any };

    setLayout(layout: string): void;
    getLayout(): string;

    setTheme(theme: string): void;
    getTheme(): string;
    setThemeConfig(config: Record<string, any>): void;
    getCustomThemeConfig(): Record<string, any>;

    destroy(): void;
    resize(): void;
    render(callback?: () => void): void;
    toPos(x: number, y: number): { x: number; y: number };
  }
}
