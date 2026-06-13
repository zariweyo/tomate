export class LapSystem {
  constructor(trackData) {
    this.totalLaps = trackData.laps;
    this.currentLap = 0;
    this.nextCheckpointIndex = 0;
    this.checkpoints = trackData.checkpoints;
    this.finishLine = trackData.finishLine;
    this.wasInsideFinishLine = false;
    this.visitedAllCheckpoints = false;
  }

  update(carPosition) {
    const nextCheckpoint = this.checkpoints[this.nextCheckpointIndex];

    if (nextCheckpoint && this.isInsideArea(carPosition, nextCheckpoint)) {
      this.nextCheckpointIndex += 1;
      this.visitedAllCheckpoints = this.nextCheckpointIndex >= this.checkpoints.length;
    }

    const isInsideFinishLine = this.isInsideArea(carPosition, this.finishLine);
    const crossedFinishLine = isInsideFinishLine && !this.wasInsideFinishLine;
    this.wasInsideFinishLine = isInsideFinishLine;

    if (crossedFinishLine && this.visitedAllCheckpoints) {
      this.currentLap += 1;
      this.nextCheckpointIndex = 0;
      this.visitedAllCheckpoints = false;
    }

    return this.currentLap >= this.totalLaps;
  }

  isInsideArea(point, area) {
    const left = area.x - area.width / 2;
    const right = area.x + area.width / 2;
    const top = area.y - area.height / 2;
    const bottom = area.y + area.height / 2;

    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  }
}
