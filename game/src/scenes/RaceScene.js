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

  async create() {
    this.isFinished = false;
    this.hasStarted = false;

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
  }

  createHud() {
    this.timeText = this.add.text(24, 22, 'Tiempo 00:00.00', {
      fontFamily: 'Arial',
      fontSize: '22px',
      color: '#ffffff',
      fontStyle: 'bold'
    });

    this.lapText = this.add.text(24, 52, `Vuelta 0/${this.trackData.laps}`, {
      fontFamily: 'Arial',
      fontSize: '20px',
      color: '#ffffff'
    });

    this.messageText = this.add.text(450, 290, 'Pulsa ACELERAR para empezar', {
      fontFamily: 'Arial',
      fontSize: '30px',
      color: '#ffffff',
      fontStyle: 'bold',
      backgroundColor: '#00000099',
      padding: { x: 18, y: 12 }
    }).setOrigin(0.5);
  }

  update(time, delta) {
    if (!this.car || this.isFinished) {
      return;
    }

    const deltaSeconds = delta / 1000;
    const inputState = this.inputSystem.update();

    if (inputState.accelerating && !this.hasStarted) {
      this.hasStarted = true;
      this.timerSystem.start(time);
      this.messageText.setVisible(false);
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
