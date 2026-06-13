export class Car {
  constructor(scene, carData, startPosition) {
    this.scene = scene;
    this.carData = carData;
    this.speed = 0;
    this.rotationDegrees = startPosition.angle;

    this.sprite = scene.add.image(startPosition.x, startPosition.y, carData.spriteKey);
    this.sprite.setDisplaySize(carData.width, carData.height);
    this.sprite.setRotation(Phaser.Math.DegToRad(this.rotationDegrees));
  }

  update(deltaSeconds, inputState, isOnTrack) {
    if (inputState.accelerating) {
      this.speed += this.carData.acceleration * deltaSeconds;
    }

    const friction = isOnTrack ? this.carData.friction : this.carData.offTrackFriction;
    const currentMaxSpeed = isOnTrack ? this.carData.maxSpeed : this.carData.offTrackMaxSpeed;

    this.speed *= friction;
    this.speed = Phaser.Math.Clamp(this.speed, 0, currentMaxSpeed);

    if (this.speed > 8) {
      if (inputState.turningLeft) {
        this.rotationDegrees -= this.carData.turnSpeed * deltaSeconds;
      }

      if (inputState.turningRight) {
        this.rotationDegrees += this.carData.turnSpeed * deltaSeconds;
      }
    }

    const rotationRadians = Phaser.Math.DegToRad(this.rotationDegrees - 90);
    this.sprite.x += Math.cos(rotationRadians) * this.speed * deltaSeconds;
    this.sprite.y += Math.sin(rotationRadians) * this.speed * deltaSeconds;
    this.sprite.setRotation(Phaser.Math.DegToRad(this.rotationDegrees));
  }

  getPosition() {
    return {
      x: this.sprite.x,
      y: this.sprite.y
    };
  }
}
