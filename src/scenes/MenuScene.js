import Phaser from "phaser";
import { GAME_HEIGHT, GAME_WIDTH } from "../gameConfig";
import { QuestionManager } from "../systems/QuestionManager";
import { showQuestionOverlay } from "../ui/quizOverlay";

export class MenuScene extends Phaser.Scene {
  constructor() {
    super("menu");
  }

  create() {
    this.cameras.main.setBackgroundColor("#070c1f");
    this.add.text(GAME_WIDTH / 2, 170, "STEM SPRINT", {
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "78px",
      fontStyle: "700",
      color: "#e7f5ff",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 260, "A high-speed runner with skill-based STEM boosts", {
      fontFamily: "Inter, sans-serif",
      fontSize: "24px",
      color: "#90e0ef",
    }).setOrigin(0.5);

    const startBtn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 40, 360, 80, 0x40e0ff, 0.2)
      .setStrokeStyle(2, 0x40e0ff)
      .setInteractive({ useHandCursor: true });

    this.add.text(startBtn.x, startBtn.y, "START SPRINT", {
      fontSize: "32px",
      fontFamily: "Inter, sans-serif",
      color: "#ffffff",
    }).setOrigin(0.5);

    this.add.text(GAME_WIDTH / 2, 610, "Controls: SPACE / ↑ to jump (double jump), ↓ to fast-drop", {
      fontFamily: "Inter, sans-serif",
      fontSize: "18px",
      color: "#9bb7d4",
    }).setOrigin(0.5);

    startBtn.on("pointerdown", () => this.launchWarmup());
  }

  launchWarmup() {
    const manager = new QuestionManager(this);
    manager.init(this.cache.json.get("questions"));
    const warmup = manager.drawWarmupSet();

    showQuestionOverlay({
      title: "Pre-Run Warm-up (10 Questions)",
      questions: warmup,
      onComplete: ({ correct, total }) => {
        const accuracy = correct / total;
        const bonusHearts = Math.floor(correct / 4);
        const scoreBonus = correct * 120;
        this.scene.start("game", {
          warmupBoost: {
            scoreBonus,
            bonusHearts,
            startingShield: accuracy >= 0.8,
          },
        });
      },
    });
  }
}
