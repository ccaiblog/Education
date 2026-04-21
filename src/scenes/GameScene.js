import Phaser from "phaser";
import { COLORS, GAME_HEIGHT, GAME_WIDTH, PLAYER } from "../gameConfig";
import { QuestionManager } from "../systems/QuestionManager";
import { showLeaderboardOverlay, showQuestionOverlay } from "../ui/quizOverlay";

const names = ["Alex", "Jordan", "Mina", "Ravi", "Lena", "Sora", "Kai", "Noah"];

export class GameScene extends Phaser.Scene {
  constructor() {
    super("game");
  }

  create(data) {
    this.boost = data.warmupBoost;
    this.elapsed = 0;
    this.score = this.boost.scoreBonus;
    this.coins = 0;
    this.combo = 0;
    this.maxCombo = 0;
    this.hearts = 3 + this.boost.bonusHearts;
    this.speedMultiplier = 1;
    this.shielded = this.boost.startingShield;
    this.magnetUntil = 0;
    this.speedUntil = 0;
    this.nextCheckpointAt = Phaser.Math.Between(120000, 180000);
    this.checkpointPending = false;
    this.lastPassedRank = 999;

    this.physics.world.setBounds(0, 0, Number.MAX_SAFE_INTEGER, GAME_HEIGHT);

    this.createTextures();
    this.createBackground();
    this.createTrack();
    this.createPlayer();
    this.createGroups();
    this.createFx();
    this.createHud();
    this.setupCollisions();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.qManager = new QuestionManager(this);
    this.qManager.init(this.cache.json.get("questions"));

    this.spawnTimers();
    this.seedLeaderboard();
  }

  createTextures() {
    const g = this.add.graphics();
    g.fillStyle(0x5af2ff, 1).fillRoundedRect(0, 0, 62, 84, 12).generateTexture("player", 62, 84).clear();
    g.fillStyle(0xff4d6d, 1).fillTriangle(0, 52, 90, 0, 90, 52).generateTexture("spike", 90, 52).clear();
    g.fillStyle(0x6930c3, 1).fillRoundedRect(0, 0, 90, 90, 10).generateTexture("block", 90, 90).clear();
    g.fillStyle(COLORS.coin, 1).fillCircle(18, 18, 18).lineStyle(3, 0xfff6bf).strokeCircle(18, 18, 16).generateTexture("coin", 36, 36).clear();
    g.fillStyle(COLORS.energy, 1).fillRoundedRect(0, 0, 38, 48, 8).generateTexture("energy", 38, 48).clear();
    g.fillStyle(COLORS.shield, 1).fillCircle(22, 22, 22).generateTexture("shield", 44, 44).clear();
    g.fillStyle(0xffffff, 1).fillCircle(3, 3, 3).generateTexture("particle", 6, 6).clear();
    g.destroy();
  }

  createBackground() {
    this.cameras.main.setBackgroundColor(COLORS.bg);
    this.bgFar = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "particle").setTint(0x111b44).setAlpha(0.25).setOrigin(0);
    this.bgMid = this.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, "particle").setTint(0x142f77).setAlpha(0.25).setOrigin(0);
    this.neonBars = this.add.group();
    for (let i = 0; i < 14; i += 1) {
      const bar = this.add.rectangle(160 + i * 110, Phaser.Math.Between(120, 350), Phaser.Math.Between(24, 80), 4, 0x3a86ff, 0.2);
      this.neonBars.add(bar);
    }
  }

  createTrack() {
    this.ground = this.add.rectangle(GAME_WIDTH / 2, 630, GAME_WIDTH, 180, 0x0f172a).setScrollFactor(0);
    this.add.rectangle(GAME_WIDTH / 2, 547, GAME_WIDTH, 3, 0x40e0ff, 0.8).setScrollFactor(0);
  }

  createPlayer() {
    this.player = this.physics.add.sprite(PLAYER.x, PLAYER.y, "player").setOrigin(0.5, 1);
    this.player.setGravityY(PLAYER.gravity);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(50, 76);
    this.player.body.setOffset(6, 8);
    this.playerJumps = 0;
    this.playerGroundY = 548;
  }

  createGroups() {
    this.obstacles = this.physics.add.group();
    this.collectibles = this.physics.add.group();
    this.powerups = this.physics.add.group();
  }

  createFx() {
    this.dust = this.add.particles(0, 0, "particle", {
      speed: { min: -180, max: -40 },
      scale: { start: 1.2, end: 0 },
      lifespan: 420,
      tint: [0x9be7ff, 0x40e0ff],
      emitting: false,
    });

    this.trail = this.add.particles(0, 0, "particle", {
      speed: { min: -70, max: 70 },
      scale: { start: 1, end: 0 },
      lifespan: 200,
      tint: [0xffe66d, 0xffffff],
      blendMode: "ADD",
      emitting: false,
    });
  }

  createHud() {
    this.hud = this.add.text(24, 18, "", {
      fontFamily: "Inter, sans-serif",
      fontSize: "24px",
      color: "#e6f7ff",
      stroke: "#000000",
      strokeThickness: 4,
    }).setScrollFactor(0);

    this.toast = this.add.text(GAME_WIDTH / 2, 110, "", {
      fontFamily: "Inter, sans-serif",
      fontSize: "30px",
      color: "#ffea00",
      stroke: "#001233",
      strokeThickness: 5,
    }).setOrigin(0.5).setScrollFactor(0).setAlpha(0);
  }

  setupCollisions() {
    this.physics.add.overlap(this.player, this.obstacles, (_, obstacle) => this.hitObstacle(obstacle));
    this.physics.add.overlap(this.player, this.collectibles, (_, item) => this.collectItem(item));
    this.physics.add.overlap(this.player, this.powerups, (_, item) => this.collectPowerup(item));
  }

  spawnTimers() {
    this.time.addEvent({ delay: 1200, callback: this.spawnObstacle, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 900, callback: this.spawnCollectibleLine, callbackScope: this, loop: true });
    this.time.addEvent({ delay: 9500, callback: this.spawnPowerup, callbackScope: this, loop: true });
  }

  spawnObstacle() {
    const speed = this.currentSpeed();
    const typeRoll = Math.random();
    let obstacle;
    if (typeRoll < 0.35) {
      obstacle = this.obstacles.create(GAME_WIDTH + 120, 548, "spike").setOrigin(0.5, 1);
      obstacle.body.setSize(82, 48);
      obstacle.body.setOffset(4, 4);
    } else {
      obstacle = this.obstacles.create(GAME_WIDTH + 120, 548, "block").setOrigin(0.5, 1);
      obstacle.body.setSize(80, 82);
      obstacle.body.setOffset(5, 6);
    }
    obstacle.setImmovable(true);
    obstacle.vx = speed * Phaser.Math.FloatBetween(1.01, 1.18);
  }

  spawnCollectibleLine() {
    const speed = this.currentSpeed();
    const y = Phaser.Math.Between(360, 500);
    for (let i = 0; i < Phaser.Math.Between(2, 5); i += 1) {
      const c = this.collectibles.create(GAME_WIDTH + 80 + i * 46, y - i * 3, "coin");
      c.vx = speed;
    }
    if (Math.random() < 0.3) {
      const energy = this.collectibles.create(GAME_WIDTH + 320, y - 40, "energy");
      energy.isEnergy = true;
      energy.vx = speed * 0.95;
    }
  }

  spawnPowerup() {
    const types = ["shield", "magnet", "speed"];
    const kind = Phaser.Utils.Array.GetRandom(types);
    const item = this.powerups.create(GAME_WIDTH + 140, Phaser.Math.Between(380, 500), "shield");
    item.kind = kind;
    item.setTint(kind === "shield" ? 0x8ecbff : kind === "magnet" ? 0xff70a6 : 0xffd166);
    item.vx = this.currentSpeed() * 1.05;
  }

  currentSpeed() {
    const ramp = Math.min(1 + (this.elapsed / 1000) * 0.02, 2.4);
    const acceleration = PLAYER.baseSpeed * ramp;
    return acceleration * this.speedMultiplier;
  }

  update(_, delta) {
    this.elapsed += delta;
    this.handleMovement();
    this.updateWorld(delta);
    this.updateHud();
    this.maybeTriggerCheckpoint();

    if (this.hearts <= 0) {
      this.gameOver();
    }
  }

  handleMovement() {
    const onGround = this.player.y >= this.playerGroundY;
    if (onGround) {
      this.player.y = this.playerGroundY;
      this.player.body.setVelocityY(0);
      this.playerJumps = 0;
      if (Math.random() < 0.3) {
        this.dust.emitParticleAt(this.player.x - 10, this.player.y - 2, 1);
      }
    }

    if (Phaser.Input.Keyboard.JustDown(this.space) || Phaser.Input.Keyboard.JustDown(this.cursors.up)) {
      if (this.playerJumps < 2) {
        const v = this.playerJumps === 0 ? PLAYER.jumpVelocity : PLAYER.doubleJumpVelocity;
        this.player.setVelocityY(v);
        this.playerJumps += 1;
        this.cameras.main.shake(70, 0.0016);
      }
    }

    if (this.cursors.down.isDown && !onGround) {
      this.player.setVelocityY(PLAYER.gravity * 0.4);
    }

    this.player.rotation = Phaser.Math.Clamp(this.player.body.velocity.y / 2000, -0.2, 0.4);
  }

  updateWorld(delta) {
    const speed = this.currentSpeed();

    this.bgFar.tilePositionX += speed * 0.0009 * delta;
    this.bgMid.tilePositionX += speed * 0.0018 * delta;

    this.neonBars.children.each((bar) => {
      bar.x -= speed * 0.002 * delta;
      if (bar.x < -80) {
        bar.x = GAME_WIDTH + 120;
        bar.y = Phaser.Math.Between(110, 350);
      }
      bar.alpha = 0.15 + Math.sin((this.elapsed + bar.x) * 0.002) * 0.08;
    });

    this.obstacles.children.each((o) => {
      o.x -= (o.vx || speed) * delta / 1000;
      if (o.x < -200) o.destroy();
    });

    this.collectibles.children.each((c) => {
      if (this.magnetUntil > this.elapsed && Phaser.Math.Distance.Between(c.x, c.y, this.player.x, this.player.y) < 250) {
        this.physics.moveTo(c, this.player.x, this.player.y, 560);
      } else {
        c.x -= (c.vx || speed) * delta / 1000;
      }
      if (c.x < -80 || c.y < -100) c.destroy();
    });

    this.powerups.children.each((p) => {
      p.x -= (p.vx || speed) * delta / 1000;
      if (p.x < -80) p.destroy();
    });

    if (this.speedUntil < this.elapsed) {
      this.speedMultiplier = 1;
    }

    this.score += Math.floor((speed * delta) / 155);
  }

  updateHud() {
    this.hud.setText(`Score ${this.score}   Hearts ${this.hearts}   Coins ${this.coins}   Combo x${this.combo}`);
  }

  collectItem(item) {
    item.destroy();
    if (item.isEnergy) {
      this.score += 80 + this.combo * 8;
      this.combo += 2;
      this.showToast("ENERGY +", 0x58ffb0);
    } else {
      this.coins += 1;
      this.score += 25 + this.combo * 3;
      this.combo += 1;
    }
    this.maxCombo = Math.max(this.maxCombo, this.combo);
    this.trail.emitParticleAt(this.player.x + 20, this.player.y - 35, 8);
  }

  collectPowerup(item) {
    const { kind } = item;
    item.destroy();
    if (kind === "shield") {
      this.shielded = true;
      this.showToast("SHIELD READY", 0x8ecbff);
    }
    if (kind === "magnet") {
      this.magnetUntil = this.elapsed + 8000;
      this.showToast("MAGNET 8s", 0xff70a6);
    }
    if (kind === "speed") {
      this.speedMultiplier = 1.35;
      this.speedUntil = this.elapsed + 5000;
      this.showToast("BOOST 5s", 0xffd166);
    }
  }

  hitObstacle(obstacle) {
    obstacle.destroy();
    if (this.shielded) {
      this.shielded = false;
      this.showToast("SHIELD BLOCK", 0x8ecbff);
      this.cameras.main.flash(110, 130, 220, 255);
      return;
    }

    this.hearts -= 1;
    this.combo = 0;
    this.showToast("HIT!", COLORS.danger);
    this.cameras.main.shake(180, 0.007);
    this.player.setTintFill(0xff4d6d);
    this.time.delayedCall(120, () => this.player.clearTint());
  }

  maybeTriggerCheckpoint() {
    if (this.elapsed < this.nextCheckpointAt || this.checkpointPending) return;
    this.checkpointPending = true;

    if (!this.isSafeForCheckpoint()) {
      this.time.delayedCall(1200, () => {
        this.checkpointPending = false;
      });
      return;
    }

    this.pauseAndAskCheckpoint();
  }

  isSafeForCheckpoint() {
    const airborne = this.player.y < this.playerGroundY - 8;
    if (airborne) return false;

    let nearestAhead = Infinity;
    this.obstacles.children.each((o) => {
      if (o.x > this.player.x) nearestAhead = Math.min(nearestAhead, o.x - this.player.x);
    });

    const danger = nearestAhead < 340;
    return !danger;
  }

  pauseAndAskCheckpoint() {
    this.physics.pause();
    this.scene.pause();
    const checkpointQuestions = this.qManager.drawSet(3);

    showQuestionOverlay({
      title: "Checkpoint Boost",
      questions: checkpointQuestions,
      onComplete: ({ correct, total }) => {
        const ratio = correct / total;
        this.score += correct * 150;
        if (ratio >= 0.67) {
          this.speedMultiplier = 1.2;
          this.speedUntil = this.elapsed + 6000;
          this.shielded = true;
          this.showToast("CHECKPOINT BONUS", 0x90f1ef);
        } else if (ratio === 0) {
          this.score = Math.max(0, this.score - 180);
          this.hearts = Math.max(1, this.hearts - 1);
          this.showToast("MINOR PENALTY", 0xff758f);
        }

        this.nextCheckpointAt = this.elapsed + Phaser.Math.Between(120000, 180000);
        this.checkpointPending = false;
        this.physics.resume();
        this.scene.resume();
      },
    });
  }

  showToast(text, color = 0xffea00) {
    this.toast.setColor(`#${color.toString(16).padStart(6, "0")}`);
    this.toast.setText(text);
    this.toast.setAlpha(1);
    this.tweens.add({ targets: this.toast, alpha: 0, y: 84, duration: 900, yoyo: false, onStart: () => this.toast.setY(110) });
  }

  seedLeaderboard() {
    this.board = names.map((name, i) => ({ name, score: 7000 + i * 1400 + Phaser.Math.Between(200, 900) }));
  }

  gameOver() {
    this.physics.pause();
    const all = [...this.board, { name: "YOU", score: this.score }].sort((a, b) => b.score - a.score);
    const rank = all.findIndex((r) => r.name === "YOU") + 1;

    if (rank < this.lastPassedRank) {
      const passed = all[rank]?.name;
      if (passed) this.showToast(`You passed ${passed}!`, 0xaffc41);
      this.lastPassedRank = rank;
    }

    showLeaderboardOverlay(all.slice(0, 8), rank);

    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, 560, 300, 0x010814, 0.92).setStrokeStyle(2, 0x40e0ff);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 80, "Run Complete", {
      fontSize: "46px",
      fontFamily: "Inter, sans-serif",
      color: "#ecfeff",
    }).setOrigin(0.5);
    this.add.text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 5, `Score ${this.score}  •  Max Combo x${this.maxCombo}`, {
      fontSize: "28px",
      fontFamily: "Inter, sans-serif",
      color: "#bde0fe",
    }).setOrigin(0.5);

    const btn = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2 + 85, 220, 62, 0x40e0ff, 0.25)
      .setStrokeStyle(2, 0x40e0ff)
      .setInteractive({ useHandCursor: true });
    this.add.text(btn.x, btn.y, "PLAY AGAIN", { fontSize: "28px", color: "#fff" }).setOrigin(0.5);
    btn.on("pointerdown", () => this.scene.start("menu"));

    this.scene.pause();
  }
}
