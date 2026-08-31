/**
 * 报名读写。不调微信支付，status 默认 pending。
 *
 * action: 'list'     —— 列出当前用户的报名，并带上对应赛事。
 * action: 'withdraw' —— 退赛必须走这里，不要在后台直接删报名。
 * 不传 action        —— 写入一条报名；同一人同一场未退赛则 duplicated。
 *
 * 【巡回赛级别】读 events.tourSeries，不要去动 events.series（那是品牌文案）。
 * open = 公开体验赛，免费用户可报。
 * L-15 / L-25 / masters = 要年度选手会员（users.memberUntil 未过期）。
 * L-25 巡回赛排名在 qualifyingCutoff 之外进预选（超签）。
 * masters 只录取 rankPoints 52 周榜前 mastersTopN。
 * 年费不是免单站报名费。支付未开通时，运营在后台填会员有效至即可放行。
 *
 * 【退赛】免费退赛截止前不算迟退。截止后算迟退，每年 3 次豁免，超出后
 * signupPriority 降为 low（再报名会进候补）。比赛开始后不能退。
 */
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const _ = db.command;
const REGS = db.collection('registrations');
const EVENTS = db.collection('events');
const USERS = db.collection('users');
const RECORDS = db.collection('match_records');

const LATE_WITHDRAW_EXEMPT = 3;

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

function tourSeriesOf(match) {
  const text = String((match && match.tourSeries) || 'open');
  if (text === 'L-15' || text === 'L-25' || text === 'masters') {
    return text;
  }
  return 'open';
}

function tourNeedsMember(tour) {
  return tour === 'L-15' || tour === 'L-25' || tour === 'masters';
}

const RANK_WINDOW_DAYS = 52 * 7;

function inRankWindow(dateKey) {
  const key = String(dateKey || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) {
    return false;
  }
  const played = Date.parse(`${key}T00:00:00`);
  if (!played) {
    return false;
  }
  return Date.now() - played <= RANK_WINDOW_DAYS * 24 * 3600 * 1000;
}

async function tourPointsOf(openid, stored) {
  const fromUser = Number(stored || 0);
  try {
    const recs = await RECORDS.where({ _openid: openid }).limit(50).get();
    const rows = (recs && recs.data) || [];
    let sum = 0;
    let has = false;
    rows.forEach((row) => {
      const pts = Number(row.rankPoints || 0);
      if (!pts || row.demo) {
        return;
      }
      if (row.dateKey && !inRankWindow(row.dateKey)) {
        return;
      }
      has = true;
      sum += pts;
    });
    if (has) {
      return sum;
    }
  } catch (error) {
    // 没有参赛记录集合时退回 users.rankPoints
  }
  return fromUser;
}

async function officialRankOf(openid, user) {
  const mine = await tourPointsOf(openid, user && user.rankPoints);
  if (mine <= 0) {
    return 0;
  }
  const counted = await USERS.where({
    rankPoints: _.gt(mine),
  }).count();
  return ((counted && counted.total) || 0) + 1;
}

function fail(error) {
  return { ok: false, error };
}

async function loadEvent(eventId) {
  try {
    const doc = await EVENTS.doc(String(eventId)).get();
    if (doc.data) {
      return { ...doc.data, id: doc.data.id || eventId };
    }
  } catch (error) {
    // _id 对不上时，再按业务 id 字段找一次
  }
  const byField = await EVENTS.where({ id: String(eventId) }).limit(1).get();
  const row = byField.data && byField.data[0];
  if (!row) {
    return null;
  }
  return { ...row, id: row.id || eventId };
}

async function readUser(openid) {
  const found = await USERS.where({ _openid: openid }).limit(1).get();
  return found.data && found.data[0];
}

async function findReg(openid, eventId) {
  const existed = await REGS.where({
    _openid: openid,
    eventId,
  })
    .limit(1)
    .get();
  return existed.data && existed.data[0];
}

async function listMine(openid) {
  const regs = await REGS.where({ _openid: openid }).limit(20).get();
  const rows = regs.data || [];
  const events = [];
  const seen = {};
  for (let i = 0; i < rows.length; i += 1) {
    const eventId = rows[i].eventId;
    if (!eventId || seen[eventId]) {
      continue;
    }
    seen[eventId] = true;
    const event = await loadEvent(eventId);
    if (event) {
      events.push(event);
    }
  }
  return {
    ok: true,
    events,
    registrations: rows,
    count: rows.length,
  };
}

async function createOne(openid, event) {
  const eventId = event && event.eventId;
  const mode = event && event.mode === '组队' ? '组队' : '单人';
  const partnerUid = (event && event.partnerUid) || '';

  if (!eventId) {
    return fail('缺少赛事 id');
  }

  const match = await loadEvent(eventId);
  if (!match) {
    return fail('找不到这场赛事');
  }
  if (match.status && match.status !== '报名中') {
    return fail('这场已经截止报名');
  }

  const deadline = String(match.signupDeadline || '').slice(0, 10);
  if (deadline && todayKey() > deadline) {
    return fail('报名已截止');
  }

  const user = await readUser(openid);
  if (!user) {
    return fail('还没有用户，请先登录');
  }

  const tour = tourSeriesOf(match);
  if (tourNeedsMember(tour)) {
    if (!isPlayerMember(user)) {
      return fail('报 L-15 / L-25 需开通年度选手会员。年费不是免单站报名费，请到「我的」开通，或让运营填写会员有效至');
    }
    if (!String(user.realName || '').trim() || !String(user.phone || '').trim()) {
      return fail('报积分赛请先在资料里填写真实姓名和手机号');
    }
  }

  let draw = 'main';
  if (tour === 'L-25') {
    const rank = await officialRankOf(openid, user);
    const cutoff = Number(match.qualifyingCutoff || 16);
    draw = rank > 0 && rank <= cutoff ? 'main' : 'qualifying';
  }
  if (tour === 'masters') {
    const rank = await officialRankOf(openid, user);
    const topN = Number(match.mastersTopN || 8);
    if (!rank || rank > topN) {
      return fail(`年终大师赛只录取巡回赛排名前 ${topN}。你当前排名不足，先打 L-15 / L-25 攒 52 周积分`);
    }
  }

  const existed = await findReg(openid, eventId);
  if (existed && existed.status !== 'withdrawn') {
    return { ok: true, duplicated: true, id: existed._id, status: existed.status };
  }

  const status = user.signupPriority === 'low' ? 'waitlist' : 'pending';
  const now = Date.now();
  const payload = {
    _openid: openid,
    eventId,
    mode,
    partnerUid,
    status,
    tourSeries: tour,
    draw,
    createdAt: now,
    updatedAt: now,
  };

  if (existed && existed.status === 'withdrawn') {
    await REGS.doc(existed._id).update({ data: payload });
    return { ok: true, duplicated: false, id: existed._id, status, draw };
  }

  const added = await REGS.add({ data: payload });
  return { ok: true, duplicated: false, id: added._id, status, draw };
}

async function withdrawOne(openid, event) {
  const eventId = event && event.eventId;
  if (!eventId) {
    return fail('缺少赛事 id');
  }

  const row = await findReg(openid, eventId);
  if (!row || row.status === 'withdrawn') {
    return fail('你还没有报名这场');
  }

  const match = await loadEvent(eventId);
  if (match && (match.status === '进行中' || match.status === '已结束')) {
    return fail('比赛已开始，不能退赛');
  }

  const freeUntil = String(
    (match && (match.withdrawDeadline || match.signupDeadline)) || '',
  ).slice(0, 10);
  const late = !!freeUntil && todayKey() > freeUntil;

  const user = await readUser(openid);
  let remainingExempt = LATE_WITHDRAW_EXEMPT;
  let signupPriority = 'normal';
  let usedExemption = false;

  if (late && user) {
    const year = new Date().getFullYear();
    let count = Number(user.lateWithdrawCount || 0);
    const countYear = Number(user.lateWithdrawYear || 0);
    if (countYear !== year) {
      count = 0;
    }
    count += 1;
    usedExemption = count <= LATE_WITHDRAW_EXEMPT;
    remainingExempt = Math.max(0, LATE_WITHDRAW_EXEMPT - count);
    signupPriority = count > LATE_WITHDRAW_EXEMPT ? 'low' : 'normal';
    await USERS.doc(user._id).update({
      data: {
        lateWithdrawCount: count,
        lateWithdrawYear: year,
        signupPriority,
        updatedAt: Date.now(),
      },
    });
  }

  await REGS.doc(row._id).update({
    data: {
      status: 'withdrawn',
      late,
      withdrawnAt: Date.now(),
      updatedAt: Date.now(),
    },
  });

  return {
    ok: true,
    late,
    usedExemption,
    remainingExempt,
    signupPriority,
  };
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return fail('拿不到微信身份，请先登录');
  }

  if (event && event.action === 'list') {
    return listMine(OPENID);
  }
  if (event && event.action === 'withdraw') {
    return withdrawOne(OPENID, event);
  }
  return createOne(OPENID, event);
};
