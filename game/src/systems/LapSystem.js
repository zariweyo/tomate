export class LapSystem {
  constructor(trackData) {
    this.totalLaps = trackData.laps;
    this.currentLap = 0;
    this.nextCheckpointIndex = 0;
    this.checkpoints = trackData.checkpoints;
    this.finishLine = trackData.finishLine;
    this.wasInsideFinishLine = false;
    this.visitedAllCheckpoints = false;
    this.previousPosition = null;
  }

  update(carPosition) {
    const nextCheckpoint = this.checkpoints[this.nextCheckpointIndex];

    if (nextCheckpoint && this.hasReachedArea(carPosition, nextCheckpoint)) {
      this.nextCheckpointIndex += 1;
      this.visitedAllCheckpoints = this.nextCheckpointIndex >= this.checkpoints.length;
    }

    const isInsideFinishLine = this.hasReachedArea(carPosition, this.finishLine);
    const crossedFinishLine = isInsideFinishLine && !this.wasInsideFinishLine;
    this.wasInsideFinishLine = isInsideFinishLine;

    if (crossedFinishLine && this.visitedAllCheckpoints) {
      this.currentLap += 1;
      this.nextCheckpointIndex = 0;
      this.visitedAllCheckpoints = false;
    }

    this.previousPosition = { ...carPosition };

    return this.currentLap >= this.totalLaps;
  }

  hasReachedArea(point, area) {
    return this.isInsideArea(point, area) || (
      this.previousPosition && this.segmentIntersectsArea(this.previousPosition, point, area)
    );
  }

  isInsideArea(point, area) {
    const left = area.x - area.width / 2;
    const right = area.x + area.width / 2;
    const top = area.y - area.height / 2;
    const bottom = area.y + area.height / 2;

    return point.x >= left && point.x <= right && point.y >= top && point.y <= bottom;
  }

  segmentIntersectsArea(start, end, area) {
    const left = area.x - area.width / 2;
    const right = area.x + area.width / 2;
    const top = area.y - area.height / 2;
    const bottom = area.y + area.height / 2;
    const deltaX = end.x - start.x;
    const deltaY = end.y - start.y;
    let tMin = 0;
    let tMax = 1;

    const clip = (direction, distance) => {
      if (direction === 0) {
        return distance >= 0;
      }

      const t = distance / direction;

      if (direction < 0) {
        if (t > tMax) {
          return false;
        }

        tMin = Math.max(tMin, t);
      } else {
        if (t < tMin) {
          return false;
        }

        tMax = Math.min(tMax, t);
      }

      return true;
    };

    return clip(-deltaX, start.x - left)
      && clip(deltaX, right - start.x)
      && clip(-deltaY, start.y - top)
      && clip(deltaY, bottom - start.y);
  }
}
