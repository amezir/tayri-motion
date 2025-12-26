const isBlobValid = (blob, canvasWidth, canvasHeight) => {
  if (!blob || 
      typeof blob.centerX !== 'number' || 
      typeof blob.centerY !== 'number' ||
      typeof blob.width !== 'number' || 
      typeof blob.height !== 'number' ||
      blob.width <= 0 || 
      blob.height <= 0 ||
      isNaN(blob.centerX) || 
      isNaN(blob.centerY) ||
      isNaN(blob.width) || 
      isNaN(blob.height)) {
    return false;
  }
  
  const blobLeft = blob.x || (blob.centerX - blob.width / 2);
  const blobRight = (blob.x || (blob.centerX - blob.width / 2)) + blob.width;
  const blobTop = blob.y || (blob.centerY - blob.height / 2);
  const blobBottom = (blob.y || (blob.centerY - blob.height / 2)) + blob.height;
  
  const margin = 50;
  const isVisible = blobRight > -margin && 
                    blobLeft < canvasWidth + margin &&
                    blobBottom > -margin && 
                    blobTop < canvasHeight + margin;
  
  return isVisible;
};

export const getEdgeConnectionPoint = (blob1, blob2) => {
  const dx = blob2.centerX - blob1.centerX;
  const dy = blob2.centerY - blob1.centerY;
  const angle = Math.atan2(dy, dx);
  
  const halfWidth1 = blob1.width / 2;
  const halfHeight1 = blob1.height / 2;
  
  let startX, startY;
  const absAngle = Math.abs(angle);
  const cornerAngle = Math.atan2(halfHeight1, halfWidth1);
  
  if (absAngle < cornerAngle) {
    startX = blob1.centerX + halfWidth1;
    startY = blob1.centerY + halfWidth1 * Math.tan(angle);
  } else if (absAngle > Math.PI - cornerAngle) {
    startX = blob1.centerX - halfWidth1;
    startY = blob1.centerY - halfWidth1 * Math.tan(angle);
  } else if (angle > 0) {
    startY = blob1.centerY + halfHeight1;
    startX = blob1.centerX + halfHeight1 / Math.tan(angle);
  } else {
    startY = blob1.centerY - halfHeight1;
    startX = blob1.centerX - halfHeight1 / Math.tan(angle);
  }
  
  const halfWidth2 = blob2.width / 2;
  const halfHeight2 = blob2.height / 2;
  const reverseAngle = angle + Math.PI;
  
  let endX, endY;
  const absReverseAngle = Math.abs(reverseAngle);
  const cornerAngle2 = Math.atan2(halfHeight2, halfWidth2);
  
  if (absReverseAngle < cornerAngle2) {
    endX = blob2.centerX + halfWidth2;
    endY = blob2.centerY + halfWidth2 * Math.tan(reverseAngle);
  } else if (absReverseAngle > Math.PI - cornerAngle2) {
    endX = blob2.centerX - halfWidth2;
    endY = blob2.centerY - halfWidth2 * Math.tan(reverseAngle);
  } else if (reverseAngle > 0) {
    endY = blob2.centerY + halfHeight2;
    endX = blob2.centerX + halfHeight2 / Math.tan(reverseAngle);
  } else {
    endY = blob2.centerY - halfHeight2;
    endX = blob2.centerX - halfHeight2 / Math.tan(reverseAngle);
  }
  
  return { startX, startY, endX, endY };
};

export const drawArrow = (ctx, fromX, fromY, toX, toY, curvature) => {
  const headLength = 15;
  const headAngle = Math.PI / 6;

  if (curvature === 0) {
    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.lineTo(toX, toY);
    ctx.stroke();

    const angle = Math.atan2(toY - fromY, toX - fromX);
    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - headAngle),
      toY - headLength * Math.sin(angle - headAngle)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + headAngle),
      toY - headLength * Math.sin(angle + headAngle)
    );
    ctx.stroke();
  } else {
    const midX = (fromX + toX) / 2;
    const midY = (fromY + toY) / 2;
    const dx = toX - fromX;
    const dy = toY - fromY;
    const controlX = midX - dy * (curvature / 100);
    const controlY = midY + dx * (curvature / 100);

    ctx.beginPath();
    ctx.moveTo(fromX, fromY);
    ctx.quadraticCurveTo(controlX, controlY, toX, toY);
    ctx.stroke();

    const t = 0.95;
    const tangentX = 2 * (1 - t) * (controlX - fromX) + 2 * t * (toX - controlX);
    const tangentY = 2 * (1 - t) * (controlY - fromY) + 2 * t * (toY - controlY);
    const angle = Math.atan2(tangentY, tangentX);

    ctx.beginPath();
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle - headAngle),
      toY - headLength * Math.sin(angle - headAngle)
    );
    ctx.moveTo(toX, toY);
    ctx.lineTo(
      toX - headLength * Math.cos(angle + headAngle),
      toY - headLength * Math.sin(angle + headAngle)
    );
    ctx.stroke();
  }
};

const getDistance = (blob1, blob2) => {
  const dx = blob2.centerX - blob1.centerX;
  const dy = blob2.centerY - blob1.centerY;
  return Math.sqrt(dx * dx + dy * dy);
};

export const drawConnections = (ctx, blobs, params) => {
  if (!blobs || blobs.length < 2 || !ctx) return;

  const canvasWidth = ctx.canvas.width;
  const canvasHeight = ctx.canvas.height;
  
  ctx.save();

  const validBlobs = blobs.filter(blob => isBlobValid(blob, canvasWidth, canvasHeight));
  
  if (validBlobs.length < 2) {
    ctx.restore();
    return;
  }

  ctx.strokeStyle = params.connectionColor || '#ffffff';
  ctx.lineWidth = params.connectionWidth || 2;

  if (params.connectionStyle === 'dashed') {
    ctx.setLineDash([params.dashLength || 10, params.dashGap || 5]);
  } else {
    ctx.setLineDash([]);
  }

  const curvature = params.connectionCurvature || 0;
  
  const maxConnectionDistance = params.maxConnectionDistance || 300;
  
  const drawnConnections = new Set();

  for (let i = 0; i < validBlobs.length; i++) {
    const blob1 = validBlobs[i];
    
    for (let j = i + 1; j < validBlobs.length; j++) {
      const blob2 = validBlobs[j];
      
      const distance = getDistance(blob1, blob2);
      
      if (distance > 1 && distance <= maxConnectionDistance) {
        const id1 = `${Math.round(blob1.centerX)},${Math.round(blob1.centerY)}`;
        const id2 = `${Math.round(blob2.centerX)},${Math.round(blob2.centerY)}`;
        const connectionKey = id1 < id2 ? `${id1}-${id2}` : `${id2}-${id1}`;
        
        if (!drawnConnections.has(connectionKey)) {
          drawnConnections.add(connectionKey);
          
          let fromX, fromY, toX, toY;

          try {
            if (params.connectionFromEdge) {
              const points = getEdgeConnectionPoint(blob1, blob2);
              fromX = points.startX;
              fromY = points.startY;
              toX = points.endX;
              toY = points.endY;
              
              if (isNaN(fromX) || isNaN(fromY) || isNaN(toX) || isNaN(toY)) {
                continue;
              }
              
              const connectionLength = Math.sqrt(
                (toX - fromX) ** 2 + (toY - fromY) ** 2
              );
              if (connectionLength > maxConnectionDistance * 1.5) {
                continue;
              }
            } else {
              fromX = blob1.centerX;
              fromY = blob1.centerY;
              toX = blob2.centerX;
              toY = blob2.centerY;
            }

            const maxCoord = Math.max(canvasWidth, canvasHeight) * 2;
            if (Math.abs(fromX) > maxCoord || Math.abs(fromY) > maxCoord ||
                Math.abs(toX) > maxCoord || Math.abs(toY) > maxCoord) {
              continue;
            }

            if (params.connectionStyle === 'arrow') {
              drawArrow(ctx, fromX, fromY, toX, toY, curvature);
            } else {
              if (curvature === 0) {
                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.lineTo(toX, toY);
                ctx.stroke();
              } else {
                const midX = (fromX + toX) / 2;
                const midY = (fromY + toY) / 2;
                const dx = toX - fromX;
                const dy = toY - fromY;
                const controlX = midX - dy * (curvature / 100);
                const controlY = midY + dx * (curvature / 100);

                ctx.beginPath();
                ctx.moveTo(fromX, fromY);
                ctx.quadraticCurveTo(controlX, controlY, toX, toY);
                ctx.stroke();
              }
            }
          } catch (error) {
            continue;
          }
        }
      }
    }
  }

  ctx.setLineDash([]);
  
  ctx.restore();
};