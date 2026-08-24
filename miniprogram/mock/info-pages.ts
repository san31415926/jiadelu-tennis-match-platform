/**
 * ============================================================================
 * 商务合作 / 关于我们 / 联系客服 文案
 * ============================================================================
 *
 * 三页结构很像：青柠（或金色）头 + 3D 图标 + 一张说明卡。
 * 二维码现在是占位框，拿到真实图后把 qr 字段改成图片路径即可。
 */

export const BUSINESS_PAGE = {
  title: '商务合作',
  kicker: '品牌合作  ·  场地合作  ·  赛事赞助',
  cardTitle: '请添加客服微信',
  cardSub: '扫码添加，沟通场地、赞助与品牌合作事宜',
  qrHint: '将客服二维码\n放在这里',
  account: '客服微信（请填写微信号）',
  hours: '工作日 10:00–18:00 回复',
  icon: '/assets/icons/profile/business-handshake.png',
  mirrored: true,
};

export const ABOUT_PAGE = {
  title: '关于我们',
  kicker: 'LTJIMMY®  网球赛汇',
  cardTitle: '扫码了解我们',
  cardSub: '关注官方微信，了解赛事与平台动态',
  qrHint: '将公众号二维码\n放在这里',
  account: '公众号（请填写名称）',
  hours: '面向业余选手的网球赛事平台',
  icon: '/assets/icons/profile/about-us.png',
  mirrored: true,
};

export const SERVICE_PAGE = {
  title: '联系客服',
  kicker: '在线客服  ·  工作日 10:00–18:00',
  cardTitle: '联系在线客服',
  cardSub: '报名、赛程、积分等疑问，点下方按钮即可进入微信客服会话。',
  button: '联系在线客服',
  hours: '工作日 10:00–18:00 在线，通常几分钟内回复',
  icon: '/assets/icons/profile/customer-service.png',
  mirrored: false,
};
