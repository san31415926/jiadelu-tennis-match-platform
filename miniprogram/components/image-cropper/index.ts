import { themeBehavior } from '../../behaviors/theme';

/**
 * ============================================================================
 * 通用图片裁剪器
 * ============================================================================
 *
 * 上传任意尺寸的图都能用：图按 contain 完整放进舞台，裁剪框按调用方给的
 * 宽高比（aspectRatio = 宽/高）套上去。拖框、拉四角、底部放大/缩小框，
 * 框里就是目标窗口会显示的那一块。确认后用 canvas 从原图像素裁出临时文件。
 *
 * 【怎么用】
 *   页面 json 先注册 image-cropper。
 *   <image-cropper
 *     wx:if="{{showCropper}}"
 *     src="{{cropSrc}}"
 *     aspect-ratio="{{cropRatio}}"
 *     bind:confirm="onCropConfirm"
 *     bind:cancel="onCropCancel"
 *   />
 *
 * aspectRatio 不传默认 1.5（3:2）。头像裁切传 1。封面按运行时量到的头图窗口算。
 * 裁剪是原生层 canvas，全屏打开时页面要先卸掉其它 canvas、藏自定义底栏。
 */

type CropBox = { x: number; y: number; w: number; h: number };
type CropTouch = { clientX: number; clientY: number };

const MIN_BOX_PX = 80;
const MAX_EXPORT_SIDE = 1600;

function ratioOf(value: number): number {
  return value > 0 ? value : 1.5;
}

function eventTouches(event: WechatMiniprogram.IAnyObject): CropTouch[] {
  return (event.touches || []) as CropTouch[];
}

function touchDist(a: CropTouch, b: CropTouch): number {
  const dx = a.clientX - b.clientX;
  const dy = a.clientY - b.clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function sizeLimits(areaW: number, areaH: number, aspect: number) {
  let maxW = areaW;
  let maxH = maxW / aspect;
  if (maxH > areaH) {
    maxH = areaH;
    maxW = maxH * aspect;
  }
  let minW = Math.min(MIN_BOX_PX, maxW);
  let minH = minW / aspect;
  if (minH > maxH) {
    minH = maxH;
    minW = minH * aspect;
  }
  if (minH < Math.min(MIN_BOX_PX, maxH) && minW < maxW) {
    minH = Math.min(MIN_BOX_PX, maxH);
    minW = minH * aspect;
    if (minW > maxW) {
      minW = maxW;
      minH = minW / aspect;
    }
  }
  return { minW, maxW };
}

function clampBox(x: number, y: number, w: number, areaW: number, areaH: number, aspect: number): CropBox {
  const { minW, maxW } = sizeLimits(areaW, areaH, aspect);
  const nextW = Math.max(minW, Math.min(w, maxW));
  const nextH = nextW / aspect;
  const nextX = Math.max(0, Math.min(x, areaW - nextW));
  const nextY = Math.max(0, Math.min(y, areaH - nextH));
  return { x: nextX, y: nextY, w: nextW, h: nextH };
}

function fitBox(areaW: number, areaH: number, aspect: number): CropBox {
  const { maxW } = sizeLimits(areaW, areaH, aspect);
  const w = maxW;
  const h = w / aspect;
  return { x: (areaW - w) / 2, y: (areaH - h) / 2, w, h };
}

Component({
  options: {
    virtualHost: true,
  },
  behaviors: [themeBehavior],
  properties: {
    /** 本地临时路径或包内路径 */
    src: {
      type: String,
      value: '',
    },
    /** 裁剪框宽/高。封面按头图窗口量，头像传 1 */
    aspectRatio: {
      type: Number,
      value: 1.5,
    },
    title: {
      type: String,
      value: '裁剪封面',
    },
    hint: {
      type: String,
      value: '拖动或拉四角，白框内就是页面会显示的区域',
    },
  },
  data: {
    statusBarHeight: 0,
    ready: false,
    exporting: false,
    resizing: false,
    displayW: 0,
    displayH: 0,
    imgLeft: 0,
    imgTop: 0,
    boxX: 0,
    boxY: 0,
    boxW: 0,
    boxH: 0,
    imageStyle: '',
  },

  lifetimes: {
    attached() {
      // Component({}) 顶层自定义字段不会挂到实例上。量图用的计数必须在这里初始化，
      // 否则 undefined+1 变成 NaN，NaN !== NaN 为 true，裁剪框永远不出现。
      this._boxX = 0;
      this._boxY = 0;
      this._naturalW = 0;
      this._naturalH = 0;
      this._layoutToken = 0;
      this._pinching = false;
      this._pinchDist = 0;
      this._pinchBox = null;
      this._drag = null;
      this.setData({ statusBarHeight: wx.getWindowInfo().statusBarHeight || 0 });
      this.layout();
    },
  },

  observers: {
    'src, aspectRatio'() {
      this.layout();
    },
  },

  methods: {
    onPreventMove() {},

    nextToken(): number {
      const token = (Number(this._layoutToken) || 0) + 1;
      this._layoutToken = token;
      return token;
    },

    layout() {
      const src = String(this.data.src || '');
      if (!src) {
        return;
      }
      const token = this.nextToken();
      wx.getImageInfo({
        src,
        success: (info) => {
          if (token !== this._layoutToken) {
            return;
          }
          this._naturalW = info.width;
          this._naturalH = info.height;
          this.measureStage(token);
        },
      });
    },

    onImageLoad(event: WechatMiniprogram.CustomEvent<{ width: number; height: number }>) {
      const width = event.detail && event.detail.width;
      const height = event.detail && event.detail.height;
      if (!width || !height) {
        return;
      }
      this._naturalW = width;
      this._naturalH = height;
      this.measureStage(this.nextToken());
    },

    onImageError() {
      wx.showToast({ title: '图片读取失败', icon: 'none' });
    },

    stageFallback(): { width: number; height: number } {
      const win = wx.getWindowInfo();
      const rpx = win.windowWidth / 750;
      const status = this.data.statusBarHeight || win.statusBarHeight || 0;
      const barH = 124 * rpx;
      const safeBottom = win.safeArea ? Math.max(0, win.windowHeight - win.safeArea.bottom) : 0;
      const dockH = 112 * rpx + safeBottom;
      return {
        width: win.windowWidth,
        height: Math.max(160, win.windowHeight - status - barH - dockH),
      };
    },

    measureStage(token: number) {
      if (this._naturalW < 1 || this._naturalH < 1) {
        return;
      }
      const fallback = this.stageFallback();
      this.createSelectorQuery()
        .select('.cropper__stage')
        .boundingClientRect()
        .exec((res) => {
          if (token !== this._layoutToken) {
            return;
          }
          const rect = res && res[0];
          const stageW = rect && rect.width >= 8 ? rect.width : fallback.width;
          const stageH = rect && rect.height >= 8 ? rect.height : fallback.height;
          this.placeOnStage(stageW, stageH);
        });
    },

    placeOnStage(stageW: number, stageH: number) {
      const naturalW = this._naturalW;
      const naturalH = this._naturalH;
      const contain = Math.min(stageW / naturalW, stageH / naturalH);
      const displayW = naturalW * contain;
      const displayH = naturalH * contain;
      const imgLeft = (stageW - displayW) / 2;
      const imgTop = (stageH - displayH) / 2;
      const box = fitBox(displayW, displayH, ratioOf(this.data.aspectRatio));
      this._boxX = box.x;
      this._boxY = box.y;
      this.setData({
        ready: true,
        displayW,
        displayH,
        imgLeft,
        imgTop,
        boxX: box.x,
        boxY: box.y,
        boxW: box.w,
        boxH: box.h,
        imageStyle:
          'width:' +
          displayW +
          'px;height:' +
          displayH +
          'px;left:' +
          imgLeft +
          'px;top:' +
          imgTop +
          'px;',
      });
    },

    applyBox(box: CropBox) {
      this._boxX = box.x;
      this._boxY = box.y;
      this.setData({
        boxX: box.x,
        boxY: box.y,
        boxW: box.w,
        boxH: box.h,
      });
    },

    onBoxChange(event: WechatMiniprogram.CustomEvent<{ x: number; y: number }>) {
      if (this.data.resizing || this._pinching) {
        return;
      }
      this._boxX = event.detail.x;
      this._boxY = event.detail.y;
    },

    onHandleStart(event: WechatMiniprogram.TouchEvent) {
      const touch = eventTouches(event)[0];
      if (!touch) {
        return;
      }
      this._drag = {
        corner: String(event.currentTarget.dataset.corner),
        startX: touch.clientX,
        startY: touch.clientY,
        box: {
          x: this._boxX,
          y: this._boxY,
          w: this.data.boxW,
          h: this.data.boxH,
        },
      };
      this.setData({ resizing: true });
    },

    onHandleMove(event: WechatMiniprogram.TouchEvent) {
      const drag = this._drag;
      const touch = eventTouches(event)[0];
      if (!drag || !touch) {
        return;
      }
      const dx = touch.clientX - drag.startX;
      const dy = touch.clientY - drag.startY;
      const aspect = ratioOf(this.data.aspectRatio);
      const start = drag.box;
      const right = start.x + start.w;
      const bottom = start.y + start.h;
      const widthFromX = (sign: number) => start.w + sign * dx;
      const widthFromY = (sign: number) => (start.h + sign * dy) * aspect;
      let nextW = start.w;
      let anchorRight = false;
      let anchorBottom = false;
      const corner = drag.corner;
      if (corner === 'se') {
        nextW = Math.abs(dx) > Math.abs(dy) * aspect ? widthFromX(1) : widthFromY(1);
      } else if (corner === 'nw') {
        nextW = Math.abs(dx) > Math.abs(dy) * aspect ? widthFromX(-1) : widthFromY(-1);
        anchorRight = true;
        anchorBottom = true;
      } else if (corner === 'ne') {
        nextW = Math.abs(dx) > Math.abs(dy) * aspect ? widthFromX(1) : widthFromY(-1);
        anchorBottom = true;
      } else {
        nextW = Math.abs(dx) > Math.abs(dy) * aspect ? widthFromX(-1) : widthFromY(1);
        anchorRight = true;
      }
      const areaW = this.data.displayW;
      const areaH = this.data.displayH;
      const { minW, maxW } = sizeLimits(areaW, areaH, aspect);
      nextW = Math.max(minW, Math.min(nextW, maxW));
      let nextH = nextW / aspect;
      let nextX = anchorRight ? right - nextW : start.x;
      let nextY = anchorBottom ? bottom - nextH : start.y;
      if (nextX < 0) {
        nextW += nextX;
        nextX = 0;
        nextH = nextW / aspect;
        if (anchorBottom) {
          nextY = bottom - nextH;
        }
      }
      if (nextY < 0) {
        nextH += nextY;
        nextY = 0;
        nextW = nextH * aspect;
        if (anchorRight) {
          nextX = right - nextW;
        }
      }
      if (nextX + nextW > areaW) {
        nextW = areaW - nextX;
        nextH = nextW / aspect;
        if (anchorBottom) {
          nextY = bottom - nextH;
        }
      }
      if (nextY + nextH > areaH) {
        nextH = areaH - nextY;
        nextW = nextH * aspect;
        if (anchorRight) {
          nextX = right - nextW;
        }
      }
      this.applyBox(clampBox(nextX, nextY, nextW, areaW, areaH, aspect));
    },

    onHandleEnd() {
      this._drag = null;
      this.setData({ resizing: false });
    },

    onPinchStart(event: WechatMiniprogram.TouchEvent) {
      const touches = eventTouches(event);
      if (touches.length < 2) {
        return;
      }
      this._pinching = true;
      this._pinchDist = touchDist(touches[0], touches[1]);
      this._pinchBox = {
        x: this._boxX,
        y: this._boxY,
        w: this.data.boxW,
        h: this.data.boxH,
      };
    },

    onPinchMove(event: WechatMiniprogram.TouchEvent) {
      const start = this._pinchBox;
      const touches = eventTouches(event);
      if (!this._pinching || !start || touches.length < 2 || this._pinchDist < 1) {
        return;
      }
      const aspect = ratioOf(this.data.aspectRatio);
      const factor = touchDist(touches[0], touches[1]) / this._pinchDist;
      const nextW = start.w * factor;
      const cx = start.x + start.w / 2;
      const cy = start.y + start.h / 2;
      this.applyBox(
        clampBox(cx - nextW / 2, cy - nextW / aspect / 2, nextW, this.data.displayW, this.data.displayH, aspect),
      );
    },

    onPinchEnd() {
      this._pinching = false;
      this._pinchBox = null;
    },

    onZoomIn() {
      this.zoomBox(1.12);
    },

    onZoomOut() {
      this.zoomBox(0.88);
    },

    zoomBox(factor: number) {
      const aspect = ratioOf(this.data.aspectRatio);
      const w = this.data.boxW * factor;
      const cx = this._boxX + this.data.boxW / 2;
      const cy = this._boxY + this.data.boxH / 2;
      this.applyBox(
        clampBox(cx - w / 2, cy - w / aspect / 2, w, this.data.displayW, this.data.displayH, aspect),
      );
    },

    onCancel() {
      if (this.data.exporting) {
        return;
      }
      this.triggerEvent('cancel');
    },

    onConfirm() {
      if (this.data.exporting || !this.data.ready) {
        return;
      }
      const naturalW = this._naturalW;
      const naturalH = this._naturalH;
      const displayW = this.data.displayW;
      if (naturalW < 1 || displayW < 1) {
        wx.showToast({ title: '图片还没准备好', icon: 'none' });
        return;
      }
      const scale = naturalW / displayW;
      const srcX = Math.max(0, this._boxX * scale);
      const srcY = Math.max(0, this._boxY * scale);
      const srcW = Math.min(naturalW - srcX, this.data.boxW * scale);
      const srcH = Math.min(naturalH - srcY, this.data.boxH * scale);
      if (srcW < 2 || srcH < 2) {
        wx.showToast({ title: '裁剪区域太小', icon: 'none' });
        return;
      }
      const aspect = srcW / srcH;
      let destW = srcW;
      let destH = srcH;
      if (destW > MAX_EXPORT_SIDE) {
        destW = MAX_EXPORT_SIDE;
        destH = destW / aspect;
      }
      if (destH > MAX_EXPORT_SIDE) {
        destH = MAX_EXPORT_SIDE;
        destW = destH * aspect;
      }
      destW = Math.max(2, Math.round(destW));
      destH = Math.max(2, Math.round(destH));
      this.setData({ exporting: true });
      this.exportCrop({ srcX, srcY, srcW, srcH, destW, destH });
    },

    exportCrop(rect: {
      srcX: number;
      srcY: number;
      srcW: number;
      srcH: number;
      destW: number;
      destH: number;
    }) {
      this.createSelectorQuery()
        .select('#cropCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          const target = res && res[0];
          const canvas = target && target.node;
          if (!canvas) {
            this.setData({ exporting: false });
            wx.showToast({ title: '裁剪失败，请重试', icon: 'none' });
            return;
          }
          canvas.width = rect.destW;
          canvas.height = rect.destH;
          const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
          const image = canvas.createImage();
          image.onload = () => {
            ctx.clearRect(0, 0, rect.destW, rect.destH);
            ctx.drawImage(
              image,
              rect.srcX,
              rect.srcY,
              rect.srcW,
              rect.srcH,
              0,
              0,
              rect.destW,
              rect.destH,
            );
            wx.canvasToTempFilePath({
              canvas,
              fileType: 'jpg',
              quality: 0.92,
              destWidth: rect.destW,
              destHeight: rect.destH,
              success: (file) => {
                this.triggerEvent('confirm', { path: file.tempFilePath });
              },
              fail: () => {
                this.setData({ exporting: false });
                wx.showToast({ title: '导出失败，请重试', icon: 'none' });
              },
            });
          };
          image.onerror = () => {
            this.setData({ exporting: false });
            wx.showToast({ title: '图片读取失败', icon: 'none' });
          };
          image.src = String(this.data.src || '');
        });
    },
  },
});
