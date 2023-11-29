function drawAll(canvasInfo, shapes) {
  clearCanvas(canvasInfo);
  drawShapes(canvasInfo, shapes);
  drawBoundary(canvasInfo);
}

function clearCanvas(canvasInfo) {
  const ctx = canvasInfo.ctx;
  const width = canvasInfo.width;

  ctx.scale(1, -1);
  ctx.translate(-width/2, -width/2);
  ctx.clearRect(0, 0, width, width);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, width);
  ctx.translate(width/2, width/2);
  ctx.scale(1, -1);
}

function drawBoundary(canvasInfo) {
  const ctx = canvasInfo.ctx;
  const width = canvasInfo.width;
  const radius = canvasInfo.radius;

  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.arc(0, 0, radius, 0, 7);
  ctx.stroke();
  ctx.strokeStyle = canvasInfo.strokeStyle;

  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.scale(1, -1);
  ctx.translate(-width/2, -width/2);
  ctx.rect(0, 0, 2 * width, 2 * width);
  ctx.translate(width/2, width/2);
  ctx.scale(1, -1);
  ctx.arc(0, 0, radius, 0, 7);
  ctx.fill();
  ctx.fillStyle = canvasInfo.fillStyle;
}

function drawShapes(canvasInfo, shapes) {
  for (const shapeType in shapes) {
    switch(shapeType) {
      case 'cursor': {
        const cursor = shapes[shapeType];
        if (cursor.display) {
          cursor.point.draw(canvasInfo, false);
        }
        break;
      }
      case 'lines': {
        for (const line of shapes[shapeType]) {
          line.draw(canvasInfo);
        }
        break;
      }
      case 'clickedPoints': {
        for (const point of shapes[shapeType]) {
          point.draw(canvasInfo);
        }
        break;
      }
      case 'polygons': {
        for (const polygon of shapes[shapeType]) {
          polygon.draw(canvasInfo)
        }
        break;
      }
    }
  }
}

export { drawAll, drawBoundary }

function plotAndLabelPoint(xCoord, yCoord, canvasInfo, plot = true) {
  const ctx = canvasInfo.ctx;
  const radius = canvasInfo.radius;
  const real = Math.round(1000 * xCoord/radius)/1000;
  const imaginary = Math.round(1000 * yCoord/radius)/1000;
  const anchorSize = canvasInfo.anchorSize;
  const label = `${real} + ${imaginary}i`;

  ctx.scale(1, -1);
  if (plot) {
    ctx.fillRect(xCoord - anchorSize/2, -anchorSize/2 - yCoord, anchorSize, anchorSize);
  }
  ctx.font = canvasInfo.font;
  ctx.fillText(label, xCoord + anchorSize/2, -(yCoord + anchorSize/2));
  ctx.scale(1, -1);
}

function plotLineOrSegment(line, canvasInfo) {
  const ctx = canvasInfo.ctx;
  for (const anchorLabel in line.anchors) {
    const anchor = line.anchors[anchorLabel]
    if (anchor.display) {
      ctx.fillStyle = anchor.fill;
      plotAndLabelPoint(anchor.x, anchor.y, canvasInfo);
    }
  }
  ctx.beginPath();
  if (line.segment) {
    ctx.moveTo(line.anchors.anchor1.x, line.anchors.anchor1.y);
    ctx.arc(line.centerX, line.centerY, line.radius, line.anchors.anchor1.angle, line.anchors.anchor2.angle);
  } else {
    ctx.moveTo(line.centerX + line.radius, line.centerY);
    ctx.arc(line.centerX, line.centerY, line.radius, 0, 7);
  }
  ctx.stroke();
}

// for (const line of shapes[shapeType]) {
//   for (const anchor of line.anchors) {
//     if (anchor.display) {
//       ctx.fillStyle = anchor.fill;
//       plotAndLabelPoint(anchor.x, anchor.y, canvasInfo);
//       ctx.fillStyle = 'black';
//     }
//   }
//   ctx.beginPath();
//   ctx.moveTo(line.centerX + line.radius, line.centerY);
//   ctx.arc(line.centerX, line.centerY, line.radius, 0, 7);
//   ctx.stroke();
// }