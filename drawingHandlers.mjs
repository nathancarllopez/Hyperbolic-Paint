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
  console.log('start down', shapes.selected);

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
      const selectedEdges = [];
      for (const edge of polygon.edges) {
        // Otherwise, search the anchors of this edge
        for (const anchor of edge.anchors) {
          if (pointClicked(anchor, mouseX, mouseY, anchor.anchorSize)) {
            anchor.selected = true;
            anchor.fillStyle = 'black';
            edge.selected = true;
            selectedEdges.push(edge);
            break;
          }
        }

        // If we've found two selected edges, stop searching this polygon
        if (selectedEdges.length === 2) {
          polygon.selected = true;
          selectedEdges.forEach(edge => shapes.selected.push(edge));
          shapes.selected.push(polygon);
          break;
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

  console.log('end down', shapes.selected);
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
      const newLines = {}
      for (let index = 0; index < shapes.lines.length; index++) {
        const line = shapes.lines[index];
        if (line.selected) {
          for (const anchor of line.anchors) {
            if (anchor.selected) {
              newLines[index] = line.recalculatePosition(changeX, changeY);
              break;
            }
          }
        }
      }

      // If any lines were dragged, update shapes.lines
      if (Object.keys(newLines).length > 0) {
        for (const index in newLines) {
          shapes.lines[index] = newLines[index];
        }
      }

      // Adjust dragging polygons
      const newPolys = {}
      for (let index = 0; index < shapes.polygons.length; index++) {
        const polygon = shapes.polygons[index];
        if (polygon.selected) {
          newPolys[index] = polygon.recalculatePosition(changeX, changeY);
        }
      }

      // If any polygons were dragged, update shapes.polygons
      if (Object.keys(newPolys).length > 0) {
        for (const index in newPolys) {
          shapes.polygons[index] = newPolys[index];
        }
      }

      // // Adjust dragging polygons
      // const newPolys = {}
      // for (let index = 0; index < shapes.polygons.length; index++) {
      //   const polygon = shapes.polygons[index];
      //   if (polygon.selected) {
      //     for (const vertex of polygon.vertices) {
      //       if (vertex.selected) {
      //         newPolys[index] = polygon.recalculatePosition(changeX, changeY);
      //         break;
      //       }
      //     }
      //   }
      // }

      // // If any polygons were dragged, update shapes.polygons
      // if (Object.keys(newPolys).length > 0) {
      //   for (const index in newPolys) {
      //     shapes.polygons[index] = newPolys[index];
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

// function polygonClick(e, canvasInfo, shapes) {
//   // Get canvas coordinates
//   const [mouseX, mouseY] = getCanvasCoord(e, canvasInfo);

//   // If cursor is inside boundary
//   const cursorInside = mouseX**2 + mouseY**2 <= canvasInfo.radius**2;
//   if (cursorInside) {
//     // Reset shapes and clear selected shapes
//     resetShapes(shapes);
//     shapes.selected.length = 0;

//     // Add clicked point to shapes.clickedPoints
//     shapes.clickedPoints.push(new Point(mouseX, mouseY));

//     // If at least three points have been clicked and shift is pressed
//     if (shapes.clickedPoints.length > 2 && e.shiftKey) {
//       shapes.polygons.push(new Polygon(canvasInfo, ...shapes.clickedPoints));
//       shapes.clickedPoints.length = 0;
//     }

//     // Redraw the canvas
//     drawAll(canvasInfo, shapes);
//   }
// }

export { displayCursor, selectDown, selectMove, selectUp, lineClick, polygonClick }

