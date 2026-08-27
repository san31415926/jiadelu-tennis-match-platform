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
 * 个性标签：10 个备选胶囊可点，也可在下面空框里自己写。点选 + 手写加起来最多 5 个。
 * 备选文案在 mock/profile-edit.ts 的 PRESET_TAGS。保存仍写成一个字符串进 users.tags。
 * 球龄、个性标签都不要 placeholder，空着就是空着。
 * 俱乐部仍跳转到俱乐部页。保存走底部「保存资料」。
 *
 * 保存走 api/auth.ts 的 saveProfile，写入 users 集合。
 * 头像选完只是临时文件，点「保存资料」才压缩成 base64 交给云函数上传；
 * 本机同时缓存一份，session 用缓存路径，「我的」onShow 就能立刻看到新图。
 * 保存按钮钉在屏幕底部，样式在 index.wxss 的 .save-bar。
 * 评分 / 等级 / 积分 / 身价 / 胜场不能手改，云函数也会拒。
 */
import {
  GENDER_OPTIONS,
  HAND_OPTIONS,
  PLAY_OPTIONS,
  PRESET_TAGS,
  MAX_PROFILE_TAGS,
  parseTags,
  joinTags,
  buildTagView,
  appendDraftTag,
} from '../../mock/profile-edit';
import { readSession, saveProfile, toEditForm, writeSession, guestProfile } from '../../api/auth';
import { openMyClub } from '../../utils/navigate';
import { themeBehavior } from '../../behaviors/theme';

function tagState(selected: string[]) {
  const view = buildTagView(selected);
  return {
    ...view,
    'form.tags': joinTags(view.selectedTags),
  };
}

Page({
  behaviors: [themeBehavior],
  data: {
    form: toEditForm(guestProfile()),
    genders: GENDER_OPTIONS,
    hands: HAND_OPTIONS,
    plays: PLAY_OPTIONS,
    selectedTags: [] as string[],
    tagChoices: PRESET_TAGS.map((label) => ({ label, on: false })),
    customTags: [] as string[],
    tagDraft: '',
    maxTags: MAX_PROFILE_TAGS,
  },

  onLoad() {
    const session = readSession();
    const form = session ? toEditForm(session) : this.data.form;
    this.setData({
      form,
      ...tagState(parseTags(form.tags)),
    });
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

  onFieldInput(event: WechatMiniprogram.Input) {
    const key = String(event.currentTarget.dataset.key || '');
    if (!key) {
      return;
    }
    this.setData({ [`form.${key}`]: event.detail.value });
  },

  onTagTap(event: WechatMiniprogram.TouchEvent) {
    const value = String(event.currentTarget.dataset.value || '');
    if (!value) {
      return;
    }
    const selected = this.data.selectedTags.slice();
    const index = selected.indexOf(value);
    if (index >= 0) {
      selected.splice(index, 1);
      this.setData(tagState(selected));
      return;
    }
    if (selected.length >= MAX_PROFILE_TAGS) {
      wx.showToast({ title: '最多选 5 个', icon: 'none' });
      return;
    }
    selected.push(value);
    this.setData(tagState(selected));
  },

  onTagDraftInput(event: WechatMiniprogram.Input) {
    this.setData({ tagDraft: event.detail.value });
  },

  takeDraftTag(selected: string[]): { selected: string[]; draft: string; blocked: boolean } {
    const next = appendDraftTag(selected, this.data.tagDraft);
    if (next.blocked) {
      return { selected: next.selected, draft: String(this.data.tagDraft || '').trim(), blocked: true };
    }
    return { selected: next.selected, draft: '', blocked: false };
  },

  onTagConfirm() {
    const next = this.takeDraftTag(this.data.selectedTags.slice());
    if (next.blocked) {
      wx.showToast({ title: '最多选 5 个', icon: 'none' });
      return;
    }
    this.setData({
      ...tagState(next.selected),
      tagDraft: next.draft,
    });
  },

  onSave() {
    const drafted = this.takeDraftTag(this.data.selectedTags.slice());
    this.setData({
      ...tagState(drafted.selected),
      tagDraft: '',
    });
    const form = this.data.form;
    const session = readSession();
    const patch = {
      nickname: form.nickname.trim(),
      avatar: form.avatar,
      phone: form.phone.trim(),
      realName: form.realName.trim(),
      gender: form.gender,
      hand: form.hand,
      city: form.city.trim(),
      club: form.club,
      play: form.play,
      years: form.years.trim(),
      tags: joinTags(drafted.selected),
      bio: form.bio.trim(),
    };
    wx.showLoading({ title: '保存中', mask: true });
    saveProfile(patch)
      .then((saved) => {
        wx.hideLoading();
        const avatarFailed = !!saved.avatarUploadFailed;
        const avatar = saved.avatar || patch.avatar;
        if (session) {
          writeSession({
            ...session,
            ...patch,
            avatar,
          });
        }
        this.setData({
          'form.avatar': avatar,
          'form.nickname': patch.nickname,
          'form.phone': patch.phone,
          'form.realName': patch.realName,
          'form.city': patch.city,
          'form.years': patch.years,
          'form.tags': patch.tags,
          'form.bio': patch.bio,
        });
        wx.showToast({
          title: avatarFailed ? '文字已保存，头像没传上去' : '已保存',
          icon: avatarFailed ? 'none' : 'success',
          duration: avatarFailed ? 2500 : 1500,
        });
      })
      .catch((error: { message?: string }) => {
        wx.hideLoading();
        wx.showToast({
          title: (error && error.message) || '保存失败',
          icon: 'none',
        });
      });
  },
});
