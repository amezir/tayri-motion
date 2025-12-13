const floodFill = (startX, startY, binaryData, width, height, visited) => {
  const stack = [[startX, startY]];
  const pixels = [];
  let minX = startX,
    maxX = startX,
    minY = startY,
    maxY = startY;

  while (stack.length > 0) {
    const [x, y] = stack.pop();
    const idx = y * width + x;

    if (x < 0 || x >= width || y < 0 || y >= height) continue;
    if (visited[idx] || binaryData[idx] === 0) continue;

    visited[idx] = 1;
    pixels.push([x, y]);

    minX = Math.min(minX, x);
    maxX = Math.max(maxX, x);
    minY = Math.min(minY, y);
    maxY = Math.max(maxY, y);

    stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
  }

  return { pixels, minX, maxX, minY, maxY };
};

export const detectBlobs = (binaryData, width, height, params) => {
  const visited = new Uint8Array(width * height);
  const blobs = [];

  const step = 3;

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