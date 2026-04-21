import Phaser from "phaser";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("boot");
  }

  preload() {
    this.load.json("questions", "src/data/questions.json");
  }

  create() {
    this.scene.start("menu");
  }
}
