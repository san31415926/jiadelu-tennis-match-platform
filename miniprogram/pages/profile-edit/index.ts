/**
 * ============================================================================
 * 我的资料页逻辑 —— 视觉刷新草稿 V5
 * ============================================================================
 *
 * Figma node 389:359。波浪头已经删掉，改成主题底 + page-nav occupy。
 * 头像是圆形封面图，不再套 gold-avatar 的 large 档。
 *
 * 【哪些能改、哪些不能改】
 * 能改：头像、昵称、手机、姓名、性别、惯用手、城市、俱乐部、
 *       常打项目、球龄、个性标签、个人简介
 * 不能改：评分、等级、积分、身价、胜场（设计写了「比赛自动生成，不可手改」）
 * UID 点了是复制，不是编辑。
 *
 * 保存目前只 toast，云开发接上后再把 form 提交到云函数。
 */
import {
  GENDER_OPTIONS,
  HAND_OPTIONS,
  MOCK_PROFILE_EDIT,
  PLAY_OPTIONS,
} from '../../mock/profile-edit';
import type { ProfileEditForm } from '../../mock/profile-edit';
import { openMyClub } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

Page({
  behaviors: [themeBehavior],
  data: {
    form: MOCK_PROFILE_EDIT as ProfileEditForm,
    genders: GENDER_OPTIONS,
    hands: HAND_OPTIONS,
    plays: PLAY_OPTIONS,
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

  onEditYears() {
    this.promptField('years', '修改球龄', this.data.form.years);
  },

  onEditTags() {
    this.promptField('tags', '修改个性标签', this.data.form.tags);
  },

  onEditBio() {
    this.promptField('bio', '编辑个人简介', this.data.form.bio);
  },

  onEditClub() {
    openMyClub();
  },

  onGenderTap(event: WechatMiniprogram.TouchEvent) {
    this.setData({ 'form.gender': event.currentTarget.dataset.value });
  },

  onHandTap(event: WechatMiniprogram.TouchEvent) {
    this.setData({ 'form.hand': event.currentTarget.dataset.value });
  },

  onPlayTap(event: WechatMiniprogram.TouchEvent) {
    this.setData({ 'form.play': event.currentTarget.dataset.value });
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
      placeholderText: value || '请输入',
      content: value,
      success: (res) => {
        if (!res.confirm || res.content === undefined) {
          return;
        }
        const next = res.content.trim();
        if (key !== 'bio' && !next) {
          return;
        }
        this.setData({ [`form.${key}`]: next });
      },
    });
  },
});
