/**
 * 云开发环境 ID。在微信开发者工具「云开发」面板开通环境后，把环境 ID 填到这里，
 * 页面即会从云数据库取数；留空时全站使用 mock/ 目录下的假数据。
 */
export const CLOUD_ENV_ID = '';

/** 数据来源：填了云环境 ID 就走云开发，否则走本地 mock */
export const USE_MOCK_DATA = !CLOUD_ENV_ID;
