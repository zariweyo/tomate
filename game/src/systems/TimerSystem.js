export class TimerSystem {
  constructor() {
    this.startedAt = null;
    this.finishedAt = null;
  }

  start(now) {
    if (this.startedAt === null) {
      this.startedAt = now;
    }
  }

  finish(now) {
    if (this.finishedAt === null) {
      this.finishedAt = now;
    }
  }

  getElapsed(now) {
    if (this.startedAt === null) {
      return 0;
    }

    const endTime = this.finishedAt ?? now;
    return Math.max(0, endTime - this.startedAt);
  }

  format(milliseconds) {
    const totalCentiseconds = Math.floor(milliseconds / 10);
    const centiseconds = totalCentiseconds % 100;
    const totalSeconds = Math.floor(totalCentiseconds / 100);
    const seconds = totalSeconds % 60;
    const minutes = Math.floor(totalSeconds / 60);

    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
  }
}
