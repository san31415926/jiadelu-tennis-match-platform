/**
 * 赛事组队招募。不是约球匹配，只改本场 teamRecruits / team_applies。
 *
 * action=publishRecruit：往这场 events.teamRecruits 前面插一条。
 * action=applyRecruit：写入 team_applies，方便控制台看到谁申请了谁。
 */
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const USERS = db.collection('users');
const EVENTS = db.collection('events');

async function ensureCollection(name) {
  try {
    await db.createCollection(name);
  } catch (error) {
    // 已经有了会抛错
  }
}

async function readUser(openid) {
  const found = await USERS.where({ _openid: openid }).limit(1).get();
  return found.data && found.data[0];
}

async function readEvent(eventId) {
  try {
    const res = await EVENTS.doc(String(eventId)).get();
    return res.data || null;
  } catch (error) {
    return null;
  }
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return { ok: false, error: '拿不到微信身份，请先登录' };
  }

  const user = await readUser(OPENID);
  if (!user) {
    return { ok: false, error: '还没有用户，请先登录' };
  }

  const action = event && event.action;
  const eventId = event && event.eventId;
  if (!eventId) {
    return { ok: false, error: '缺少赛事 id' };
  }

  const row = await readEvent(eventId);
  if (!row) {
    return { ok: false, error: '找不到这场赛事' };
  }

  if (action === 'publishRecruit') {
    const need = String((event && event.need) || '不限');
    const deadline = String((event && event.deadline) || '');
    const note = String((event && event.note) || '').slice(0, 80);
    const grade = row.grade || '';
    const category = row.category || '';
    const needText =
      need === '女搭档'
        ? `缺女搭档 · ${grade}${category}`
        : need === '男搭档'
          ? `缺男搭档 · ${grade}${category}`
          : `不限性别 · ${deadline || '开赛'}前组好`;
    const recruit = {
      id: `t-${OPENID.slice(-6)}-${Date.now()}`,
      name: user.nickname || '微信用户',
      avatar: user.avatar || '/assets/images/avatars/anime-01.jpg',
      need: note ? `${needText} · ${note}` : needText,
      points: Number(String(user.points || '0').replace(/[^\d]/g, '')) || 0,
    };
    const teamRecruits = [recruit].concat(Array.isArray(row.teamRecruits) ? row.teamRecruits : []);
    await EVENTS.doc(String(eventId)).update({
      data: {
        teamRecruits,
      },
    });
    return { ok: true, teamRecruits };
  }

  if (action === 'applyRecruit') {
    const recruitId = String((event && event.recruitId) || '');
    const recruitName = String((event && event.recruitName) || '');
    if (!recruitId && !recruitName) {
      return { ok: false, error: '缺少招募 id' };
    }
    await ensureCollection('team_applies');
    const applyId = `a-${OPENID}-${eventId}-${recruitId || recruitName}`;
    await db.collection('team_applies').doc(applyId).set({
      data: {
        id: applyId,
        eventId,
        recruitId,
        recruitName,
        applicant: user.nickname || '微信用户',
        avatar: user.avatar || '/assets/images/avatars/anime-01.jpg',
        _openid: OPENID,
        createdAt: Date.now(),
      },
    });
    return { ok: true, applied: true };
  }

  return { ok: false, error: '未知操作' };
};
