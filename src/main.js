import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "./gameConfig";
import { BootScene } from "./scenes/BootScene";
import { MenuScene } from "./scenes/MenuScene";
import { GameScene } from "./scenes/GameScene";

new Phaser.Game({
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  parent: "game",
  scene: [BootScene, MenuScene, GameScene],
  physics: {
    default: "arcade",
    arcade: {
      gravity: { y: 0 },
      debug: false,
    },
  },
  pixelArt: false,
  backgroundColor: "#070c1f",
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
});
