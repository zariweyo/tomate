export class Car {
  constructor(scene, carData, startPosition) {
    this.scene = scene;
    this.carData = carData;
    this.speed = 0;
    this.rotationDegrees = startPosition.angle;

    this.body = scene.add.container(startPosition.x, startPosition.y);
    this.sprite = scene.add.rectangle(0, 0, carData.width, carData.height, 0xdd2222);
    this.frontWing = scene.add.rectangle(0, -carData.height / 2 + 4, carData.width + 10, 5, 0xffffff);
    this.rearWing = scene.add.rectangle(0, carData.height / 2 - 4, carData.width + 8, 5, 0x111111);
    this.cockpit = scene.add.rectangle(0, -4, carData.width * 0.55, carData.height * 0.32, 0x111111);

    this.body.add([this.sprite, this.frontWing, this.rearWing, this.cockpit]);
    this.body.setRotation(Phaser.Math.DegToRad(this.rotationDegrees));
  }

  update(deltaSeconds, inputState, isOnTrack) {
    if (inputState.accelerating) {
      this.speed += this.carData.acceleration * deltaSeconds;
    }

    const friction = isOnTrack ? this.carData.friction : this.carData.offTrackFriction;
    this.speed *= friction;
    this.speed = Phaser.Math.Clamp(this.speed, 0, this.carData.maxSpeed);

    if (this.speed > 8) {
      if (inputState.turningLeft) {
        this.rotationDegrees -= this.carData.turnSpeed * deltaSeconds;
      }

      if (inputState.turningRight) {
        this.rotationDegrees += this.carData.turnSpeed * deltaSeconds;
      }
    }

    const rotationRadians = Phaser.Math.DegToRad(this.rotationDegrees - 90);
    this.body.x += Math.cos(rotationRadians) * this.speed * deltaSeconds;
    this.body.y += Math.sin(rotationRadians) * this.speed * deltaSeconds;
    this.body.setRotation(Phaser.Math.DegToRad(this.rotationDegrees));
  }

  getPosition() {
    return {
      x: this.body.x,
      y: this.body.y
    };
  }
}
