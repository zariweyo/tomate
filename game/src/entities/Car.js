export class Car {
  constructor(scene, carData, config) {
    this.scene = scene;
    this.carData = carData;
    this.config = config;
    this.visualTurnDegrees = 0;

    this.sprite = scene.add.image(0, 0, carData.spriteKey);
    const scale = Math.min(carData.width / this.sprite.width, carData.height / this.sprite.height);
    this.sprite.setScale(scale);
    this.sprite.setOrigin(0.5, this.config.rearAxleOriginY);
    this.sprite.setDepth(15);
  }

  setScreenPosition(x, y) {
    this.sprite.setPosition(x, y);
  }

  setVisualTurn(steeringAngleDegrees) {
    this.visualTurnDegrees = Phaser.Math.Linear(
      this.visualTurnDegrees,
      Phaser.Math.Clamp(steeringAngleDegrees, -this.config.visualTurnDegrees, this.config.visualTurnDegrees),
      this.config.visualTurnSmoothing
    );
    this.sprite.setRotation(Phaser.Math.DegToRad(this.visualTurnDegrees));
  }
}
