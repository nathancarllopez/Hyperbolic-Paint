import { getCanvasCoord } from "./util.mjs";
import { drawAll } from "./drawToCanvas.mjs";
import { Point, Line, Polygon } from "./geometryClasses.mjs";

/**
 * DRAWING TOOLS
 */
//#region
function clickDragDown(e, hypCanvas) {
  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

  // If cursor is inside boundary...
  const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
  if (cursorInside) {
    // Find all selected shapes
    hypCanvas.findSelectedShapes(mouseX, mouseY);

    // If a shape was clicked, prepare to drag it
    if (hypCanvas.selected) {
      hypCanvas.dragging = true;
    }

    // Update and save
    hypCanvas.startX = mouseX;
    hypCanvas.startY = mouseY;
    hypCanvas.saveCurrentShapes();
  }

  // Otherwise, unselect all shapes
  else {
    if (hypCanvas.selected) {
      hypCanvas.unselectAllShapes();
    }
  }

  // Redraw the canvas
  drawAll(hypCanvas);
}

function clickDragMove(e, hypCanvas) {
  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

  // Adjust shapes if dragging or moving inside the boundary
  const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
  if (cursorInside) {
    // Handle shapes being dragged
    if (hypCanvas.dragging) {
      hypCanvas.adjustDraggingShapes(mouseX, mouseY);
      drawAll(hypCanvas);
    }
  }

  // If outside of the boundary, unselect all shapes and turn off flags
  else {
    if (hypCanvas.selected) {
      hypCanvas.unselectAllShapes();
    }
    hypCanvas.dragging = false;
    hypCanvas.moving = false;
  }
}

function clickDragUp(e, hypCanvas) {
  // Turn off the dragging and moving flags
  hypCanvas.dragging = false;

  // Turn the cursor on
  hypCanvas.cursor.display = true;
  hypCanvas.cursor.point = new Point(hypCanvas, ...getCanvasCoord(e, hypCanvas));

  // If no shape was moved, remove the saved shapes
  if (!hypCanvas.shapesMoved) {
    hypCanvas.shapeHistory.pop();
  }

  // Otherwise, turn off the shapes moved flag
  else {
    hypCanvas.shapesMoved = false;
  }
}

function lineClick(e, hypCanvas) {
  // Remove transform shape
  if (hypCanvas.transformShape) {
    hypCanvas.transformShape = null;
  }

  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
  if (cursorInside) {
    // Save a copy of the current shapes
    hypCanvas.saveCurrentShapes();

    // Add clicked point to shapes.clickedPoints
    hypCanvas.shapes.clickedPoints.push(new Point(hypCanvas, mouseX, mouseY));

    // If two points have been clicked, create a new line
    if (hypCanvas.shapes.clickedPoints.length == 2) {
      const lineToAdd = new Line(hypCanvas, ...hypCanvas.shapes.clickedPoints)
      console.log(lineToAdd.hypDist());
      hypCanvas.shapes.lines.push(lineToAdd)
      hypCanvas.shapes.clickedPoints.length = 0;
    }

    // Redraw the canvas
    drawAll(hypCanvas);
  }
}

function polygonClick(e, hypCanvas) {
  // Remove transform shape
  if (hypCanvas.transformShape) {
    hypCanvas.transformShape = null;
  }

  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
  if (cursorInside) {
    // Save a copy of the current shapes
    hypCanvas.saveCurrentShapes();

    // Add clicked point to shapes.clickedPoints
    hypCanvas.shapes.clickedPoints.push(new Point(hypCanvas, mouseX, mouseY));

    // If at least three points have been clicked and shift is pressed
    if (hypCanvas.shapes.clickedPoints.length > 2 && e.shiftKey) {
      const edges = [];
      for (let index = 0; index < hypCanvas.shapes.clickedPoints.length; index++) {
        const vertex1 = hypCanvas.shapes.clickedPoints[index];
        const vertex2 = index === hypCanvas.shapes.clickedPoints.length - 1 ?
          hypCanvas.shapes.clickedPoints[0] :
          hypCanvas.shapes.clickedPoints[index + 1];
        edges.push(new Line(hypCanvas, vertex1, vertex2));
      }
      hypCanvas.shapes.polygons.push(new Polygon(hypCanvas, ...edges));
      hypCanvas.shapes.clickedPoints.length = 0;
    }

    // Redraw the canvas
    drawAll(hypCanvas);
  }
}
//#endregion

/**
 * TRANSFORMATION TOOLS
 */
//#region
function rotateClick(e, hypCanvas) {
  // Remove transform shape
  if (hypCanvas.transformShape) {
    hypCanvas.transformShape = null;
  }

  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
  if (cursorInside) {
    // Save a copy of the current shapes
    hypCanvas.saveCurrentShapes();

    // Update the center of rotation
    hypCanvas.transformShape = new Point(hypCanvas, mouseX, mouseY);
    hypCanvas.transformShape.fillStyle = 'fuchsia';

    // Redraw the canvas
    drawAll(hypCanvas);
  }
}

function translateClick(e, hypCanvas) {
  // Remove transform shape
  if (hypCanvas.transformShape) {
    hypCanvas.transformShape = null;
  }
  
  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
  if (cursorInside) {
    // Save a copy of the current shapes
    hypCanvas.saveCurrentShapes();

    // Add clicked point to shapes.clickedPoints
    const clicked = new Point(hypCanvas, mouseX, mouseY)
    clicked.fillStyle = 'fuchsia';
    hypCanvas.shapes.clickedPoints.push(clicked);

    // If two points have been clicked, create a new line
    if (hypCanvas.shapes.clickedPoints.length == 2) {
      // Create the axis of translation
      const axisOfTranslation = new Line(hypCanvas, ...hypCanvas.shapes.clickedPoints);
      axisOfTranslation.strokeStyle = 'fuchsia';
      axisOfTranslation.anchors.forEach(
        anchor => anchor.fillStyle = 'fuchsia'
      );

      // Add the axis of translation to hypCanvas
      hypCanvas.transformShape = axisOfTranslation;

      // Clear out the clicked points
      hypCanvas.shapes.clickedPoints.length = 0;
    }

    // Redraw the canvas
    drawAll(hypCanvas);
  }
}
//#endregion

export {
  clickDragDown,
  clickDragMove,
  clickDragUp,
  lineClick,
  polygonClick,
  rotateClick,
  translateClick
}

// UNDER CONSTRUCTION
function updateToolbar(hypCanvas, shape) {
  // Get color buttons and line width range
  const lineWidthRange = document.querySelector('.width');
  const allColorButtons = Array.from(document.querySelectorAll('.color-button'));

  // Remove border from selected color button
  for (let index = 0; index < allColorButtons.length; index++) {
    const button = index === allColorButtons.length - 1 ?
      colorPickerDiv :
      allColorButtons[index];
    if (button.style.border) {
      button.style.removeProperty('border');
      break;
    }
  }

  // Shape is a line
  if (shape instanceof Line) {
    // Set line width range
    const change = shape.lineWidth - lineWidthRange.value;
    lineWidthRange.value = shape.lineWidth;
    hypCanvas.lineWidth = shape.lineWidth;
    hypCanvas.anchorSize = hypCanvas.anchorSize + change;

    // Set the colorType button to stroke
    const colorTypeButtons = document.getElementsByName('color-type');
    for (const button of colorTypeButtons) {
      if (button.id === 'fill') {
        button.checked = false;
      } else {
        button.checked = true;
      }
    }
    hypCanvas.colorType = 'stroke';

    // Set the color button
    const shapeColor = shape.strokeStyle;
    hypCanvas.strokeStyle = shapeColor;
    for (const button of allColorButtons) {
      if (button.style.background && button.style.background === shapeColor) {
        button.style.border = '2px solid gray';
        break;
      } else if (button.id && button.id === 'colorPickerDiv') {
        const colorPicker = document.querySelector('.color-input')
        const colorPickerColor = colorPicker.value;
        if (shapeColor !== colorPickerColor) {
          colorPicker.value = shapeColor;
          button.style.background = shapeColor;
        }
      }
    }
  }

  // Shape is a polygon
  else if (shape instanceof Polygon) {
    // Set line width range
    const change = shape.edges[0].lineWidth - lineWidthRange.value;
    lineWidthRange.value = shape.edges[0].lineWidth;
    hypCanvas.lineWidth = shape.edges[0].lineWidth;
    hypCanvas.anchorSize = hypCanvas.anchorSize + change;

    // Set the color buttons
    const shapeStrokeStyle = shape.edges[0].strokeStyle;
    const shapeFillStyle = shape.fillStyle;
    hypCanvas.strokeStyle = shapeStrokeStyle;
    hypCanvas.fillStyle = shapeFillStyle;
    const relevantColor = hypCanvas.colorType === 'stroke' ?
      shapeStrokeStyle :
      shapeFillStyle;
    for (const button of allColorButtons) {
      if (button.style.background && button.style.background === relevantColor) {
        button.style.border = '2px solid gray';
        break;
      } else if (button.id && button.id === 'colorPickerDiv') {
        const colorPicker = document.querySelector('.color-input')
        const colorPickerColor = colorPicker.value;
        if (relevantColor !== colorPickerColor) {
          colorPicker.value = relevantColor;
          button.style.background = relevantColor;
        }
      }
    }
  }
}