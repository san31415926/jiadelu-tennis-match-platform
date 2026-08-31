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
 * UID 点了是复制，不是编辑。展示为 L-ID。
 *
 * 想改示例值 → 改 MOCK_PROFILE_EDIT
 * 想改选项文案 → 改 GENDER_OPTIONS / HAND_OPTIONS / PLAY_OPTIONS
 * 想改个性标签备选 → 改 PRESET_TAGS（10 个）；上限改 MAX_PROFILE_TAGS
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

/** 资料页一排可点的备选。点选和手输加起来不能超过 MAX_PROFILE_TAGS。 */
export const PRESET_TAGS: string[] = [
  '底线型',
  '发球好',
  '网前主动',
  '双手反拍',
  '夜场常客',
  '周末球员',
  '进攻型',
  '防守型',
  '力量型',
  '旋转好',
];

export const MAX_PROFILE_TAGS = 5;

export function parseTags(raw: string): string[] {
  if (!raw) {
    return [];
  }
  const seen: Record<string, boolean> = {};
  const list: string[] = [];
  String(raw)
    .split(/[\s·,，、]+/)
    .forEach((piece) => {
      const tag = piece.trim();
      if (!tag || seen[tag]) {
        return;
      }
      seen[tag] = true;
      list.push(tag);
    });
  return list.slice(0, MAX_PROFILE_TAGS);
}

export function joinTags(tags: string[]): string {
  return tags.join(' ');
}

export function buildTagView(selected: string[]) {
  const picked = selected.slice(0, MAX_PROFILE_TAGS);
  return {
    selectedTags: picked,
    tagChoices: PRESET_TAGS.map((label) => ({
      label,
      on: picked.indexOf(label) >= 0,
    })),
    customTags: picked.filter((tag) => PRESET_TAGS.indexOf(tag) < 0),
  };
}

/** 手写标签：空的或已有的直接过；满 5 个返回 blocked，调用方自己决定提示还是丢掉。 */
export function appendDraftTag(
  selected: string[],
  draft: string,
): { selected: string[]; blocked: boolean } {
  const tag = String(draft || '').trim();
  if (!tag) {
    return { selected, blocked: false };
  }
  if (selected.indexOf(tag) >= 0) {
    return { selected, blocked: false };
  }
  if (selected.length >= MAX_PROFILE_TAGS) {
    return { selected, blocked: true };
  }
  return { selected: selected.concat(tag), blocked: false };
}

export const MOCK_PROFILE_EDIT: ProfileEditForm = {
  avatar: '/assets/images/avatars/anime-01.jpg',
  nickname: '帆',
  phone: '138****2618',
  uid: 'L-10008652',
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
