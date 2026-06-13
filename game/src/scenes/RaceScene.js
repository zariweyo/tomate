import f1CarSpriteUrl from '../assets/cars/f1-car.svg?no-inline';
import { TrackRepository } from '../repositories/TrackRepository.js';
import { CarRepository } from '../repositories/CarRepository.js';
import { Track } from '../entities/Track.js';
import { Car } from '../entities/Car.js';
import { InputSystem } from '../systems/InputSystem.js';
import { TimerSystem } from '../systems/TimerSystem.js';
import { gameConfig } from '../config/gameConfig.js';

export class RaceScene extends Phaser.Scene {
  constructor() {
    super('RaceScene');
  }

  preload() {
    this.load.svg('basic-f1', f1CarSpriteUrl, { width: 64, height: 128 });
  }

  async create() {
    this.isFinished = false;
    this.hasStarted = false;
    this.hasRequestedFullscreen = false;
    this.progressDistance = 0;
    this.lateralOffset = 0;
    this.speed = 0;
    this.carHeading = 0;
    this.trackRotation = 0;
    this.steeringAngle = 0;

    const trackRepository = new TrackRepository();
    const carRepository = new CarRepository();

    this.trackData = await trackRepository.getTrackById('tomate-gp');
    this.carData = await carRepository.getCarById('basic-f1');

    this.cameras.main.setBackgroundColor('#101014');

    this.worldContainer = this.add.container(0, 0);
    this.track = new Track(this, this.trackData, this.worldContainer);
    this.track.draw();

    this.progressDistance = this.trackData.startDistance;
    this.worldPosition = this.track.getPositionAt(this.progressDistance, 0);
    this.carHeading = this.worldPosition.angle;
    this.trackRotation = this.getAlignedTrackRotation();
    this.car = new Car(this, this.carData, gameConfig.car);
    this.inputSystem = new InputSystem(this);
    this.timerSystem = new TimerSystem();

    this.createHud();
    this.layoutScene();
    this.updateWorldTransform();

    this.scale.on('resize', () => {
      this.layoutScene();
      this.updateWorldTransform();
    });
  }

  createHud() {
    this.timeText = this.add.text(24, 18, 'Tiempo 00:00.00', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setDepth(20);

    this.sectorText = this.add.text(24, 48, 'Sector 1/3', {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    }).setDepth(20);

    this.progressText = this.add.text(24, 74, 'Progreso 0%', {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff'
    }).setDepth(20);

    this.messageText = this.add.text(0, 0, 'Pulsa ▲ para empezar', {
      fontFamily: 'Arial',
      fontSize: '30px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#00000099',
      padding: { x: 18, y: 12 },
      align: 'center'
    }).setOrigin(0.5).setDepth(30);
  }

  layoutScene() {
    const width = this.scale.width;
    const height = this.scale.height;
    this.carScreenPosition = {
      x: width / 2,
      y: height * gameConfig.camera.carVerticalPosition
    };

    this.car.setScreenPosition(this.carScreenPosition.x, this.carScreenPosition.y);
    this.messageText.setPosition(width / 2, height * gameConfig.camera.messageVerticalPosition);
  }

  update(time, delta) {
    if (!this.car || this.isFinished) {
      return;
    }

    const deltaSeconds = delta / 1000;
    const inputState = this.inputSystem.update();
    const turnDirection = Number(inputState.turningRight) - Number(inputState.turningLeft);
    const projectionBeforeMove = this.updateTrackProjection();
    const isOnRoad = this.track.isOnRoad(projectionBeforeMove.lateralOffset);

    if (inputState.accelerating && !this.hasStarted) {
      this.hasStarted = true;
      this.timerSystem.start(time);
      this.messageText.setVisible(false);
      this.requestFullscreenOnce();
    }

    this.updateRallyState(deltaSeconds, inputState, turnDirection, isOnRoad);
    this.updateTrackProjection();
    this.car.setVisualTurn(Phaser.Math.RadToDeg(this.getCarVisualAngle()));
    this.updateWorldTransform();

    if (this.hasStarted) {
      this.timeText.setText(`Tiempo ${this.timerSystem.format(this.timerSystem.getElapsed(time))}`);
      this.sectorText.setText(`Sector ${this.track.getSectorIndex(this.progressDistance)}/3`);
      this.progressText.setText(`Progreso ${Math.floor(this.track.getProgress(this.progressDistance) * 100)}%`);

      if (this.progressDistance >= this.track.totalLength - this.trackData.finishPadding) {
        this.finishRace(time);
      }
    }
  }

  updateRallyState(deltaSeconds, inputState, turnDirection, isOnRoad) {
    const acceleration = inputState.accelerating ? gameConfig.car.acceleration : 0;
    const friction = isOnRoad ? gameConfig.car.roadFriction : gameConfig.car.offRoadFriction;
    const maxSpeed = isOnRoad ? gameConfig.car.maxSpeed : gameConfig.car.offRoadMaxSpeed;

    this.speed += acceleration * deltaSeconds;
    this.speed *= friction;
    this.speed = Phaser.Math.Clamp(this.speed, 0, maxSpeed);

    this.updateSteeringAngle(deltaSeconds, turnDirection);

    const yawRate = this.speed / gameConfig.steering.wheelBase * Math.tan(this.steeringAngle);
    this.carHeading += yawRate * deltaSeconds;
    this.updateTrackRotation(deltaSeconds, turnDirection);

    this.worldPosition.x += Math.cos(this.carHeading) * this.speed * deltaSeconds;
    this.worldPosition.y += Math.sin(this.carHeading) * this.speed * deltaSeconds;
  }

  updateTrackRotation(deltaSeconds, turnDirection) {
    const visualTurnThreshold = Phaser.Math.DegToRad(gameConfig.car.visualTurnDegrees);
    const visualAngle = this.getCarVisualAngle();
    let targetVisualAngle = 0;

    if (turnDirection !== 0) {
      if (Math.abs(visualAngle) <= visualTurnThreshold) {
        return;
      }

      targetVisualAngle = Math.sign(visualAngle) * visualTurnThreshold;
    }

    const targetRotation = Phaser.Math.Angle.Wrap(targetVisualAngle - this.carHeading - Math.PI / 2);
    const rotationSpeed = turnDirection === 0
      ? gameConfig.steering.trackReturnDegreesPerSecond
      : gameConfig.steering.trackFollowDegreesPerSecond;
    const rotationStep = Phaser.Math.DegToRad(rotationSpeed) * deltaSeconds;
    this.trackRotation = this.rotateAngleTowards(this.trackRotation, targetRotation, rotationStep);
  }

  getAlignedTrackRotation() {
    return Phaser.Math.Angle.Wrap(-Math.PI / 2 - this.carHeading);
  }

  getCarVisualAngle() {
    return Phaser.Math.Angle.Wrap(this.carHeading + this.trackRotation + Math.PI / 2);
  }

  rotateAngleTowards(current, target, maxStep) {
    const difference = Phaser.Math.Angle.Wrap(target - current);

    if (Math.abs(difference) <= maxStep) {
      return target;
    }

    return Phaser.Math.Angle.Wrap(current + Math.sign(difference) * maxStep);
  }

  updateSteeringAngle(deltaSeconds, turnDirection) {
    const maxSteering = Phaser.Math.DegToRad(gameConfig.steering.maxSteeringDegrees);

    if (turnDirection !== 0) {
      const steeringStep = Phaser.Math.DegToRad(gameConfig.steering.steeringDegreesPerSecond) * deltaSeconds;
      this.steeringAngle += turnDirection * steeringStep;
      this.steeringAngle = Phaser.Math.Clamp(this.steeringAngle, -maxSteering, maxSteering);
      return;
    }

    const returnStep = Phaser.Math.DegToRad(gameConfig.steering.steeringReturnDegreesPerSecond) * deltaSeconds;

    if (Math.abs(this.steeringAngle) <= returnStep) {
      this.steeringAngle = 0;
      return;
    }

    this.steeringAngle -= Math.sign(this.steeringAngle) * returnStep;
  }

  updateTrackProjection() {
    const projection = this.track.projectPosition(this.worldPosition);
    this.lateralOffset = projection.lateralOffset;
    this.progressDistance = Math.max(this.progressDistance, projection.distance);

    return projection;
  }

  updateWorldTransform() {
    const rotatedX = this.worldPosition.x * Math.cos(this.trackRotation) - this.worldPosition.y * Math.sin(this.trackRotation);
    const rotatedY = this.worldPosition.x * Math.sin(this.trackRotation) + this.worldPosition.y * Math.cos(this.trackRotation);

    this.worldContainer.setRotation(this.trackRotation);
    this.worldContainer.setPosition(
      this.carScreenPosition.x - rotatedX,
      this.carScreenPosition.y - rotatedY
    );
  }

  requestFullscreenOnce() {
    if (this.hasRequestedFullscreen || this.scale.isFullscreen) {
      return;
    }

    this.hasRequestedFullscreen = true;

    if (this.scale.fullscreen.available) {
      this.scale.startFullscreen();
    }
  }

  finishRace(time) {
    this.isFinished = true;
    this.timerSystem.finish(time);
    const finalTime = this.timerSystem.format(this.timerSystem.getElapsed(time));

    this.messageText
      .setText(`Final: ${finalTime}\nPulsa para reiniciar`)
      .setVisible(true)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', () => this.scene.restart());
  }
}
