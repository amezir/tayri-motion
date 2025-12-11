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

export const drawConnections = (ctx, blobs, params) => {
  if (blobs.length < 2) return;

  ctx.strokeStyle = params.connectionColor;
  ctx.lineWidth = params.connectionWidth;

  if (params.connectionStyle === 'dashed') {
    ctx.setLineDash([params.dashLength, params.dashGap]);
  } else {
    ctx.setLineDash([]);
  }

  const curvature = params.connectionCurvature;

  // Connecter chaque blob au suivant dans l'ordre
  for (let i = 0; i < blobs.length - 1; i++) {
    const blob1 = blobs[i];
    const blob2 = blobs[i + 1];

    let fromX, fromY, toX, toY;

    if (params.connectionFromEdge) {
      const points = getEdgeConnectionPoint(blob1, blob2);
      fromX = points.startX;
      fromY = points.startY;
      toX = points.endX;
      toY = points.endY;
    } else {
      fromX = blob1.centerX;
      fromY = blob1.centerY;
      toX = blob2.centerX;
      toY = blob2.centerY;
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
  }

  ctx.setLineDash([]);
};