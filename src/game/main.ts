import { MainScene } from './scenes/MainScene';
import { AUTO, Game } from 'phaser';

const config: Phaser.Types.Core.GameConfig = {
  type: AUTO,
  // Initial size can be standard, FIT will scale it
  width: 960,
  height: 540,
  parent: 'game-container',
  backgroundColor: '#1a1a1a',
  scale: {
    // RESIZE mode allows us to use the full container width/height
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [MainScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
};

const StartGame = (parent: string, playerHorseIndex: number) => {
  const game = new Game({ ...config, parent });

  game.events.once('ready', () => {
    game.registry.set('playerHorseIndex', playerHorseIndex);
  });

  return game;
};

export default StartGame;
