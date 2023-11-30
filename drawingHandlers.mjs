import { Point, Line, Polygon } from "./classes.mjs";
import { drawAll } from "./drawToCanvas.mjs";
import { getCanvasCoord, unselectAllShapes, adjustDraggingShapes } from "./util.mjs";

// const selected = [];
// const dragging = [];
let dragging = false;
let startX;
let startY;

function displayCursor(e, canvasInfo, shapes) {
  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);

  // Only display the cursor inside the boundary while not dragging
  const cursorOutside = mouseX**2 + mouseY**2 > canvasInfo.radius**2;
  if (cursorOutside || dragging) {
    shapes.cursor.display = false;
  } else {
    shapes.cursor.display = true;
    shapes.cursor.point = new Point(mouseX, mouseY);
  }

  // Redraw the canvas
  drawAll(canvasInfo, shapes);
}

function selectDown(e, canvasInfo, shapes) {
  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);

  // If cursor is inside boundary...
  const cursorInside = mouseX**2 + mouseY**2 <= canvasInfo.radius**2;
  if (cursorInside) {
    // Turn off the cursor
    shapes.cursor.display = false;

    // Clear out any previously selected shapes
    unselectAllShapes(shapes);

    // Check if a line was selected
    for (const line of shapes.lines) {
      for (const anchor of line.anchors) {
        if (anchor.pointClicked(mouseX, mouseY)) {
          anchor.selected = true;
          anchor.fillStyle = 'black';
          line.selected = true;
          shapes.selected = true;
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
          shapes.selected = true;
          break;
        }
      }
    }

    // If a shape was clicked...
    if (shapes.selected) {
      // Update start position
      startX = mouseX;
      startY = mouseY;

      // Turn on dragging flag
      dragging = true;
    }

    // Otherwise, unselect all shapes
    else {
      unselectAllShapes(shapes);
    }
  }

  // Otherwise, unselect all shapes
  else {
    unselectAllShapes(shapes);
  }

  // Redraw the canvas
  drawAll(canvasInfo, shapes);
}

function selectMove(e, canvasInfo, shapes) {
  // Only proceed if a shape is being dragged
  if (dragging) {
    // Get canvas coordinates
    const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);

    // Adjust shapes if inside boundary
    const cursorInside = mouseX**2 + mouseY**2 <= canvasInfo.radius**2;
    if (cursorInside) {
      // Calculate movement
      const changeX = mouseX - startX;
      const changeY = mouseY - startY;
      startX = mouseX;
      startY = mouseY;
      
      // Adjust dragging lines
      adjustDraggingShapes(shapes.lines, changeX, changeY);

      // Adjust dragging polygons
      adjustDraggingShapes(shapes.polygons, changeX, changeY);
    }

    // Otherwise, reset shapes and turn off dragging flag
    else {
      unselectAllShapes(shapes);
      dragging = false;
    }

    // Redraw the canvas
    drawAll(canvasInfo, shapes);
  }
}

function selectUp(e, canvasInfo, shapes) {
  // Turn off dragging flag
  dragging = false;

  // Turn cursor on
  shapes.cursor.display = true;
  shapes.cursor.point = new Point(...getCanvasCoord(e, canvasInfo))

  // Redraw the canvas
  drawAll(canvasInfo, shapes);
}

function lineClick(e, canvasInfo, shapes) {
  // Unselect any selected shapes
  if (shapes.selected) {
    unselectAllShapes(shapes);
  }

  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= canvasInfo.radius**2;
  if (cursorInside) {
    // Add clicked point to shapes.clickedPoints
    shapes.clickedPoints.push(new Point(mouseX, mouseY));

    // If two points have been clicked, create a new line
    if (shapes.clickedPoints.length == 2) {
      shapes.lines.push(new Line(canvasInfo, ...shapes.clickedPoints))
      shapes.clickedPoints.length = 0;
    }

    // Redraw the canvas
    drawAll(canvasInfo, shapes);
  }
}

function polygonClick(e, canvasInfo, shapes) {
  // Unselect any selected shapes
  if (shapes.selected) {
    unselectAllShapes(shapes);
  }

  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= canvasInfo.radius**2;
  if (cursorInside) {
    // Add clicked point to shapes.clickedPoints
    shapes.clickedPoints.push(new Point(mouseX, mouseY));

    // If at least three points have been clicked and shift is pressed
    if (shapes.clickedPoints.length > 2 && e.shiftKey) {
      const edges = [];
      for (let index = 0; index < shapes.clickedPoints.length; index++) {
        const vertex1 = shapes.clickedPoints[index];
        const vertex2 = index === shapes.clickedPoints.length - 1 ?
          shapes.clickedPoints[0] :
          shapes.clickedPoints[index + 1];
        edges.push(new Line(canvasInfo, vertex1, vertex2));
      }
      shapes.polygons.push(new Polygon(canvasInfo, ...edges));
      shapes.clickedPoints.length = 0;
    }

    // Redraw the canvas
    drawAll(canvasInfo, shapes);
  }
}

export { displayCursor, selectDown, selectMove, selectUp, lineClick, polygonClick }

