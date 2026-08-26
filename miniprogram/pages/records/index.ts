/**
 * ============================================================================
 * 参赛记录页逻辑
 * ============================================================================
 *
 * 「我的」菜单点参赛记录进来。已对照草稿 Figma「参赛记录 / V5」(419:359)：
 * occupy 吸顶栏、生涯汇总卡、全部/胜/负芯片。筛选选中和胜场标走主题强调色。
 *
 * 【筛选只看胜负】
 * 三个芯片：全部 / 胜 / 负。切的时候不过滤项目或日期，只按 result 字段。
 * 想加「混双」这类项目筛选，要同时改 mock/records.ts 的 RECORD_FILTERS。
 *
 * 【点进去】
 * 走已经做好的赛事详情，不新开战绩页。组队 / 约战 / H2H 本期不做。
 */
import { filterRecords, RECORD_FILTERS, RECORDS_SUMMARY } from '../../mock/records';
import type { MatchRecord, RecordFilter } from '../../mock/records';
import { navigateToEventDetail } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    summary: RECORDS_SUMMARY,
    filters: RECORD_FILTERS,
    activeFilter: '全部' as RecordFilter,
    records: [] as MatchRecord[],
  },

  onLoad() {
    this.setData({
      records: filterRecords('全部'),
    });
  },

  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filter = String(event.currentTarget.dataset.filter) as RecordFilter;
    this.setData({
      activeFilter: filter,
      records: filterRecords(filter),
    });
  },

  onRecordTap(event: WechatMiniprogram.TouchEvent) {
    navigateToEventDetail(String(event.currentTarget.dataset.id));
  },
});
