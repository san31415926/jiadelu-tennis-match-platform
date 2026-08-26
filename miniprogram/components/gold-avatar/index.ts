/**
 * ============================================================================
 * 金框头像组件
 * ============================================================================
 *
 * 【这个组件包含什么】
 * 三层：圆形照片、金色金属圈（透明圆孔）、可选的青柠相机角标。
 * 金圈来自 Figma「我的资料」导出的独立切图，不是把头像和框烤在一张图里，
 * 所以以后换真实微信头像只改 src，不用重切金框。
 *
 * 【怎么用】
 *   <gold-avatar src="{{url}}" size="large" show-badge bind:avatartap="onAvatarTap" />
 *
 * size 四档：
 *   large   旧「我的 / 我的资料」装饰头用过，圈 192、头像 150、相机 58。V5 这两页已改圆图，这档暂时闲置
 *   club    俱乐部主页 logo，圈 160、头像 118（草稿 445:37）
 *   small   榜单列表，圈 86、头像 68，不带相机，才能放进 94rpx 高的行里
 *   member  俱乐部主页成员行，圈 72、头像 52（草稿 446:40）
 *
 * show-badge 为 true 才显示相机。只有「能改头像」的地方才打开，
 * 榜单上别人的头像不要加相机。
 *
 * 【切图在哪】
 *   金圈   /assets/images/gold-avatar-ring.png
 *   相机   /assets/icons/profile/camera-badge.png
 * 原图在 ui-slices/output/profile-edit/，压缩脚本见 tools/build-figma-assets.cjs。
 */
Component({
  properties: {
    /** 头像图路径。圆形裁切由 WXSS 的 border-radius 负责 */
    src: {
      type: String,
      value: '',
    },
    /** large = 我的页；club = 俱乐部主页 logo；small = 榜单；member = 成员行 */
    size: {
      type: String,
      value: 'large',
    },
    /** 是否显示右下角相机。改头像的入口才开 */
    showBadge: {
      type: Boolean,
      value: false,
    },
  },

  methods: {
    onTap() {
      this.triggerEvent('avatartap');
    },
  },
});
