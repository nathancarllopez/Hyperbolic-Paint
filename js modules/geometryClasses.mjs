class HypCanvas { 
  constructor(canvas, bdryPadding, oldCanvas) {
    // Get the canvas width
    this.canvas = canvas;
    this.width = canvas.width;

    // Compute offsets
    const boundRect = canvas.getBoundingClientRect();
    this.offsetX = boundRect.left + this.width/2;
    this.offsetY = boundRect.top + this.width/2;

    // Compute radius
    this.bdryPadding = bdryPadding;
    this.radius = this.width/2 - bdryPadding;

    // Create the context and change the coord system
    this.ctx = canvas.getContext('2d');
    this.ctx.translate(this.width/2, this.width/2);
    this.ctx.scale(1, -1);

    // Set this properties to oldCanvas properties
    if (oldCanvas instanceof HypCanvas) {
      // Store the toolbar info
      this.activeTool = oldCanvas.activeTool;
      this.colorType = oldCanvas.colorType;
      this.strokeStyle = oldCanvas.strokeStyle;
      this.fillStyle = oldCanvas.fillStyle;
      this.lineWidth = oldCanvas.lineWidth;
      this.globalAlpha = oldCanvas.globalAlpha;
      this.anchorSize = oldCanvas.anchorSize;

      // Initialize shapes and cursor
      this.shapes = oldCanvas.shapes;
      this.transformShape = oldCanvas.transformShape;
      this.cursor = oldCanvas.cursor;
      this.shapeHistory = oldCanvas.shapeHistory;

      // Drawing variables
      this.selected = oldCanvas.selected;
      this.dragging = oldCanvas.dragging;
      this.drawing = oldCanvas.drawing;
      this.shapesMoved = oldCanvas.shapesMoved;
      this.moving = oldCanvas.moving;
      this.startX = oldCanvas.startX;
      this.startY = oldCanvas.startY;

      // Animation variables
      this.transforming = oldCanvas.transforming;
      this.activeTransform = oldCanvas.activeTransform;
      this.lastTimestamp = oldCanvas.lastTimestamp;
      this.transformSpeed = oldCanvas.transformSpeed;
    }

    // Set this properties to default value
    else {
      // Store the toolbar info
      this.activeTool = 'clickDrag';
      this.colorType = 'stroke';
      this.strokeStyle = 'black';
      this.fillStyle = 'orange';
      this.lineWidth = 2;
      this.globalAlpha = 0.5;
      this.anchorSize = 5;

      // Things to draw
      this.shapes = {
        clickedPoints: [],
        lines: [],
        polygons: [],
        freeDraw: [],
      };
      this.transformShape = null;
      this.cursor = { display: false};
      this.shapeHistory = [];

      // This part is for testing performance
      // for (let i = 0; i < 5000; i++) {
      //   this.shapes.polygons.push(genRandomTriangle(this));
      // }

      // Drawing variables
      this.selected = false;
      this.dragging = false;
      this.drawing = false;
      this.freeDrawAdded = false;
      this.shapesMoved = false;
      this.moving = false;
      this.startX = null;
      this.startY = null;

      // Animation variables
      this.transforming = false;
      this.activeTransform = null;
      this.lastTimestamp = null;
      this.transformSpeed = 0.0001;
    }
  }

  findSelectedShapes(mouseX, mouseY) {
    // Clear out any previously selected shapes
    if (this.selected) {
      this.unselectAllShapes();
    }

    // Clicked points
    for (const point of this.shapes.clickedPoints) {
      if (point.pointClicked(mouseX, mouseY)) {
        point.selected = true;
        point.fillStyle = 'black';
        this.selected = true;
      }
    }

    // Lines
    for (const line of this.shapes.lines) {
      for (const anchor of line.anchors) {
        if (anchor.pointClicked(mouseX, mouseY)) {
          anchor.selected = true;
          anchor.fillStyle = 'black';
          line.selected = true;
          this.selected = true;
          break;
        }
      }
    }

    // Polygons
    for (const polygon of this.shapes.polygons) {
      let numSelectedEdges = 0;
      for (const edge of polygon.edges) {
        for (const anchor of edge.anchors) {
          if (anchor.pointClicked(mouseX, mouseY)) {
            anchor.selected = true;
            anchor.fillStyle = 'black';
            edge.selected = true;
            numSelectedEdges++;
            break;
          }
        }

        if (numSelectedEdges === 2) {
          polygon.selected = true;
          this.selected = true;
          break;
        }
      }
    }

    // Free drawings
    for (const freeDrawing of this.shapes.freeDraw) {
      const startPoint = freeDrawing.startPoint;
      if (startPoint.pointClicked(mouseX, mouseY)) {
        startPoint.selected = true;
        startPoint.fillStyle = 'black';
        freeDrawing.selected = true;
        this.selected = true;
      }

      const endPoint = freeDrawing.endPoint;
      if (endPoint.pointClicked(mouseX, mouseY)) {
        endPoint.selected = true;
        endPoint.fillStyle = 'black';
        freeDrawing.selected = true;
        this.selected = true;
      }
    }

    // Transform shapes
    if (this.transformShape) {
      // Center of rotation
      if (this.transformShape instanceof Point) {
        if (this.transformShape.pointClicked(mouseX, mouseY)) {
          this.transformShape.selected = true;
          this.transformShape.fillStyle = 'purple';
          this.selected = true;
        }
      }

      // Axis of translation
      else if (this.transformShape instanceof Line) {
        const anchor1 = this.transformShape.anchor1;
        const anchor2 = this.transformShape.anchor2;
        let axisClicked = true;
        if (anchor1.pointClicked(mouseX, mouseY)) {
          anchor1.selected = true;
          anchor1.fillStyle = 'purple';
          anchor2.selected = false;
        } else if (anchor2.pointClicked(mouseX, mouseY)) {
          anchor2.selected = true;
          anchor2.fillStyle = 'purple';
          anchor1.selected = false;
        } else {
          axisClicked = false;
        }
        this.transformShape.selected = axisClicked;
        this.selected = axisClicked;
      }
    }
  }

  unselectAllShapes() {
    // Turn off selected flag
    this.selected = false;

    // Unselect clicked points
    for (const point of this.shapes.clickedPoints) {
      point.selected = false;
      point.fillStyle = 'gray';
    }

    // Unselect lines
    for (const line of this.shapes.lines) {
      line.selected = false;
      for (const anchor of line.anchors) {
        anchor.selected = false;
        anchor.fillStyle = 'gray';
      }
    }

    // Unselect polygons
    for (const polygon of this.shapes.polygons) {
      polygon.selected = false;
      for (const edge of polygon.edges) {
        edge.selected = false;
        for (const anchor of edge.anchors) {
          anchor.selected = false;
          anchor.fillStyle = 'gray';
        }
      }
    }

    // Unselect free drawings
    for (const freeDrawing of this.shapes.freeDraw) {
      freeDrawing.selected = false;
      freeDrawing.startPoint.selected = false;
      freeDrawing.startPoint.fillStyle = 'gray';
      freeDrawing.endPoint.selected = false;
      freeDrawing.endPoint.fillStyle = 'gray';
    }

    // Unselect transform shapes
    if (this.transformShape && !this.transforming) {
      // Center of rotation
      if (this.transformShape instanceof Point) {
        this.transformShape.selected = false;
        this.transformShape.fillStyle = 'fuchsia';
      }

      // Axis of translation
      else if (this.transformShape instanceof Line) {
        this.transformShape.selected = false;
        this.transformShape.strokeStyle = 'fuchsia';
        for (const anchor of this.transformShape.anchors) {
          anchor.selected = false;
          anchor.fillStyle = 'fuchsia';
        }
      }
    }
  }

  saveCurrentShapes() {
    // Create an empty object to copy to
    const shapesCopy = {
      shapes: {
        clickedPoints: [],
        lines: [],
        polygons: [],
        freeDraw: [],
      },
      transformShape: null
    };

    // Add copies of each shape to the empty object
    for (const [shapeType, shapeArray] of Object.entries(this.shapes)) {
      for (const shape of shapeArray) {
        shapesCopy.shapes[shapeType].push(shape.recalculatePosition(0, 0));
      }
    }

    // Copy the transform shape
    if (this.transformShape) {
      shapesCopy.transformShape = this.transformShape.recalculatePosition(0, 0);
    }

    // Add the copy to the shape history
    this.shapeHistory.push(shapesCopy);
  }

  adjustDraggingShapes(mouseX, mouseY) {
    // Turn on shapes moved flag
    this.shapesMoved = true;

    // Calculate movement and update start position
    const changeX = mouseX - this.startX;
    const changeY = mouseY - this.startY;
    this.startX = mouseX;
    this.startY = mouseY;

    // Drag all the selected shapes
    for (const shapeArray of Object.values(this.shapes)) {
      // Create adjusted copies of the selected shapes
      const adjShapes = {};
      for (let index = 0; index < shapeArray.length; index++) {
        const shape = shapeArray[index];
        if (shape.selected) {
          adjShapes[index] = shape.recalculatePosition(changeX, changeY);
        }
      }

      // Update the shape array
      if (Object.keys(adjShapes).length > 0) {
        for (const index in adjShapes) {
          shapeArray[index] = adjShapes[index];
        }
      }
    }

    // Drag the transform shape if it is selected
    if (this.transformShape && this.transformShape.selected) {
      this.transformShape = this.transformShape.recalculatePosition(changeX, changeY);
    }
  }
}

class FreeDrawing {
  constructor(hypCanvas, startX, startY, closed = false) {
    // Drawing properties
    this.hypCanvas = hypCanvas;
    this.selected = false;
    this.strokeStyle = hypCanvas.strokeStyle;
    this.lineWidth = hypCanvas.lineWidth;
    this.closed = closed;

    // Start and end point
    this.startPoint = new Point(hypCanvas, startX, startY);
    this.allPoints = [this.startPoint];
    this.endPoint = this.startPoint.recalculatePosition(0, 0);
  }

  copyDrawingProperties(that) {
    this.hypCanvas = that.hypCanvas;
    this.selected = that.selected;
    this.strokeStyle = that.strokeStyle;
    this.closed = that.closed;
    this.startPoint.copyDrawingProperties(that.startPoint);
    this.endPoint.copyDrawingProperties(that.endPoint);
  }

  recalculatePosition(changeX, changeY) {
    if (changeX > 0 || changeY > 0) {
      const selectedPoint = this.startPoint.selected ?
        this.startPoint :
        this.endPoint;
      const changedPoint = selectedPoint.recalculatePosition(changeX, changeY);
      const axis = new Line(this.hypCanvas, selectedPoint, changedPoint);
      const mobius = Mobius.TRANSLATE(this.hypCanvas, axis, axis.hypDist());

      const adjStartPoint = mobius.applyTo(this.startPoint);
      const adjDrawing = new FreeDrawing(this.hypCanvas, adjStartPoint.x, adjStartPoint.y, this.closed);
      for (let i = 1; i < this.allPoints.length; i++) {
        const adjPoint = mobius.applyTo(this.allPoints[i]);
        adjDrawing.updateEndPoint(adjPoint.x, adjPoint.y);
      }
      // const adjDrawing = new FreeDrawing(this.hypCanvas, changedPoint.x, changedPoint.y, this.closed);;
      // if (selectedPoint.isEqualTo(this.startPoint)) {
      //   for (let i = 1; i < this.allPoints.length; i++) {
      //     const adjPoint = mobius.applyTo(this.allPoints[i]);
      //     adjDrawing.updateEndPoint(adjPoint.x, adjPoint.y);
      //   }
      // } else {
      //   for (let i = this.allPoints.length - 2; i > -1; i--) {
      //     const adjPoint = mobius.applyTo(this.allPoints[i]);
      //     adjDrawing.updateEndPoint(adjPoint.x, adjPoint.y);
      //   }
      // }
      adjDrawing.copyDrawingProperties(this);

      return adjDrawing;
    } else {
      return this;
    }
  }

  updateEndPoint(mouseX, mouseY) {
    const currentPoint = new Point(this.hypCanvas, mouseX, mouseY);
    this.allPoints.push(currentPoint);
    this.endPoint = currentPoint.recalculatePosition(0, 0);
  }

  draw(hypCanvas) {
    this.startPoint.draw(hypCanvas);
    this.endPoint.draw(hypCanvas);

    const ctx = hypCanvas.ctx;
    ctx.strokeStyle = this.strokeStyle;
    ctx.lineWidth = this.lineWidth;
    ctx.beginPath();
    for (let i = 0; i < this.allPoints.length - 1; i++) {
      const first = this.allPoints[i];
      const second = this.allPoints[i + 1];
      ctx.moveTo(first.x, first.y);
      ctx.lineTo(second.x, second.y);
    }
    if (this.closed) {
      const startPoint = this.startPoint;
      ctx.lineTo(startPoint.x, startPoint.y);
    }
    ctx.stroke();
  }
}

class Point {
  constructor(hypCanvas, x, y) {
    // Drawing properties
    this.hypCanvas = hypCanvas;
    this.selected = false;
    this.fillStyle = 'gray';
    this.anchorSize = 5;
    this.displayX = Math.round(100 * (x/this.hypCanvas.radius))/100;
    this.displayY = Math.round(100 * (y/this.hypCanvas.radius))/100;
    this.label = this.displayY >= 0 ?
      `${this.displayX} + ${this.displayY}i` :
      `${this.displayX} - ${-this.displayY}i`;
    // this.displayX = Math.round(100 * x)/100;
    // this.displayY = Math.round(100 * y)/100;
    // this.label = `(${this.displayX}, ${this.displayY})`;

    // Coordinates and length
    this.x = x;
    this.y = y;
    this.modulus = Math.sqrt(x**2 + y**2);

    // Argument
    if (x === 0 && y === 0) {
      this.argument = null;
    } else if (x > 0 && y === 0) {
      this.argument = 0
    } else {
      const argument = Math.atan2(y, x);
      this.argument = argument > 0 ?
        argument :
        2 * Math.PI + argument;
    }
  }

  updateLabel(displayX, displayY) {
    this.displayX = Math.round(100 * (displayX/this.hypCanvas.radius))/100;
    this.displayY = Math.round(100 * (displayY/this.hypCanvas.radius))/100;
    this.label = this.displayY >= 0 ?
      `${this.displayX} + ${this.displayY}i` :
      `${this.displayX} - ${-this.displayY}i`;
  }

  copyDrawingProperties(that, preserveLabel = true) {
    this.selected = that.selected;
    this.fillStyle = that.fillStyle;
    this.anchorSize = that.anchorSize;

    if (preserveLabel) {
      this.displayX = that.displayX;
      this.displayY = that.displayY;
      this.label = that.label;
    } else {
      this.updateLabel(this.x, this.y);
    }
  }

  recalculatePosition(changeX, changeY) {
    // Create a new point with the new coordinates
    const adjustedPoint = new Point(this.hypCanvas, this.x + changeX, this.y + changeY);

    // Update the drawing properties for the adjusted point
    adjustedPoint.copyDrawingProperties(this, false);

    return adjustedPoint;
  }

  draw(hypCanvas, drawAnchor = true) {
    // Draw the point
    const ctx = hypCanvas.ctx;
    ctx.fillStyle = this.fillStyle;
    const anchorSize = this.anchorSize;
    if (drawAnchor) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, anchorSize, 0, 7);
      ctx.fill();
    }
    ctx.font = '14px serif'
    ctx.scale(1, -1);
    ctx.fillText(this.label, this.x + anchorSize, -(this.y + anchorSize));
    ctx.scale(1, -1);
  }

  pointClicked(mouseX, mouseY) {
    return (mouseX - this.x)**2 + (mouseY - this.y)**2 < this.anchorSize**2;
  }

  // static randPoint = () => {
  //   let re;
  //   let im;
  //   do {
  //     re = 2 * Math.random() - 1;
  //     im = 2 * Math.random() - 1;
  //   } while (re**2 + im**2 > 1);
  //   return new Point(re, im)
  // };

  isOnADiameterWith(that, error = 0) {
    // Reject if both points are zero
    if (this.isZero() && that.isZero()) {
      throw "Both points cannot be zero"
    }

    // Return true if exactly one of the points is zero
    if (this.isZero() || that.isZero()) {
      return this.isZero() !== that.isZero()
    }

    // Return true if the points have the same argument
    const argDiff = Math.abs(this.argument - that.argument);
    if (
      argDiff <= error ||
      Math.abs(argDiff - Math.PI) <= error
    ) {
      return true
    }

    // Otherwise return false
    return false;
  }

  // getDiameterEndpoints(hypCanvas) {
  getDiameterEndpoints() {
    // Reject when this is zero
    if (this.isZero()) {
      throw "No unique diameter through zero"
    }

    // Normalize so modulus is equal to the canvas radius
    const normThis = this.scale(this.hypCanvas.radius/this.modulus);
    const oppNormThis = normThis.scale(-1);

    return [normThis, oppNormThis];
  }

  // Equality
  //#region
  isZero() {
    return this.x === 0 && this.y === 0;
  }
  isEqualTo(that) {
    return (this.minus(that)).isZero();
  }
  //#endregion

  // Complex number arithmetic
  //#region
  times(that) {
    const x = this.x * that.x - this.y * that.y;
    const y = this.x * that.y + this.y * that.x;
    return new Point(this.hypCanvas, x, y)
  }
  distanceTo(that) {
    const difference = this.minus(that);
    return difference.modulus;
  }
  conjugate() {
    return new Point(this.hypCanvas, this.x, -this.y);
  }
  plus(that) {
    return new Point(this.hypCanvas, this.x + that.x, this.y + that.y);
  }
  scale(factor) {
    return new Point(this.hypCanvas, factor * this.x, factor * this.y);
  }
  minus(that) {
    return new Point(this.hypCanvas, this.x - that.x, this.y - that.y);
  }
  dividedBy(that) {
    if (that.isZero()) {
      throw "Cannot divide by zero";
    }
    const thatConj = that.conjugate();
    const conjProd = this.times(thatConj);
    const result = conjProd.scale(1/that.modulus**2);
    return result;
  }
  //#endregion

  // Hyperbolic geometry
  //#region
  crossRatio(a, b, c) {
    const firstRatio = (this.minus(a)).dividedBy(this.minus(b));
    const secondRatio = (c.minus(b)).dividedBy(c.minus(a));
    return firstRatio.times(secondRatio);
  }
  //#endregion
  
  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

class Line {
  constructor(hypCanvas, point1, point2) {
    // Reject when the two points are the same
    if (point1.isEqualTo(point2)) {
      throw "We need two points to determine a line";
    }

    // Drawing properties
    this.hypCanvas = hypCanvas;
    this.selected = false;
    this.strokeStyle = this.hypCanvas.strokeStyle
    this.lineWidth = this.hypCanvas.lineWidth;
    this.segment = this.hypCanvas.activeTool === 'segment' || this.hypCanvas.activeTool === 'polygon';

    // Record the points in the order they were clicked
    this.point1 = point1;
    this.point2 = point2;

    // If one of the points is zero, return a diameter through the other
    if (point1.isZero() || point2.isZero()) {
      this.diameter = true;
      
      // Determine the endpoints
      const [endpointA, endpointB] = point1.isZero() ?
        point2.getDiameterEndpoints(hypCanvas) :
        point1.getDiameterEndpoints(hypCanvas);
      if (point1.distanceTo(endpointA) < point1.distanceTo(endpointB)) {
        this.endpoint1 = endpointA;
        this.endpoint2 = endpointB;
      } else {
        this.endpoint1 = endpointB;
        this.endpoint2 = endpointA;
      }
      
      // Determine the anchors: anchor1 = 0
      if (point1.isZero()) {
        this.anchor1 = point1;
        this.anchor2 = point2;
      } else {
        this.anchor1 = point2;
        this.anchor2 = point1;
      }
      this.anchors = [this.anchor1, this.anchor2];
      this.anchors.forEach(anchor => anchor.anchorSize = hypCanvas.anchorSize);
    }
    
    // If the points have the same argument (mod pi), return a diameter through either
    else if (point1.isOnADiameterWith(point2, 0.01)) {
      this.diameter = true;

      // Determine the endpoints
      const [endpointA, endpointB] = point1.getDiameterEndpoints(hypCanvas);
      if (point1.distanceTo(endpointA) < point1.distanceTo(endpointB)) {
        this.endpoint1 = endpointA;
        this.endpoint2 = endpointB;
      } else {
        this.endpoint1 = endpointB;
        this.endpoint2 = endpointA;
      }

      // Determine the anchors: anchor1 arg < anchor2 arg
      if (point1.modulus < point2.modulus) {
        this.anchor1 = point1;
        this.anchor2 = point2;
      } else {
        this.anchor1 = point2;
        this.anchor2 = point1;
      }
      this.anchors = [this.anchor1, this.anchor2];
      this.anchors.forEach(anchor => anchor.anchorSize = hypCanvas.anchorSize);
    }

    // General case
    else {
      this.diameter = false;

      // Scale input points so they lie in the unit disk
      const canvasRadius = hypCanvas.radius;
      const p = new Point(hypCanvas, point1.x/canvasRadius, point1.y/canvasRadius);
      const q = new Point(hypCanvas, point2.x/canvasRadius, point2.y/canvasRadius);

      // Determine the center and radius of the hyperbolic geodesic
      const numerator = (p.scale(1 + q.modulus**2)).minus(q.scale(1 + p.modulus**2));
      const denominator = (p.times(q.conjugate())).minus((p.conjugate()).times(q));
      const center = numerator.dividedBy(denominator);
      this.center = center.scale(canvasRadius);
      this.radius = p.distanceTo(center) * canvasRadius;

      // Define the anchors in order of increasing argument
      if (point1.argument < point2.argument) {
        this.anchor1 = point1;
        this.anchor2 = point2;
      } else {
        this.anchor1 = point2;
        this.anchor2 = point1;
      }
      this.anchors = [this.anchor1, this.anchor2];
      this.anchors.forEach(anchor => anchor.anchorSize = hypCanvas.anchorSize);

      // Determine whether to draw line counterclockwise and the anchor angles (relative to the line center)
      this.counterclockwise = !(this.anchor2.argument > this.anchor1.argument + Math.PI);
      this.anchor1Arg = (this.anchor1.minus(this.center)).argument;
      this.anchor2Arg = (this.anchor2.minus(this.center)).argument;
    }
  }

  hypDist() {
    let endpoint1;
    let endpoint2;
    
    if (this.diameter) {
      endpoint1 = this.endpoint1;
      endpoint2 = this.endpoint2;
    } else {
      [endpoint1, endpoint2] = this.getEndpoints(false);
    }

    // endpoint1.draw(this.hypCanvas);
    // endpoint2.draw(this.hypCanvas);

    const cRat = endpoint1.crossRatio(this.point2, this.point1, endpoint2);
    const rawDist = Math.log(cRat.x);
    const dist = Math.abs(rawDist);
    return dist;
  }

  getEndpoints(normalized = true) {
    // Normalize the center and radius
    const centerNormalized = this.center.scale(1/this.hypCanvas.radius);
    const radiusNormalized = this.radius/this.hypCanvas.radius;

    // Calculate endpoints using center and radius:
    // Solving |z - center|^2 = radius^2 leads to a quadratic equation in z,
    // then use the quadratic formula.
    const beta = radiusNormalized**2 - 1 - centerNormalized.modulus**2;
    const betaPoint = new Point(this.hypCanvas, 1, 0).scale(beta);
    const discSquared = beta**2 - 4 * centerNormalized.modulus**2;
    const discriminant = discSquared > 0 ?
      Math.sqrt(discSquared) :
      Math.sqrt(-discSquared);
    const discrPoint = discSquared > 0 ?
      new Point(this.hypCanvas, 1, 0).scale(discriminant) :
      new Point(this.hypCanvas, 0, 1).scale(discriminant);
    const posNumerator = discrPoint.minus(betaPoint);
    const negNumerator = (discrPoint.scale(-1)).minus(betaPoint);
    const denominator = (centerNormalized.conjugate()).scale(2);
    const posEndpoint = posNumerator.dividedBy(denominator);
    const negEndpoint = negNumerator.dividedBy(denominator);

    // Order the endpoints in the same order as the points that created the line
    let endpoint1;
    let endpoint2;
    const point1Normalized = this.point1.scale(1/this.hypCanvas.radius);
    if (point1Normalized.distanceTo(posEndpoint) < point1Normalized.distanceTo(negEndpoint)) {
      endpoint1 = posEndpoint;
      endpoint2 = negEndpoint;
    } else {
      endpoint1 = negEndpoint;
      endpoint2 = posEndpoint;
    }

    // If not normalized, rescale up to the canvas size
    if (!normalized) {
      endpoint1 = endpoint1.scale(this.hypCanvas.radius);
      endpoint2 = endpoint2.scale(this.hypCanvas.radius);
    }

    return [endpoint1, endpoint2];
  }

  copyDrawingProperties(that) {
    this.hypCanvas = that.hypCanvas;
    this.selected = that.selected;
    this.strokeStyle = that.strokeStyle;
    this.lineWidth = that.lineWidth;
    this.segment = that.segment;
  }

  recalculatePosition(changeX, changeY) {
    // Adjust the selected anchor
    const anchor1 = this.anchor1;
    const anchor2 = this.anchor2;
    const adjustedAnchors = [];
    for (const anchor of [anchor1, anchor2]) {
      if (anchor.selected) {
        adjustedAnchors.push(anchor.recalculatePosition(changeX, changeY));
      } else {
        adjustedAnchors.push(anchor);
      }
    }
    const anchorSize = anchor1.anchorSize;

    // Create a new line with the adjusted anchors
    const adjustedLine = anchor1.isEqualTo(this.point1) ?
      new Line(this.hypCanvas, adjustedAnchors[0], adjustedAnchors[1]) :
      new Line(this.hypCanvas, adjustedAnchors[1], adjustedAnchors[0]);
    adjustedLine.copyDrawingProperties(this);
    adjustedLine.anchors.forEach(anchor => anchor.anchorSize = anchorSize);

    return adjustedLine;
  }

  draw(hypCanvas, drawAnchors = false) {
    // Draw the anchors
    if (!drawAnchors) {
      this.anchors.forEach(anchor => anchor.draw(hypCanvas));
    }

    // Draw the line
    const ctx = hypCanvas.ctx;
    ctx.beginPath();
    ctx.strokeStyle = this.strokeStyle;
    ctx.lineWidth = this.lineWidth;
    if (this.segment) {
      ctx.moveTo(this.anchor1.x, this.anchor1.y);
      if (this.diameter) {
        ctx.lineTo(this.anchor2.x, this.anchor2.y);
      } else {
        ctx.arc(this.center.x, this.center.y, this.radius, this.anchor1Arg, this.anchor2Arg, this.counterclockwise);
        ctx.moveTo(this.anchor1.x, this.anchor1.y);
      }
    } else {
      if (this.diameter) {
        ctx.moveTo(this.endpoint1.x, this.endpoint1.y);
        ctx.lineTo(this.endpoint2.x, this.endpoint2.y);
      } else {
        ctx.moveTo(this.center.x + this.radius, this.center.y);
        ctx.arc(this.center.x, this.center.y, this.radius, 0, 7);
      }
    }
    ctx.stroke();
  }
}

class Polygon {
  constructor(hypCanvas, ...edges) {
    // Reject if less than 3 edges are given
    if (edges.length < 3) {
      throw "We need at least three points to determine a polygon";
    }

    // Drawing properties
    this.hypCanvas = hypCanvas;
    this.selected = false;
    this.fillStyle = this.hypCanvas.fillStyle;
    this.globalAlpha = this.hypCanvas.globalAlpha;

    // Record and copy the edges
    this.edges = edges;
    const edgesCopy = edges.map(edge => edge.recalculatePosition(0, 0));

    // Orient the edges
    this.oEdges = [];
    let currentEdge;
    let currentVertex = edgesCopy[0].anchor1;
    while (edgesCopy.length > 0) {
      // Update the current edge
      currentEdge = edgesCopy.shift();

      // Initialize the new oriented edge
      const oEdge = {
        line: currentEdge,
        oriented: null
      }

      // If the current vertex is the first anchor
      if (currentVertex.isEqualTo(currentEdge.anchor1)) {
        oEdge.oriented = true;
        currentVertex = currentEdge.anchor2;
        this.oEdges.push(oEdge);
      }

      // If the current vertex is the second anchor
      else if (currentVertex.isEqualTo(currentEdge.anchor2)) {
        oEdge.oriented = false;
        currentVertex = currentEdge.anchor1;
        this.oEdges.push(oEdge);
      }

      // If the current vertex is neither of the anchors
      else {
        edgesCopy.push(currentEdge);
      }
    }
  }

  draw(hypCanvas, fill = true) {
    // Fill the interior
    if (fill) {
      // Initialize the context
      const ctx = hypCanvas.ctx;
      ctx.fillStyle = this.fillStyle;
      ctx.globalAlpha = this.globalAlpha;

      // Trace the boundary using the oriented edges
      ctx.beginPath();
      const firstAnchor = this.oEdges[0].line.anchor1
      ctx.moveTo(firstAnchor.x, firstAnchor.y);
      for (const oEdge of this.oEdges) {
        const edge = oEdge.line;
        if (oEdge.oriented) {
          if (edge.diameter) {
            ctx.lineTo(edge.anchor2.x, edge.anchor2.y);
          } else {
            ctx.arc(
              edge.center.x,
              edge.center.y,
              edge.radius,
              edge.anchor1Arg,
              edge.anchor2Arg,
              edge.counterclockwise
            )
          }
        } else {
          if (edge.diameter) {
            ctx.lineTo(edge.anchor1.x, edge.anchor1.y);
          } else {
            ctx.arc(
              edge.center.x,
              edge.center.y,
              edge.radius,
              edge.anchor2Arg,
              edge.anchor1Arg,
              !edge.counterclockwise
            )
          }
        }
      }
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Draw the edges
    this.edges.forEach(edge => edge.draw(hypCanvas))
  }

  copyDrawingProperties(that) {
    this.hypCanvas = that.hypCanvas;
    this.selected = that.selected;
    this.fillStyle = that.fillStyle;
    this.globalAlpha = that.globalAlpha;
  }

  recalculatePosition(changeX, changeY) {
    // Adjust the selected edges
    const newEdges = {};
    for (let index = 0; index < this.edges.length; index++) {
      const edge = this.edges[index];
      if (edge.selected) {
        newEdges[index] = edge.recalculatePosition(changeX, changeY);
      }
    }

    // Create a copy of the current edges and replace the adjusted edges
    const edgesCopy = [...this.edges];
    for (const index in newEdges) {
      edgesCopy[index] = newEdges[index];
    }

    // Create a new polygon with the adjusted edges
    const adjustedPolygon = new Polygon(this.hypCanvas, ...edgesCopy);
    adjustedPolygon.copyDrawingProperties(this);

    return adjustedPolygon;
  }
}

class Mobius {
  /** 
   * Will be of the form z \mapsto (az + b)/(cz + d)
   * Assumes that the boundary circle displayed on screen is the unit
   * circle, so scaled b and c accordingly
   */
  constructor(hypCanvas, a, b, c, d) {
    this.hypCanvas = hypCanvas;
    this.a = a;
    this.b = b.scale(hypCanvas.radius);
    this.c = c.scale(1/hypCanvas.radius);
    this.d = d;
  }

  static ROTATE(hypCanvas, center, theta) {
    const centerNormalized = center.scale(1/hypCanvas.radius);
    const euler = new Point(hypCanvas, Math.cos(theta), Math.sin(theta));
    const one = new Point(hypCanvas, 1, 0);
    const centerLengthSquared = one.scale(centerNormalized.modulus**2);

    const a = euler.minus(centerLengthSquared);
    const b = centerNormalized.times(one.minus(euler));
    const c = (centerNormalized.conjugate()).times(euler.minus(one));
    const d = one.minus(euler.scale(centerNormalized.modulus**2));

    return new Mobius(hypCanvas, a, b, c, d);
  }

  static TRANSLATE(hypCanvas, axis, translationDistance) {
    // Determine the normalized endpoints
    let endpoint1Normalized;
    let endpoint2Normalized
    if (axis.diameter) {
      endpoint1Normalized = axis.endpoint1.scale(1/hypCanvas.radius);
      endpoint2Normalized = axis.endpoint2.scale(1/hypCanvas.radius);
    } else {
      [endpoint1Normalized, endpoint2Normalized] = axis.getEndpoints();
    }

    // const endpoints = axis.getEndpoints();
    const p = endpoint1Normalized;
    const q = endpoint2Normalized;
    const e = Math.exp(translationDistance);

    const a = (q.scale(e)).minus(p);
    const b = (p.times(q)).scale(1 - e);
    const c = new Point(hypCanvas, e - 1, 0);
    const d = q.minus(p.scale(e));

    return new Mobius(hypCanvas, a, b, c, d);
  }

  applyTo(shape, updateLabel = true) {
    // Points
    if (shape instanceof Point) {
      // Compute the numerator and denominator
      const numerator = (this.a.times(shape)).plus(this.b);
      const denominator = (this.c.times(shape)).plus(this.d);

      // Compute the final answer and copy it's drawing properties
      const adjPoint = numerator.dividedBy(denominator);
      adjPoint.copyDrawingProperties(shape, updateLabel)

      return adjPoint;
    }
    
    // Lines
    else if (shape instanceof Line) {
      // Apply the mobius transformation to the line anchors
      const adjAnchors = shape.anchors.map(anchor => this.applyTo(anchor, updateLabel));

      // Create a new line with the adjusted anchors
      const adjLine = new Line(shape.hypCanvas, ...adjAnchors);
      adjLine.copyDrawingProperties(shape);

      return adjLine;
    }

    // Polygons
    else if (shape instanceof Polygon) {
      // Apply the mobius transformation to each of the edges
      const adjEdges = shape.edges.map(edge => this.applyTo(edge, updateLabel));

      // Create a new polygon with the adjusted edges
      const adjPoly = new Polygon(shape.hypCanvas, ...adjEdges);
      adjPoly.copyDrawingProperties(shape);

      return adjPoly;
    }

    // Free Drawings
    else if (shape instanceof FreeDrawing) {
      // Create a new adjusted free drawing
      const adjStartPoint = this.applyTo(shape.startPoint);
      const adjDrawing = new FreeDrawing(shape.hypCanvas, adjStartPoint.x, adjStartPoint.y, shape.closed);

      // Apply the mobius transformation to the rest of the points
      for (let i = 1; i < shape.allPoints.length; i++) {
        const point = shape.allPoints[i];
        const adjPoint = this.applyTo(point);
        adjDrawing.updateEndPoint(adjPoint.x, adjPoint.y);
      }
      adjDrawing.copyDrawingProperties(shape);

      return adjDrawing;
    }
  }
}

export { HypCanvas, FreeDrawing, Point, Line, Polygon, Mobius }

function genRandomShape(hypCanvas) {
  // Generate the vertices
  const numVertices = Math.floor(Math.random() * 6) + 3;
  const radius = hypCanvas.radius;
  const vertices = [];
  do {
    let re;
    let im;
    do {
      re = 2 * Math.random() - 1;
      im = 2 * Math.random() - 1;
    } while (re**2 + im**2 > 1)
    vertices.push(new Point(hypCanvas, re * radius, im * radius));
  } while (vertices.length < numVertices)

  // Reorder the vertices
  const reorderVertices = Math.random() > 0.5;
  if (reorderVertices) {
    vertices.sort((a, b) => a.argument - b.argument);
  }

  // Create the edges
  vertices.push(vertices[0]);
  const edges = [];
  for (let vertexNum = 0; vertexNum < vertices.length - 1; vertexNum++) {
    const edge = new Line(hypCanvas, vertices[vertexNum], vertices[vertexNum + 1]);
    edge.segment = true;
    edges.push(edge);
  }
  
  return new Polygon(hypCanvas, ...edges);
}