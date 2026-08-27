/**
 * ============================================================================
 * 登录 / 资料 —— 页面只调这里，不要自己写 wx.cloud
 * ============================================================================
 *
 * 【开关】config/env.ts 的 USE_MOCK.auth。
 * true：登录仍塞 mock/profile.ts 的示例「帆」。
 * false：调 login / updateProfile 云函数，users 集合里是真用户。
 *
 * 【为什么一打开就是登录态】
 * 开发者工具用的是你这个微信身份。只要 users 里有这条 OPENID，
 * 启动会调 restoreSession → login(create:false) 自动接上。
 * 「我的」底部「退出登录」会写本地标记，下次启动不再自动恢复；
 * 云端资料还在，再点登录会接回同一条记录。不要去删 users。
 *
 * 【字段】返回值对齐 mock/profile.ts 的 ProfileSummary，
 * 另外带上「我的资料」表单要用的 phone / realName 等。
 *
 * 改了能改的字段，记得走 saveProfile，不要只改页面 data，刷新会丢。
 */
import { USE_MOCK } from '../config/env';
import { GUEST_PROFILE, MOCK_PROFILE } from '../mock/profile';
import type { ProfileSummary } from '../mock/profile';
import { MOCK_PROFILE_EDIT } from '../mock/profile-edit';
import type { ProfileEditForm } from '../mock/profile-edit';
import {
  avatarCacheExists,
  avatarCachePath,
  callCloud,
  isLocalTempFile,
  packAvatarForCloud,
} from './cloud';
import { withProfileComplete } from '../utils/profile-complete';

/** 退出后写 '1'。启动 restoreSession 看到它就保持游客，直到再点登录。 */
const LOGGED_OUT_KEY = 'auth.loggedOut';

export interface CloudProfile extends ProfileSummary {
  phone: string;
  realName: string;
  gender: string;
  city: string;
  club: string;
  /** 加入的俱乐部 id，没有就是空字符串。资料页显示用 club 名字 */
  clubId: string;
  play: string;
  years: string;
  tags: string;
  rating: string;
  level: string;
}

function withEditFields(base: ProfileSummary, extra?: Partial<CloudProfile>): CloudProfile {
  return {
    ...base,
    phone: extra && extra.phone != null ? extra.phone : MOCK_PROFILE_EDIT.phone,
    realName: extra && extra.realName != null ? extra.realName : MOCK_PROFILE_EDIT.realName,
    gender: extra && extra.gender != null ? extra.gender : MOCK_PROFILE_EDIT.gender,
    city: extra && extra.city != null ? extra.city : MOCK_PROFILE_EDIT.city,
    club: extra && extra.club != null ? extra.club : MOCK_PROFILE_EDIT.club,
    clubId: extra && extra.clubId != null ? extra.clubId : '',
    play: extra && extra.play != null ? extra.play : MOCK_PROFILE_EDIT.play,
    years: extra && extra.years != null ? extra.years : MOCK_PROFILE_EDIT.years,
    tags: extra && extra.tags != null ? extra.tags : MOCK_PROFILE_EDIT.tags,
    rating: extra && extra.rating != null ? extra.rating : MOCK_PROFILE_EDIT.rating,
    level: extra && extra.level != null ? extra.level : MOCK_PROFILE_EDIT.level,
  };
}

function currentApp(): IAppOption | undefined {
  try {
    const app = getApp<IAppOption>();
    if (!app || !app.globalData) {
      return undefined;
    }
    return app;
  } catch (error) {
    return undefined;
  }
}

function useMockAuth(): boolean {
  if (USE_MOCK.auth) {
    return true;
  }
  const app = currentApp();
  // 启动时 App 实例可能还没挂上，按已接云走，不要去读 undefined.globalData
  if (!app) {
    return false;
  }
  return !app.globalData.cloudReady;
}

/** login 返回的是 cloud://。本机有缓存就优先显示缓存，避免再去下载云文件撞 TLS。 */
function withDisplayAvatar(profile: CloudProfile): CloudProfile {
  if (profile.avatar && profile.avatar.indexOf('cloud://') === 0 && avatarCacheExists()) {
    return { ...profile, avatar: avatarCachePath() };
  }
  return profile;
}

export function guestProfile(): CloudProfile {
  return withEditFields(GUEST_PROFILE, {
    phone: '',
    realName: '',
    gender: '男',
    city: '',
    club: '',
    clubId: '',
    play: '混双',
    years: '',
    tags: '',
    rating: '--',
    level: '--',
  });
}

export function mockLoggedInProfile(): CloudProfile {
  return withEditFields(MOCK_PROFILE);
}

export function toEditForm(profile: CloudProfile): ProfileEditForm {
  const uid = profile.uid.replace(/^UID\s*/, '');
  return {
    avatar: profile.avatar,
    nickname: profile.nickname,
    phone: profile.phone,
    uid,
    realName: profile.realName,
    gender: profile.gender === '女' ? '女' : '男',
    hand: profile.hand === '左手' ? '左手' : '右手',
    city: profile.city,
    club: profile.club,
    play:
      profile.play === '单打' || profile.play === '双打' || profile.play === '混双'
        ? profile.play
        : '混双',
    years: profile.years,
    tags: profile.tags,
    bio: profile.bio,
    rating: profile.rating,
    level: profile.level,
    points: profile.points,
    marketValue: profile.marketValue,
    wins: profile.wins,
  };
}

function skipRestore(): boolean {
  try {
    return wx.getStorageSync(LOGGED_OUT_KEY) === '1';
  } catch {
    return false;
  }
}

function markLoggedOut() {
  wx.setStorageSync(LOGGED_OUT_KEY, '1');
}

function clearLoggedOut() {
  wx.setStorageSync(LOGGED_OUT_KEY, '');
}

/**
 * 启动时调用：只查不建。
 * 以前登录过就恢复资料；从没点过登录、或点过「退出登录」，就保持游客。
 */
export async function restoreSession(): Promise<CloudProfile | null> {
  if (useMockAuth() || skipRestore()) {
    return null;
  }
  const res = await callCloud<{ exists: boolean; profile: CloudProfile | null }>('login', {
    create: false,
  });
  return res.exists && res.profile ? withDisplayAvatar(res.profile) : null;
}

/**
 * 用户点登录。没有记录就在 users 里建一条。
 * phoneCode 来自 button open-type="getPhoneNumber"，云函数拿它向微信换真实手机号。
 * 模拟器经常没有这个能力，不传 phoneCode 也能登录，只是资料里手机号是空的。
 */
export async function loginWithWeChat(options?: { phoneCode?: string }): Promise<CloudProfile> {
  clearLoggedOut();
  if (useMockAuth()) {
    return mockLoggedInProfile();
  }
  const payload: Record<string, unknown> = { create: true };
  if (options && options.phoneCode) {
    payload.phoneCode = options.phoneCode;
  }
  const res = await callCloud<{ exists: boolean; profile: CloudProfile }>('login', payload);
  if (!res.profile) {
    throw new Error('登录成功但没有返回资料');
  }
  return withDisplayAvatar(res.profile);
}

/**
 * 把能改的字段写入 users。
 * 新头像不走客户端 uploadFile（Clash 半开会 TLS 失败），改成压缩后的
 * base64 交给 updateProfile 云函数上传。库里只存 cloud:// fileID。
 * 页面展示用本机缓存路径，这样「我的」回来立刻能看到新图。
 */
export async function saveProfile(
  patch: Partial<CloudProfile>,
): Promise<Partial<CloudProfile> & { avatarUploadFailed?: boolean }> {
  if (useMockAuth()) {
    return patch;
  }
  const next: Partial<CloudProfile> = { ...patch };
  let localAvatar = '';
  let avatarBase64 = '';
  if (next.avatar && isLocalTempFile(next.avatar)) {
    const packed = await packAvatarForCloud(next.avatar);
    avatarBase64 = packed.base64;
    localAvatar = packed.localPath;
    delete next.avatar;
  }
  const cloudPatch = avatarBase64 ? { ...next, avatarBase64 } : next;
  if (Object.keys(cloudPatch).length === 0) {
    return next;
  }
  const res = await callCloud<{ avatar?: string; avatarFailed?: boolean }>(
    'updateProfile',
    { patch: cloudPatch },
    60000,
  );
  return {
    ...next,
    avatar: localAvatar || res.avatar || patch.avatar,
    avatarUploadFailed: !!res.avatarFailed,
  };
}

/**
 * 本机回到游客。不删云端 users。
 * 会写本地标记，下次冷启动也不再自动恢复；再点登录会接回同一条记录。
 */
export function logout() {
  markLoggedOut();
  writeSession(null);
}

export function writeSession(profile: CloudProfile | null) {
  const app = currentApp();
  if (!app) {
    return;
  }
  const next = profile ? withProfileComplete(profile) : null;
  app.globalData.isLoggedIn = !!next;
  app.globalData.userProfile = next;
}

export function readSession(): CloudProfile | null {
  const app = currentApp();
  if (!app || !app.globalData.isLoggedIn) {
    return null;
  }
  return app.globalData.userProfile as CloudProfile | null;
}
