/**
 * 加入或创建俱乐部。
 *
 * action=join：写入 club_members，更新 users.club / clubId，俱乐部人数 +1。
 * action=create：新建一家俱乐部，自己当队长。
 *
 * 一个人同时只能在一家。换俱乐部会退出旧的，旧俱乐部人数 -1。
 * 不要从前端传 openid，身份用 cloud.getWXContext()。
 */
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const USERS = db.collection('users');
const CLUBS = db.collection('clubs');
const MEMBERS = db.collection('club_members');

function todayJoinedAt() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `加入 ${y}-${m}-${d}`;
}

function foundedToday() {
  const now = new Date();
  const y = now.getFullYear();
  const m = `${now.getMonth() + 1}`.padStart(2, '0');
  const d = `${now.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function readUser(openid) {
  const found = await USERS.where({ _openid: openid }).limit(1).get();
  return found.data && found.data[0];
}

async function readClub(clubId) {
  try {
    const res = await CLUBS.doc(clubId).get();
    return res.data || null;
  } catch (error) {
    return null;
  }
}

async function readMyMember(openid) {
  try {
    const res = await MEMBERS.doc(`m-${openid}`).get();
    return res.data || null;
  } catch (error) {
    return null;
  }
}

async function leaveOldClub(oldClubId) {
  if (!oldClubId) {
    return;
  }
  try {
    await CLUBS.doc(oldClubId).update({
      data: {
        members: _.inc(-1),
      },
    });
  } catch (error) {
    // 旧俱乐部分子可能已不存在
  }
}

async function writeMembership(openid, user, club, captain) {
  const memberId = `m-${openid}`;
  await MEMBERS.doc(memberId).set({
    data: {
      id: memberId,
      clubId: club.id,
      memberId,
      nickname: user.nickname || '微信用户',
      avatar: user.avatar || '/assets/images/avatars/anime-01.jpg',
      joinedAt: todayJoinedAt(),
      power: user.power || 0,
      captain: !!captain,
      _openid: openid,
    },
  });
  await USERS.doc(user._id).update({
    data: {
      club: club.name,
      clubId: club.id,
      updatedAt: Date.now(),
    },
  });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return { ok: false, error: '拿不到微信身份，请先登录' };
  }

  const action = event && event.action;

  /**
   * 我的俱乐部。报名同理：成员文档是云函数写的，客户端 {openid}
   * 经常读不到，所以归属也走云函数。
   */
  if (action === 'mine') {
    const existing = await readMyMember(OPENID);
    const user = await readUser(OPENID);
    return {
      ok: true,
      clubId: (existing && existing.clubId) || (user && user.clubId) || '',
      clubName: (user && user.club) || '',
    };
  }

  const user = await readUser(OPENID);
  if (!user) {
    return { ok: false, error: '还没有用户，请先登录' };
  }

  const existing = await readMyMember(OPENID);
  const oldClubId = existing && existing.clubId ? existing.clubId : '';

  if (action === 'join') {
    const clubId = event && event.clubId;
    if (!clubId) {
      return { ok: false, error: '缺少俱乐部 id' };
    }
    const club = await readClub(clubId);
    if (!club) {
      return { ok: false, error: '找不到这家俱乐部' };
    }
    if (oldClubId === clubId) {
      return { ok: true, already: true, clubId, clubName: club.name };
    }

    await leaveOldClub(oldClubId);
    await writeMembership(OPENID, user, club, false);
    await CLUBS.doc(clubId).update({
      data: {
        members: _.inc(1),
      },
    });
    return { ok: true, already: false, clubId, clubName: club.name };
  }

  if (action === 'create') {
    const name = String((event && event.name) || '').trim();
    if (!name) {
      return { ok: false, error: '请填写俱乐部名称' };
    }
    const city = String((event && event.city) || user.city || '广州').trim() || '广州';
    const clubId = `club-${Date.now()}`;
    const founded = foundedToday();
    const power = user.power || 0;
    const club = {
      id: clubId,
      name,
      logo: '/assets/images/club/logo-1.jpg',
      members: 1,
      power,
      founded,
      meta: `成员 1 人 · 战力 ${power} · 成立 ${founded}`,
      city,
      recruiting: true,
      powerRank: 999,
      monthPoints: 0,
      monthPower: 0,
      points: 0,
      rankPower: power,
    };
    await CLUBS.doc(clubId).set({ data: club });
    await leaveOldClub(oldClubId);
    await writeMembership(OPENID, user, club, true);
    return { ok: true, already: false, clubId, clubName: name };
  }

  return { ok: false, error: '未知操作' };
};
