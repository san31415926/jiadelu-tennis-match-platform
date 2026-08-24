/**
 * ============================================================================
 * 我的资料页逻辑
 * ============================================================================
 *
 * 终稿 Figma node 64:377。两版画板文字完全一样，收成这一页。
 *
 * 【哪些能改、哪些不能改】
 * 能改：头像、昵称、手机号、姓名、性别、惯用手、城市、俱乐部
 * 不能改：评分、等级、积分、身价（设计里写了「比赛成绩自动生成」）
 * UID 点了是复制，不是编辑。
 *
 * 保存目前只 toast，云开发接上后再把 form 提交到云函数。
 */
import {
  GENDER_OPTIONS,
  HAND_OPTIONS,
  MOCK_PROFILE_EDIT,
} from '../../mock/profile-edit';
import type { ProfileEditForm } from '../../mock/profile-edit';
import { navigateToPage } from '../../utils/navigate';

Page({
  data: {
    statusBarHeight: 0,
    form: MOCK_PROFILE_EDIT as ProfileEditForm,
    genders: GENDER_OPTIONS,
    hands: HAND_OPTIONS,
  },

  onLoad() {
    const app = getApp<IAppOption>();
    this.setData({ statusBarHeight: app.globalData.statusBarHeight });
  },

  onPickAvatar() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      success: (res) => {
        const path = res.tempFiles[0] && res.tempFiles[0].tempFilePath;
        if (!path) {
          return;
        }
        this.setData({ 'form.avatar': path });
      },
    });
  },

  onEditNickname() {
    this.promptField('nickname', '修改昵称', this.data.form.nickname);
  },

  onEditPhone() {
    this.promptField('phone', '修改手机号', this.data.form.phone);
  },

  onEditRealName() {
    this.promptField('realName', '修改真实姓名', this.data.form.realName);
  },

  onEditCity() {
    this.promptField('city', '修改所在城市', this.data.form.city);
  },

  onEditClub() {
    navigateToPage('/pages/clubs/index');
  },

  onGenderTap(event: WechatMiniprogram.TouchEvent) {
    this.setData({ 'form.gender': event.currentTarget.dataset.value });
  },

  onHandTap(event: WechatMiniprogram.TouchEvent) {
    this.setData({ 'form.hand': event.currentTarget.dataset.value });
  },

  onCopyUid() {
    wx.setClipboardData({
      data: this.data.form.uid.replace(/\s/g, ''),
      success: () => wx.showToast({ title: 'UID 已复制', icon: 'none' }),
    });
  },

  onSave() {
    wx.showToast({ title: '已保存示例资料，接入云开发后会真正写入', icon: 'none' });
  },

  promptField(key: keyof ProfileEditForm, title: string, value: string) {
    wx.showModal({
      title,
      editable: true,
      placeholderText: value,
      content: value,
      success: (res) => {
        if (!res.confirm || res.content === undefined) {
          return;
        }
        const next = res.content.trim();
        if (!next) {
          return;
        }
        this.setData({ [`form.${key}`]: next });
      },
    });
  },
});
