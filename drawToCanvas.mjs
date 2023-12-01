function drawAll(canvasInfo, shapes) {
  clearCanvas(canvasInfo);
  drawShapes(canvasInfo, shapes);
  drawBoundary(canvasInfo);
  drawCursor(canvasInfo, shapes); 
}

function drawCursor(canvasInfo, shapes) {
  const cursor = canvasInfo.cursor;
  if (cursor.display) {
    cursor.point.draw(canvasInfo, false);
  }
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
    if (['clickedPoints', 'polygons', 'lines'].includes(shapeType)) {
      for (const shape of shapes[shapeType]) {
        shape.draw(canvasInfo);
      }
    }
  }
}

export { drawAll, drawBoundary }