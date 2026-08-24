/// <reference types="miniprogram-api-typings" />

interface UserProfile {
  nickname: string;
  avatarUrl: string;
  uid: string;
  level: number;
  rating: string;
  points: number;
  power: number;
  marketValue: number;
  marketValueTrend: number;
  xpCurrent: number;
  xpNext: number;
}

interface IAppOption {
  globalData: {
    statusBarHeight: number;
    navBarHeight: number;
    /** 标题左右留白，避开右上角胶囊按钮，单位 px */
    menuInsetRight: number;
    safeAreaBottom: number;
    screenWidth: number;
    /** 微信登录态，云开发接入后由云函数校验 */
    isLoggedIn: boolean;
    userProfile: UserProfile | null;
    cloudReady: boolean;
  };
  initSystemMetrics(): void;
  initCloud(): void;
}
