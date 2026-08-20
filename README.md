# 嘉得路网球对战平台（LTJIMMY 网球赛事）

微信小程序端 + 设计资产 + 切图工具链。当前阶段：**从 Figma 定稿设计稿还原小程序界面**。

## 仓库结构

| 目录 | 内容 |
| --- | --- |
| `miniprogram/` | 微信小程序工程（原生 + TypeScript） |
| `测试图/` | Figma 导出的定稿页面图与 3D 图标素材板，是视觉验收的基准 |
| `ui-slices/` | 早期切图脚本与产物（sharp 图像流水线） |
| `tools/` | 设计稿取色、图标包围盒检测、波浪路径提取、Figma 资产下载与压缩脚本 |
| `功能清单.md` | 旧版小程序功能盘点与新版归位表，开发范围以此为准 |

## 设计稿来源

Figma 文件「网球赛事总结」，file key `nzKWauHC37fyjpAtA3rjfd`，已定稿画板：

| 画板 | node id | 对应页面 |
| --- | --- | --- |
| Tennis Home / Editable Screen | `1:206` | 赛事首页（三个版本仅筛选 Tab 选中态不同） |
| Super Cup / Prototype Screen | `1:307` | 超级杯 |
| My / Prototype Screen | `10:211` | 我的 |
| Player Rankings / Prototype Screen | `15:2` | 球员排行（TOP15 版） |
| Event Calendar / Prototype Screen | `17:92` | 赛事日历 |
| Gallery / Prototype Screen | `23:272` | 赛事相册 |
| Club / Prototype Screen | `23:343` | 俱乐部 |

画板宽 **750px**，与小程序 750rpx 基准一致，因此**设计稿 1px 直接写作 1rpx**。画板高 1184px
短于真机可视高度，页面按「头部固定高度 + 内容区流式」实现，不要按画板总高等比缩放。

设计 token 统一收在 `miniprogram/styles/tokens.wxss`，取值全部来自 Figma 节点，不是目视估值。

## 本地环境准备

### 小程序

1. 安装[微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/stable.html)稳定版。
2. 导入 `miniprogram/` 目录，编译类型选「小程序」。
3. 把 `miniprogram/project.config.json` 里的 `appid` 换成自己的 AppID。
4. TypeScript 由开发者工具的编译插件处理（`useCompilerPlugins: ["typescript"]`），无需额外构建步骤。

云开发环境 ID 填在 `miniprogram/config/env.ts`；留空时全站走 `miniprogram/mock/` 下的假数据。

### 图像处理脚本

`tools/` 与 `ui-slices/` 下的脚本依赖 `sharp`，当前复用了同级 `image-to-slice-tool` 项目的
`node_modules`（该目录不在本仓库内）。如需运行这些脚本，先在同级目录准备该项目：

```bash
git clone https://github.com/Asai2080/Figma-design.git image-to-slice-tool
cd image-to-slice-tool && npm install
```

脚本用途：

| 脚本 | 用途 |
| --- | --- |
| `tools/sample-design-colors.cjs` | 定点采样定稿图颜色，输出 hex |
| `tools/detect-icon-boxes.cjs` | 自动检测图标素材板上每个图标的包围盒 |
| `tools/extract-wave-path.cjs` | 提取头部渐变区下缘的波浪曲线，生成 SVG path |
| `tools/probe-crop.cjs` | 裁剪并放大指定区域，用于人工核对切图坐标 |
| `tools/build-mp-icons.cjs` | 把切图资产整理压缩进小程序 assets |
| `tools/fetch-figma-assets.ps1` | 下载 Figma MCP 导出的资产（地址 7 天过期） |
| `tools/build-figma-assets.cjs` | 压缩 Figma 原始资产到小程序显示尺寸 |

## Figma → 代码工作流

通过 Figma 远程 MCP（`https://mcp.figma.com/mcp`）读取设计上下文，拿到每个节点的精确坐标、
颜色、字号、圆角与导出资产，再改写为 WXML/WXSS。要点：

- 简单几何图标（圆点、圆环、圆角条、椭圆光晕）用纯 WXSS 实现，不占包体积。
- 3D 图标与照片使用 Figma 导出的原始资产，按各自标注尺寸单独设定宽高，不套用统一尺寸。
- 底栏未选中图标在设计中带 `opacity: 52%`，用 CSS 控制，不要把它烘进图片。

小程序主包上限 2MB，`miniprogram/assets/` 当前约 220KB。

## 开发范围

本期实现 `功能清单.md` 中已有设计稿的页面；**对战 / 约战匹配不做**。底部三 Tab：赛事 / 超级杯 / 我的，
榜单作为首页宫格进入的二级页。

## 当前进度

| 页面 | Figma 节点 | 状态 |
| --- | --- | --- |
| 赛事首页 | `1:206` | 已还原 |
| 超级杯 | `1:307` | 已还原 |
| 我的 | `10:212` | 已还原 |
| 球员排行 | `15:3` | 已还原 |
| 赛事日历 | `17:93` | 已还原 |
| 俱乐部 | `23:343` | 已还原 |
| 赛事相册 | `23:272` | 已还原 |
| 积分兑换 / 历届冠军 / 年会典礼 / 赛事详情 / 我的资料 / 参赛记录 / 关于我们 / 商务合作 | — | 无设计稿 |

**所有已定稿的设计页面均已还原完毕。**

### 已实现的页面状态

设计稿中同一页面往往画了多个状态（例如首页三个画板只是筛选项选中态不同，榜单两个画板
只是城市榜/全国榜选中态相反），这些都收敛成同一页面的动态状态：

| 页面 | 状态维度 | 说明 |
| --- | --- | --- |
| 首页 / 超级杯 | 我的报名 / 报名中 / 进行中 / 已结束 | 四组数据独立；「我的报名」未登录时提示登录 |
| 首页 | 宫格「我的报名」入口 | 等同于切到该筛选，不跳页 |
| 榜单 | 城市榜 / 全国榜 | 城市榜按当前用户城市过滤 |
| 榜单 | 积分 / 身价 / 战力 | 三个指标各自独立取值，排序结果不同，身价带货币格式 |
| 榜单 | 收起 / 展开 TOP50 | 收起时只露出 4~6 名，与设计一致 |
| 俱乐部 | 全部 / 同城 / 招新中 / 战力榜前50 | 可与搜索关键词叠加 |
| 俱乐部 | 申请加入 / 已加入 | 已加入用金色描边区分 |
| 相册 | 全部 / 超级杯 / 新秀杯 / 评级赛 / 赛程表 | 按分组分类过滤 |
| 日历 | 日期选中、翻月、今日回跳、有无赛事 | 固定 6 周网格避免高度跳动 |
| 我的 | 未登录 / 已登录 | 未登录沿用同一布局，数值为占位符（功能清单要求，设计稿未画） |

登录态存在 `app.globalData.isLoggedIn`，供首页与超级杯的「我的报名」共享。

页面全部使用 `miniprogram/mock/` 下的假数据，交互点击给出提示。尚未还原的入口在
`miniprogram/utils/navigate.ts` 的白名单外，点击只提示不跳转；新页面还原后在该白名单和
`app.json` 的 `pages` 中登记即可生效。

共用组件：

| 组件 | 用途 |
| --- | --- |
| `components/hero-carousel/` | 渐变头部 + 轮播 + 指示点（首页、超级杯） |
| `components/filter-tabs/` | 报名状态筛选，选中色可配置 |
| `components/event-card/` | 赛事卡片（首页、超级杯、日历） |
| `custom-tab-bar/` | 自定义底栏，选中光晕用 CSS 绘制 |

## 待办

1. **接入微信云开发**：填写 `miniprogram/config/env.ts` 的环境 ID，建立赛事、俱乐部、球员、
   报名四张集合，把 `mock/` 换成云函数调用。
3. **拆分金框头像**：我的页与榜单页的金色相框和头像在设计中是合成图，接入真实头像需要拆成两层。
4. **确认字号**：设计稿正文字号偏小（卡片信息 17rpx ≈ 8.5pt，标题 24rpx ≈ 12pt），已严格照设计实现，
   真机验证后再决定是否整体放大一档。
5. **替换示例图片**：榜单头像、俱乐部 logo、球场照片目前是本地示例资产，应改为云存储网络图。
6. 企业主体认证与微信支付商户号（报名收费需要），自建后端时还需域名备案。
