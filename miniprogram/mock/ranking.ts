/** 球员排行页假数据，字段与 Figma node 15:3 的文本节点对应 */

export interface PodiumPlayer {
  rank: 1 | 2 | 3;
  nickname: string;
  club: string;
  score: string;
  avatar: string;
}

export interface RankingRow {
  rank: number;
  nickname: string;
  club: string;
  score: string;
  badge: string;
  avatar: string;
}

export interface MyRanking {
  summary: string;
  actionText: string;
}

export const RANKING_SCOPES = ['城市榜', '全国榜'];
export const RANKING_METRICS = ['积分', '身价', '战力'];

const DEMO_AVATAR = '/assets/images/ranking/avatar-demo.jpg';

export const PODIUM: PodiumPlayer[] = [
  {
    rank: 2,
    nickname: 'nana',
    club: '东莞队',
    score: '1600',
    avatar: DEMO_AVATAR,
  },
  {
    rank: 1,
    nickname: '瑰夏豆豆',
    club: '瑰夏豆豆队',
    score: '1650',
    avatar: DEMO_AVATAR,
  },
  {
    rank: 3,
    nickname: '吕布',
    club: '广州嘻哈',
    score: '1400',
    avatar: DEMO_AVATAR,
  },
];

export const RANKING_ROWS: RankingRow[] = [
  {
    rank: 4,
    nickname: '阿飞',
    club: '深圳ACE网球俱乐部',
    score: '1200',
    badge: 'A+',
    avatar: '/assets/images/ranking/avatar-4.jpg',
  },
  {
    rank: 5,
    nickname: '小满',
    club: '佛山飞跃队',
    score: '1200',
    badge: 'A+',
    avatar: '/assets/images/ranking/avatar-5.jpg',
  },
  {
    rank: 6,
    nickname: '大熊',
    club: '东莞松山湖TC',
    score: '1200',
    badge: 'A+',
    avatar: '/assets/images/ranking/avatar-6.jpg',
  },
];

export const MY_RANKING: MyRanking = {
  summary: '我的排名  第128  •  积分 0  •  暂未上榜',
  actionText: '去参赛',
};
