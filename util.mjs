function getCanvasCoord(e, canvasInfo) {
  return [
    e.clientX - canvasInfo.offsetX,
    -(e.clientY - canvasInfo.offsetY)
  ];
}

function pointClicked(point, mouseX, mouseY, anchorSize) {
  return (mouseX - point.x)**2 + (mouseY - point.y)**2 < anchorSize**2
}

function resetShapes(shapesToReset) {
  // Reset lines
  for (const line of shapesToReset.lines) {
    for (const anchor of line.anchors) {
      anchor.selected = false;
      anchor.fillStyle = 'gray';
    }
  }

  // Reset polygons
  for (const polygon of shapesToReset.polygons) {
    for (const vertex of polygon.vertices) {
      vertex.selected = false;
      vertex.fillStyle = 'gray';
    }
  }
}

export { getCanvasCoord, pointClicked, resetShapes }