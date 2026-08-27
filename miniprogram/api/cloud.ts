/**
 * ============================================================================
 * 云函数调用封装
 * ============================================================================
 *
 * 页面不要直接 wx.cloud.callFunction / uploadFile。失败时这里抛错，由调用方 toast。
 * 云函数约定返回 { ok: true, ... } 或 { ok: false, error: '原因' }。
 * 用户头像不要走客户端 uploadFile（Clash 半开会 TLS 失败）。
 * 压缩成 base64 交给 updateProfile 云函数上传。
 */

function cloud() {
  if (!wx.cloud) {
    throw new Error('云能力未初始化');
  }
  return wx.cloud;
}

export async function callCloud<T>(
  name: string,
  data?: Record<string, unknown>,
  timeout?: number,
): Promise<T> {
  const res = await cloud().callFunction({
    name,
    data: data || {},
    timeout: timeout || 20000,
  });
  const result = res.result as ({ ok?: boolean; error?: string } & T) | undefined;
  if (!result || result.ok === false) {
    throw new Error((result && result.error) || '云函数调用失败');
  }
  return result;
}

export function cloudDb() {
  return cloud().database();
}

/** 本机长期缓存。换头像成功后显示走这里，不依赖从云存储再下载（下载也会撞 TLS）。 */
export function avatarCachePath(): string {
  return `${wx.env.USER_DATA_PATH}/profile-avatar.jpg`;
}

function fs() {
  return wx.getFileSystemManager();
}

function compressImage(filePath: string, quality: number, width: number): Promise<string> {
  return new Promise((resolve) => {
    const fallback = () => {
      wx.compressImage({
        src: filePath,
        quality,
        success: (res) => resolve(res.tempFilePath || filePath),
        fail: () => resolve(filePath),
      });
    };
    wx.compressImage({
      src: filePath,
      quality,
      compressedWidth: width,
      success: (res) => resolve(res.tempFilePath || filePath),
      fail: fallback,
    });
  });
}

function readBase64(filePath: string): Promise<string> {
  return new Promise((resolve, reject) => {
    fs().readFile({
      filePath,
      encoding: 'base64',
      success: (res) => resolve(String(res.data || '')),
      fail: (err) => reject(new Error((err && err.errMsg) || '读头像失败')),
    });
  });
}

function copyAvatarCache(filePath: string): Promise<string> {
  const dest = avatarCachePath();
  if (filePath === dest) {
    return Promise.resolve(dest);
  }
  return new Promise((resolve, reject) => {
    const manager = fs();
    const write = () => {
      manager.copyFile({
        srcPath: filePath,
        destPath: dest,
        success: () => resolve(dest),
        fail: (err) => reject(new Error((err && err.errMsg) || '缓存头像失败')),
      });
    };
    manager.unlink({
      filePath: dest,
      complete: write,
    });
  });
}

export function avatarCacheExists(): boolean {
  try {
    fs().accessSync(avatarCachePath());
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * 选完的临时图：压到够小 → 存本机缓存（立刻能显示）→ 读出 base64 给云函数上传。
 * 不在客户端调 uploadFile，避开 Clash 半开时的 TLS 失败。
 * base64 压到约 80KB 以内，免得撑破云函数入参上限。
 */
export async function packAvatarForCloud(filePath: string): Promise<{ base64: string; localPath: string }> {
  const limits = [
    { quality: 55, width: 400 },
    { quality: 40, width: 320 },
    { quality: 28, width: 240 },
  ];
  let compact = filePath;
  let base64 = '';
  for (let i = 0; i < limits.length; i += 1) {
    compact = await compressImage(filePath, limits[i].quality, limits[i].width);
    base64 = await readBase64(compact);
    if (base64 && base64.length <= 80000) {
      break;
    }
  }
  if (!base64) {
    throw new Error('头像读出来是空的');
  }
  if (base64.length > 80000) {
    throw new Error('头像太大，请换一张更小的图');
  }
  const localPath = await copyAvatarCache(compact);
  return { base64, localPath };
}

/** 相册 / 头像选出来的临时路径。包内图、云 fileID、本机头像缓存都不用再传。 */
export function isLocalTempFile(src: string): boolean {
  if (!src) {
    return false;
  }
  if (src === avatarCachePath()) {
    return false;
  }
  if (src.indexOf('/assets/') === 0 || src.indexOf('cloud://') === 0) {
    return false;
  }
  if (src.indexOf('https://') === 0 && src.indexOf('/tmp') < 0) {
    return false;
  }
  return true;
}
