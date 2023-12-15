function getCanvasCoord(e, hypCanvas) {
  return [
    e.clientX - hypCanvas.offsetX,
    -(e.clientY - hypCanvas.offsetY)
  ];
}

function unselectAllShapes(hypCanvas) {
  // Clear out selected shapes array
  hypCanvas.selected = false;

  // Unselect lines
  for (const line of hypCanvas.shapes.lines) {
    line.selected = false;
    for (const anchor of line.anchors) {
      anchor.selected = false;
      anchor.fillStyle = 'gray';
    }
  }

  // Unselect polygons
  for (const polygon of hypCanvas.shapes.polygons) {
    polygon.selected = false;
    for (const edge of polygon.edges) {
      edge.selected = false;
      for (const anchor of edge.anchors) {
        anchor.selected = false;
        anchor.fillStyle = 'gray';
      }
    }
  }

  // Unselect center of rotation
  if (hypCanvas.centerOfRotation && !hypCanvas.transforming) {
    hypCanvas.centerOfRotation.selected = false;
    hypCanvas.centerOfRotation.fillStyle = 'fuchsia';
  }

  // Unselect axis of translation
  if (hypCanvas.axisOfTranslation && !hypCanvas.transforming) {
    const axis = hypCanvas.axisOfTranslation.axis;
    axis.selected = false;
    axis.strokeStyle = 'fuchsia';
    for (const anchor of axis.anchors) {
      anchor.selected = false;
      anchor.fillStyle = 'fuchsia';
    }
  }
}

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

function deepCopyShapes(shapes) {
  // Create an empty object as a copy
  const deepCopy = {
    lines: [],
    polygons: [],
    clickedPoints: [],
  };

  // Copy the lines
  for (const line of shapes.lines) {
    deepCopy.lines.push(line.recalculatePosition(0, 0))
  }

  // Copy the polygons
  for (const polygon of shapes.polygons) {
    deepCopy.polygons.push(polygon.recalculatePosition(0, 0));
  }

  // Copy the clicked points
  for (const clicked of shapes.clickedPoints) {
    deepCopy.clickedPoints.push(clicked.recalculatePosition(0, 0));
  }

  return deepCopy;
}

function getRadioButtonValue(name) {
  // Get all radio buttons with name
  const radioButtons = document.getElementsByName(name);

  // Return the value of the checked button
  for (const button of radioButtons) {
    if (button.checked) {
      return button.value;
    }
  }
}

function removeBorder(allColorButtons) {
  for (const button of allColorButtons) {
    if (button.style.border) {
      button.style.removeProperty('border');
      break;
    }
  }
}

function resetToolBar(hypCanvas) {
  // Reset line width
  const lineWidth = hypCanvas.lineWidth
  const lineWidthRange = document.querySelector('#width');
  lineWidthRange.value = lineWidth

  // Remove the border from all the color buttons
  const allColorButtons = Array.from(document.querySelectorAll('.color-button'));
  removeBorder(allColorButtons);

  // Reset color
  const canvasColor = hypCanvas.colorType === 'stroke' ?
    hypCanvas.strokeStyle :
    hypCanvas.fillStyle;
  let colorButtonFound = false;
  const colorPickerDiv = allColorButtons.pop()
  for (const button of allColorButtons) {
    if (button.style.background === canvasColor) {
      colorButtonFound = true;
      button.style.border = '2px solid gray';
    }
  }
  if (!colorButtonFound) {
    const colorPicker = document.querySelector('.color-input');
    colorPicker.value = canvasColor;
    colorPickerDiv.style.background = canvasColor;
    colorPickerDiv.style.border = '2px solid gray';
  }
}

export {
  getCanvasCoord,
  unselectAllShapes,
  adjustDraggingShapes,
  deepCopyShapes,
  getRadioButtonValue,
  removeBorder,
  resetToolBar
}