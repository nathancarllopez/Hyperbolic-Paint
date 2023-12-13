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
      this.shapeHistory = oldCanvas.shapeHistory;
      this.cursor = oldCanvas.cursor;

      // Drawing variables
      this.selected = oldCanvas.selected;
      this.dragging = oldCanvas.dragging;
      this.shapesMoved = oldCanvas.shapesMoved;
      this.startX = oldCanvas.startX;
      this.startY = oldCanvas.startY;

      // Animation variables
      this.transforming = oldCanvas.transforming;
      this.activeTransform = oldCanvas.activeTransform;
      this.lastTimestamp = oldCanvas.lastTimestamp;
      this.transformSpeed = oldCanvas.transformSpeed;
      this.centerOfRotation = oldCanvas.centerOfRotation;
      this.axisOfTranslation = oldCanvas.axisOfTranslation;
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

      this.shapes = {
        clickedPoints: [],
        lines: [],
        polygons: [genRandomTriangle(this)],
      };
      this.shapeHistory = [];
      this.cursor = { display: false};

      // Drawing variables
      this.selected = false;
      this.dragging = false;
      this.shapesMoved = false;
      this.startX = null;
      this.startY = null;

      // Animation variables
      this.transforming = false;
      this.activeTransform = null;
      this.lastTimestamp = null;
      this.transformSpeed = 0.0001;
      this.centerOfRotation = null;
      this.axisOfTranslation = null;
    }
  };
}

class Point {
  constructor(x, y) {
    // Drawing properties
    this.selected = false;
    this.fillStyle = 'gray';
    this.anchorSize = 5;

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

  draw(hypCanvas, drawAnchor = true) {
    // Prepare the label
    const ctx = hypCanvas.ctx;
    const xLabel = Math.round(100 * (this.x/hypCanvas.radius))/100;
    const yLabel = Math.round(100 * (this.y/hypCanvas.radius))/100;
    // const xLabel = Math.round(100 * (this.x))/100;
    // const yLabel = Math.round(100 * (this.y))/100;
    const label = `(${xLabel}, ${yLabel})`;

    // Draw the point
    ctx.fillStyle = this.fillStyle;
    const anchorSize = this.anchorSize;
    if (drawAnchor) {
      ctx.beginPath();
      ctx.arc(this.x, this.y, anchorSize, 0, 7);
      ctx.fill();
    }
    ctx.font = '14px serif'
    ctx.scale(1, -1);
    ctx.fillText(label, this.x + anchorSize, -(this.y + anchorSize));
    ctx.scale(1, -1);
  }

  pointClicked(mouseX, mouseY) {
    return (mouseX - this.x)**2 + (mouseY - this.y)**2 < this.anchorSize**2;
  }

  recalculatePosition(changeX, changeY) {
    // Create a new point with the new coordinates
    const adjustedPoint = new Point(this.x + changeX, this.y + changeY);

    // Update the drawing properties for the adjusted point
    adjustedPoint.copyDrawingProperties(this);

    return adjustedPoint;
  }

  static randPoint = () => {
    let re;
    let im;
    do {
      re = 2 * Math.random() - 1;
      im = 2 * Math.random() - 1;
    } while (re**2 + im**2 > 1);
    return new Point(re, im)
  };

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

  getDiameterEndpoints(hypCanvas) {
    // Reject when this is zero
    if (this.isZero()) {
      throw "No unique diameter through zero"
    }

    // Normalize so length = canvas radius
    const normThis = this.scale(hypCanvas.radius/this.modulus);
    const oppNormThis = normThis.scale(-1);

    // Return endpoints in order of increasing argument
    if (normThis.argument < oppNormThis.argument) {
      return [normThis, oppNormThis];
    }
    return [oppNormThis, normThis];
  }

  copyDrawingProperties(that) {
    this.selected = that.selected;
    this.fillStyle = that.fillStyle;
    this.anchorSize = that.anchorSize;
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
    return new Point(x, y)
  }
  distance(that) {
    const difference = this.minus(that);
    return difference.modulus;
  }
  conjugate() {
    return new Point(this.x, -this.y);
  }
  plus(that) {
    return new Point(this.x + that.x, this.y + that.y);
  }
  scale(factor) {
    return new Point(factor * this.x, factor * this.y);
  }
  minus(that) {
    return new Point(this.x - that.x, this.y - that.y);
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
  hypDist(that) {

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

    // If one of the points is zero, return a diameter through the other
    if (point1.isZero() || point2.isZero()) {
      this.diameter = true;
      const diameterEndpoints = point1.isZero() ?
        point2.getDiameterEndpoints(hypCanvas) :
        point1.getDiameterEndpoints(hypCanvas);
      this.endpoint1 = diameterEndpoints[0];
      this.endpoint2 = diameterEndpoints[1];
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
    else if (
      point1.isOnADiameterWith(point2, 0.01)
    ) {
      this.diameter = true;
      const diameterEndpoints = point1.getDiameterEndpoints(hypCanvas);
      this.endpoint1 = diameterEndpoints[0];
      this.endpoint2 = diameterEndpoints[1];
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
      const p = new Point(point1.x/canvasRadius, point1.y/canvasRadius);
      const q = new Point(point2.x/canvasRadius, point2.y/canvasRadius);

      // Determine the center and radius of the hyperbolic geodesic
      const numerator = (p.scale(1 + q.modulus**2)).minus(q.scale(1 + p.modulus**2));
      const denominator = (p.times(q.conjugate())).minus((p.conjugate()).times(q));
      const center = numerator.dividedBy(denominator);
      this.center = center.scale(canvasRadius);
      this.radius = p.distance(center) * canvasRadius;

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

  getEndpoints(normalized = true) {
    // If line is a diameter, endpoints are already calculated
    if (this.diameter) {
      return [this.endpoint1, this.endpoint2];
    }

    // Otherwise, get and normalize the center and radius
    const centerNormalized = this.center.scale(1/this.hypCanvas.radius);
    const radiusNormalized = this.radius/this.hypCanvas.radius;

    // Calculate endpoints using center and radius:
    // Solving |z - center|^2 = radius^2 leads to a quadratic equation in z,
    // then use the quadratic formula.
    const beta = radiusNormalized**2 - 1 - centerNormalized.modulus**2;
    const betaPoint = new Point(1, 0).scale(beta);
    const discSquared = beta**2 - 4 * centerNormalized.modulus**2;
    const discriminant = discSquared > 0 ?
      Math.sqrt(discSquared) :
      Math.sqrt(-discSquared);
    const discrPoint = discSquared > 0 ?
      new Point(1, 0).scale(discriminant) :
      new Point(0, 1).scale(discriminant);
    const posNumerator = discrPoint.minus(betaPoint);
    const negNumerator = (discrPoint.scale(-1)).minus(betaPoint);
    const denominator = (centerNormalized.conjugate()).scale(2);
    const posEndpoint = posNumerator.dividedBy(denominator);
    const negEndpoint = negNumerator.dividedBy(denominator);

    // If not normalized, rescale up to the canvas size
    if (!normalized) {
      posEndpoint.scale(this.hypCanvas.radius);
      negEndpoint.scale(this.hypCanvas.radius);
    }

    // Return the endpoints in increasing order of argument
    if (posEndpoint.argument < negEndpoint.argument) {
      return [posEndpoint, negEndpoint];
    }
    return [negEndpoint, posEndpoint];
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
    const adjustedLine = new Line(this.hypCanvas, ...adjustedAnchors);
    adjustedLine.copyDrawingProperties(this);
    adjustedLine.anchors.forEach(anchor => anchor.anchorSize = anchorSize);

    return adjustedLine;
  }

  draw(hypCanvas) {
    // Draw the anchors
    this.anchors.forEach(anchor => anchor.draw(hypCanvas));

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

function genRandomTriangle(hypCanvas) {
  const radius = hypCanvas.radius;
  const vertices = [];
  do {
    let re;
    let im;
    do {
      re = 2 * Math.random() - 1;
      im = 2 * Math.random() - 1;
    } while (re**2 + im**2 > 1)
    vertices.push(new Point(re * radius, im * radius));
  } while (vertices.length < 3)

  const [a, b, c] = vertices;
  const edges = [
    new Line(hypCanvas, a, b),
    new Line(hypCanvas, b, c),
    new Line(hypCanvas, c, a),
  ]
  edges.map(line => line.segment = true);
  
  return new Polygon(hypCanvas, ...edges);
}

class Mobius {
  /** Will be of the form z \mapsto (az + b)/(cz + d) */
  constructor(hypCanvas, a, b, c, d) {
    this.hypCanvas = hypCanvas;
    this.a = a;
    this.b = b.scale(hypCanvas.radius);
    this.c = c.scale(1/hypCanvas.radius);
    this.d = d;
  }

  static ROTATE(hypCanvas, center, theta) {
    const centerNormalized = center.scale(1/hypCanvas.radius);
    const euler = new Point(Math.cos(theta), Math.sin(theta));
    const one = new Point(1, 0);
    const centerLengthSquared = one.scale(centerNormalized.modulus**2);

    const a = euler.minus(centerLengthSquared);
    const b = centerNormalized.times(one.minus(euler));
    const c = (centerNormalized.conjugate()).times(euler.minus(one));
    const d = one.minus(euler.scale(centerNormalized.modulus**2));

    return new Mobius(hypCanvas, a, b, c, d);
  }

  static TRANSLATE(hypCanvas, axis, translationDistance) {
    const endpoints = axis.getEndpoints();
    const p = endpoints[0];
    const q = endpoints[1];
    const e = Math.exp(translationDistance);

    const a = (q.scale(e)).minus(p);
    const b = (p.times(q)).scale(1 - e);
    const c = new Point(e - 1, 0);
    const d = q.minus(p.scale(e));

    return new Mobius(hypCanvas, a, b, c, d);
  }

  applyTo(shape) {
    // Points
    if (shape instanceof Point) {
      // Compute the numerator and denominator
      const numerator = (this.a.times(shape)).plus(this.b);
      const denominator = (this.c.times(shape)).plus(this.d);

      // Compute the final answer and copy it's drawing properties
      const adjPoint = numerator.dividedBy(denominator);
      adjPoint.copyDrawingProperties(shape)

      return adjPoint;
    }
    
    // Lines
    else if (shape instanceof Line) {
      // Apply the mobius transformation to the line anchors
      const adjAnchors = shape.anchors.map(anchor => this.applyTo(anchor));

      // Create a new line with the adjusted anchors
      const adjLine = new Line(shape.hypCanvas, ...adjAnchors);
      adjLine.copyDrawingProperties(shape);

      return adjLine;
    }

    // Polygons
    else if (shape instanceof Polygon) {
      // Apply the mobius transformation to each of the edges
      const adjEdges = shape.edges.map(edge => this.applyTo(edge));

      // Create a new polygon with the adjusted edges
      const adjPoly = new Polygon(shape.hypCanvas, ...adjEdges);
      adjPoly.copyDrawingProperties(shape);

      return adjPoly;
    }
  }
}

export { HypCanvas, Point, Line, Polygon, Mobius, genRandomTriangle }