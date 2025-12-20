import { detectBlobs } from './blobDetection';
import { drawConnections } from './blobConnections';

const resolveColor = (value, fallback) => {
  if (typeof value === 'string') {
    return value;
  }

  if (value && typeof value === 'object') {
    let r = value.r ?? 0;
    let g = value.g ?? 0;
    let b = value.b ?? 0;
    let a = value.a ?? 1;

    if (r <= 1 && g <= 1 && b <= 1) {
      r = Math.round(r * 255);
      g = Math.round(g * 255);
      b = Math.round(b * 255);
    }

    if (a > 1) {
      a = a / 255;
    }

    a = Math.min(Math.max(a, 0), 1);

    return `rgba(${r}, ${g}, ${b}, ${a})`;
  }

  return fallback;
};

const randomFromCharset = (length, charset) => {
  let out = '';
  const n = charset.length;
  for (let i = 0; i < length; i++) {
    out += charset[Math.floor(Math.random() * n)];
  }
  return out;
};

const getRandomLabelForMode = (mode) => {
  switch (mode) {
    case 'randomNumbers':
      return randomFromCharset(6, '0123456789');
    case 'randomLetters':
      return randomFromCharset(6, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ');
    case 'randomSymbols':
      return randomFromCharset(6, '!@#$%^&*()[]{}<>?/|~-=+');
    default:
      return '';
  }
};

export const processVideoFrame = (video, canvas, params, onBlobsDetected) => {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  const binaryData = new Uint8Array(canvas.width * canvas.height);

  for (let i = 0; i < data.length; i += 4) {
    const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    const idx = i / 4;
    binaryData[idx] = gray > params.threshold ? 255 : 0;
  }

  const detectedBlobs = detectBlobs(binaryData, canvas.width, canvas.height, params);
  onBlobsDetected(detectedBlobs);

  if (!params.showOriginal) {
    for (let i = 0; i < binaryData.length; i++) {
      const val = binaryData[i];
      data[i * 4] = val;
      data[i * 4 + 1] = val;
      data[i * 4 + 2] = val;
    }
    ctx.putImageData(imageData, 0, 0);
  }

  let blurSourceCanvas = null;
  let blurSourceCtx = null;
  const wantsBlurFill =
    params.showBlobs &&
    (params.blobFillMode === 'blur' || params.blobFillMode === 'both' || params.blobFillMode === 'zoom');

  if (wantsBlurFill && typeof document !== 'undefined') {
    blurSourceCanvas = document.createElement('canvas');
    blurSourceCanvas.width = canvas.width;
    blurSourceCanvas.height = canvas.height;
    blurSourceCtx = blurSourceCanvas.getContext('2d');
    if (blurSourceCtx) {
      blurSourceCtx.drawImage(canvas, 0, 0);
    }
  }

  if (params.showBlobs) {
    const borderWidth = typeof params.blobBorderWidth === 'number'
      ? params.blobBorderWidth
      : 2;
    const fillOpacity = typeof params.blobFillOpacity === 'number'
      ? Math.min(Math.max(params.blobFillOpacity, 0), 1)
      : 0.35;
    const blurAmount = typeof params.blobBlurAmount === 'number'
      ? Math.max(params.blobBlurAmount, 0)
      : 6;
    const zoomLevel = typeof params.blobZoomLevel === 'number'
      ? Math.max(params.blobZoomLevel, 1)
      : 2;

    const labelFontFamily = params.blobLabelFontFamily || 'monospace';
    const labelColor = resolveColor(params.blobLabelColor, '#ffffff');

    const labelMode = params.blobLabelMode || 'coords';

    const previousCache = canvas._blobLabelCache || new Map();
    const nextCache = new Map();

    ctx.font = `14px ${labelFontFamily}`;
    ctx.textBaseline = 'top';

    detectedBlobs.forEach((blob) => {
      let labelText;
      if (labelMode === 'coords') {
        labelText = `x:${blob.centerX.toFixed(0)}, y:${blob.centerY.toFixed(0)}`;
      } else {
        const keyX = Math.round(blob.centerX / 20);
        const keyY = Math.round(blob.centerY / 20);
        const key = `${keyX}_${keyY}_${labelMode}`;

        if (previousCache.has(key)) {
          labelText = previousCache.get(key);
        } else {
          labelText = getRandomLabelForMode(labelMode) || '?';
        }
        nextCache.set(key, labelText);
      }

      if (
        (params.blobFillMode === 'blur' || params.blobFillMode === 'both') &&
        blurSourceCanvas && blurSourceCtx && blurAmount > 0
      ) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(blob.x, blob.y, blob.width, blob.height);
        ctx.clip();
        ctx.filter = `blur(${blurAmount}px)`;
        ctx.drawImage(blurSourceCanvas, 0, 0);
        ctx.restore();
      }

      if (params.blobFillMode === 'color' || params.blobFillMode === 'both') {
        ctx.save();
        ctx.globalAlpha = fillOpacity;
        ctx.fillStyle = resolveColor(params.fillStyle, '#ffffff');
        ctx.fillRect(blob.x, blob.y, blob.width, blob.height);
        ctx.restore();
      }

      // Zoom fill mode
      if (params.blobFillMode === 'zoom' && blurSourceCanvas && blurSourceCtx) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(blob.x, blob.y, blob.width, blob.height);
        ctx.clip();

        const blobCenterX = blob.centerX;
        const blobCenterY = blob.centerY;
        
        const sourceWidth = blob.width / zoomLevel;
        const sourceHeight = blob.height / zoomLevel;
        
        const sourceX = Math.max(0, Math.min(
          blobCenterX - sourceWidth / 2,
          blurSourceCanvas.width - sourceWidth
        ));
        const sourceY = Math.max(0, Math.min(
          blobCenterY - sourceHeight / 2,
          blurSourceCanvas.height - sourceHeight
        ));

        ctx.drawImage(
          blurSourceCanvas,
          sourceX, sourceY, sourceWidth, sourceHeight,
          blob.x, blob.y, blob.width, blob.height
        );
        ctx.restore();
      }

      if (borderWidth > 0) {
        ctx.strokeStyle = resolveColor(params.strokeStyle, '#ff0000');
        ctx.lineWidth = borderWidth;
        ctx.strokeRect(blob.x, blob.y, blob.width, blob.height);
      }

      ctx.fillStyle = labelColor;
      ctx.fillText(
        labelText,
        blob.x,
        Math.max(blob.y - 16, 0)
      );
    });

    canvas._blobLabelCache = nextCache;
  }

  if (params.showConnections && detectedBlobs.length > 1) {
    drawConnections(ctx, detectedBlobs, params);
  }
};