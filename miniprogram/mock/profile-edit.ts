/**
 * ============================================================================
 * 我的资料 —— 表单假数据
 * ============================================================================
 *
 * 对应终稿 Figma node 64:377。登录后从「我的」点进来看这一套。
 * 球员档案（评分/等级/积分/身价）是比赛成绩自动生成的，页面上不能改。
 *
 * 想改示例值 → 改 MOCK_PROFILE_EDIT
 * 想改选项文案 → 改 GENDER_OPTIONS / HAND_OPTIONS
 */

export interface ProfileEditForm {
  avatar: string;
  nickname: string;
  phone: string;
  uid: string;
  realName: string;
  gender: '男' | '女';
  hand: '右手' | '左手';
  city: string;
  club: string;
  rating: string;
  level: string;
  points: string;
  marketValue: string;
}

export const GENDER_OPTIONS: Array<'男' | '女'> = ['男', '女'];
export const HAND_OPTIONS: Array<'右手' | '左手'> = ['右手', '左手'];

export const MOCK_PROFILE_EDIT: ProfileEditForm = {
  avatar: '/assets/images/ranking/avatar-demo.jpg',
  nickname: '帆',
  phone: '138****2618',
  uid: '138 2618',
  realName: '陈帆',
  gender: '男',
  hand: '右手',
  city: '广州',
  club: '广州嘻哈',
  rating: '5.0',
  level: 'Lv.18',
  points: '1650',
  marketValue: '¥12,800',
};
