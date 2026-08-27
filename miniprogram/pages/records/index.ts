/**
 * ============================================================================
 * 参赛记录页逻辑
 * ============================================================================
 *
 * 「我的」菜单点参赛记录进来。已对照草稿 Figma「参赛记录 / V5」(419:359)：
 * occupy 吸顶栏、生涯汇总卡、全部/胜/负芯片。筛选选中和胜场标走主题强调色。
 *
 * 有个人记录就显示自己的；还没有就显示演示数据（seed 灌的 demo）。
 * 组队 / 约战 / H2H 本期不做。
 */
import { listMatchRecords, recordsOfFilter } from '../../api/catalog';
import { RECORD_FILTERS, RECORDS_SUMMARY } from '../../mock/records';
import type { MatchRecord, RecordFilter, RecordsSummary } from '../../mock/records';
import { navigateToEventDetail } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    summary: RECORDS_SUMMARY as RecordsSummary,
    filters: RECORD_FILTERS,
    activeFilter: '全部' as RecordFilter,
    allRecords: [] as MatchRecord[],
    records: [] as MatchRecord[],
  },

  async onLoad() {
    await getApp<IAppOption>().globalData.cloudBoot;
    const { records, summary } = await listMatchRecords();
    this.setData({
      summary,
      allRecords: records,
      records: recordsOfFilter(records, '全部'),
    });
  },

  onFilterTap(event: WechatMiniprogram.TouchEvent) {
    const filter = String(event.currentTarget.dataset.filter) as RecordFilter;
    this.setData({
      activeFilter: filter,
      records: recordsOfFilter(this.data.allRecords, filter),
    });
  },

  onRecordTap(event: WechatMiniprogram.TouchEvent) {
    navigateToEventDetail(String(event.currentTarget.dataset.id));
  },
});
