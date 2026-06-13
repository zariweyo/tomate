const trackModules = import.meta.glob('../data/tracks/*.json', {
  eager: true,
  import: 'default'
});

export class TrackRepository {
  async getTrackById(trackId) {
    const trackPath = `../data/tracks/${trackId}.json`;
    const track = trackModules[trackPath];

    if (!track) {
      throw new Error(`Track not found: ${trackId}`);
    }

    return track;
  }
}
