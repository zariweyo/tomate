import Phaser from 'phaser';
import { RaceScene } from './scenes/RaceScene.js';

const config = {
  type: Phaser.AUTO,
  parent: 'game-container',
  width: window.innerWidth,
  height: window.innerHeight,
  backgroundColor: '#101014',
  input: {
    activePointers: 3
  },
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [RaceScene]
};

new Phaser.Game(config);
