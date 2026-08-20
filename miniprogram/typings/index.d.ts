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
    safeAreaBottom: number;
    screenWidth: number;
    userProfile: UserProfile | null;
    cloudReady: boolean;
  };
  initSystemMetrics(): void;
  initCloud(): void;
}
