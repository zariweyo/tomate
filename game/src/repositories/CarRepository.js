const carModules = import.meta.glob('../data/cars/*.json', {
  eager: true,
  import: 'default'
});

export class CarRepository {
  async getCarById(carId) {
    const carPath = `../data/cars/${carId}.json`;
    const car = carModules[carPath];

    if (!car) {
      throw new Error(`Car not found: ${carId}`);
    }

    return car;
  }
}
