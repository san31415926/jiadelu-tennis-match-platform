/**
 * 微信小程序全局类型（本地精简版）。
 * 完整定义见 npm 包 miniprogram-api-typings；这里只覆盖本仓库实际用到的 API，
 * 避免在小程序目录里装 node_modules。上传时 typings/ 已被 packOptions 忽略。
 *
 * Page / Component 必须用 ThisType 把 setData、data 挂到 this 上，
 * 否则页面方法里写 this.setData 会被判成「不存在属性」。
 */

declare namespace WechatMiniprogram {
  interface IAnyObject {
    [key: string]: any;
  }

  interface Target<T extends IAnyObject = IAnyObject> {
    id: string;
    dataset: T;
  }

  interface BaseEvent<
    Mark extends IAnyObject = IAnyObject,
    CurrentTargetDataset extends IAnyObject = IAnyObject,
    TargetDataset extends IAnyObject = CurrentTargetDataset
  > {
    type: string;
    timeStamp: number;
    target: Target<TargetDataset>;
    currentTarget: Target<CurrentTargetDataset>;
    mark?: Mark;
  }

  interface CustomEvent<
    Detail = IAnyObject,
    Mark extends IAnyObject = IAnyObject,
    CurrentTargetDataset extends IAnyObject = IAnyObject,
    TargetDataset extends IAnyObject = CurrentTargetDataset
  > extends BaseEvent<Mark, CurrentTargetDataset, TargetDataset> {
    detail: Detail;
  }

  interface TouchEvent<
    Mark extends IAnyObject = IAnyObject,
    CurrentTargetDataset extends IAnyObject = IAnyObject,
    TargetDataset extends IAnyObject = CurrentTargetDataset
  > extends CustomEvent<IAnyObject, Mark, CurrentTargetDataset, TargetDataset> {}

  interface Input extends CustomEvent<{ value: string; cursor: number }> {}

  interface SwiperChange extends CustomEvent<{ current: number; source: string }> {}

  interface WindowInfo {
    pixelRatio: number;
    screenWidth: number;
    screenHeight: number;
    windowWidth: number;
    windowHeight: number;
    statusBarHeight: number;
    safeArea: {
      left: number;
      right: number;
      top: number;
      bottom: number;
      width: number;
      height: number;
    };
    screenTop: number;
  }

  interface Rect {
    width: number;
    height: number;
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  interface LoginSuccessCallbackResult {
    code: string;
    errMsg: string;
  }

  interface ShowActionSheetSuccessCallbackResult {
    tapIndex: number;
    errMsg: string;
  }

  interface ShowModalSuccessCallbackResult {
    confirm: boolean;
    cancel: boolean;
    content?: string;
    errMsg: string;
  }

  interface ChooseMediaFile {
    tempFilePath: string;
    size?: number;
  }

  interface ChooseMediaSuccessCallbackResult {
    tempFiles: ChooseMediaFile[];
    type?: string;
    errMsg: string;
  }

  /** 战力图那种 type="2d" 的 canvas 节点，不是旧的 canvas-id 上下文 */
  interface Canvas {
    width: number;
    height: number;
    getContext(contextType: '2d'): CanvasRenderingContext2D | null;
    createImage(): CanvasImage;
  }

  /** canvas 2d 用 createImage 造出来的图，onload 之后才能 drawImage */
  interface CanvasImage {
    src: string;
    width?: number;
    height?: number;
    onload: (() => void) | null;
    onerror: (() => void) | null;
  }

  interface GetImageInfoSuccessCallbackResult {
    width: number;
    height: number;
    path: string;
    errMsg: string;
  }

  interface CanvasToTempFilePathSuccessCallbackResult {
    tempFilePath: string;
    errMsg: string;
  }

  interface NodesRef {
    fields(fields: { node?: boolean; size?: boolean }): SelectorQuery;
    boundingClientRect(): SelectorQuery;
  }

  interface SelectorQuery {
    select(selector: string): NodesRef;
    exec(
      callback?: (
        res: Array<{
          node?: Canvas;
          width?: number;
          height?: number;
          left?: number;
          top?: number;
          right?: number;
          bottom?: number;
        }>,
      ) => void,
    ): void;
  }

  interface WxCloud {
    init(options: { env: string; traceUser?: boolean }): void;
    callFunction(options: {
      name: string;
      data?: Record<string, unknown>;
      /** 毫秒。传头像 base64 时 updateProfile 给 60 秒 */
      timeout?: number;
    }): Promise<{ result: unknown }>;
    database(): {
      command: {
        in(list: unknown[]): unknown;
        gte(value: unknown): unknown;
        lte(value: unknown): unknown;
        and(...args: unknown[]): unknown;
      };
      collection(name: string): {
        where(query: Record<string, unknown>): {
          limit(n: number): {
            get(): Promise<{ data: Record<string, unknown>[] }>;
          };
          get(): Promise<{ data: Record<string, unknown>[] }>;
        };
        limit(n: number): {
          get(): Promise<{ data: Record<string, unknown>[] }>;
        };
        get(): Promise<{ data: Record<string, unknown>[] }>;
        doc(id: string): {
          get(): Promise<{ data: Record<string, unknown> }>;
        };
      };
    };
  }

  /**
   * 这里少写一个方法，页面里一调用就会 TS2339。
   * 开发者工具开了 TypeScript 插件后，类型错误会挡住整包编译，模拟器变成白屏。
   * 新用了微信 API，先在这个 interface 里补上，再写业务代码。
   */
  interface Wx {
    cloud?: WxCloud;
    getWindowInfo(): WindowInfo;
    getMenuButtonBoundingClientRect(): Rect;
    getSystemInfoSync(): WindowInfo;
    showToast(options: {
      title: string;
      icon?: 'success' | 'error' | 'loading' | 'none';
      duration?: number;
      mask?: boolean;
    }): void;
    showLoading(options: { title: string; mask?: boolean }): void;
    hideLoading(): void;
    showActionSheet(options: {
      itemList: string[];
      success?: (res: ShowActionSheetSuccessCallbackResult) => void;
      fail?: (err: { errMsg: string }) => void;
    }): void;
    showModal(options: {
      title?: string;
      content?: string;
      showCancel?: boolean;
      editable?: boolean;
      placeholderText?: string;
      success?: (res: ShowModalSuccessCallbackResult) => void;
    }): void;
    chooseMedia(options: {
      count?: number;
      mediaType?: Array<'image' | 'video' | 'mix'>;
      sourceType?: Array<'album' | 'camera'>;
      success?: (res: ChooseMediaSuccessCallbackResult) => void;
    }): void;
    getImageInfo(options: {
      src: string;
      success?: (res: GetImageInfoSuccessCallbackResult) => void;
      fail?: (err: { errMsg: string }) => void;
    }): void;
    canvasToTempFilePath(options: {
      canvas?: Canvas;
      canvasId?: string;
      x?: number;
      y?: number;
      width?: number;
      height?: number;
      destWidth?: number;
      destHeight?: number;
      fileType?: 'jpg' | 'png';
      quality?: number;
      success?: (res: CanvasToTempFilePathSuccessCallbackResult) => void;
      fail?: (err: { errMsg: string }) => void;
    }): void;
    nextTick(callback: () => void): void;
    setClipboardData(options: { data: string; success?: () => void }): void;
    navigateTo(options: { url: string }): void;
    redirectTo(options: { url: string }): void;
    navigateBack(options?: {
      delta?: number;
      success?: () => void;
      fail?: () => void;
    }): void;
    switchTab(options: { url: string }): void;
    previewImage(options: { urls: string[]; current?: string }): void;
    login(options: {
      success?: (res: LoginSuccessCallbackResult) => void;
      fail?: (err: { errMsg: string }) => void;
      complete?: () => void;
    }): void;
    getStorageSync(key: string): string;
    setStorageSync(key: string, data: string): void;
    setBackgroundColor(options: {
      backgroundColor?: string;
      backgroundColorTop?: string;
      backgroundColorBottom?: string;
      success?: () => void;
      fail?: () => void;
    }): void;
  }

  interface PageInstanceMethods<D extends IAnyObject = IAnyObject> {
    readonly data: D;
    setData(data: Partial<D> | IAnyObject, callback?: () => void): void;
    getTabBar<T = any>(): T;
    createSelectorQuery(): SelectorQuery;
  }

  type PageInstance<T extends IAnyObject> = T &
    PageInstanceMethods<T extends { data: infer D } ? D & IAnyObject : IAnyObject>;

  type PageOptions<T extends IAnyObject> = T & {
    behaviors?: any[];
  } & ThisType<PageInstance<T>>;

  interface ComponentInstanceMethods {
    readonly data: IAnyObject;
    setData(data: IAnyObject, callback?: () => void): void;
    triggerEvent(name: string, detail?: IAnyObject, options?: IAnyObject): void;
    createSelectorQuery(): SelectorQuery;
  }

  type ComponentInstance<T extends IAnyObject> = T &
    ComponentInstanceMethods &
    (T extends { methods: infer M } ? M : {});

  type ComponentOptions<T extends IAnyObject> = T & {
    methods?: T extends { methods: infer M } ? M & ThisType<ComponentInstance<T>> : never;
    lifetimes?: WechatMiniprogram.IAnyObject;
    pageLifetimes?: WechatMiniprogram.IAnyObject;
    observers?: WechatMiniprogram.IAnyObject;
    options?: WechatMiniprogram.IAnyObject;
    properties?: WechatMiniprogram.IAnyObject;
    data?: WechatMiniprogram.IAnyObject;
  } & ThisType<ComponentInstance<T>>;
}

/**
 * 战力图用 canvas 2d 上下文。tsconfig 的 lib 只有 ES2020，没有 DOM，
 * 所以这里自己声明用到的那几个方法，避免 CanvasRenderingContext2D 找不到。
 */
interface CanvasRenderingContext2D {
  strokeStyle: string;
  fillStyle: string;
  lineWidth: number;
  scale(x: number, y: number): void;
  clearRect(x: number, y: number, w: number, h: number): void;
  drawImage(
    image: WechatMiniprogram.CanvasImage,
    sx: number,
    sy: number,
    sw: number,
    sh: number,
    dx: number,
    dy: number,
    dw: number,
    dh: number,
  ): void;
  beginPath(): void;
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  closePath(): void;
  stroke(): void;
  fill(): void;
  arc(x: number, y: number, radius: number, startAngle: number, endAngle: number): void;
}

declare function setTimeout(handler: () => void, timeout?: number): number;

declare const wx: WechatMiniprogram.Wx;

declare const console: {
  log(...data: any[]): void;
  warn(...data: any[]): void;
  error(...data: any[]): void;
};

declare function App<T extends WechatMiniprogram.IAnyObject>(
  options: T & ThisType<T>,
): void;

declare function getApp<T = any>(): T;

declare function getCurrentPages(): Array<{
  route: string;
  data?: WechatMiniprogram.IAnyObject;
  setData(data: WechatMiniprogram.IAnyObject, callback?: () => void): void;
}>;

declare function Behavior(options: WechatMiniprogram.IAnyObject): any;

declare function Page<T extends WechatMiniprogram.IAnyObject>(
  options: WechatMiniprogram.PageOptions<T>,
): void;

declare function Component<T extends WechatMiniprogram.IAnyObject>(
  options: WechatMiniprogram.ComponentOptions<T>,
): void;
