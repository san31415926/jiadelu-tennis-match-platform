/**
 * 加入或创建俱乐部。
 *
 * action=join：写入 club_members，更新 users.club / clubId，人数按实数回写。
 * action=create：新建一家俱乐部，自己当队长。
 * action=mine：读当前用户归属；成员记录缺失时补写，users.club 被冲掉时按 club_members 补回。
 *
 * 一个人同时只能在一家。换俱乐部会退出旧的，两家人数都按实数重算。
 * 第一次加入俱乐部免费用户可以；转会（已有一家再加入另一家）和创建俱乐部
 * 要有效年度选手会员。身价/分红按会员身份放行，不要把年费说成免报名费。
 * 不要从前端传 openid，身份用 cloud.getWXContext()。
 */
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
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

function todayKey() {
  return foundedToday();
}

function isPlayerMember(doc) {
  if (doc && doc.memberPaused) {
    return false;
  }
  const until = String((doc && doc.memberUntil) || '').slice(0, 10);
  return !!until && until >= todayKey();
}

function fail(error) {
  return { ok: false, error };
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

/** 人数按 club_members 实数回写，不要在种子 24 上 +1。 */
async function recountMembers(clubId) {
  if (!clubId) {
    return 0;
  }
  let total = 0;
  try {
    const counted = await MEMBERS.where({ clubId }).count();
    total = (counted && counted.total) || 0;
  } catch (error) {
    return 0;
  }
  const club = await readClub(clubId);
  const power = (club && club.power) || 0;
  const founded = (club && club.founded) || foundedToday();
  try {
    await CLUBS.doc(clubId).update({
      data: {
        members: total,
        meta: `成员 ${total} 人 · 战力 ${power} · 成立 ${founded}`,
      },
    });
  } catch (error) {
    // 俱乐部分子可能已不存在
  }
  return total;
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
  const next = Object.assign({}, user, { club: club.name, clubId: club.id });
  await USERS.doc(user._id).update({
    data: {
      club: club.name,
      clubId: club.id,
      profileComplete: completeLabel(next),
      updatedAt: Date.now(),
    },
  });
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return fail('拿不到微信身份，请先登录');
  }

  const action = event && event.action;

  /**
   * 我的俱乐部。报名同理：成员文档是云函数写的，客户端 {openid}
   * 经常读不到，所以归属也走云函数。
   */
  if (action === 'mine') {
    const existing = await readMyMember(OPENID);
    const user = await readUser(OPENID);
    const clubId = (existing && existing.clubId) || (user && user.clubId) || '';
    let clubName = (user && user.club) || '';
    const club = clubId ? await readClub(clubId) : null;
    if (clubId && !clubName) {
      clubName = (club && club.name) || '';
    }
    if (user && clubId && club && !existing) {
      await writeMembership(OPENID, user, club, false);
      await recountMembers(clubId);
    }
    if (user && clubId && (user.club !== clubName || user.clubId !== clubId)) {
      const next = Object.assign({}, user, { club: clubName, clubId });
      await USERS.doc(user._id).update({
        data: {
          club: clubName,
          clubId,
          profileComplete: completeLabel(next),
          updatedAt: Date.now(),
        },
      });
    }
    return { ok: true, clubId, clubName };
  }

  const user = await readUser(OPENID);
  if (!user) {
    return fail('还没有用户，请先登录');
  }

  const existing = await readMyMember(OPENID);
  const oldClubId = existing && existing.clubId ? existing.clubId : '';

  if (action === 'join') {
    const clubId = event && event.clubId;
    if (!clubId) {
      return fail('缺少俱乐部 id');
    }
    const club = await readClub(clubId);
    if (!club) {
      return fail('找不到这家俱乐部');
    }
    if (oldClubId === clubId) {
      await recountMembers(clubId);
      return { ok: true, already: true, clubId, clubName: club.name };
    }
    if (oldClubId && !isPlayerMember(user)) {
      return fail('转会需要有效的年度选手会员。加入第一家俱乐部不需要年费');
    }

    await writeMembership(OPENID, user, club, false);
    await recountMembers(oldClubId);
    await recountMembers(clubId);
    return { ok: true, already: false, clubId, clubName: club.name };
  }

  if (action === 'create') {
    const name = String((event && event.name) || '').trim();
    if (!name) {
      return fail('请填写俱乐部名称');
    }
    if (!isPlayerMember(user)) {
      return fail('创建俱乐部需要有效的年度选手会员（联赛准入）');
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
    await writeMembership(OPENID, user, club, true);
    await recountMembers(oldClubId);
    await recountMembers(clubId);
    return { ok: true, already: false, clubId, clubName: name };
  }

  return fail('未知操作');
};
