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
