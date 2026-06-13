import f1CarSpriteUrl from '../assets/cars/f1-car.svg?no-inline';
import { TrackRepository } from '../repositories/TrackRepository.js';
import { CarRepository } from '../repositories/CarRepository.js';
import { Track } from '../entities/Track.js';
import { Car } from '../entities/Car.js';
import { InputSystem } from '../systems/InputSystem.js';
import { TimerSystem } from '../systems/TimerSystem.js';
import { gameConfig } from '../config/gameConfig.js';
import { LocalRecordRepository } from '../repositories/LocalRecordRepository.js';

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
    this.velocityHeading = 0;
    this.trackRotation = 0;
    this.steeringAngle = 0;
    this.driftAmount = 0;
    this.dustParticles = [];
    this.dustSpawnTimer = 0;
    this.sectorSplitTimes = [null, null];
    this.sectorTimes = [null, null, null];
    this.nextSectorSplitIndex = 0;

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
    this.velocityHeading = this.carHeading;
    this.trackRotation = this.getAlignedTrackRotation();
    this.car = new Car(this, this.carData, gameConfig.car);
    this.inputSystem = new InputSystem(this);
    this.timerSystem = new TimerSystem();
    this.recordRepository = new LocalRecordRepository();

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

    this.splitsText = this.add.text(24, 100, 'S1 --:--.--  S2 --:--.--  S3 --:--.--', {
      fontFamily: 'Arial',
      fontSize: '16px',
      color: '#f4d35e'
    }).setDepth(20);

    this.messageText = this.add.text(0, 0, 'Pulsa cualquier botón para empezar', {
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

    if (inputState.hasInput && !this.hasStarted) {
      this.hasStarted = true;
      this.timerSystem.start(time);
      this.messageText.setVisible(false);
      this.requestFullscreenOnce();
    }

    this.updateRallyState(deltaSeconds, turnDirection, isOnRoad);
    this.updateTrackProjection();
    this.car.setVisualTurn(Phaser.Math.RadToDeg(this.getCarVisualAngle()));
    this.updateWorldTransform();
    this.updateDust(deltaSeconds);

    if (this.hasStarted) {
      this.timeText.setText(`Tiempo ${this.timerSystem.format(this.timerSystem.getElapsed(time))}`);
      this.sectorText.setText(`Sector ${this.track.getSectorIndex(this.progressDistance)}/3`);
      this.progressText.setText(`Progreso ${Math.floor(this.track.getProgress(this.progressDistance) * 100)}%`);
      this.updateSectorTimes(time);

      if (this.progressDistance >= this.track.totalLength - this.trackData.finishPadding) {
        this.finishRace(time);
      }
    }
  }

  updateRallyState(deltaSeconds, turnDirection, isOnRoad) {
    const acceleration = this.hasStarted ? gameConfig.car.acceleration : 0;
    const friction = isOnRoad ? gameConfig.car.roadFriction : gameConfig.car.offRoadFriction;
    const maxSpeed = isOnRoad ? gameConfig.car.maxSpeed : gameConfig.car.offRoadMaxSpeed;

    this.speed += acceleration * deltaSeconds;
    this.speed *= friction;
    this.speed = Phaser.Math.Clamp(this.speed, 0, maxSpeed);

    this.updateSteeringAngle(deltaSeconds, turnDirection);

    const yawRate = this.speed / gameConfig.steering.wheelBase * Math.tan(this.steeringAngle);
    this.carHeading += yawRate * deltaSeconds;
    this.updateDrift(deltaSeconds, isOnRoad);
    this.updateTrackRotation(deltaSeconds, turnDirection);

    const forwardX = Math.cos(this.velocityHeading);
    const forwardY = Math.sin(this.velocityHeading);
    const sideX = Math.cos(this.carHeading + Math.PI / 2) * Math.sign(this.steeringAngle);
    const sideY = Math.sin(this.carHeading + Math.PI / 2) * Math.sign(this.steeringAngle);
    const slideForce = this.speed * this.driftAmount * gameConfig.drift.slideStrength;

    this.worldPosition.x += (forwardX * this.speed + sideX * slideForce) * deltaSeconds;
    this.worldPosition.y += (forwardY * this.speed + sideY * slideForce) * deltaSeconds;
  }

  updateDrift(deltaSeconds, isOnRoad) {
    if (!gameConfig.drift.enabled) {
      this.driftAmount = 0;
      this.velocityHeading = this.carHeading;
      return;
    }

    const steeringDegrees = Math.abs(Phaser.Math.RadToDeg(this.steeringAngle));
    const wantsToDrift = this.speed >= gameConfig.drift.minimumSpeed
      && steeringDegrees >= gameConfig.drift.minimumSteeringDegrees;
    const targetDrift = wantsToDrift ? Phaser.Math.Clamp(
      (steeringDegrees - gameConfig.drift.minimumSteeringDegrees)
        / Math.max(1, gameConfig.steering.maxSteeringDegrees - gameConfig.drift.minimumSteeringDegrees),
      0,
      1
    ) : 0;
    const recovery = targetDrift > this.driftAmount
      ? gameConfig.drift.slideRecoveryPerSecond
      : gameConfig.drift.gripRecoveryPerSecond;

    this.driftAmount = Phaser.Math.Linear(this.driftAmount, targetDrift, recovery * deltaSeconds);

    if (!isOnRoad) {
      this.driftAmount = Math.max(this.driftAmount, 0.35);
    }

    const headingGrip = Phaser.Math.Linear(8, 1.6, this.driftAmount) * deltaSeconds;
    this.velocityHeading = this.rotateAngleTowards(this.velocityHeading, this.carHeading, headingGrip);
    this.speed *= 1 - this.driftAmount * gameConfig.drift.speedLossPerSecond * deltaSeconds;
  }

  updateSectorTimes(time) {
    while (
      this.nextSectorSplitIndex < this.track.sectorDistances.length
      && this.progressDistance >= this.track.sectorDistances[this.nextSectorSplitIndex]
    ) {
      const elapsed = this.timerSystem.getElapsed(time);
      this.sectorSplitTimes[this.nextSectorSplitIndex] = elapsed;

      if (this.nextSectorSplitIndex === 0) {
        this.sectorTimes[0] = elapsed;
      } else {
        this.sectorTimes[1] = elapsed - this.sectorSplitTimes[0];
      }

      this.nextSectorSplitIndex += 1;
      this.updateSplitsHud();
    }
  }

  updateSplitsHud() {
    this.splitsText.setText(
      this.sectorTimes
        .map((sectorTime, index) => `S${index + 1} ${sectorTime === null ? '--:--.--' : this.timerSystem.format(sectorTime)}`)
        .join('  ')
    );
  }

  updateDust(deltaSeconds) {
    if (!gameConfig.dust.enabled || !this.hasStarted || this.speed < gameConfig.dust.minimumSpeed) {
      this.updateDustParticles(deltaSeconds);
      return;
    }

    this.dustSpawnTimer += deltaSeconds * 1000;

    const dustInterval = gameConfig.dust.spawnEveryMilliseconds / Phaser.Math.Linear(1, gameConfig.drift.dustMultiplier, this.driftAmount);

    while (this.dustSpawnTimer >= dustInterval) {
      this.dustSpawnTimer -= dustInterval;
      this.spawnDustParticle();
    }

    this.updateDustParticles(deltaSeconds);
  }

  spawnDustParticle() {
    const carAngle = this.getCarVisualAngle();
    const rearX = this.carScreenPosition.x - Math.sin(carAngle) * gameConfig.dust.rearOffset;
    const rearY = this.carScreenPosition.y + Math.cos(carAngle) * gameConfig.dust.rearOffset;
    const sideX = Math.cos(carAngle);
    const sideY = Math.sin(carAngle);
    const spread = gameConfig.dust.spread * Phaser.Math.Linear(1, 1.8, this.driftAmount);
    const offset = Phaser.Math.Between(-spread, spread);
    const particle = this.add.circle(
      rearX + sideX * offset,
      rearY + sideY * offset,
      gameConfig.dust.startRadius + Math.random() * 4 + this.driftAmount * 5,
      gameConfig.dust.color,
      Phaser.Math.Linear(0.38, 0.62, this.driftAmount)
    );

    particle.setDepth(6);

    this.dustParticles.push({
      shape: particle,
      driftX: sideX * offset * 0.35,
      driftY: sideY * offset * 0.35 + 20,
      alpha: Phaser.Math.Linear(0.38, 0.62, this.driftAmount)
    });
  }

  updateDustParticles(deltaSeconds) {
    this.dustParticles = this.dustParticles.filter((particle) => {
      particle.alpha -= gameConfig.dust.fadePerSecond * deltaSeconds;

      if (particle.alpha <= 0) {
        particle.shape.destroy();
        return false;
      }

      particle.shape.x += particle.driftX * deltaSeconds;
      particle.shape.y += particle.driftY * deltaSeconds;
      particle.shape.setRadius(particle.shape.radius + gameConfig.dust.growthPerSecond * deltaSeconds);
      particle.shape.setAlpha(particle.alpha);

      return true;
    });
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
    const totalTime = this.timerSystem.getElapsed(time);
    const finalTime = this.timerSystem.format(totalTime);
    this.updateSectorTimes(time);
    this.sectorTimes[2] = totalTime - (this.sectorSplitTimes[1] ?? this.sectorSplitTimes[0] ?? 0);
    this.updateSplitsHud();

    const result = this.recordRepository.saveRun(this.trackData.id, {
      totalTime,
      sectorTimes: this.sectorTimes
    });

    this.messageText
      .setText(this.createFinishSummary(finalTime, totalTime, result))
      .setFontSize(22)
      .setVisible(true)
      .setInteractive({ useHandCursor: true })
      .once('pointerdown', () => this.scene.restart());
  }

  createFinishSummary(finalTime, totalTime, result) {
    const previousTotal = result.previous.bestTotal;
    const totalRecordText = previousTotal === null || totalTime < previousTotal
      ? 'Record total nuevo'
      : `Record total ${this.timerSystem.format(previousTotal)}`;
    const sectorLines = this.sectorTimes.map((sectorTime, index) => {
      const previousSector = result.previous.bestSectors[index];
      const recordText = previousSector === null || sectorTime < previousSector
        ? 'record'
        : `rec ${this.timerSystem.format(previousSector)}`;

      return `S${index + 1} ${this.timerSystem.format(sectorTime)} (${recordText})`;
    });

    return [
      `Final ${finalTime}`,
      totalRecordText,
      ...sectorLines,
      'Pulsa para reiniciar'
    ].join('\n');
  }
}
