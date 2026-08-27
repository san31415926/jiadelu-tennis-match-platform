/**
 * 报名读写。不调微信支付，status 固定 pending。
 *
 * action: 'list'  —— 列出当前用户的报名，并带上对应赛事。
 * 不传 action     —— 写入一条报名；同一人同一场已报过就返回 duplicated。
 *
 * 报名是云函数写入的。集合若是「仅创建者可读写」，客户端 where {openid}
 * 读不到这些文档，首页「我的报名」会是空的，但再点报名会提示已经报过。
 * 所以列表必须走云函数，不要在小程序端直接查 registrations。
 */
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();
const REGS = db.collection('registrations');
const EVENTS = db.collection('events');

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
  return { ok: true, events, count: rows.length };
}

async function createOne(openid, event) {
  const eventId = event && event.eventId;
  const mode = event && event.mode === '组队' ? '组队' : '单人';
  const partnerUid = (event && event.partnerUid) || '';

  if (!eventId) {
    return { ok: false, error: '缺少赛事 id' };
  }

  const existed = await REGS.where({
    _openid: openid,
    eventId,
  })
    .limit(1)
    .get();

  if (existed.data && existed.data[0]) {
    return { ok: true, duplicated: true, id: existed.data[0]._id };
  }

  const now = Date.now();
  const added = await REGS.add({
    data: {
      _openid: openid,
      eventId,
      mode,
      partnerUid,
      status: 'pending',
      createdAt: now,
      updatedAt: now,
    },
  });

  return { ok: true, duplicated: false, id: added._id };
}

exports.main = async (event) => {
  const { OPENID } = cloud.getWXContext();
  if (!OPENID) {
    return { ok: false, error: '拿不到微信身份，请先登录' };
  }

  if (event && event.action === 'list') {
    return listMine(OPENID);
  }
  return createOne(OPENID, event);
};
