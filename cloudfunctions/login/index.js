/**
 * 登录云函数。
 *
 * 小程序点「登录」时 create=true：没有用户就建一条，有就返回已有资料。
 * 小程序启动时 create=false：只查不建，没登录过的人保持游客。
 *
 * 用户身份用 cloud.getWXContext().OPENID，不要信前端传来的 id。
 * 手机号不要信前端明文。点了「授权手机号」会传来 phoneCode，
 * 这里用 openapi.phonenumber.getPhoneNumber 向微信换成真实号码再写入 users.phone。
 * 返回的 profile 字段名对齐 mock/profile.ts 的 ProfileSummary。
 */
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const USERS = db.collection('users');

const EMPTY_RADAR = {
  overall: 0,
  axes: [
    { label: '发球', value: 0 },
    { label: '正手', value: 0 },
    { label: '反手', value: 0 },
    { label: '网前', value: 0 },
    { label: '步伐', value: 0 },
    { label: '体能', value: 0 },
  ],
};

function newUid() {
  return String(10000000 + Math.floor(Math.random() * 89999999));
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

function formatPlayerId(uid) {
  const raw = String(uid || '')
    .replace(/^UID\s*/i, '')
    .replace(/^L-/i, '')
    .trim();
  if (!raw || raw === '--') {
    return 'L-ID --';
  }
  return `L-${raw}`;
}

function todayKey() {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

function isPlayerMember(doc) {
  if (doc && doc.memberPaused) {
    return false;
  }
  const until = String((doc && doc.memberUntil) || '').slice(0, 10);
  return !!until && until >= todayKey();
}

function toProfile(doc) {
  const uid = doc.uid || '';
  return {
    nickname: doc.nickname || '微信用户',
    avatar: doc.avatar || '/assets/images/avatars/anime-01.jpg',
    uid: formatPlayerId(uid),
    playerId: doc.playerId || formatPlayerId(uid),
    bio: doc.bio || '',
    cover: doc.cover || '',
    theme: doc.theme || 'mint',
    marketValue: doc.marketValue || '¥0',
    points: doc.points || '0',
    wins: doc.wins || '0',
    hand: doc.hand || '--',
    profileComplete: completeLabel(doc),
    clubRank: doc.clubRank || '--',
    clubMembers: doc.clubMembers || '--',
    recordSummary: doc.recordSummary || '登录后查看参赛记录',
    lastEvent: doc.lastEvent || '',
    radar: doc.radar || EMPTY_RADAR,
    phone: doc.phone || '',
    realName: doc.realName || '',
    gender: doc.gender || '男',
    city: doc.city || '',
    club: doc.club || '',
    clubId: doc.clubId || '',
    play: doc.play || '混双',
    years: doc.years || '',
    tags: doc.tags || '',
    rating: doc.rating || '--',
    level: doc.level || '--',
    power: doc.power || 0,
    memberUntil: String(doc.memberUntil || '').slice(0, 10),
    memberActive: isPlayerMember(doc),
    memberPaused: !!doc.memberPaused,
    lateWithdrawCount: Number(doc.lateWithdrawCount || 0),
    signupPriority: doc.signupPriority === 'low' ? 'low' : 'normal',
  };
}

function blankUser(openid) {
  const uid = newUid();
  const now = Date.now();
  return {
    _openid: openid,
    uid,
    nickname: '微信用户',
    avatar: '/assets/images/avatars/anime-01.jpg',
    bio: '',
    cover: '',
    theme: 'mint',
    marketValue: '¥0',
    points: '0',
    pointsValue: 0,
    wins: '0',
    hand: '右手',
    profileComplete: '0%',
    clubRank: '--',
    clubMembers: '--',
    recordSummary: '暂无参赛记录',
    lastEvent: '',
    radar: EMPTY_RADAR,
    phone: '',
    realName: '',
    gender: '男',
    city: '',
    club: '',
    clubId: '',
    play: '混双',
    years: '',
    tags: '',
    rating: '--',
    level: 'Lv.1',
    power: 0,
    memberUntil: '',
    memberPaused: false,
    lateWithdrawCount: 0,
    lateWithdrawYear: 0,
    signupPriority: 'normal',
    playerId: `L-${uid}`,
    createdAt: now,
    updatedAt: now,
  };
}

async function readPhone(phoneCode) {
  if (!phoneCode) {
    return '';
  }
  try {
    const res = await cloud.openapi.phonenumber.getPhoneNumber({
      code: phoneCode,
    });
    return (res && res.phoneInfo && res.phoneInfo.phoneNumber) || '';
  } catch (error) {
    console.error('换手机号失败', error);
    return '';
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return { ok: false, error: '拿不到微信身份，请用真机或已登录的开发者工具预览' };
  }

  const phone = await readPhone(event && event.phoneCode);
  const found = await USERS.where({ _openid: OPENID }).limit(1).get();
  const existing = found.data && found.data[0];
  const create = event && event.create !== false;

  if (existing) {
    const patch = {};
    if (phone && phone !== existing.phone) {
      patch.phone = phone;
      existing.phone = phone;
    }
    if (!existing.playerId && existing.uid) {
      patch.playerId = formatPlayerId(existing.uid);
      existing.playerId = patch.playerId;
    }
    if (Object.keys(patch).length > 0) {
      patch.updatedAt = Date.now();
      await USERS.doc(existing._id).update({ data: patch });
    }
    return { ok: true, exists: true, profile: toProfile(existing) };
  }

  if (!create) {
    return { ok: true, exists: false, profile: null };
  }

  const user = blankUser(OPENID);
  if (phone) {
    user.phone = phone;
  }
  await USERS.add({ data: user });
  return { ok: true, exists: true, profile: toProfile(user) };
};
