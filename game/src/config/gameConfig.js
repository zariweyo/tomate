export const gameConfig = {
  car: {
    maxSpeed: 715,
    offRoadMaxSpeed: 370,
    acceleration: 210,
    roadFriction: 0.99,
    offRoadFriction: 0.9,
    rearAxleOriginY: 0.78,
    visualTurnDegrees: 30,
    visualTurnSmoothing: 0.78
  },
  steering: {
    maxSteeringDegrees: 35,
    steeringDegreesPerSecond: 75,
    steeringReturnDegreesPerSecond: 110,
    wheelBase: 76,
    trackFollowDegreesPerSecond: 180,
    trackReturnDegreesPerSecond: 45
  },
  camera: {
    carVerticalPosition: 0.75,
    messageVerticalPosition: 0.42
  },
  dust: {
    enabled: true,
    spawnEveryMilliseconds: 38,
    minimumSpeed: 45,
    rearOffset: 34,
    spread: 18,
    startRadius: 6,
    growthPerSecond: 28,
    fadePerSecond: 1.7,
    color: 0xc8a66a
  }
};
