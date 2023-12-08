import { 
  getCanvasCoord,
  unselectAllShapes,
  deepCopyShapes,
  adjustDraggingShapes } from "./util.mjs";
import { drawAll } from "./drawToCanvas.mjs";
import { Point, Line, Polygon } from "./classes.mjs";

/**
 * DRAWING TOOLS
 */
//#region
function selectDown(e, hypCanvas) {
  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

  // Get the shapes object
  const shapes = hypCanvas.shapes;

  // If cursor is inside boundary...
  const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
  if (cursorInside) {
    // Clear out any previously selected shapes
    unselectAllShapes(hypCanvas);

    // Create an array to hold the selected shape(s)
    const selectedShapes = [];

    // Check if a line was selected
    for (const line of shapes.lines) {
      for (const anchor of line.anchors) {
        if (anchor.pointClicked(mouseX, mouseY)) {
          anchor.selected = true;
          anchor.fillStyle = 'black';
          line.selected = true;
          selectedShapes.push(line);
          hypCanvas.selected = true;
          break;
        }
      }
    }

    // Check if a polygon was selected
    for (const polygon of shapes.polygons) {
      let numSelectedEdges = 0;
      for (const edge of polygon.edges) {
        // Search the anchors of this edge
        for (const anchor of edge.anchors) {
          if (anchor.pointClicked(mouseX, mouseY)) {
            anchor.selected = true;
            anchor.fillStyle = 'black';
            edge.selected = true;
            numSelectedEdges++;
            break;
          }
        }

        // Once we've found two selected edges, stop searching this polygon
        if (numSelectedEdges === 2) {
          polygon.selected = true;
          selectedShapes.push(polygon);
          hypCanvas.selected = true;
          break;
        }
      }
    }

    // If a shape was clicked...
    if (hypCanvas.selected) {
      // Update start position
      hypCanvas.startX = mouseX;
      hypCanvas.startY = mouseY;

      // Turn on dragging flag
      hypCanvas.dragging = true;

      // Save a copy of current shapes
      hypCanvas.shapeHistory.push(deepCopyShapes(shapes));

      // // If only one shape was selected, update the toolbar
      // if (selectedShapes.length === 1) {
      //   updateToolbar(hypCanvas, selectedShapes[0]);
      // }
    }

    // Otherwise, unselect all shapes
    else {
      unselectAllShapes(hypCanvas);
    }
  }

  // Otherwise, unselect all shapes
  else {
    unselectAllShapes(hypCanvas);
  }

  // Redraw the canvas
  drawAll(hypCanvas);

}

function selectMove(e, hypCanvas) {
  // Only proceed if a shape is being dragged
  if (hypCanvas.dragging) {
    // Get canvas coordinates
    const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

    // Adjust shapes if inside boundary
    const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
    if (cursorInside) {
      // Turn on shapes moved flag
      hypCanvas.shapesMoved = true;

      // Calculate movement
      const changeX = mouseX - hypCanvas.startX;
      const changeY = mouseY - hypCanvas.startY;
      hypCanvas.startX = mouseX;
      hypCanvas.startY = mouseY;
      
      // Adjust dragging lines
      adjustDraggingShapes(hypCanvas.shapes.lines, changeX, changeY);

      // Adjust dragging polygons
      adjustDraggingShapes(hypCanvas.shapes.polygons, changeX, changeY);
    }

    // Otherwise, reset shapes and turn off dragging flag
    else {
      unselectAllShapes(hypCanvas);
      hypCanvas.dragging = false;
    }

    // Redraw the canvas
    drawAll(hypCanvas);
  }
}

function selectUp(e, hypCanvas) {
  // Turn off the dragging flag
  hypCanvas.dragging = false;

  // Turn the cursor on
  hypCanvas.cursor.display = true;
  hypCanvas.cursor.point = new Point(...getCanvasCoord(e, hypCanvas));

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
  // Unselect any selected shapes
  if (hypCanvas.shapes.selected) {
    unselectAllShapes(hypCanvas);
  }

  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
  if (cursorInside) {
    // Save a copy of the current shapes
    hypCanvas.shapeHistory.push(deepCopyShapes(hypCanvas.shapes));

    // Add clicked point to shapes.clickedPoints
    hypCanvas.shapes.clickedPoints.push(new Point(mouseX, mouseY));

    // If two points have been clicked, create a new line
    if (hypCanvas.shapes.clickedPoints.length == 2) {
      hypCanvas.shapes.lines.push(new Line(hypCanvas, ...hypCanvas.shapes.clickedPoints))
      hypCanvas.shapes.clickedPoints.length = 0;
    }

    // Redraw the canvas
    drawAll(hypCanvas);
  }
}

function polygonClick(e, hypCanvas) {
  // Unselect any selected shapes
  if (hypCanvas.shapes.selected) {
    unselectAllShapes(hypCanvas);
  }

  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
  if (cursorInside) {
    // Save a copy of the current shapes
    hypCanvas.shapeHistory.push(deepCopyShapes(hypCanvas.shapes));

    // Add clicked point to shapes.clickedPoints
    hypCanvas.shapes.clickedPoints.push(new Point(mouseX, mouseY));

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
// TO DO
//#endregion

export { selectDown, selectMove, selectUp, lineClick, polygonClick }

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