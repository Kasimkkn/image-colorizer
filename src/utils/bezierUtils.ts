
export interface Point {
  x: number;
  y: number;
}

export interface BezierPoint extends Point {
  controlPoint1?: Point;
  controlPoint2?: Point;
}

export class BezierCurve {
  private points: BezierPoint[] = [];
  private isDrawing = false;
  private currentPoint: BezierPoint | null = null;

  addPoint(point: Point, isControlPoint = false): void {
    if (!isControlPoint) {
      const bezierPoint: BezierPoint = { ...point };
      this.points.push(bezierPoint);
      this.currentPoint = bezierPoint;
    } else if (this.currentPoint) {
      if (!this.currentPoint.controlPoint1) {
        this.currentPoint.controlPoint1 = point;
      } else if (!this.currentPoint.controlPoint2) {
        this.currentPoint.controlPoint2 = point;
      }
    }
  }

  getPathData(): string {
    if (this.points.length === 0) return '';
    
    let pathData = `M ${this.points[0].x} ${this.points[0].y}`;
    
    for (let i = 1; i < this.points.length; i++) {
      const current = this.points[i];
      const previous = this.points[i - 1];
      
      if (previous.controlPoint1 && previous.controlPoint2) {
        pathData += ` C ${previous.controlPoint1.x} ${previous.controlPoint1.y}, ${previous.controlPoint2.x} ${previous.controlPoint2.y}, ${current.x} ${current.y}`;
      } else {
        pathData += ` L ${current.x} ${current.y}`;
      }
    }
    
    return pathData;
  }

  clear(): void {
    this.points = [];
    this.currentPoint = null;
    this.isDrawing = false;
  }

  getPoints(): BezierPoint[] {
    return [...this.points];
  }
}

export const snapToAngle = (point: Point, startPoint: Point, angleStep = 15): Point => {
  const dx = point.x - startPoint.x;
  const dy = point.y - startPoint.y;
  const angle = Math.atan2(dy, dx) * (180 / Math.PI);
  const snappedAngle = Math.round(angle / angleStep) * angleStep;
  const distance = Math.sqrt(dx * dx + dy * dy);
  
  const snappedRadians = snappedAngle * (Math.PI / 180);
  return {
    x: startPoint.x + distance * Math.cos(snappedRadians),
    y: startPoint.y + distance * Math.sin(snappedRadians)
  };
};

export const isPointNearPoint = (point1: Point, point2: Point, tolerance = 10): boolean => {
  const dx = point1.x - point2.x;
  const dy = point1.y - point2.y;
  return Math.sqrt(dx * dx + dy * dy) <= tolerance;
};
