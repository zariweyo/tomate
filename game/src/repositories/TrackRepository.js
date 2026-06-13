export class TrackRepository {
  async getTrackById(trackId) {
    const response = await fetch(`./src/data/tracks/${trackId}.json`);

    if (!response.ok) {
      throw new Error(`Track not found: ${trackId}`);
    }

    return response.json();
  }
}
