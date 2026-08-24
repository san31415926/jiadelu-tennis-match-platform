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

  interface WxCloud {
    init(options: { env: string; traceUser?: boolean }): void;
  }

  interface Wx {
    cloud?: WxCloud;
    getWindowInfo(): WindowInfo;
    getMenuButtonBoundingClientRect(): Rect;
    showToast(options: {
      title: string;
      icon?: 'success' | 'error' | 'loading' | 'none';
      duration?: number;
      mask?: boolean;
    }): void;
    navigateTo(options: { url: string }): void;
    navigateBack(options?: { delta?: number }): void;
    switchTab(options: { url: string }): void;
    previewImage(options: { urls: string[]; current?: string }): void;
    login(options: {
      success?: (res: LoginSuccessCallbackResult) => void;
      fail?: (err: { errMsg: string }) => void;
      complete?: () => void;
    }): void;
  }

  interface PageInstanceMethods<D extends IAnyObject = IAnyObject> {
    readonly data: D;
    setData(data: Partial<D> | IAnyObject, callback?: () => void): void;
    getTabBar<T = any>(): T;
  }

  type PageInstance<T extends IAnyObject> = T &
    PageInstanceMethods<T extends { data: infer D } ? D & IAnyObject : IAnyObject>;

  type PageOptions<T extends IAnyObject> = T & ThisType<PageInstance<T>>;

  interface ComponentInstanceMethods {
    readonly data: IAnyObject;
    setData(data: IAnyObject, callback?: () => void): void;
    triggerEvent(name: string, detail?: IAnyObject, options?: IAnyObject): void;
  }

  type ComponentInstance<T extends IAnyObject> = T &
    ComponentInstanceMethods &
    (T extends { methods: infer M } ? M : {});

  type ComponentOptions<T extends IAnyObject> = T & {
    methods?: T extends { methods: infer M } ? M & ThisType<ComponentInstance<T>> : never;
  } & ThisType<ComponentInstance<T>>;
}

declare const wx: WechatMiniprogram.Wx;

declare function App<T extends WechatMiniprogram.IAnyObject>(
  options: T & ThisType<T>,
): void;

declare function getApp<T = any>(): T;

declare function Page<T extends WechatMiniprogram.IAnyObject>(
  options: WechatMiniprogram.PageOptions<T>,
): void;

declare function Component<T extends WechatMiniprogram.IAnyObject>(
  options: WechatMiniprogram.ComponentOptions<T>,
): void;
