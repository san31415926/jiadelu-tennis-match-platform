/**
 * 把小程序传来的示例数据写入云库。
 *
 * 【空集合】第一次灌，和以前一样整表写入。
 * 【upsertEvents / upsertCatalog】按业务 id 覆盖写。改了 mock 标题、
 * 单打双打、俱乐部、榜单，不用去控制台清库。报名记录、真实用户资料不动。
 *
 * 集合还不存在时先 createCollection。每条用业务 id 当 _id，
 * 详情页才能 doc(id).get()。
 */
const cloud = require('wx-server-sdk');

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV });

const db = cloud.database();

async function ensureCollection(name) {
  try {
    await db.createCollection(name);
  } catch (error) {
    // 已经有了会抛错，忽略即可
  }
}

async function seedCollection(name, list, upsert) {
  await ensureCollection(name);
  const col = db.collection(name);
  let total = 0;
  try {
    const countRes = await col.count();
    total = countRes.total || 0;
  } catch (error) {
    total = 0;
  }
  if (total > 0 && !upsert) {
    return { skipped: true, total, written: 0 };
  }
  if (!Array.isArray(list) || list.length === 0) {
    return { skipped: true, total: total || 0, written: 0, empty: true };
  }

  let written = 0;
  for (let i = 0; i < list.length; i += 1) {
    const row = list[i];
    if (!row || !row.id) {
      continue;
    }
    const { id, ...rest } = row;
    await col.doc(String(id)).set({
      data: {
        ...rest,
        id,
      },
    });
    written += 1;
  }
  return { skipped: false, written, total: written, upsert: !!upsert };
}

exports.main = async (event) => {
  const payload = event || {};
  const result = {};
  const upsertEvents = !!payload.upsertEvents || !!payload.force;
  const upsertCatalog = !!payload.upsertCatalog || !!payload.force;

  if (payload.events) {
    result.events = await seedCollection('events', payload.events, upsertEvents);
  }
  if (payload.clubs) {
    result.clubs = await seedCollection('clubs', payload.clubs, upsertCatalog);
  }
  if (payload.members) {
    result.members = await seedCollection('club_members', payload.members, upsertCatalog);
  }
  if (payload.players) {
    result.players = await seedCollection('players', payload.players, upsertCatalog);
  }
  if (payload.galleries) {
    result.galleries = await seedCollection('galleries', payload.galleries, upsertCatalog);
  }
  if (payload.venues) {
    result.venues = await seedCollection('venues', payload.venues, upsertCatalog);
  }
  if (payload.records) {
    result.records = await seedCollection('match_records', payload.records, upsertCatalog);
  }

  if (Object.keys(result).length === 0) {
    return { ok: false, error: '没有要灌入的数据' };
  }

  return { ok: true, result };
};
