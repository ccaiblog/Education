import Phaser from "phaser";
export class QuestionManager {
  constructor(scene) {
    this.scene = scene;
    this.pool = { math: [], science: [] };
  }

  init(data) {
    this.pool = data;
  }

  drawSet(size = 3) {
    const categories = ["math", "science"];
    const out = [];
    for (let i = 0; i < size; i += 1) {
      const category = categories[i % categories.length];
      const source = this.pool[category];
      out.push(source[Phaser.Math.Between(0, source.length - 1)]);
    }
    return Phaser.Utils.Array.Shuffle(out);
  }

  drawWarmupSet() {
    const all = [...this.pool.math, ...this.pool.science];
    return Phaser.Utils.Array.Shuffle(all).slice(0, 10);
  }
}
