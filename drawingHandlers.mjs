import { Point, Line, Polygon } from "./classes.mjs";
import { drawAll } from "./drawToCanvas.mjs";
import { getCanvasCoord, pointClicked, resetShapes } from "./util.mjs";

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
  console.log(shapes.selected);

  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= canvasInfo.radius**2;
  if (cursorInside) {
    // Turn off the cursor
    shapes.cursor.display = false;

    // Clear out any previous selected shapes
    resetShapes(shapes);
    shapes.selected.length = 0;

    // Check if a line anchor was selected
    for (const line of shapes.lines) {
      for (const anchor of line.anchors) {
        if (pointClicked(anchor, mouseX, mouseY, anchor.anchorSize)) {
          anchor.selected = true;
          anchor.fillStyle = 'black';
          line.selected = true;
          shapes.selected.push(line);
        }
      }
    }

    // Check if a polygon vertex was selected
    for (const polygon of shapes.polygons) {
      for (const vertex of polygon.vertices) {
        if (pointClicked(vertex, mouseX, mouseY, vertex.anchorSize)) {
          vertex.selected = true;
          vertex.fillStyle = 'gray';
          polygon.selected = true;
          shapes.selected.push(polygon);
        }
      }
    }

    // If a shape was clicked
    if (shapes.selected.length > 0) {
      // Update start position
      startX = mouseX;
      startY = mouseY;

      // Turn on dragging flag
      dragging = true;
    }

    // Redraw the canvas
    drawAll(canvasInfo, shapes);
  }
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
      const linesCopy = [...shapes.lines];
      for (let index = 0; index < linesCopy.length; index++) {
        // Adjust this line if it is selected
        const line = shapes.lines[index];
        let newLine;
        if (line.selected) {
          for (const anchor of line.anchors) {
            if (anchor.selected) {
              newLine = line.recalculatePosition(changeX, changeY);
              break;
            }
          }
        }

        // If the line was adjusted, remove it from shapes.lines and add the new line
        if (newLine) {
          shapes.lines = shapes.lines.slice(0, index).concat(shapes.lines.slice(index + 1))
          shapes.lines.push(newLine);
        }
      }
      // for (const line of shapes.lines) {
      //   if (line.selected) {
      //     for (const anchor of line.anchors) {
      //       if (anchor.selected) {
      //         anchor.changeCoord(changeX, changeY);
      //         break;
      //       }
      //     }
      //     line.recalculatePosition();
      //   }
      // }

      // Adjust dragging polygons
      // for (const polygon of shapes.polygons) {
      //   if (polygon.selected) {
      //     for (const vertex of polygon.vertices) {
      //       if (vertex.selected) {
      //         vertex.changeCoord(changeX, changeY);
      //         break;
      //       }
      //     }
      //     polygon.recalculatePosition();
      //   }
      // }
    }

    // Otherwise, reset shapes and clear out selected array
    else {
      resetShapes(shapes);
      shapes.selected.length = 0;
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
  const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);
  shapes.cursor.point = new Point(mouseX, mouseY);

  // Redraw the canvas
  drawAll(canvasInfo, shapes);
}

function lineClick(e, canvasInfo, shapes) {
  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= canvasInfo.radius**2;
  if (cursorInside) {
    // Reset shapes and clear selected shapes
    resetShapes(shapes);
    shapes.selected.length = 0;

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
  // Get canvas coordinates
  const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);

  // If cursor is inside boundary
  const cursorInside = mouseX**2 + mouseY**2 <= canvasInfo.radius**2;
  if (cursorInside) {
    // Reset shapes and clear selected shapes
    resetShapes(shapes);
    shapes.selected.length = 0;

    // Add clicked point to shapes.clickedPoints
    shapes.clickedPoints.push(new Point(mouseX, mouseY));

    // If at least three points have been clicked and shift is pressed
    if (shapes.clickedPoints.length > 2 && e.shiftKey) {
      shapes.polygons.push(new Polygon(canvasInfo, ...shapes.clickedPoints));
      shapes.clickedPoints.length = 0;
    }

    // Redraw the canvas
    drawAll(canvasInfo, shapes);
  }
}

export { displayCursor, selectDown, selectMove, selectUp, lineClick, polygonClick }

