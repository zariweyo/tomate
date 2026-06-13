const STORAGE_KEY = 'tomate-rally-records';

export class LocalRecordRepository {
  getTrackRecords(trackId) {
    return this.getAllRecords()[trackId] ?? {
      bestTotal: null,
      bestSectors: [null, null, null]
    };
  }

  saveRun(trackId, run) {
    const records = this.getAllRecords();
    const trackRecords = records[trackId] ?? {
      bestTotal: null,
      bestSectors: [null, null, null]
    };

    const previous = {
      bestTotal: trackRecords.bestTotal,
      bestSectors: [...trackRecords.bestSectors]
    };

    if (trackRecords.bestTotal === null || run.totalTime < trackRecords.bestTotal) {
      trackRecords.bestTotal = run.totalTime;
    }

    trackRecords.bestSectors = trackRecords.bestSectors.map((bestSector, index) => {
      const sectorTime = run.sectorTimes[index];

      if (sectorTime === null || sectorTime === undefined) {
        return bestSector;
      }

      return bestSector === null || sectorTime < bestSector ? sectorTime : bestSector;
    });

    records[trackId] = trackRecords;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));

    return {
      previous,
      current: trackRecords
    };
  }

  getAllRecords() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) ?? {};
    } catch {
      return {};
    }
  }
}
