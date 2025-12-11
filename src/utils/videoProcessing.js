import { detectBlobs } from './blobDetection';
import { drawConnections } from './blobConnections';

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

  if (params.showBlobs) {
    ctx.strokeStyle = params.strokeStyle;
    ctx.lineWidth = 2;
    ctx.font = '14px monospace';
    ctx.fillStyle = params.fillStyle;

    detectedBlobs.forEach((blob) => {
      ctx.strokeRect(blob.x, blob.y, blob.width, blob.height);
      ctx.fillText(`x:${blob.centerX.toFixed(0)}, y:${blob.centerY.toFixed(0)}`, blob.x, blob.y - 5);
    });
  }

  if (params.showConnections && detectedBlobs.length > 1) {
    drawConnections(ctx, detectedBlobs, params);
  }
};