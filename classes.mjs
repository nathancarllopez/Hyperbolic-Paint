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

  pointClicked(mouseX, mouseY) {
    return (mouseX - this.x)**2 + (mouseY - this.y)**2 < this.anchorSize**2;
  }

  changeCoord(changeX, changeY) {
    // Create a new point with the new coordinates
    const adjustedPoint = new Point(this.x + changeX, this.y + changeY);

    // Update the drawing properties for the adjusted point
    adjustedPoint.selected = this.selected;
    adjustedPoint.fillStyle = this.fillStyle;
    adjustedPoint.anchorSize = this.anchorSize;

    return adjustedPoint;
  }

  static randPoint = () => new Point(Math.random(), Math.random());
  
  draw(canvasInfo, drawAnchor = true) {
    // Prepare the label
    const ctx = canvasInfo.ctx;
    // const xLabel = Math.round(100 * (this.x/canvasInfo.radius))/100;
    // const yLabel = Math.round(100 * (this.y/canvasInfo.radius))/100;
    const xLabel = Math.round(100 * (this.x))/100;
    const yLabel = Math.round(100 * (this.y))/100;
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

  getDiameterEndpoints(canvasInfo) {
    // Reject when this is zero
    if (this.isZero()) {
      throw "No unique diameter through zero"
    }

    // Normalize so length = canvas radius
    const normThis = this.scale(canvasInfo.radius/this.modulus);
    const oppNormThis = normThis.scale(-1);

    // Return endpoints in order of increasing argument
    if (normThis.argument < oppNormThis.argument) {
      return [normThis, oppNormThis];
    }
    return [oppNormThis, normThis];
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

  toString() {
    return `(${this.x}, ${this.y})`;
  }
}

class Line {
  constructor(canvasInfo, point1, point2) {
    // Reject when the two points are the same
    if (point1.isEqualTo(point2)) {
      throw "We need two points to determine a line";
    }

    // Drawing properties
    this.canvasInfo = canvasInfo;
    this.selected = false;
    this.strokeStyle = this.canvasInfo.strokeStyle
    this.lineWidth = this.canvasInfo.lineWidth;
    this.segment = this.canvasInfo.activeTool === 'segment' || this.canvasInfo.activeTool === 'polygon';

    // If one of the points is zero, return a diameter through the other
    if (point1.isZero() || point2.isZero()) {
      this.diameter = true;
      const diameterEndpoints = point1.isZero() ?
        point2.getDiameterEndpoints(canvasInfo) :
        point1.getDiameterEndpoints(canvasInfo);
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
      this.anchors.forEach(anchor => anchor.anchorSize = canvasInfo.anchorSize);
    }
    
    // If the points have the same argument (mod pi), return a diameter through either
    else if (
      point1.isOnADiameterWith(point2, 0.01)
    ) {
      this.diameter = true;
      const diameterEndpoints = point1.getDiameterEndpoints(canvasInfo);
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
      this.anchors.forEach(anchor => anchor.anchorSize = canvasInfo.anchorSize);
    }

    // General case
    else {
      this.diameter = false;

      // Scale input points so they lie in the unit disk
      const canvasRadius = canvasInfo.radius;
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
      this.anchors.forEach(anchor => anchor.anchorSize = canvasInfo.anchorSize);

      // Determine whether to draw line counterclockwise and the anchor angles (relative to the line center)
      this.counterclockwise = !(this.anchor2.argument > this.anchor1.argument + Math.PI);
      this.anchor1Arg = (this.anchor1.minus(this.center)).argument;
      this.anchor2Arg = (this.anchor2.minus(this.center)).argument;
    }
  }

  recalculatePosition(changeX, changeY) {
    // Adjust the selected anchor
    const anchor1 = this.anchor1;
    const anchor2 = this.anchor2;
    const adjustedAnchors = [];
    for (const anchor of [anchor1, anchor2]) {
      if (anchor.selected) {
        adjustedAnchors.push(anchor.changeCoord(changeX, changeY));
      } else {
        adjustedAnchors.push(anchor);
      }
    }
    const anchorSize = anchor1.anchorSize;

    // Create a new line with the adjusted anchors
    const adjustedLine = new Line(this.canvasInfo, ...adjustedAnchors);

    // Update the adjustedLine with the drawing properties of this
    adjustedLine.canvasInfo = this.canvasInfo
    adjustedLine.selected = this.selected;
    adjustedLine.lineWidth = this.lineWidth;
    adjustedLine.strokeStyle = this.strokeStyle;
    adjustedLine.segment = this.segment
    adjustedLine.anchors.forEach(anchor => anchor.anchorSize = anchorSize);

    return adjustedLine;
  }

  draw(canvasInfo) {
    // Draw the anchors
    this.anchors.forEach(anchor => anchor.draw(canvasInfo));

    // Draw the line
    const ctx = canvasInfo.ctx;
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
  constructor(canvasInfo, ...edges) {
    // Reject if less than 3 edges are given
    if (edges.length < 3) {
      throw "We need at least three points to determine a polygon";
    }

    // Drawing properties
    this.canvasInfo = canvasInfo;
    this.selected = false;
    this.fillStyle = this.canvasInfo.fillStyle;

    // Record the edges
    this.edges = edges;
  }

  draw(canvasInfo, fill = true) {
    // Fill the interior
    if (fill) {
      const ctx = canvasInfo.ctx;
      ctx.beginPath();
      ctx.fillStyle = this.fillStyle;
      const firstVertex = this.edges[0].anchor1;
      ctx.moveTo(firstVertex.x, firstVertex.y);
      for (const edge of this.edges) { // We may need to figure out how to traverse the edges clockwise
        if (edge.diameter) {
          ctx.lineTo(edge.anchor2.x, edge.anchor2.y);
        } else {
          ctx.arc(edge.center.x, edge.center.y, edge.radius, edge.anchor1Arg, edge.anchor2Arg, edge.counterclockwise);
        }
      }
      // ctx.moveTo(firstVertex.x, firstVertex.y);
      ctx.fill();
    }

    // Draw the edges
    this.edges.forEach(edge => edge.draw(canvasInfo));
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

    // Create a new polygon with the adjusted vertices
    const adjustedPolygon = new Polygon(this.canvasInfo, ...edgesCopy);

    // Update the adjusted polygons drawing properties to match this
    adjustedPolygon.canvasInfo = this.canvasInfo;
    adjustedPolygon.selected = this.selected;
    adjustedPolygon.fillStyle = this.fillStyle;

    return adjustedPolygon;
  }
}

export { Point, Line, Polygon }