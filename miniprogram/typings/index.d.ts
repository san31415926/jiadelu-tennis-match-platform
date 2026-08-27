/// <reference types="miniprogram-api-typings" />

/**
 * 登录后的用户资料。字段对齐 mock/profile.ts 的 ProfileSummary，
 * 并带上「我的资料」表单用的那些项。云函数 login 返回这一套。
 */
interface UserProfile {
  nickname: string;
  avatar: string;
  uid: string;
  bio: string;
  cover: string;
  theme: string;
  marketValue: string;
  points: string;
  wins: string;
  hand: string;
  profileComplete: string;
  clubRank: string;
  clubMembers: string;
  recordSummary: string;
  lastEvent: string;
  radar: {
    overall: number;
    axes: { label: string; value: number }[];
  };
  phone: string;
  realName: string;
  gender: string;
  city: string;
  club: string;
  clubId: string;
  play: string;
  years: string;
  tags: string;
  rating: string;
  level: string;
}

interface IAppOption {
  globalData: {
    statusBarHeight: number;
    navBarHeight: number;
    /** 标题左右留白，避开右上角胶囊按钮，单位 px */
    menuInsetRight: number;
    safeAreaBottom: number;
    screenWidth: number;
    /** 微信登录态。首页「我的报名」和我的页都读它 */
    isLoggedIn: boolean;
    userProfile: UserProfile | null;
    cloudReady: boolean;
    /**
     * 启动时恢复登录、灌赛事的 Promise。
     * 页面 onLoad 先 await 它，避免比云函数还先画出来。
     */
    cloudBoot: Promise<void>;
    /** 全站壳色。我的页「更换背景」写入，默认 mint */
    theme: string;
  };
  initSystemMetrics(): void;
  initCloud(): void;
  bootCloud(): Promise<void>;
  onLaunch(): void;
}
