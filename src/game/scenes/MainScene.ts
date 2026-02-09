import { Scene } from 'phaser';
import { EventBus } from '../EventBus';

export class MainScene extends Scene {
  private horses: Phaser.GameObjects.Container[] = [];
  private finishLineX: number = 0;
  private playerHorseIndex: number = 0;
  private isRacing: boolean = false;
  private finishedHorses: number[] = [];
  private gameWidth: number = 0;
  private gameHeight: number = 0;
  private trackLength: number = 0;
  private tutorialDiv: HTMLDivElement | null = null;
  private raceStartTime: number = 0;
  private horseResults: { id: number; time: number }[] = [];

  constructor() {
    super('MainScene');
  }

  preload() {
    this.load.svg('background', 'assets/bg.svg', { width: 1024, height: 512 });
    this.load.svg('horse_run_0', 'assets/horse_run_0.svg', { width: 128, height: 80 });
    this.load.svg('horse_run_1', 'assets/horse_run_1.svg', { width: 128, height: 80 });
    this.load.svg('horse_run_2', 'assets/horse_run_2.svg', { width: 128, height: 80 });
    this.load.svg('horse_run_3', 'assets/horse_run_3.svg', { width: 128, height: 80 });
  }

  create() {
    // Dynamic dimensions from Scale Manager
    this.gameWidth = this.scale.width;
    this.gameHeight = this.scale.height;
    this.trackLength = this.gameWidth * 4;

    // Reset instance state
    this.isRacing = false;
    this.horses = [];
    this.finishedHorses = [];
    this.horseResults = [];

    // Ensure animations are clean
    if (this.anims.exists('run')) {
      this.anims.remove('run');
    }
    this.anims.create({
      key: 'run',
      frames: [
        { key: 'horse_run_0' },
        { key: 'horse_run_1' },
        { key: 'horse_run_2' },
        { key: 'horse_run_3' },
      ],
      frameRate: 12,
      repeat: -1,
    });

    // Backgrounds - tiling to cover full width
    for (let i = 0; i < 6; i++) {
      this.add
        .image(i * 1024, 0, 'background')
        .setOrigin(0, 0)
        .setDisplaySize(1024, this.gameHeight);
    }

    // Finish Line
    this.finishLineX = this.trackLength - 200;
    const finishLineGroup = this.add.group();

    // Relative start Y for the track (approx 40% down)
    const trackStartY = this.gameHeight * 0.4;
    const trackHeight = this.gameHeight - trackStartY;

    for (let i = trackStartY; i < this.gameHeight; i += 20) {
      for (let j = 0; j < 2; j++) {
        const color = (Math.floor((i - trackStartY) / 20) + j) % 2 === 0 ? 0xffffff : 0x000000;
        finishLineGroup.add(
          this.add.rectangle(this.finishLineX + j * 20, i, 20, 20, color).setOrigin(0, 0),
        );
      }
    }

    // Lanes and Horses
    const laneHeight = trackHeight / 5;
    const startX = 50;
    this.playerHorseIndex = this.registry.get('playerHorseIndex') ?? 0;
    const saddleColors = [0xe74c3c, 0x3498db, 0xf1c40f, 0x2ecc71, 0x9b59b6];

    for (let i = 0; i < 5; i++) {
      const laneY = trackStartY + laneHeight * (i + 0.5);
      const horseContainer = this.add.container(startX, laneY);
      const horseSprite = this.add.sprite(0, 0, 'horse_run_0');

      // Scale horse relative to lane height (approx 80% of lane)
      const targetScale = (laneHeight * 0.8) / 80;
      horseSprite.setScale(targetScale);
      horseSprite.setName('horseSprite');

      const saddle = this.add.rectangle(
        -5,
        -5,
        18 * targetScale,
        12 * targetScale,
        saddleColors[i],
      );
      const numberText = this.add
        .text(-5, -5, (i + 1).toString(), {
          fontSize: `${Math.max(10, 14 * targetScale)}px`,
          color: '#ffffff',
          fontStyle: 'bold',
        })
        .setOrigin(0.5);

      horseContainer.add([horseSprite, saddle, numberText]);
      (horseContainer as any).speed = 0;
      (horseContainer as any).finished = false;
      horseContainer.setDepth(i);
      this.horses.push(horseContainer);

      if (i === this.playerHorseIndex) {
        horseSprite.setInteractive({ useHandCursor: true });
        horseSprite.on('pointerdown', () => this.boostPlayer());

        const tapText = this.add
          .text(0, -laneHeight * 0.5, 'TAP!', {
            fontSize: `${Math.max(14, 18 * targetScale)}px`,
            color: '#ffff00',
            stroke: '#000000',
            strokeThickness: 4,
          })
          .setOrigin(0.5);
        this.tweens.add({ targets: tapText, scale: 1.2, duration: 500, yoyo: true, repeat: -1 });
        horseContainer.add(tapText);
      }
    }

    // Camera
    this.cameras.main.setBounds(0, 0, this.trackLength, this.gameHeight);
    if (this.horses[this.playerHorseIndex]) {
      this.cameras.main.startFollow(this.horses[this.playerHorseIndex], true, 0.1, 0.1);
    }

    // Notify React
    EventBus.emit('current-scene-ready', this);

    // Start race
    const startHandler = () => {
      this.isRacing = true;
      this.raceStartTime = this.time.now;
      if (this.horses && this.horses.length > 0) {
        this.horses.forEach(h => {
          const s = h.getByName('horseSprite') as Phaser.GameObjects.Sprite;
          if (s && s.play) s.play('run');
        });
      }
      if (this.tutorialDiv) {
        this.tutorialDiv.remove();
        this.tutorialDiv = null;
      }
    };
    EventBus.on('start-race', startHandler);

    this.events.once('shutdown', () => {
      if (this.tutorialDiv) {
        this.tutorialDiv.remove();
        this.tutorialDiv = null;
      }
      EventBus.removeListener('start-race', startHandler);
    });

    // Handle Window Resize dynamically
    this.scale.on('resize', (gameSize: Phaser.Structs.Size) => {
      this.gameWidth = gameSize.width;
      this.gameHeight = gameSize.height;
      // In a real RESIZE app you'd reposition everything here,
      // but for now we re-create or just let the user reload.
    });

    const old = document.getElementById('tutorial-target');
    if (old) old.remove();

    this.tutorialDiv = document.createElement('div');
    this.tutorialDiv.id = 'tutorial-target';
    this.tutorialDiv.style.position = 'absolute';
    this.tutorialDiv.style.width = '100px';
    this.tutorialDiv.style.height = '60px';
    this.tutorialDiv.style.pointerEvents = 'none';
    document.body.appendChild(this.tutorialDiv);
  }

  boostPlayer() {
    if (!this.isRacing || this.finishedHorses.includes(this.playerHorseIndex)) return;
    const playerHorse = this.horses[this.playerHorseIndex] as any;
    if (!playerHorse) return;
    playerHorse.speed += 1.7;
    if (playerHorse.speed > 11) playerHorse.speed = 11;
    const burst = this.add.circle(playerHorse.x, playerHorse.y, 30, 0xffff00, 0.5);
    this.tweens.add({
      targets: burst,
      scale: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => burst.destroy(),
    });
  }

  update(_time: number, delta: number) {
    if (this.tutorialDiv && this.horses[this.playerHorseIndex]) {
      const horse = this.horses[this.playerHorseIndex];
      const canvasBounds = this.scale.canvasBounds;
      const cam = this.cameras.main;
      if (horse && canvasBounds && cam) {
        const relX = (horse.x - cam.worldView.x) * cam.zoom;
        const relY = (horse.y - cam.worldView.y) * cam.zoom;
        const scaleX = canvasBounds.width / cam.width;
        const scaleY = canvasBounds.height / cam.height;
        this.tutorialDiv.style.left = `${canvasBounds.x + relX * scaleX - 50 * scaleX}px`;
        this.tutorialDiv.style.top = `${canvasBounds.y + relY * scaleY - 30 * scaleY}px`;
        this.tutorialDiv.style.width = `${100 * scaleX}px`;
        this.tutorialDiv.style.height = `${60 * scaleY}px`;
      }
    }

    if (!this.isRacing) return;

    let allFinished = true;
    this.horses.forEach((horseContainer, index) => {
      const horse = horseContainer as any;
      if (!horse || horse.finished) {
        if (horse && horse.finished) {
          const sprite = horseContainer.getByName('horseSprite') as Phaser.GameObjects.Sprite;
          if (sprite && sprite.anims && sprite.anims.isPlaying) sprite.stop();
        }
        return;
      }

      if (index !== this.playerHorseIndex) {
        if (Math.random() < 0.015) {
          horse.speed = Math.random() * 3 + 3;
        }
      } else {
        horse.speed *= 0.99;
        if (horse.speed < 2) horse.speed = 2;
      }

      horseContainer.x += horse.speed * (delta / 16);
      const sprite = horseContainer.getByName('horseSprite') as Phaser.GameObjects.Sprite;
      if (sprite && sprite.anims) sprite.anims.timeScale = horse.speed / 5;

      if (Math.random() < 0.3 && horse.speed > 2) {
        const dust = this.add.circle(
          horseContainer.x - 20,
          horseContainer.y + 20,
          Math.random() * 5 + 2,
          0x8b4513,
          0.5,
        );
        this.tweens.add({
          targets: dust,
          x: dust.x - 50,
          y: dust.y - 20,
          alpha: 0,
          scale: 2,
          duration: 500,
          onComplete: () => dust.destroy(),
        });
      }

      if (horseContainer.x >= this.finishLineX) {
        horse.finished = true;
        this.finishedHorses.push(index);
        const finishTime = this.time.now - this.raceStartTime;
        this.horseResults.push({ id: index, time: finishTime });
      } else {
        allFinished = false;
      }
    });

    if (allFinished) {
      this.isRacing = false;
      this.horseResults.sort((a, b) => a.time - b.time);
      const playerRank = this.horseResults.findIndex(h => h.id === this.playerHorseIndex) + 1;
      EventBus.emit('game-over', { rank: playerRank, results: this.horseResults });
    }
  }
}
