function getCanvasCoord(e, canvasInfo) {
  return [
    e.clientX - canvasInfo.offsetX,
    -(e.clientY - canvasInfo.offsetY)
  ];
}

function unselectAllShapes(shapes) {
  // Clear out selected shapes array
  shapes.selected = false;

  // Reset lines selected property
  for (const line of shapes.lines) {
    line.selected = false;
    for (const anchor of line.anchors) {
      anchor.selected = false;
      anchor.fillStyle = 'gray';
    }
  }

  // Reset polygons selected property
  for (const polygon of shapes.polygons) {
    polygon.selected = false;
    for (const edge of polygon.edges) {
      edge.selected = false;
      for (const anchor of edge.anchors) {
        anchor.selected = false;
        anchor.fillStyle = 'gray';
      }
    }
  }
}

// function unselectAllShapes(shapes) {
//   // Clear out selected shapes array
//   shapes.selected.length = 0;

//   // Reset lines selected property
//   for (const line of shapes.lines) {
//     line.selected = false;
//     for (const anchor of line.anchors) {
//       anchor.selected = false;
//       anchor.fillStyle = 'gray';
//     }
//   }

//   // Reset polygons selected property
//   for (const polygon of shapes.polygons) {
//     polygon.selected = false;
//     for (const edge of polygon.edges) {
//       edge.selected = false;
//       for (const anchor of edge.anchors) {
//         anchor.selected = false;
//         anchor.fillStyle = 'gray';
//       }
//     }
//   }
// }

function adjustDraggingShapes(shapeArray, changeX, changeY) {
  // Adjust selected shapes
  const newShapes = {}
  for (let index = 0; index < shapeArray.length; index++) {
    const shape = shapeArray[index];
    if (shape.selected) {
      newShapes[index] = shape.recalculatePosition(changeX, changeY);
    }
  }

  // Update shapeArray
  if (Object.keys(newShapes).length > 0) {
    for (const index in newShapes) {
      shapeArray[index] = newShapes[index];
    }
  }
}

export { getCanvasCoord, unselectAllShapes, adjustDraggingShapes }