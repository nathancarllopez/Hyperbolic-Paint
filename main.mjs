import { drawAll } from "./drawToCanvas.mjs";
import { displayCursor, selectDown, selectMove, selectUp, lineClick, polygonClick } from "./drawingHandlers.mjs";
import { deepCopyShapes, unselectAllShapes } from "./util.mjs";

// Initialize canvas
const canvas = document.querySelector('canvas');
const BDRYPADDING = 5;
const boundRect = canvas.getBoundingClientRect();
const canvasInfo = {
  ctx: canvas.getContext('2d'),
  width: canvas.width,
  radius: canvas.width/2 - BDRYPADDING,
  offsetX: boundRect.left + canvas.width/2,
  offsetY: boundRect.top + canvas.width/2,
  activeTool: 'clickDrag',
  colorType: 'stroke',
  strokeStyle: 'black',
  fillStyle: 'white',
  lineWidth: document.querySelector('#line-width').value,
  anchorSize: 5,
  shapeHistory: [],
  cursor: {
    display: false
  },
}

// Reorient context
canvasInfo.ctx.translate(canvas.width/2, canvas.width/2);
canvasInfo.ctx.scale(1, -1);

// Initialize shapes
const randRoll = () => {
  let re;
  let im;
  do {
    re = Math.random() * 2 - 1;
    im = Math.random() * 2 - 1;
  } while (re**2 + im**2 > 1);
  return [re * canvasInfo.radius, im * canvasInfo.radius];
};
let shapes = {
  lines: [],
  polygons: [],
  clickedPoints: [],
  selected: false
}
drawAll(canvasInfo, shapes);

// Display cursor and select tool event listeners
canvas.addEventListener('mousemove', e => displayCursor(e, canvasInfo, shapes));
canvas.addEventListener('mousedown', handleSelectDown);
canvas.addEventListener('mousemove', handleSelectMove);
canvas.addEventListener('mouseup', handleSelectUp);

// Drawing tool buttons event listeners
const drawingToolButtons = document.querySelectorAll('input[name="tools"]');
drawingToolButtons.forEach(button => {
  button.addEventListener('click', event => switchToolListeners(event))
});
function switchToolListeners(event) {
  // Map to store tools and events
  const toolListenersMap = {
    clickDrag: [
      ['mousedown', handleSelectDown],
      ['mousemove', handleSelectMove],
      ['mouseup', handleSelectUp]
    ],
    line: [
      ['click', handleLineClick]
    ],
    segment: [
      ['click', handleLineClick]
    ],
    polygon: [
      ['click', handlePolygonClick]
    ],
  }

  // Remove canvas event listeners for previous tool
  for (const args of toolListenersMap[canvasInfo.activeTool]) {
    canvas.removeEventListener(...args);
  }

  // Update canvasInfo
  canvasInfo.activeTool = event.target.id;
  if (canvasInfo.activeTool !== 'clickDrag') {
    unselectAllShapes(shapes);
  }
  
  // Add canvas event tools for new tool
  for (const args of toolListenersMap[canvasInfo.activeTool]) {
    canvas.addEventListener(...args);
  }
}

// Stroke or fill event listener
const colorTypeButtons = document.querySelectorAll('input[name="color-type"]');
colorTypeButtons.forEach(button => {
  button.addEventListener('click', event => {
    canvasInfo.colorType = event.target.value;
  })
})

// Color choice buttons event listener
const defaultColorButtons = document.querySelectorAll('.default-color');
defaultColorButtons[0].style.border = '2px solid gray';
defaultColorButtons.forEach(
  button => button.addEventListener('click', event => changeColor(event))
);
function changeColor(event) {
  // Get selected color
  const colorButton = event.target;
  const selectedColor = colorButton.style.background;

  // Remove border from previously selected button
  let prevButton;
  for (const button of defaultColorButtons) {
    if (button.style.border) {
      prevButton = button;
      button.style.removeProperty('border');
      break;
    }
  }

  // If there are selected shapes, update their colors
  if (shapes.selected) {
    // Restore border for previous button
    prevButton.style.border = '2px solid gray';

    // Save a copy of the current shapes
    canvasInfo.shapeHistory.push(deepCopyShapes(shapes));

    // Update stroke color
    if (canvasInfo.colorType === 'stroke') {
      // Line stroke color
      for (const line of shapes.lines) {
        if (line.selected) {
          line.strokeStyle = selectedColor;
        }
      }

      // Polygon stroke color
      for (const polygon of shapes.polygons) {
        if (polygon.selected) {
          polygon.edges.forEach(edge => edge.strokeStyle = selectedColor);
        }
      }
    }
    
    // Update fill color
    if (canvasInfo.colorType === 'fill') {
      // Polygon fill color
      for (const polygon of shapes.polygons) {
        if (polygon.selected) {
          polygon.fillStyle = selectedColor;
        }
      }
    }

    // Redraw the canvas
    drawAll(canvasInfo, shapes);
  }

  // Otherwise, add border to the new button and update canvasInfo
  else {
    colorButton.style.border = '2px solid gray';
    if (canvasInfo.colorType === 'stroke') {
      canvasInfo.strokeStyle = selectedColor;
    } else {
      canvasInfo.fillStyle = selectedColor;
    }
  }
}

// Line width range event listener
const lineWidthRange = document.querySelector('.line-width');
lineWidthRange.addEventListener('input', event => changeLineWidth(event));
function changeLineWidth(event) {
  // Get new line width
  const newLineWidth = event.target.value;

  // If there are selected shapes, update their line widths
  if (shapes.selected) {
    // Save a copy of the current shapes
    canvasInfo.shapeHistory.push(deepCopyShapes(shapes));

    // Lines
    for (const line of shapes.lines) {
      if (line.selected) {
        const change = newLineWidth - line.lineWidth;
        line.lineWidth = newLineWidth;
        line.anchors.forEach(anchor => 
          anchor.anchorSize = anchor.anchorSize + change
        );
      }
    }

    // Polygons
    for (const polygon of shapes.polygons) {
      if (polygon.selected) {
        const change = newLineWidth - polygon.edges[0].lineWidth;
        for (const edge of polygon.edges) {
          edge.lineWidth = newLineWidth;
          edge.anchors.forEach(anchor =>
            anchor.anchorSize = anchor.anchorSize + change
          );
        }
      }
    }

    // Redraw the canvas
    drawAll(canvasInfo, shapes);
  }

  // Otherwise, update canvasInfo
  else {
    const change = newLineWidth - canvasInfo.lineWidth;
    canvasInfo.anchorSize = canvasInfo.anchorSize + change;
    canvasInfo.lineWidth = newLineWidth;
  }
}

// Undo button
const undoButton = document.querySelector('#undo');
undoButton.addEventListener('click', event => {
  if (canvasInfo.shapeHistory.length > 0) {
    shapes = canvasInfo.shapeHistory.pop();
    drawAll(canvasInfo, shapes);
  }
});

// Clear button
const clearButton = document.querySelector('#clear');
clearButton.addEventListener('click', event => {
  canvasInfo.shapeHistory.push(deepCopyShapes(shapes));
  shapes.lines.length = 0;
  shapes.polygons.length = 0;
  shapes.clickedPoints.length = 0;
  drawAll(canvasInfo, shapes);
});

// // Delete key to
// document.addEventListener('keydown', (e) => {
//   if (shapes.selected.length > 0) {
//     const key = e.key;
//     if (key === 'Backspace' || key === 'Delete') {
//       for (const shapeType in shapes) {
//         shapes[shapeType] = shapes[shapeType].filter(shape => !shape.selected);
//       }
//       drawAll(canvasInfo, shapes);
//     }
//   }
// });

// Naming event listener functions so they can be removed
function handleSelectDown(event) {
  selectDown(event, canvasInfo, shapes);
}
function handleSelectMove(event) {
  selectMove(event, canvasInfo, shapes);
}
function handleSelectUp(event) {
  selectUp(event, canvasInfo, shapes);
}
function handleLineClick(event) {
  lineClick(event, canvasInfo, shapes);
}
function handlePolygonClick(event) {
  polygonClick(event, canvasInfo, shapes);
}