import { HypCanvas, Point } from "./classes.mjs";
import { drawAll } from "./drawToCanvas.mjs";
import { deepCopyShapes, getCanvasCoord, removeBorder, resetToolBar, unselectAllShapes } from "./util.mjs";
import { lineClick, polygonClick, rotateClick, selectDown, selectMove, selectUp } from "./toolbarHandlers.mjs";
import { runTransformation } from "./transformHandlers.mjs";

/**
 * STARTUP
 */
let hypCanvas = createHypCanvas()
attachDefaultEventListeners(hypCanvas);

/**
 * FUNCTIONS TO RUN AT STARTUP
 */
//#region
function createHypCanvas(oldCanvas = {}) {
  // Globals
  const BDRYPADDING = 5;
  const PROPORTION = 0.75;

  // Get the canvas element and set its starting size
  const canvas = document.querySelector('canvas');
  const screenSize = Math.min(
    window.innerHeight, window.innerWidth
  );
  const canvasSize = screenSize * PROPORTION;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // Create the hyp canvas object and draw starting shapes
  const hypCanvas = new HypCanvas(canvas, BDRYPADDING, oldCanvas);
  drawAll(hypCanvas);

  return hypCanvas
}

function attachDefaultEventListeners(hypCanvas) {
  // Window resize event listener
  // NOT WORKING, SKIPPING FOR NOW
  // attachWindowEventListener(hypCanvas);

  // Cursor event listeners
  attachCursorEventListeners(hypCanvas);

  // Drawing tool event liseners
  attachToolbarEventListeners(hypCanvas);

  // Transform options event listeners
  attachTransformControlsEventListeners(hypCanvas);

  // Color type (stroke or fill) event listeners
  attachColorTypeEventListeners(hypCanvas);

  // Color button (red, blue, etc.) event listeners
  attachColorButtonEventListeners(hypCanvas);

  // Line width event listener
  attachLineWidthEventListeners(hypCanvas);

  // Undo, delete, and clear event listeners
  attachEditButtonsEventListeners(hypCanvas);
}
//#endregion

/**
 * HELPER FUNCTIONS
 */
//#region
function attachCursorEventListeners(hypCanvas) {
  // Mouse move event handler for cursor
  function displayCursor(e, hypCanvas) {
    // Get canvas coordinates
    const [mouseX, mouseY] = getCanvasCoord(e, hypCanvas);
  
    // Only display the cursor inside the boundary while not dragging
    const cursorOutside = mouseX**2 + mouseY**2 > hypCanvas.radius**2;
    if (cursorOutside || hypCanvas.dragging) {
      hypCanvas.cursor.display = false;
    } else {
      hypCanvas.cursor.display = true;
      hypCanvas.cursor.point = new Point(mouseX, mouseY);
    }
  
    // Redraw the canvas
    drawAll(hypCanvas);
  }

  // Get canvas and attach mouse event listeners
  const canvas = hypCanvas.canvas;
  canvas.addEventListener('mousemove', e => 
    displayCursor(e, hypCanvas)
  );
  canvas.addEventListener('mouseleave', () => {
    hypCanvas.cursor.display = false;
    drawAll(hypCanvas)
  });

  // Attach resize event listener to window
  window.addEventListener('resize', () => {
    hypCanvas.cursor.display = false;
    hypCanvas = createHypCanvas(hypCanvas);
    drawAll(hypCanvas)
  });
}

function attachToolbarEventListeners(hypCanvas) {
  // Wrapping the toolbar handlers so they can be removed
  function handleSelectDown(e) {
    selectDown(e, hypCanvas);
  }
  function handleSelectMove(e) {
    selectMove(e, hypCanvas);
  }
  function handleSelectUp(e) {
    selectUp(e, hypCanvas);
  }
  function handleLineClick(e) {
    lineClick(e, hypCanvas);
  }
  function handlePolygonClick(e) {
    polygonClick(e, hypCanvas);
  }
  function handleRotationClick(e) {
    rotateClick(e, hypCanvas)
  }

  // Attach the select tool event listeners to canvas
  const canvas = hypCanvas.canvas;
  canvas.addEventListener('mousedown', handleSelectDown);
  canvas.addEventListener('mousemove', handleSelectMove);
  canvas.addEventListener('mouseup', handleSelectUp);

  // Switch tools handler
  function switchToolListeners(e, hypCanvas) {
    // Map to pair tools and events
    const toolListenersMap = {
      clickDrag: [
        ['mousedown', handleSelectDown],
        ['mousemove', handleSelectMove],
        ['mouseup', handleSelectUp],
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
      rotate: [
        ['click', handleRotationClick]
      ]
    }

    // Remove event listeners for currently active tool
    const canvas = hypCanvas.canvas;
    for (const args of toolListenersMap[hypCanvas.activeTool]) {
      canvas.removeEventListener(...args);
    }

    // Update hypCanvas and reset the toolbar
    hypCanvas.activeTool = e.target.value;
    if (hypCanvas.activeTool !== 'clickDrag') {
      if (hypCanvas.selected) {
        unselectAllShapes(hypCanvas);
      }
      if (hypCanvas.transforming) {
        hypCanvas.transforming = false;
        hypCanvas.lastTimestamp = null;
      }
      // if (hypCanvas.activeTool !== 'rotate') {
      //   hypCanvas.centerOfRotation = null;
      // }
    }
    resetToolBar(hypCanvas);

    // Add event listeners for newly selected tool
    for (const args of toolListenersMap[hypCanvas.activeTool]) {
      canvas.addEventListener(...args);
    }
  }

  // Attach switchToolListeners to the drawing tool buttons
  const drawingToolButtons = document.getElementsByName('tools');
  drawingToolButtons.forEach(button =>
    button.addEventListener('click', e =>
      switchToolListeners(e, hypCanvas)
    )
  );
}

function attachTransformControlsEventListeners(hypCanvas) {
  // Play button
  const playButton = document.querySelector('#play');
  playButton.addEventListener('click', () => {
    if (!hypCanvas.transforming) {
      hypCanvas.transforming = true;
      runTransformation(hypCanvas);
    }
  });

  // Pause button
  const pauseButton = document.querySelector('#pause');
  pauseButton.addEventListener('click', () => {
    if (hypCanvas.transforming) {
      hypCanvas.transforming = false;
      hypCanvas.lastTimestamp = null;
    }
  });

  // Transform speed
  const speedRange = document.querySelector('#speed');
  speedRange.addEventListener('input', e => {
    hypCanvas.transformSpeed = 0.0001 * e.target.value;
  });
}

function attachColorTypeEventListeners(hypCanvas) {
  // Switch color type handler
  function changeColorType(e, hypCanvas) {
    // Remove border from all buttons
    const colorButtons = document.querySelectorAll('.color-button');
    for (const button of colorButtons) {
      if (button.style.border) {
        button.style.removeProperty('border');
        break;
      }
    }
    const colorPickerButton = document.querySelector('#colorPickerDiv');
    colorPickerButton.style.removeProperty('border');

    // Update hypCanvas to match the selected color type
    hypCanvas.colorType = e.target.value;

    // Add a border to the button to indicate the active color
    const borderString = '2px solid gray';
    if (hypCanvas.colorType === 'stroke') {
      let defaultButton = false;
      for (const button of colorButtons) {
        if (button.style.background === hypCanvas.strokeStyle) {
          defaultButton = true;
          button.style.border = borderString;
          break;
        }
      }
      if (!defaultButton) {
        colorPickerButton.style.border = borderString;
      }
    } else if (hypCanvas.colorType === 'fill') {
      let defaultButton = false;
      for (const button of colorButtons) {
        if (button.style.background === hypCanvas.fillStyle) {
          defaultButton = true;
          button.style.border = borderString;
          break;
        }
      }
      if (!defaultButton) {
        colorPickerButton.style.border = borderString;
      }
    }
  }

  // Get the stroke or fill buttons
  const colorTypeButtons = document.getElementsByName('color-type');

  // Attach listeners
  colorTypeButtons.forEach(button =>
    button.addEventListener('click', e => 
      changeColorType(e, hypCanvas)
    )
  );
}

function attachColorButtonEventListeners(hypCanvas) {
  // Get the various color buttons
  const allColorButtons = Array.from(document.querySelectorAll('.color-button'));

  // Isolate default color buttons
  const defaultColorButtons = allColorButtons.slice(0, allColorButtons.length - 1);

  // Change default color button handler
  function changeDefaultColor(e, hypCanvas) {
    // Remove border from all buttons
    removeBorder(allColorButtons);

    // Get selected color button and its color
    const selectedButton = e.target;
    const selectedColor = selectedButton.style.background;
    selectedButton.style.border = '2px solid gray';

    // If there are selected shapes, update their color
    if (hypCanvas.selected) {
      // Save a copy of the current shapes
      const shapes = hypCanvas.shapes;
      hypCanvas.shapeHistory.push(deepCopyShapes(shapes));

      // Update stroke color
      if (hypCanvas.colorType === 'stroke') {
        // Lines
        for (const line of shapes.lines) {
          if (line.selected) {
            line.strokeStyle = selectedColor;
          }
        }

        // Polygons
        for (const polygon of shapes.polygons) {
          if (polygon.selected) {
            polygon.edges.forEach(edge => edge.strokeStyle = selectedColor);
          }
        }
      }

      // Update fill color
      else if (hypCanvas.colorType === 'fill') {
        // Polygons
        for (const polygon of shapes.polygons) {
          if (polygon.selected) {
            polygon.fillStyle = selectedColor;
          }
        }
      }

      // Redraw the canvas
      drawAll(hypCanvas)
    }

    // Otherwise, update hypCanvas
    else {
      if (hypCanvas.colorType === 'stroke') {
        hypCanvas.strokeStyle = selectedColor;
      } else if (hypCanvas.colorType === 'fill') {
        hypCanvas.fillStyle = selectedColor;
      }
    }
  }

  // Attach the change color handler to color buttons
  defaultColorButtons.forEach(button =>
    button.addEventListener('click', e => changeDefaultColor(e, hypCanvas))
  );

  // Get the color picker and its div
  const colorPickerDiv = allColorButtons[allColorButtons.length - 1];
  const colorPickerInput = document.querySelector('.color-input');

  // Handler for color picker
  function changeColorPicker(e, hypCanvas) {
    // Remove the border from all buttons
    removeBorder(allColorButtons);

    // Update the border and background of the colorPickerDiv
    const inputColor = e.target.value;
    colorPickerDiv.style.border = '2px solid gray';
    colorPickerDiv.style.background = inputColor;

    // If shapes are selected...
    if (hypCanvas.selected) {
      // Save a copy of the current shapes
      const shapes = hypCanvas.shapes;
      hypCanvas.shapeHistory.push(deepCopyShapes(shapes));

      // Update stroke color
      if (hypCanvas.colorType === 'stroke') {
        // Lines
        for (const line of shapes.lines) {
          if (line.selected) {
            line.strokeStyle = inputColor;
          }
        }

        // Polygons
        for (const polygon of shapes.polygons) {
          if (polygon.selected) {
            polygon.edges.forEach(edge => edge.strokeStyle = inputColor);
          }
        }
      }

      // Update fill color
      else if (hypCanvas.colorType === 'fill') {
        // Polygons
        for (const polygon of shapes.polygons) {
          if (polygon.selected) {
            polygon.fillStyle = inputColor;
          }
        }
      }

      // Redraw the canvas
      drawAll(hypCanvas)
    }

    // Otherwise, update hypCanvas
    else {
      if (hypCanvas.colorType === 'stroke') {
        hypCanvas.strokeStyle = inputColor;
      } else if (hypCanvas.colorType === 'fill') {
        hypCanvas.fillStyle = inputColor;
      }
    }
  }

  // Attach handler to color picker
  colorPickerInput.addEventListener('input', e => changeColorPicker(e, hypCanvas));
}

function attachLineWidthEventListeners(hypCanvas) {
  // Get line width range
  const lineWidthRange = document.querySelector('.width');

  // Line width handler
  function changeLineWidth(e, hypCanvas) {
    // Get new line width
    const newLineWidth = e.target.value;

    // If there are selected shapes, update their line widths
    if (hypCanvas.selected) {
      // Save a copy of the current shapes
      const shapes = hypCanvas.shapes;
      hypCanvas.shapeHistory.push(deepCopyShapes(shapes));

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
      drawAll(hypCanvas);
    }

    // Otherwise, update canvasInfo
    else {
      const change = newLineWidth - hypCanvas.lineWidth;
      hypCanvas.anchorSize = hypCanvas.anchorSize + change;
      hypCanvas.lineWidth = newLineWidth;
    }
  }

  // Attach changeLineWidth to the line width range
  lineWidthRange.addEventListener('input', e => changeLineWidth(e, hypCanvas));
}

function attachEditButtonsEventListeners(hypCanvas) {
  // Undo button
  const undoButton = document.querySelector('#undo');
  undoButton.addEventListener('click', () => {
    if (hypCanvas.shapeHistory.length > 0) {
      hypCanvas.shapes = hypCanvas.shapeHistory.pop();
      drawAll(hypCanvas);
    } else {
      alert('Nothing to undo!')
    }
  });

  // Delete button
  const deleteButton = document.querySelector('#delete');
  deleteButton.addEventListener('click', () => {
    if (hypCanvas.selected) {
      hypCanvas.shapeHistory.push(deepCopyShapes(hypCanvas.shapes));
      for (const shapeType in hypCanvas.shapes) {
        hypCanvas.shapes[shapeType] = hypCanvas.shapes[shapeType].filter(shape => !shape.selected);
      }
      drawAll(hypCanvas);
    } else {
      alert('Select a shape first to delete it.')
    }
  });

  // Clear button
  const clearButton = document.querySelector('#clear');
  clearButton.addEventListener('click', () => {
    hypCanvas.shapeHistory.push(deepCopyShapes(hypCanvas.shapes));
    for (const shapeType in hypCanvas.shapes) {
      hypCanvas.shapes[shapeType].length = 0;
    }
    drawAll(hypCanvas);
  });
}
//#endregion

// NOT WORKING, SKIPPING FOR NOW
// function attachWindowEventListener() {
//   // Window resize handler
//   function preventSmallWindow() {
//     // Get the content width and height
//     const contentWidth = document.body.scrollWidth || document.documentElement.scrollWidth;
//     const contentHeight = document.body.scrollHeight || document.documentElement.scrollHeight;

//     // Resize the window if the width or height get too small
//     const windowWidth = window.innerWidth
//     const windowHeight = window.innerHeight;
//     if (windowWidth < contentWidth || windowHeight < contentHeight) {
//       window.resizeTo(contentWidth, contentHeight);
//     }
//   }

//   // Attach resize event listener
//   window.addEventListener('resize', preventSmallWindow);
//   preventSmallWindow();
// }