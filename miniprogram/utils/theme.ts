/**
 * ============================================================================
 * 全站主题
 * ============================================================================
 *
 * 「我的 → 更换背景」只改这一份色表，整站一起换。不要在页面里再写死青绿。
 *
 * 【怎么接一个新页面 / 新组件】
 *   1. behaviors: [themeBehavior]     （behaviors/theme.ts，页面和组件都能挂）
 *   2. 根节点 style="{{themeVars}}"
 *   3. 按钮、筛选、光晕用 {{accent}} / {{accentText}}，或 CSS 的 var(--accent)
 *
 * 挂上就会自动登记、自动刷色。不要再手写 register / apply。
 *
 * 【怎么改某个主题的颜色】
 * 只改下面的 THEME_CHROME。styles/theme.wxss 是备用 class，给还没挂内联的元素。
 *
 * 【换色怎么刷到全站】
 * setAppTheme 会：写入缓存 → 改窗口露底色 → 给所有已挂载的页面和组件 setData。
 * 顺手再扫一遍当前页的自定义底栏，避免漏刷。
 */

import { headerMetrics } from './header';

export type AppTheme = 'mint' | 'lime' | 'gold' | 'sky' | 'dusk' | 'photo';

export type ThemeHost = {
  setData: (data: WechatMiniprogram.IAnyObject) => void;
  getTabBar?: () => ThemeHost | undefined;
};

export type ThemePayload = {
  theme: AppTheme;
  themeVars: string;
  headerGradient: string;
  headerGradientDown: string;
  accent: string;
  accentText: string;
};

const STORAGE_KEY = 'appTheme';

export const THEME_KEYS: AppTheme[] = [
  'mint',
  'lime',
  'gold',
  'sky',
  'dusk',
  'photo',
];

/** 冷启动、没有缓存时的默认。用户要的是全站薄荷，不要改回 lime。 */
export const DEFAULT_THEME: AppTheme = 'mint';

export interface ThemeChrome {
  headerGradient: string;
  headerGradientDown: string;
  pageBg: string;
  pageNavBg: string;
  headerSolid: string;
  /** 按钮、筛选、底栏选中。要比页底深，才一眼认得出来 */
  accent: string;
  accentText: string;
}

/**
 * 每个主题的壳色。photo（原图）跟薄荷同一套顶栏，只在「我的」霜化罩更透。
 * headerGradient = 首页 / 超级杯那条横的；headerGradientDown = 二级页竖的。
 */
export const THEME_CHROME: Record<AppTheme, ThemeChrome> = {
  mint: {
    headerGradient: 'linear-gradient(90deg, #c8f4e8 0%, #b8eddc 48%, #66c4b4 100%)',
    headerGradientDown: 'linear-gradient(180deg, #b8eddc 0%, #d6f5e8 55%, #f0fcf7 100%)',
    pageBg: '#f0fcf7',
    pageNavBg: '#b8eddc',
    headerSolid: '#b8eddc',
    accent: '#66c4b4',
    accentText: '#14211a',
  },
  lime: {
    headerGradient: 'linear-gradient(90deg, #d4f34a 0%, #bfe63b 48%, #7ebb27 100%)',
    headerGradientDown: 'linear-gradient(180deg, #a1d60f 0%, #c7f033 60%, #f0faa6 100%)',
    pageBg: '#f7f7f6',
    pageNavBg: '#b2e514',
    headerSolid: '#d4f34a',
    accent: '#83d414',
    accentText: '#1a1f16',
  },
  gold: {
    headerGradient: 'linear-gradient(90deg, #f7e052 0%, #edc71f 50%, #e2b15a 100%)',
    headerGradientDown: 'linear-gradient(180deg, #edc71f 0%, #f7e052 62%, #fff5c7 100%)',
    pageBg: '#fbf4e4',
    pageNavBg: '#edc71f',
    headerSolid: '#edc71f',
    accent: '#edc71f',
    accentText: '#1a1f16',
  },
  sky: {
    headerGradient: 'linear-gradient(90deg, #c5e8f8 0%, #8ec8ea 50%, #6eb4e0 100%)',
    headerGradientDown: 'linear-gradient(180deg, #8ec8ea 0%, #c5e8f8 55%, #eef7fc 100%)',
    pageBg: '#eef7fc',
    pageNavBg: '#8ec8ea',
    headerSolid: '#8ec8ea',
    accent: '#6eb4e0',
    accentText: '#142028',
  },
  dusk: {
    headerGradient: 'linear-gradient(90deg, #f5c5d6 0%, #e08aaa 50%, #d4789c 100%)',
    headerGradientDown: 'linear-gradient(180deg, #e08aaa 0%, #f5c5d6 55%, #fceef4 100%)',
    pageBg: '#fceef4',
    pageNavBg: '#e08aaa',
    headerSolid: '#e08aaa',
    accent: '#d4789c',
    accentText: '#ffffff',
  },
  photo: {
    headerGradient: 'linear-gradient(90deg, #c8f4e8 0%, #b8eddc 48%, #66c4b4 100%)',
    headerGradientDown: 'linear-gradient(180deg, #b8eddc 0%, #d6f5e8 55%, #f0fcf7 100%)',
    pageBg: '#f0fcf7',
    pageNavBg: '#b8eddc',
    headerSolid: '#b8eddc',
    accent: '#66c4b4',
    accentText: '#14211a',
  },
};

export const THEME_WINDOW: Record<AppTheme, { pageBg: string; headerTop: string }> = {
  mint: { pageBg: THEME_CHROME.mint.pageBg, headerTop: THEME_CHROME.mint.headerSolid },
  lime: { pageBg: THEME_CHROME.lime.pageBg, headerTop: THEME_CHROME.lime.headerSolid },
  gold: { pageBg: THEME_CHROME.gold.pageBg, headerTop: THEME_CHROME.gold.headerSolid },
  sky: { pageBg: THEME_CHROME.sky.pageBg, headerTop: THEME_CHROME.sky.headerSolid },
  dusk: { pageBg: THEME_CHROME.dusk.pageBg, headerTop: THEME_CHROME.dusk.headerSolid },
  photo: { pageBg: THEME_CHROME.photo.pageBg, headerTop: THEME_CHROME.photo.headerSolid },
};

export function isAppTheme(value: string): value is AppTheme {
  return THEME_KEYS.indexOf(value as AppTheme) !== -1;
}

/** 缓存里出现不认识的值时，退回默认薄荷，避免整站空白。 */
export function normalizeTheme(value: string | undefined | null): AppTheme {
  return value && isAppTheme(value) ? value : DEFAULT_THEME;
}

/** 内联到根节点。微信里这样改 CSS 变量才稳，class 经常改不动。 */
export function themeVarsOf(theme: AppTheme): string {
  const chrome = THEME_CHROME[theme] || THEME_CHROME.mint;
  return [
    `--header-gradient:${chrome.headerGradient}`,
    `--header-gradient-down:${chrome.headerGradientDown}`,
    `--page-bg:${chrome.pageBg}`,
    `--page-nav-bg:${chrome.pageNavBg}`,
    `--header-solid:${chrome.headerSolid}`,
    `--accent:${chrome.accent}`,
    `--accent-text:${chrome.accentText}`,
  ].join(';');
}

/** 一次给页面 / 组件 setData 的整包。themeBehavior 的初始 data 也是这份。 */
export function themePayload(theme: AppTheme): ThemePayload {
  const chrome = THEME_CHROME[theme] || THEME_CHROME.mint;
  return {
    theme,
    themeVars: themeVarsOf(theme),
    headerGradient: chrome.headerGradient,
    headerGradientDown: chrome.headerGradientDown,
    accent: chrome.accent,
    accentText: chrome.accentText,
  };
}

/** 先读本地缓存，没有再读 globalData，再没有用薄荷。 */
export function getAppTheme(): AppTheme {
  try {
    const stored = wx.getStorageSync(STORAGE_KEY);
    if (stored) {
      return normalizeTheme(stored);
    }
  } catch {
    // 读缓存失败就走下面的内存值
  }
  try {
    const app = getApp<IAppOption>();
    if (app && app.globalData && app.globalData.theme) {
      return normalizeTheme(app.globalData.theme);
    }
  } catch {
    // App 还没起来
  }
  return DEFAULT_THEME;
}

/** 下拉露底、内容不足一屏时的窗口底色。 */
export function paintWindow(theme: AppTheme) {
  const colors = THEME_WINDOW[theme] || THEME_WINDOW.mint;
  wx.setBackgroundColor({
    backgroundColor: colors.pageBg,
    backgroundColorTop: colors.headerTop,
    backgroundColorBottom: colors.pageBg,
  });
}

/** 已挂载、需要跟着换色的页面和组件。由 themeBehavior 自动登记。 */
const hosts: ThemeHost[] = [];

/**
 * 不写成 export function：微信把带 import 的文件当模块编译后，
 * 后声明的 export function 不会提升，bindTheme 里会报 paintHost is not defined。
 */
function paintHostImpl(host: ThemeHost, theme?: AppTheme) {
  if (!host || typeof host.setData !== 'function') {
    return;
  }
  try {
    host.setData({
      ...themePayload(theme || getAppTheme()),
      ...headerMetrics(),
    });
  } catch {
    // 量尺寸失败也不能把页面 onLoad 冲掉，顶栏至少还能用 CSS 安全区垫着
    host.setData(themePayload(theme || getAppTheme()));
  }
}

/** 挂上并立刻刷成当前主题。重复挂不会登记两次。 */
export function bindTheme(host: ThemeHost) {
  if (hosts.indexOf(host) === -1) {
    hosts.push(host);
  }
  paintHostImpl(host);
}

/** 页面卸载 / 组件销毁时摘掉，避免换色时给已经不在的页面 setData。 */
export function unbindTheme(host: ThemeHost) {
  const index = hosts.indexOf(host);
  if (index >= 0) {
    hosts.splice(index, 1);
  }
}

/** 只刷这一个。页面 onShow 时调用，保证切回来颜色是新的。 */
export function paintHost(host: ThemeHost, theme?: AppTheme) {
  paintHostImpl(host, theme);
}

function paintAll(theme: AppTheme) {
  const payload = {
    ...themePayload(theme),
    ...headerMetrics(),
  };
  const painted: ThemeHost[] = [];

  const paint = (host?: ThemeHost | null) => {
    if (!host || typeof host.setData !== 'function') {
      return;
    }
    if (painted.indexOf(host) >= 0) {
      return;
    }
    painted.push(host);
    host.setData(payload);
  };

  hosts.forEach(paint);

  getCurrentPages().forEach((page) => {
    paint(page as ThemeHost);
    try {
      const tabBar = typeof page.getTabBar === 'function' ? page.getTabBar() : undefined;
      paint(tabBar as ThemeHost | undefined);
    } catch {
      // 非 Tab 页没有底栏
    }
  });
}

/**
 * 「我的 → 更换背景」的入口。写缓存 → 刷窗口露底色 → 给所有已挂载 host 上色。
 * 页面不要自己调 paintAll，统一走这里。
 */
export function setAppTheme(value: string): AppTheme {
  const theme = normalizeTheme(value);
  try {
    wx.setStorageSync(STORAGE_KEY, theme);
  } catch {
    // 存储满了也不要卡住换色
  }
  try {
    const app = getApp<IAppOption>();
    if (app && app.globalData) {
      app.globalData.theme = theme;
    }
  } catch {
    // App 未就绪时，页面仍能从 storage 读到
  }
  paintWindow(theme);
  paintAll(theme);
  return theme;
}
