export class CarRepository {
  async getCarById(carId) {
    const response = await fetch(`./src/data/cars/${carId}.json`);

    if (!response.ok) {
      throw new Error(`Car not found: ${carId}`);
    }

    return response.json();
  }
}
