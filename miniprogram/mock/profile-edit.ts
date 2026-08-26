/**
 * ============================================================================
 * 我的资料 —— 表单假数据（V5）
 * ============================================================================
 *
 * 对应视觉刷新草稿 Figma node 389:359。登录后从「我的」点进来看这一套。
 *
 * 【哪些能改、哪些不能改】
 * 能改：头像、昵称、手机、姓名、性别、惯用手、城市、俱乐部、
 *       常打项目、球龄、个性标签、个人简介
 * 不能改：评分、等级、积分、身价、胜场（设计写了「比赛自动生成，不可手改」）
 * UID 点了是复制，不是编辑。
 *
 * 想改示例值 → 改 MOCK_PROFILE_EDIT
 * 想改选项文案 → 改 GENDER_OPTIONS / HAND_OPTIONS / PLAY_OPTIONS
 */

export type GenderOption = '男' | '女';
export type HandOption = '右手' | '左手';
export type PlayOption = '单打' | '双打' | '混双';

export interface ProfileEditForm {
  avatar: string;
  nickname: string;
  phone: string;
  uid: string;
  realName: string;
  gender: GenderOption;
  hand: HandOption;
  city: string;
  club: string;
  play: PlayOption;
  years: string;
  tags: string;
  bio: string;
  rating: string;
  level: string;
  points: string;
  marketValue: string;
  wins: string;
}

export const GENDER_OPTIONS: GenderOption[] = ['男', '女'];
export const HAND_OPTIONS: HandOption[] = ['右手', '左手'];
export const PLAY_OPTIONS: PlayOption[] = ['单打', '双打', '混双'];

export const MOCK_PROFILE_EDIT: ProfileEditForm = {
  avatar: '/assets/images/avatars/anime-01.jpg',
  nickname: '帆',
  phone: '138****2618',
  uid: '10008652',
  realName: '陈帆',
  gender: '男',
  hand: '右手',
  city: '佛山',
  club: '球球热网球·禅城店',
  play: '混双',
  years: '6 年',
  tags: '底线型  ·  夜场常客',
  bio: '',
  rating: '7.0',
  level: 'Lv.18',
  points: '1650',
  marketValue: '¥12,800',
  wins: '8',
};
