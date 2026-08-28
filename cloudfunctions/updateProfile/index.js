/**
 * 保存当前用户能改的资料。
 *
 * 能改：头像、昵称、手机、姓名、性别、惯用手、城市、
 *       常打项目、球龄、个性标签、个人简介、封面、主题。
 * 俱乐部只由 clubAction 写入，这里不要带 club，避免资料页空值把已加入的冲掉。
 * 不能改：评分、等级、积分、身价、胜场（设计写了比赛自动生成）。
 *
 * 头像不要让小程序直传云存储：部分网络（Clash 半开）会在 TLS 握手被掐。
 * 前端把压缩后的图改成 base64 放进 avatarBase64，这里用云函数身份上传，
 * 库里只存 cloud:// fileID。
 *
 * 资料完成度按已填项现算（头像/昵称/手机/姓名/城市/俱乐部/球龄/标签/简介/封面），
 * 不要信前端传来的 profileComplete，也不要沿用建号时写死的 20%。
 */
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const USERS = db.collection('users');

const ALLOWED = [
  'nickname',
  'avatar',
  'phone',
  'realName',
  'gender',
  'hand',
  'city',
  'play',
  'years',
  'tags',
  'bio',
  'cover',
  'theme',
];

const MAX_AVATAR_B64 = 400000;

function decodeAvatar(raw) {
  const text = String(raw || '');
  return text.replace(/^data:image\/[a-zA-Z0-9+]+;base64,/, '');
}

async function uploadAvatar(openid, base64) {
  const body = decodeAvatar(base64);
  if (!body) {
    throw new Error('头像数据是空的');
  }
  if (body.length > MAX_AVATAR_B64) {
    throw new Error('头像太大，请换一张更小的图');
  }
  const up = await cloud.uploadFile({
    cloudPath: `avatars/${openid}-${Date.now()}.jpg`,
    fileContent: Buffer.from(body, 'base64'),
  });
  if (!up || !up.fileID) {
    throw new Error('头像上传失败');
  }
  return up.fileID;
}

function completeLabel(doc) {
  const nickname = String(doc.nickname || '').trim();
  const avatar = String(doc.avatar || '');
  const hasText = (value) => String(value || '').trim().length > 0;
  const checks = [
    avatar && avatar !== '/assets/images/avatars/anime-01.jpg',
    nickname && nickname !== '微信用户' && nickname !== '登录',
    hasText(doc.phone),
    hasText(doc.realName),
    hasText(doc.city),
    hasText(doc.club) || hasText(doc.clubId),
    hasText(doc.years),
    hasText(doc.tags),
    hasText(doc.bio),
    hasText(doc.cover),
  ];
  const filled = checks.filter(Boolean).length;
  return `${Math.round((filled / checks.length) * 100)}%`;
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return { ok: false, error: '拿不到微信身份' };
  }

  const patch = event && event.patch ? event.patch : {};
  const data = {};
  ALLOWED.forEach((key) => {
    if (Object.prototype.hasOwnProperty.call(patch, key)) {
      data[key] = patch[key];
    }
  });

  let avatarError = '';
  if (patch.avatarBase64) {
    try {
      data.avatar = await uploadAvatar(OPENID, patch.avatarBase64);
    } catch (error) {
      avatarError = (error && error.message) || '头像上传失败';
    }
  }

  if (data.avatar && (String(data.avatar).indexOf('wxfile://') === 0
    || String(data.avatar).indexOf('http://tmp') === 0
    || String(data.avatar).indexOf('http://usr') === 0)) {
    delete data.avatar;
  }

  if (Object.keys(data).length === 0) {
    return { ok: false, error: avatarError || '没有可保存的字段' };
  }

  data.updatedAt = Date.now();

  const found = await USERS.where({ _openid: OPENID }).limit(1).get();
  const existing = found.data && found.data[0];
  if (!existing) {
    return { ok: false, error: '还没有用户，请先登录' };
  }

  data.profileComplete = completeLabel(Object.assign({}, existing, data));
  await USERS.doc(existing._id).update({ data });
  return {
    ok: true,
    avatar: data.avatar || existing.avatar,
    avatarFailed: !!avatarError,
    error: avatarError || undefined,
  };
};
