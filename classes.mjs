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

  draw(canvasInfo, drawAnchor = true) {
    // Prepare the label
    const ctx = canvasInfo.ctx;
    const xLabel = Math.round(100 * (this.x/canvasInfo.radius))/100;
    const yLabel = Math.round(100 * (this.y/canvasInfo.radius))/100;
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
    ctx.fillStyle = canvasInfo.fillStyle;
    ctx.scale(1, -1);
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

  changeCoord(changeX, changeY) {
    this.x = this.x + changeX;
    this.y = this.y + changeY;
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
    this.strokeStyle = canvasInfo.strokeStyle;
    this.lineWidth = canvasInfo.lineWidth;
    this.segment = canvasInfo.activeTool === 'segment' || canvasInfo.activeTool === 'polygon';

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
    
    // If the points have the same argument, return a diameter through either
    else if (point1.argument === point2.argument) {
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

      // Determine whether to draw line counterclockwise
      // and the anchor angles (relative to the center)
      this.counterclockwise = !(this.anchor2.argument > this.anchor1.argument + Math.PI);
      this.anchor1Arg = (this.anchor1.minus(this.center)).argument;
      this.anchor2Arg = (this.anchor2.minus(this.center)).argument;
    }
  }

  recalculatePosition(changeX, changeY) {
    // Adjust the selected anchor
    const anchor1 = this.anchor1;
    const anchor2 = this.anchor2;
    for (const anchor of [anchor1, anchor2]) {
      if (anchor.selected) {
        anchor.changeCoord(changeX, changeY);
        break;
      }
    }
    const anchorSize = anchor1.anchorSize;

    // Create a new line with the adjusted anchors
    const adjustedLine = new Line(this.canvasInfo, this.anchor1, this.anchor2);

    // Update the adjustedLine with the drawing properties of this
    adjustedLine.selected = this.selected;
    adjustedLine.strokeStyle = this.strokeStyle;
    adjustedLine.lineWidth = this.lineWidth;
    adjustedLine.segment = this.segment
    adjustedLine.anchors.forEach(anchor => anchor.anchorSize = anchorSize);

    return adjustedLine;

    // // Create a new line with this.anchors
    // const adjustedLine = new Line(this.canvasInfo, this.anchor1, this.anchor2);

    // // Update anchors
    // const change1X = adjustedLine.anchor1.x - this.anchor1.x;
    // const change1Y = adjustedLine.anchor1.y - this.anchor1.y;
    // this.anchor1.changeCoord(change1X, change1Y);
    // const change2X = adjustedLine.anchor2.x - this.anchor2.x;
    // const change2Y = adjustedLine.anchor2.y - this.anchor2.y;
    // this.anchor2.changeCoord(change2X, change2Y);
  
    // // New line is a diameter
    // this.diameter = adjustedLine.diameter;
    // if (this.diameter) {
    //   this.endpoint1 = adjustedLine.endpoint1;
    //   this.endpoint2 = adjustedLine.endpoint2;
    // }
  
    // // New line is not a diameter
    // else {
    //   this.center = adjustedLine.center;
    //   this.radius = adjustedLine.radius;
    //   this.counterclockwise = adjustedLine.counterclockwise;
    //   this.anchor1Arg = adjustedLine.anchor1Arg;
    //   this.anchor2Arg = adjustedLine.anchor2Arg;
    // }
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
    ctx.strokeStyle = canvasInfo.strokeStyle;
  }
}

class Polygon {
  constructor(canvasInfo, ...vertices) {
    // Reject if less than 3 vertices given
    if (vertices.length < 3) {
      throw "We need at least three points to determine a polygon";
    }

    // Drawing properties
    this.selected = false;
    this.fillStyle = 'blue';

    // Build the edges and edge-vertex map
    this.vertices = vertices;
    this.edges = [];
    for (let vertexNum = 0; vertexNum < vertices.length; vertexNum++) {
      const vertex1 = vertices[vertexNum];
      const vertex2 = vertexNum === vertices.length - 1 ?
        vertices[0] :
        vertices[vertexNum + 1];
      this.edges.push(new Line(canvasInfo, vertex1, vertex2));
    }
  }

  draw(canvasInfo, fill = true) {
    // Draw the vertices
    this.vertices.forEach(vertex => vertex.draw(canvasInfo));

    // Draw the edges
    this.edges.forEach(edge => edge.draw(canvasInfo));

    // Fill the interior
    if (fill) {
      const ctx = canvasInfo.ctx;
      const firstVertex = this.vertices[0];
      ctx.beginPath();
      ctx.fillStyle = this.fillStyle;
      ctx.moveTo(firstVertex.x, firstVertex.y);
      for (const edge of this.edges) {
        if (edge.diameter) {
          ctx.lineTo(edge.anchor2.x, edge.anchor2.y);
        } else {
          ctx.arc(edge.center.x, edge.center.y, edge.radius, edge.anchor1Arg, edge.anchor2Arg, edge.counterclockwise);
        }
      }
      ctx.fill()
    }
  }

  getVertexEdges(vertex) {
    return this.edges.filter(edge => edge.anchor1.isEqualTo(vertex) || edge.anchor2.isEqualTo(vertex))
  }

  recalculatePosition() {

  }
}

export { Point, Line, Polygon }