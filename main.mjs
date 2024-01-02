import { HypCanvas, Point, Line, Mobius } from "./js modules/geometryClasses.mjs";
import { drawAll } from "./js modules/drawToCanvas.mjs";
import { 
  getCanvasCoord,
  removeBorder,
  resetToolBar,
  switchPlayPauseButtonText,
} from "./js modules/util.mjs";
import {
  clickDragDown,
  clickDragMove,
  clickDragUp,
  freeDrawDown,
  freeDrawMove,
  freeDrawUp,
  lineClick,
  polygonClick,
  rotateClick,
  translateClick
} from "./js modules/toolbarHandlers.mjs";

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
  const screenSize = Math.min(window.innerHeight, window.innerWidth);
  const canvasSize = screenSize * PROPORTION;
  canvas.width = canvasSize;
  canvas.height = canvasSize;

  // Create the hyp canvas object and draw starting shapes
  const hypCanvas = new HypCanvas(canvas, BDRYPADDING, oldCanvas);
  drawAll(hypCanvas);

  return hypCanvas
}

function attachDefaultEventListeners(hypCanvas) {
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

  // Fill opacity event listener
  attachFillOpacityEventListeners(hypCanvas);

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
    const cursorInside = mouseX**2 + mouseY**2 <= hypCanvas.radius**2;
    if (cursorInside && !hypCanvas.dragging && !hypCanvas.drawing) {
      hypCanvas.cursor.display = true;
      hypCanvas.cursor.point = new Point(hypCanvas, mouseX, mouseY);
    } else {
      hypCanvas.cursor.display = false;
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
  //#region
  function handleClickDragDown(e) {
    clickDragDown(e, hypCanvas);
  }
  function handleClickDragMove(e) {
    clickDragMove(e, hypCanvas);
  }
  function handleClickDragUp(e) {
    clickDragUp(e, hypCanvas);
  }
  function handleFreeDrawDown(e) {
    freeDrawDown(e, hypCanvas);
  }
  function handleFreeDrawMove(e) {
    freeDrawMove(e, hypCanvas);
  }
  function handleFreeDrawUp(e) {
    freeDrawUp(e, hypCanvas);
  }
  function handleLineClick(e) {
    lineClick(e, hypCanvas);
  }
  function handlePolygonClick(e) {
    polygonClick(e, hypCanvas);
  }
  function handleRotateClick(e) {
    rotateClick(e, hypCanvas)
  }
  function handleTranslateClick(e) {
    translateClick(e, hypCanvas);
  }
  //#endregion

  // Attach the click and drag tool event listeners to the canvas
  const canvas = hypCanvas.canvas;
  canvas.addEventListener('mousedown', handleClickDragDown);
  canvas.addEventListener('mousemove', handleClickDragMove);
  canvas.addEventListener('mouseup', handleClickDragUp);

  // Switch tools handler
  function switchToolListeners(e, hypCanvas) {
    // Map to pair tools and events
    const toolListenersMap = {
      clickDrag: [
        ['mousedown', handleClickDragDown],
        ['mousemove', handleClickDragMove],
        ['mouseup', handleClickDragUp],
      ],
      freeDraw: [
        ['mousedown', handleFreeDrawDown],
        ['mousemove', handleFreeDrawMove],
        ['mouseup', handleFreeDrawUp],
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
        ['click', handleRotateClick]
      ],
      translate: [
        ['click', handleTranslateClick]
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
        hypCanvas.unselectAllShapes();
      }
      if (hypCanvas.transforming) {
        hypCanvas.transforming = false;
        hypCanvas.lastTimestamp = null;
        switchPlayPauseButtonText();
      }
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
  // Transformation handler
  function runTransformation(hypCanvas) {
    // Transform callback for requestAnimationFrame
    function transform(timestamp) {
      if (hypCanvas.transforming) {
        // Calculate how much time has passed and update the last timestamp
        const elapsed = hypCanvas.lastTimestamp ?
          timestamp - hypCanvas.lastTimestamp :
          0;
        hypCanvas.lastTimestamp = timestamp;

        // Determine the mobius transformation to apply
        let mobius;
        if (hypCanvas.activeTransform === 'rotate') {
          const theta = (hypCanvas.transformSpeed * elapsed) % (2 * Math.PI);
          mobius = Mobius.ROTATE(hypCanvas, hypCanvas.transformShape, theta);
        } else if (hypCanvas.activeTransform === 'translate') {
          const translationDistance = hypCanvas.transformSpeed * elapsed;
          mobius = Mobius.TRANSLATE(hypCanvas, hypCanvas.transformShape, translationDistance);
        }

        // Apply mobius transformation to all shapes
        for (const shapeType in hypCanvas.shapes) {
          hypCanvas.shapes[shapeType] = hypCanvas.shapes[shapeType].map(
            shape => mobius.applyTo(shape)
          );
        }
  
        // Redraw the canvas
        drawAll(hypCanvas);
  
        // Move forward another frame
        requestAnimationFrame(transform);
      }
    }

    // Start transforming
    requestAnimationFrame(transform);
  }

  // Button appearance handler
  function playAndPause(e, hypCanvas) {
    // Case 1: If a center of rotation or axis of translation has been placed, start transforming
    let switchButtonText = true;
    if (hypCanvas.transformShape && !hypCanvas.transforming) {
     // Change color of transform shape to purple
     let activeTransform;
      if (hypCanvas.transformShape instanceof Point) {
        activeTransform = 'rotate';
        hypCanvas.transformShape.fillStyle = 'purple';
      } else if (hypCanvas.transformShape instanceof Line) {
        activeTransform = 'translate';
        hypCanvas.transformShape.strokeStyle = 'purple';
        for (const anchor of hypCanvas.transformShape.anchors) {
          anchor.fillStyle = 'purple';
        }
      }

      // Activate transforming flag and set activeTransform
      hypCanvas.transforming = true;
      hypCanvas.activeTransform = activeTransform;

      // Start transforming
      runTransformation(hypCanvas);
    }

    // Case 2: If we're already transforming, stop transforming
    else if (hypCanvas.transforming) {
      hypCanvas.transforming = false;
      hypCanvas.activeTransform = null;
      hypCanvas.lastTimestamp = null;
      hypCanvas.unselectAllShapes();
      drawAll(hypCanvas);
    }

    // If neither Case 1 nor 2 holds, do not change the button and alert the user
    else {
      switchButtonText = false;
      let alertText;
      if (!hypCanvas.transformShape) {
        alertText = 'Nothing to play!';
      } else if (!hypCanvas.transforming) {
        alertText = 'Nothing to pause!';
      }
      alert(alertText);
    }

    // Update button text if Case 1 or Case 2 occurred
    if (switchButtonText) {
      switchPlayPauseButtonText();
    }
  }

  // Attach handler to play/pause button
  const playPauseButton = document.querySelector('#playPause');
  playPauseButton.addEventListener('click', e => playAndPause(e, hypCanvas));

  // Transform speed
  const speedRange = document.querySelector('#speed');
  speedRange.addEventListener('input', e => {
    hypCanvas.transformSpeed = 0.00001 * e.target.value;
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
      hypCanvas.saveCurrentShapes();

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
      hypCanvas.saveCurrentShapes();

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
      hypCanvas.saveCurrentShapes();
      // hypCanvas.shapeHistory.push(deepCopyShapes(shapes));

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

function attachFillOpacityEventListeners(hypCanvas) {
  // Get the fill opacity range
  const fillOpacityRange = document.querySelector('.opacity')

  // Fill opacity handler
  function changeFillOpacity(e, hypCanvas) {
    // Get the new fill opacity
    const newGlobalAlpha = e.target.value / 100;

    // If there are selected shapes, update their fill opacity
    if (hypCanvas.selected) {
      // Save a copy of the current shapes
      const shapes = hypCanvas.shapes;
      hypCanvas.saveCurrentShapes();
      // hypCanvas.shapeHistory.push(deepCopyShapes(shapes));

      // Polygons
      for (const polygon of shapes.polygons) {
        if (polygon.selected) {
          polygon.globalAlpha = newGlobalAlpha;
        }
      }

      // Redraw the canvas
      drawAll(hypCanvas);
    }

    // Otherwise, update hypCanvas
    else {
      hypCanvas.globalAlpha = newGlobalAlpha;
    }
  }

  // Attach changeFillOpacity to the fill opacity range
  fillOpacityRange.addEventListener('input', e => changeFillOpacity(e, hypCanvas));
}

function attachEditButtonsEventListeners(hypCanvas) {
  // Undo button
  const undoButton = document.querySelector('#undo');
  undoButton.addEventListener('click', () => {
    if (hypCanvas.shapeHistory.length > 0) {
      const previousShapes = hypCanvas.shapeHistory.pop();
      hypCanvas.shapes = previousShapes.shapes;
      hypCanvas.transformShape = previousShapes.transformShape;
      drawAll(hypCanvas);
    } else {
      alert('Nothing to undo!');
    }
  });

  // Delete button
  const deleteButton = document.querySelector('#delete');
  deleteButton.addEventListener('click', () => {
    if (hypCanvas.selected) {
      hypCanvas.saveCurrentShapes();
      for (const shapeType in hypCanvas.shapes) {
        hypCanvas.shapes[shapeType] = hypCanvas.shapes[shapeType].filter(shape => !shape.selected);
      }
      if (hypCanvas.transformShape && hypCanvas.transformShape.selected) {
        hypCanvas.transformShape = null;
        hypCanvas.transforming = false;
        hypCanvas.activeTransform = null;
        hypCanvas.lastTimestamp = null;
        switchPlayPauseButtonText();
      }
      hypCanvas.unselectAllShapes();
      drawAll(hypCanvas);
    } else {
      alert('Select a shape first to delete it.')
    }
  });

  // Clear button
  const clearButton = document.querySelector('#clear');
  clearButton.addEventListener('click', () => {
    hypCanvas.saveCurrentShapes();
    for (const shapeType in hypCanvas.shapes) {
      hypCanvas.shapes[shapeType].length = 0;
      hypCanvas.transformShape = null;
    }
    drawAll(hypCanvas);
  });
}
//#endregion
