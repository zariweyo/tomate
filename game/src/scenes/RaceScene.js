import f1CarSpriteUrl from '../assets/cars/f1-car.svg';
import { TrackRepository } from '../repositories/TrackRepository.js';
import { CarRepository } from '../repositories/CarRepository.js';
import { Track } from '../entities/Track.js';
import { Car } from '../entities/Car.js';
import { InputSystem } from '../systems/InputSystem.js';
import { LapSystem } from '../systems/LapSystem.js';
import { TimerSystem } from '../systems/TimerSystem.js';

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

    const trackRepository = new TrackRepository();
    const carRepository = new CarRepository();

    this.trackData = await trackRepository.getTrackById('tomate-gp');
    this.carData = await carRepository.getCarById('basic-f1');

    this.cameras.main.setBackgroundColor('#101014');

    this.track = new Track(this, this.trackData);
    this.track.draw();

    this.car = new Car(this, this.carData, this.trackData.startPosition);
    this.inputSystem = new InputSystem(this);
    this.lapSystem = new LapSystem(this.trackData);
    this.timerSystem = new TimerSystem();

    this.createHud();
    this.createOrientationOverlay();
  }

  createHud() {
    this.timeText = this.add.text(24, 18, 'Tiempo 00:00.00', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setDepth(20);

    this.lapText = this.add.text(24, 48, `Vuelta 0/${this.trackData.laps}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    }).setDepth(20);

    this.messageText = this.add.text(480, 270, 'Pulsa ▲ para empezar', {
      fontFamily: 'Arial',
      fontSize: '30px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#00000099',
      padding: { x: 18, y: 12 },
      align: 'center'
    }).setOrigin(0.5).setDepth(30);
  }

  createOrientationOverlay() {
    this.orientationOverlay = this.add.rectangle(480, 270, 960, 540, 0x101014, 1).setDepth(100).setVisible(false);
    this.orientationText = this.add.text(480, 270, 'Gira el dispositivo\npara jugar', {
      fontFamily: 'Arial',
      fontSize: '34px',
      color: '#ffffff',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5).setDepth(101).setVisible(false);
  }

  update(time, delta) {
    if (!this.car || this.isFinished) {
      return;
    }

    const isPortrait = window.innerHeight > window.innerWidth;
    this.orientationOverlay.setVisible(isPortrait);
    this.orientationText.setVisible(isPortrait);

    if (isPortrait) {
      return;
    }

    const deltaSeconds = delta / 1000;
    const inputState = this.inputSystem.update();

    if (inputState.accelerating && !this.hasStarted) {
      this.hasStarted = true;
      this.timerSystem.start(time);
      this.messageText.setVisible(false);
      this.requestFullscreenOnce();
    }

    const position = this.car.getPosition();
    const isOnTrack = this.track.isPointOnTrack(position.x, position.y);
    this.car.update(deltaSeconds, inputState, isOnTrack);

    if (this.hasStarted) {
      const finished = this.lapSystem.update(this.car.getPosition());
      this.timeText.setText(`Tiempo ${this.timerSystem.format(this.timerSystem.getElapsed(time))}`);
      this.lapText.setText(`Vuelta ${Math.min(this.lapSystem.currentLap, this.trackData.laps)}/${this.trackData.laps}`);

      if (finished) {
        this.finishRace(time);
      }
    }
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
