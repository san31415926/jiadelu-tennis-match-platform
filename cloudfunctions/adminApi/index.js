/**
 * 运营后台入口。网页不能直接 wx.cloud，所以所有增删改查都走这里。
 *
 * 云函数带管理员权限，能改任何人的文档（报名、用户、成员都算）。
 * 小程序还是读原来的集合，后台改完刷新小程序就能看到。
 *
 * action=login  运营账号登录，返回 token
 * action=me / codes / menus  登录后的用户信息
 * action=list / save / remove  读写云库，必须带 token
 *
 * 公网 HTTP 打开后，网页用 https 调这里。先配环境变量 ADMIN_PASSWORD，
 * 再开通公网访问，否则谁拿到地址都能改库。
 */
const crypto = require('crypto');
const cloud = require('wx-server-sdk');

/** 和后台 / 小程序同一个环境。HTTP 调云函数时 DYNAMIC_CURRENT_ENV 经常是空的。 */
const CLOUD_ENV = 'cloud1-d9go68a317d35c262';

cloud.init({ env: CLOUD_ENV });

const db = cloud.database();

const COLLECTIONS = {
  events: { idField: 'id' },
  clubs: { idField: 'id' },
  galleries: { idField: 'id' },
  posters: { idField: 'id' },
  venues: { idField: 'id' },
  players: { idField: 'id' },
  match_records: { idField: 'id' },
  club_members: { idField: 'id' },
  users: { idField: '_id', autoId: true },
  registrations: { idField: '_id', autoId: true },
  team_applies: { idField: 'id' },
};

const ADMIN_USERS = 'admin_users';
const TOKEN_TTL_MS = 7 * 24 * 3600 * 1000;
const TOKEN_SECRET = String(process.env.ADMIN_TOKEN_SECRET || 'jiadelu-adminApi-token');

function hashPassword(password) {
  return crypto.pbkdf2Sync(String(password), TOKEN_SECRET, 12000, 32, 'sha256').toString('hex');
}

function signToken(user) {
  const body = Buffer.from(
    JSON.stringify({
      username: user.username,
      realName: user.realName,
      roles: user.roles || ['super'],
      exp: Date.now() + TOKEN_TTL_MS,
    }),
  ).toString('base64');
  const sig = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('hex');
  return `${body}.${sig}`;
}

function readToken(raw) {
  const text = String(raw || '').replace(/^Bearer\s+/i, '').trim();
  const parts = text.split('.');
  if (parts.length !== 2) {
    return null;
  }
  const [body, sig] = parts;
  const expect = crypto.createHmac('sha256', TOKEN_SECRET).update(body).digest('hex');
  if (expect !== sig) {
    return null;
  }
  try {
    const data = JSON.parse(Buffer.from(body, 'base64').toString('utf8'));
    if (!data || !data.exp || Date.now() > Number(data.exp)) {
      return null;
    }
    return data;
  } catch (error) {
    return null;
  }
}

function isHttp(event) {
  return !!(event && (event.httpMethod || event.requestContext));
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, Accept-Language',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
  };
}

function httpWrap(payload, statusCode) {
  return {
    statusCode: statusCode || 200,
    headers: corsHeaders(),
    body: JSON.stringify(payload),
  };
}

function toClient(result) {
  if (!result || result.ok === false) {
    return {
      code: -1,
      message: (result && result.error) || '失败',
      data: null,
    };
  }
  if (result.accessToken) {
    return { code: 0, data: { accessToken: result.accessToken } };
  }
  if (result.user && !result.list && !result.row) {
    return { code: 0, data: result.user };
  }
  if (result.codes) {
    return { code: 0, data: result.codes };
  }
  if (result.menus) {
    return { code: 0, data: result.menus };
  }
  return { code: 0, data: result };
}

function headerToken(event) {
  const headers = (event && event.headers) || {};
  return String(headers.Authorization || headers.authorization || '').trim();
}

function parseDateKey(time, year) {
  const hit = String(time || '').match(/(\d{1,2})月(\d{1,2})日/);
  if (!hit) {
    return '';
  }
  const y = year || new Date().getFullYear();
  const month = hit[1].length < 2 ? `0${hit[1]}` : hit[1];
  const day = hit[2].length < 2 ? `0${hit[2]}` : hit[2];
  return `${y}-${month}-${day}`;
}

function stripDoc(row) {
  const next = { ...(row || {}) };
  delete next._id;
  return next;
}

function normalize(name, data, isCreate) {
  const row = { ...(data || {}) };
  const now = Date.now();

  if (name === 'events') {
    const status = row.status === '进行中' || row.status === '已结束' ? row.status : '报名中';
    const category = String(row.category || '混双');
    const slots = String(row.slots || '8/16');
    const line = row.line === 'super-cup' ? 'super-cup' : 'personal';
    row.status = status;
    row.line = line;
    row.category = category;
    row.slots = slots;
    row.statusLabel = row.statusLabel || status;
    row.slotCaption = row.slotCaption || `${category}·${slots}签`;
    row.actionText =
      row.actionText ||
      (status === '已结束' ? '查看成绩' : status === '进行中' ? '查看对阵' : '立即报名');
    row.poster = row.poster || '/assets/images/court-photo.jpg';
    row.grade = row.grade || '7.0';
    row.gradeTone = row.gradeTone === 'green' ? 'green' : 'orange';
    row.price = row.price || '¥158';
    row.area = row.area || '广州';
    row.tags = Array.isArray(row.tags) ? row.tags : [];
    row.dateKey = row.dateKey || parseDateKey(row.time, 2026);
    if (isCreate && !row.id) {
      row.id = `${line === 'super-cup' ? 'sc' : 'e'}-${now}`;
    }
  }

  if (name === 'clubs') {
    const members = Number(row.members || 0);
    const power = Number(row.power || 0);
    const founded = String(row.founded || '');
    row.members = members;
    row.power = power;
    row.founded = founded;
    row.meta = row.meta || `成员 ${members} 人 · 战力 ${power} · 成立 ${founded}`;
    row.recruiting = !!row.recruiting;
    row.powerRank = Number(row.powerRank || 999);
    row.monthPoints = Number(row.monthPoints || 0);
    row.monthPower = Number(row.monthPower || power);
    row.points = Number(row.points || 0);
    row.rankPower = Number(row.rankPower || power);
    row.logo = row.logo || '/assets/images/club/logo-1.jpg';
    row.city = row.city || '广州';
    if (isCreate && !row.id) {
      row.id = `club-${now}`;
    }
  }

  if (name === 'galleries') {
    row.photos = Array.isArray(row.photos) ? row.photos.filter(Boolean) : [];
    row.count = `${row.photos.length} 张`;
    if (!Array.isArray(row.titleParts) || row.titleParts.length === 0) {
      const text = String(row.title || row.subtitle || '未命名相册');
      row.titleParts = [{ text }];
    }
    row.layout = row.layout === 'bracket' ? 'bracket' : 'photo';
    row.category = row.category || '超级杯';
    if (isCreate && !row.id) {
      row.id = `gallery-${now}`;
    }
  }

  if (name === 'posters' && isCreate && !row.id) {
    row.id = `poster-${now}`;
  }

  if (name === 'venues') {
    row.venueNames = Array.isArray(row.venueNames)
      ? row.venueNames
      : String(row.venueNames || '')
          .split(/[,，]/)
          .map((item) => item.trim())
          .filter(Boolean);
    row.hero = row.hero && typeof row.hero === 'object' ? row.hero : { cover: '', featured: '', events: '' };
    if (isCreate && !row.id) {
      row.id = `venue-${now}`;
    }
  }

  if (name === 'players') {
    row.points = Number(row.points || 0);
    row.marketValue = Number(row.marketValue || 0);
    row.power = Number(row.power || 0);
    row.avatar = row.avatar || '/assets/images/avatars/anime-01.jpg';
    if (isCreate && !row.id) {
      row.id = `p-${now}`;
    }
  }

  if (name === 'match_records') {
    row.result = row.result === '负' ? '负' : '胜';
    if (isCreate && !row.id) {
      row.id = `r-${now}`;
    }
  }

  if (name === 'club_members') {
    row.captain = !!row.captain;
    row.power = Number(row.power || 0);
    row.avatar = row.avatar || '/assets/images/avatars/anime-01.jpg';
    if (isCreate && !row.id) {
      const clubId = String(row.clubId || 'club');
      const memberId = String(row.memberId || now);
      row.memberId = memberId;
      row.id = `${clubId}_${memberId}`;
    }
  }

  if (name === 'users') {
    row.updatedAt = now;
    if (isCreate) {
      row.createdAt = row.createdAt || now;
    }
  }

  if (name === 'registrations') {
    row.updatedAt = now;
    row.status = row.status || 'pending';
    row.mode = row.mode === '组队' ? '组队' : '单人';
    if (isCreate) {
      row.createdAt = row.createdAt || now;
    }
  }

  if (name === 'team_applies' && isCreate && !row.id) {
    row.id = `a-${now}`;
    row.createdAt = row.createdAt || now;
  }

  return row;
}

async function readDoc(col, id) {
  try {
    const res = await col.doc(String(id)).get();
    return res.data || null;
  } catch (error) {
    return null;
  }
}

async function ensureCollection(name) {
  try {
    await db.createCollection(name);
  } catch (error) {
    // 已经有了会抛错
  }
}

async function listCollection(name) {
  const col = db.collection(name);
  const rows = [];
  let skip = 0;
  const pageSize = 100;
  const max = 500;
  while (skip < max) {
    const query = skip > 0 ? col.skip(skip).limit(pageSize) : col.limit(pageSize);
    const res = await query.get();
    const batch = res.data || [];
    rows.push.apply(rows, batch);
    if (batch.length < pageSize) {
      break;
    }
    skip += pageSize;
  }
  return rows;
}

function readPayload(event) {
  if (!event) {
    return {};
  }
  if (typeof event === 'string') {
    try {
      return JSON.parse(event);
    } catch (error) {
      return {};
    }
  }
  let payload = event;
  if (typeof event.body === 'string' && event.body) {
    try {
      payload = { ...event, ...JSON.parse(event.body) };
    } catch (error) {
      payload = event;
    }
  } else if (event.body && typeof event.body === 'object') {
    payload = { ...event, ...event.body };
  }
  return payload;
}

function asUser(row) {
  return {
    username: row.username,
    realName: row.realName || '运营',
    roles: Array.isArray(row.roles) && row.roles.length ? row.roles : ['super'],
    homePath: '/content/events',
  };
}

async function ensureBootstrapUser() {
  try {
    await db.createCollection(ADMIN_USERS);
  } catch (error) {
    // 已经有了
  }
  const col = db.collection(ADMIN_USERS);
  let total = 0;
  try {
    const counted = await col.count();
    total = counted.total || 0;
  } catch (error) {
    total = 0;
  }
  if (total > 0) {
    return;
  }
  const password = String(process.env.ADMIN_PASSWORD || '').trim();
  if (!password) {
    return;
  }
  const username = String(process.env.ADMIN_USERNAME || 'admin').trim();
  await col.add({
    data: {
      username,
      passwordHash: hashPassword(password),
      realName: '运营',
      roles: ['super'],
      createdAt: Date.now(),
    },
  });
}

async function login(payload) {
  await ensureBootstrapUser();
  const username = String((payload && payload.username) || '').trim();
  const password = String((payload && payload.password) || '');
  if (!username || !password) {
    return { ok: false, error: '请输入账号和密码' };
  }
  const found = await db.collection(ADMIN_USERS).where({ username }).limit(1).get();
  const row = found.data && found.data[0];
  if (!row) {
    if (!String(process.env.ADMIN_PASSWORD || '').trim()) {
      return { ok: false, error: '还没有运营账号。到云函数环境变量填写 ADMIN_PASSWORD 后重新上传。' };
    }
    return { ok: false, error: '账号或密码不对' };
  }
  if (row.passwordHash !== hashPassword(password)) {
    return { ok: false, error: '账号或密码不对' };
  }
  const user = asUser(row);
  return { ok: true, accessToken: signToken(user), user };
}

function currentUser(payload, event) {
  return readToken((payload && payload.token) || headerToken(event));
}

async function saveDoc(name, spec, payload) {
  await ensureCollection(name);
  const col = db.collection(name);
  const incoming = stripDoc(payload || {});
  let existing = null;
  let docId = '';

  if (spec.autoId) {
    docId = String(payload && payload._id ? payload._id : incoming._id || '');
    if (docId) {
      existing = await readDoc(col, docId);
    }
  } else {
    docId = String(incoming[spec.idField] || incoming.id || '');
    if (docId) {
      existing = await readDoc(col, docId);
    }
  }

  const merged = { ...(existing || {}), ...incoming };
  const row = normalize(name, merged, !existing);

  if (spec.autoId) {
    const data = stripDoc(row);
    if (existing && docId) {
      await col.doc(docId).set({ data });
      return { id: docId, _id: docId, ...data };
    }
    const added = await col.add({ data });
    return { id: added._id, _id: added._id, ...data };
  }

  const id = String(row[spec.idField] || docId);
  row[spec.idField] = id;
  if (!row.id) {
    row.id = id;
  }
  await col.doc(id).set({ data: stripDoc(row) });
  return { _id: id, ...row };
}

async function removeDoc(name, spec, payload) {
  const id = String((payload && (payload.id || payload._id)) || '');
  if (!id) {
    return { ok: false, error: '缺少 id' };
  }
  const col = db.collection(name);
  if (spec.autoId) {
    await col.doc(id).remove();
    return { ok: true, id };
  }
  try {
    await col.doc(id).remove();
  } catch (error) {
    const found = await col.where({ id }).limit(1).get();
    const row = found.data && found.data[0];
    if (!row) {
      return { ok: false, error: '找不到这条记录' };
    }
    await col.doc(row._id).remove();
  }
  return { ok: true, id };
}

async function handle(payload, event) {
  const action = payload.action;
  const http = isHttp(event);

  if (action === 'login') {
    return login(payload);
  }
  if (action === 'logout') {
    return { ok: true };
  }

  if (http) {
    const user = currentUser(payload, event);
    if (!user) {
      return { ok: false, error: '请先登录' };
    }
    if (action === 'me') {
      return { ok: true, user: asUser(user) };
    }
    if (action === 'codes') {
      return { ok: true, codes: ['AC_100100', 'AC_100110', 'AC_100120', 'AC_100010'] };
    }
    if (action === 'menus') {
      return { ok: true, menus: [] };
    }
  } else if (action === 'me' || action === 'codes' || action === 'menus') {
    return { ok: false, error: '请用网页登录' };
  }

  const collection = payload.collection;
  const spec = COLLECTIONS[collection];
  if (!spec) {
    return { ok: false, error: `不支持的集合：${collection || '(空)'}` };
  }

  if (action === 'list') {
    const list = await listCollection(collection);
    return { ok: true, list, total: list.length };
  }
  if (action === 'save') {
    const row = await saveDoc(collection, spec, payload.data || {});
    return { ok: true, row };
  }
  if (action === 'remove') {
    return removeDoc(collection, spec, payload.data || payload);
  }
  return { ok: false, error: `未知操作：${action || '(空)'}` };
}

exports.main = async (event) => {
  if (isHttp(event) && String(event.httpMethod || '').toUpperCase() === 'OPTIONS') {
    return httpWrap({ ok: true }, 204);
  }

  const payload = readPayload(event);
  let result;
  try {
    result = await handle(payload, event);
  } catch (error) {
    result = { ok: false, error: (error && error.message) || '云函数执行失败' };
  }

  if (isHttp(event)) {
    return httpWrap(toClient(result));
  }
  return result;
};
