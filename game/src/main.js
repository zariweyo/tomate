import Phaser from 'phaser';
import { RaceScene } from './scenes/RaceScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: 900,
  height: 620,
  backgroundColor: '#101014',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [RaceScene]
};

new Phaser.Game(config);
