// Main function
function drawAll(hypCanvas) {
  clearCanvas(hypCanvas);
  drawShapes(hypCanvas);
  drawBoundary(hypCanvas);
  drawCursor(hypCanvas); 
}

export { drawAll }

// Wipes the canvas clean
function clearCanvas(hypCanvas) {
  // Extract the context and canvas width
  const ctx = hypCanvas.ctx;
  const width = hypCanvas.width;

  // Transform back to "standard" coord system
  ctx.scale(1, -1);
  ctx.translate(-width/2, -width/2);

  // Clear out the canvas and add a white square
  ctx.clearRect(0, 0, width, width);
  ctx.fillStyle = 'white';
  ctx.fillRect(0, 0, width, width);

  // Transform back to Cartesian coord system
  ctx.translate(width/2, width/2);
  ctx.scale(1, -1);
}

// Draws the shapes stored in hypCanvas.shapes
function drawShapes(hypCanvas) {
  for (const shapeArray of Object.values(hypCanvas.shapes)) {
    shapeArray.forEach(shape => shape.draw(hypCanvas));
  }
}

// Draw boundary and mask outside of it
function drawBoundary(hypCanvas) {
  // Extract canvas context, width, and radius
  const ctx = hypCanvas.ctx;
  const width = hypCanvas.width;
  const radius = hypCanvas.radius;

  // Draw the boundary circle
  ctx.beginPath();
  ctx.strokeStyle = 'black';
  ctx.lineWidth = 1;
  ctx.arc(0, 0, radius, 0, 7);
  ctx.stroke();

  // Draw a mask outside of the boundary
  ctx.beginPath();
  ctx.fillStyle = "white";
  ctx.scale(1, -1);
  ctx.translate(-width/2, -width/2);
  ctx.rect(0, 0, 2 * width, 2 * width);
  ctx.translate(width/2, width/2);
  ctx.scale(1, -1);
  ctx.arc(0, 0, radius, 0, 7);
  ctx.fill();
}

// Draw the cursor
function drawCursor(hypCanvas) {
  const cursor = hypCanvas.cursor;
  if (cursor.display) {
    cursor.point.draw(hypCanvas, false);
  }
}