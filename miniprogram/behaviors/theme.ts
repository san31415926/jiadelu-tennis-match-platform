/**
 * ============================================================================
 * 主题接入 —— 页面和组件都挂这一份
 * ============================================================================
 *
 * 【怎么用】（新页 / 新组件只做这两步）
 *   import { themeBehavior } from '../../behaviors/theme';
 *   Page({ behaviors: [themeBehavior], ... })
 *   Component({ behaviors: [themeBehavior], ... })
 *   根节点写 style="{{themeVars}}"，按钮/筛选用 {{accent}} 或 var(--accent)
 *
 * 【不要用 definitionFilter 去改 onLoad】
 * 微信会把改过的函数塞进页面 data，控制台报 Free data with key "onLoad"，
 * 赛事这种 Tab 页实例化会坏掉，点底栏也没反应。
 *
 * 页面和组件都走 lifetimes.attached / detached。
 * 组件从别的页切回来时再走 pageLifetimes.show 刷一次色。
 *
 * 色值只改 utils/theme.ts 的 THEME_CHROME。
 */

import { bindTheme, getAppTheme, themePayload, unbindTheme } from '../utils/theme';

const initialTheme = getAppTheme();

export const themeBehavior = Behavior({
  data: themePayload(initialTheme),

  lifetimes: {
    attached() {
      bindTheme(this);
    },
    detached() {
      unbindTheme(this);
    },
  },

  pageLifetimes: {
    show() {
      bindTheme(this);
    },
  },
});
