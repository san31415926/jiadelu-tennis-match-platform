/**
 * ============================================================================
 * 赛事卡片组件
 * ============================================================================
 *
 * 【怎么用】
 * 在页面的 json 里注册：
 *   "usingComponents": { "event-card": "../../components/event-card/index" }
 * 在 wxml 里使用：
 *   <event-card event="{{item}}" bind:cardtap="onEventTap" bind:venuetap="onVenueTap" />
 *
 * 【两个事件的区别】
 * cardtap   点卡片主体，一般用来跳赛事详情
 * venuetap  点底部场馆行（有 venueLink 的卡才有这一行），跳店铺页 pages/venue
 *
 * 场馆行用的是 catchtap 而不是 bindtap —— catch 会阻止事件继续向上冒泡到
 * 卡片，所以点场馆只会触发 venuetap，不会同时触发 cardtap。
 *
 * 右下角现在是价格不是报名按钮。报名入口在赛事详情页。
 */
Component({
  properties: {
    /**
     * 赛事数据，结构见 mock/home.ts 的 EventItem。
     * 类型写 Object 是小程序组件属性的写法，具体字段不做校验，
     * 传错字段名会显示空白而不是报错，所以改字段名时要两边一起改。
     */
    event: {
      type: Object,
      value: null,
    },
  },

  methods: {
    /** 取当前卡片的赛事 id，两个事件都要带上它，页面才知道点的是哪一场 */
    currentId(): string | undefined {
      const event = this.data.event as { id?: string } | null;
      return event?.id;
    },

    onCardTap() {
      this.triggerEvent('cardtap', { id: this.currentId() });
    },

    onVenueTap() {
      this.triggerEvent('venuetap', { id: this.currentId() });
    },
  },
});
