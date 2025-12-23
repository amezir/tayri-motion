const floodFill = (startX, startY, binaryData, width, height, visited) => {
  const stack = [[startX, startY]];
  const pixels = [];
  let minX = startX,
    maxX = startX,
    minY = startY,
    maxY = startY;

  const maxPixels = 100000;
  let pixelCount = 0;

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const idx = y * width + x;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[idx] || binaryData[idx] === 0) continue;

    visited[idx] = 1;
    pixels.push([x, y]);
    pixelCount++;

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    if (pixelCount >= maxPixels) {
      for (const [sx, sy] of stack) {
        const sidx = sy * width + sx;
        if (sidx >= 0 && sidx < visited.length) {
          visited[sidx] = 1;
        }
      }
      break;
    }

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return { pixels, minX, maxX, minY, maxY };
};

export const detectBlobs = (binaryData, width, height, params) => {
  const visited = new Uint8Array(width * height);
  const blobs = [];

  let whitePixelCount = 0;
  for (let i = 0; i < binaryData.length; i += 8) {
    if (binaryData[i] === 255) whitePixelCount += 8;
  }
  const whitePixelRatio = whitePixelCount / (width * height);
  
  let step = 2;
  if (whitePixelRatio > 0.15) step = 3;
  if (whitePixelRatio > 0.25) step = 4;
  if (whitePixelRatio > 0.40) step = 6;
  if (whitePixelRatio > 0.60) step = 8;
  if (whitePixelRatio > 0.75) step = 10;

  for (let y = 0; y < height; y += step) {
    for (let x = 0; x < width; x += step) {
      const idx = y * width + x;
      if (binaryData[idx] === 255 && !visited[idx]) {
        const blob = floodFill(x, y, binaryData, width, height, visited);

        if (blob.pixels.length >= params.minBlobSize) {
          const centerX = (blob.minX + blob.maxX) / 2;
          const centerY = (blob.minY + blob.maxY) / 2;

          blobs.push({
            x: blob.minX,
            y: blob.minY,
            width: blob.maxX - blob.minX,
            height: blob.maxY - blob.minY,
            centerX,
            centerY,
            size: blob.pixels.length,
          });
        }
      }
    }
  }

  const sortedBlobs = blobs.sort((a, b) => b.size - a.size).slice(0, params.maxBlobs);
  
  return sortedBlobs.sort((a, b) => {
    const xDiff = a.centerX - b.centerX;
    if (Math.abs(xDiff) > 50) return xDiff; 
    return a.centerY - b.centerY;
  });
};