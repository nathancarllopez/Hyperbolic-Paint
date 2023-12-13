import { Mobius } from "./classes.mjs";
import { drawAll } from "./drawToCanvas.mjs";

function runTransformation(hypCanvas) {
  // Transformation callbacks
  function rotate(timestamp) {
    // Only proceed if hypCanvas.transforming is true
    if (hypCanvas.transforming) {
      // Calculate how much time has passed
      const elapsed = hypCanvas.lastTimestamp ?
        timestamp - hypCanvas.lastTimestamp :
        0;
      hypCanvas.lastTimestamp = timestamp;
      
      // Determine the mobius transformation
      const theta = (hypCanvas.transformSpeed * elapsed) % (2 * Math.PI);
      const rotateByTheta = Mobius.ROTATE(hypCanvas, hypCanvas.centerOfRotation, theta);

      // Apply mobius transformation to all shapes
      for (const shapeType in hypCanvas.shapes) {
        const shapeArray = hypCanvas.shapes[shapeType];
        hypCanvas.shapes[shapeType] = shapeArray.map(
          shape => rotateByTheta.applyTo(shape)
        );
      }

      // Redraw the canvas
      drawAll(hypCanvas);

      // Move forward another frame
      requestAnimationFrame(rotate);
    }
  };
  const allTransforms = {
    "rotate": rotate
  };

  // Start transforming
  const activeTransform = allTransforms[hypCanvas.activeTransform];
  requestAnimationFrame(activeTransform);
}

export { runTransformation }