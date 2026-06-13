export class Track {
  constructor(scene, trackData) {
    this.scene = scene;
    this.trackData = trackData;
  }

  draw() {
    const { center, outerRadius, innerRadius } = this.trackData.track;
    const graphics = this.scene.add.graphics();

    graphics.fillStyle(0x1d7f3a, 1);
    graphics.fillRect(0, 0, this.trackData.world.width, this.trackData.world.height);

    graphics.fillStyle(0x57575d, 1);
    graphics.fillEllipse(center.x, center.y, outerRadius.x * 2, outerRadius.y * 2);

    graphics.lineStyle(8, 0xffffff, 1);
    graphics.strokeEllipse(center.x, center.y, outerRadius.x * 2, outerRadius.y * 2);

    graphics.fillStyle(0x1d7f3a, 1);
    graphics.fillEllipse(center.x, center.y, innerRadius.x * 2, innerRadius.y * 2);

    graphics.lineStyle(8, 0xffffff, 1);
    graphics.strokeEllipse(center.x, center.y, innerRadius.x * 2, innerRadius.y * 2);

    this.drawFinishLine(graphics);
  }

  drawFinishLine(graphics) {
    const finishLine = this.trackData.finishLine;
    graphics.fillStyle(0xffffff, 1);
    graphics.fillRect(
      finishLine.x - finishLine.width / 2,
      finishLine.y - finishLine.height / 2,
      finishLine.width,
      finishLine.height
    );

    graphics.fillStyle(0x111111, 1);
    const squareSize = 12;
    for (let x = 0; x < finishLine.width; x += squareSize) {
      for (let y = 0; y < finishLine.height; y += squareSize) {
        if ((x / squareSize + y / squareSize) % 2 === 0) {
          graphics.fillRect(
            finishLine.x - finishLine.width / 2 + x,
            finishLine.y - finishLine.height / 2 + y,
            squareSize,
            squareSize
          );
        }
      }
    }
  }

  isPointOnTrack(x, y) {
    const { center, outerRadius, innerRadius } = this.trackData.track;
    const outerValue = ((x - center.x) ** 2) / (outerRadius.x ** 2) + ((y - center.y) ** 2) / (outerRadius.y ** 2);
    const innerValue = ((x - center.x) ** 2) / (innerRadius.x ** 2) + ((y - center.y) ** 2) / (innerRadius.y ** 2);

    return outerValue <= 1 && innerValue >= 1;
  }
}
