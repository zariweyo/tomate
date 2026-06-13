export class Track {
  constructor(scene, trackData, container) {
    this.scene = scene;
    this.trackData = trackData;
    this.container = container;
    this.points = trackData.points;
    this.roadWidth = trackData.roadWidth;
    this.segments = this.createSegments();
    this.totalLength = this.segments.at(-1).endDistance;
    this.sectorDistances = [
      this.totalLength / 3,
      (this.totalLength * 2) / 3
    ];
  }

  draw() {
    const bounds = this.getBounds();
    const graphics = this.scene.add.graphics();

    graphics.fillStyle(0x245f37, 1);
    graphics.fillRect(bounds.left - 900, bounds.top - 900, bounds.width + 1800, bounds.height + 1800);

    this.drawRoad(graphics);
    this.drawMarkers(graphics);

    this.container.add(graphics);
  }

  createSegments() {
    let distance = 0;

    return this.points.slice(0, -1).map((start, index) => {
      const end = this.points[index + 1];
      const length = Phaser.Math.Distance.Between(start.x, start.y, end.x, end.y);
      const angle = Phaser.Math.Angle.Between(start.x, start.y, end.x, end.y);
      const segment = {
        start,
        end,
        length,
        angle,
        startDistance: distance,
        endDistance: distance + length
      };

      distance += length;

      return segment;
    });
  }

  drawRoad(graphics) {
    this.strokePath(graphics, this.roadWidth + 34, 0x40372f, 1);
    this.strokePath(graphics, this.roadWidth, 0x6d6a66, 1);
    this.strokePath(graphics, 5, 0xdad7c8, 0.58);

    graphics.fillStyle(0xcfc6a0, 1);
    for (let distance = 140; distance < this.totalLength - 80; distance += 280) {
      const sample = this.getPointAtDistance(distance);
      graphics.fillCircle(sample.x, sample.y, 9);
    }
  }

  drawMarkers(graphics) {
    this.drawLineAcrossRoad(graphics, this.trackData.startDistance, 0xffffff, 10);
    this.drawLineAcrossRoad(graphics, this.sectorDistances[0], 0xf4d35e, 8);
    this.drawLineAcrossRoad(graphics, this.sectorDistances[1], 0xf4d35e, 8);
    this.drawLineAcrossRoad(graphics, this.totalLength - this.trackData.finishPadding, 0xffffff, 12, true);
  }

  strokePath(graphics, width, color, alpha) {
    graphics.lineStyle(width, color, alpha);
    graphics.beginPath();
    graphics.moveTo(this.points[0].x, this.points[0].y);

    for (const point of this.points.slice(1)) {
      graphics.lineTo(point.x, point.y);
    }

    graphics.strokePath();
  }

  drawLineAcrossRoad(graphics, distance, color, width, isFinish = false) {
    const sample = this.getPointAtDistance(distance);
    const normal = this.getNormal(sample.angle);
    const halfWidth = this.roadWidth / 2;

    graphics.lineStyle(width, color, 1);
    graphics.beginPath();
    graphics.moveTo(sample.x - normal.x * halfWidth, sample.y - normal.y * halfWidth);
    graphics.lineTo(sample.x + normal.x * halfWidth, sample.y + normal.y * halfWidth);
    graphics.strokePath();

    if (isFinish) {
      graphics.lineStyle(4, 0x111111, 1);
      for (let offset = -halfWidth; offset <= halfWidth; offset += 24) {
        graphics.beginPath();
        graphics.moveTo(sample.x + normal.x * offset, sample.y + normal.y * offset);
        graphics.lineTo(sample.x + normal.x * (offset + 12), sample.y + normal.y * (offset + 12));
        graphics.strokePath();
      }
    }
  }

  getPointAtDistance(distance) {
    const clampedDistance = Phaser.Math.Clamp(distance, 0, this.totalLength);
    const segment = this.segments.find((item) => clampedDistance <= item.endDistance) ?? this.segments.at(-1);
    const progress = segment.length === 0 ? 0 : (clampedDistance - segment.startDistance) / segment.length;

    return {
      x: Phaser.Math.Linear(segment.start.x, segment.end.x, progress),
      y: Phaser.Math.Linear(segment.start.y, segment.end.y, progress),
      angle: segment.angle
    };
  }

  getNormal(angle) {
    return {
      x: Math.cos(angle + Math.PI / 2),
      y: Math.sin(angle + Math.PI / 2)
    };
  }

  getPositionAt(distance, lateralOffset) {
    const sample = this.getPointAtDistance(distance);
    const normal = this.getNormal(sample.angle);

    return {
      x: sample.x + normal.x * lateralOffset,
      y: sample.y + normal.y * lateralOffset,
      angle: sample.angle
    };
  }

  projectPosition(point) {
    let closestProjection = null;

    for (const segment of this.segments) {
      const segmentX = segment.end.x - segment.start.x;
      const segmentY = segment.end.y - segment.start.y;
      const pointX = point.x - segment.start.x;
      const pointY = point.y - segment.start.y;
      const segmentLengthSquared = segmentX * segmentX + segmentY * segmentY;
      const amount = segmentLengthSquared === 0
        ? 0
        : Phaser.Math.Clamp((pointX * segmentX + pointY * segmentY) / segmentLengthSquared, 0, 1);
      const x = segment.start.x + segmentX * amount;
      const y = segment.start.y + segmentY * amount;
      const distanceToLine = Phaser.Math.Distance.Between(point.x, point.y, x, y);

      if (!closestProjection || distanceToLine < closestProjection.distanceToLine) {
        const normal = this.getNormal(segment.angle);
        const lateralOffset = (point.x - x) * normal.x + (point.y - y) * normal.y;

        closestProjection = {
          x,
          y,
          angle: segment.angle,
          distance: segment.startDistance + segment.length * amount,
          lateralOffset,
          distanceToLine
        };
      }
    }

    return closestProjection;
  }

  isOnRoad(lateralOffset) {
    return Math.abs(lateralOffset) <= this.roadWidth / 2;
  }

  getSectorIndex(distance) {
    if (distance >= this.sectorDistances[1]) {
      return 3;
    }

    if (distance >= this.sectorDistances[0]) {
      return 2;
    }

    return 1;
  }

  getProgress(distance) {
    return Phaser.Math.Clamp(distance / this.totalLength, 0, 1);
  }

  getBounds() {
    const xs = this.points.map((point) => point.x);
    const ys = this.points.map((point) => point.y);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);

    return {
      left,
      top,
      width: right - left,
      height: bottom - top
    };
  }
}
