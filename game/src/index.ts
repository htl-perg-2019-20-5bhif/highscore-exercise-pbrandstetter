import { Scene, Types, CANVAS, Game, Physics, Input, GameObjects } from 'phaser';
import { Spaceship, Direction } from './spaceship';
import { Bullet } from './bullet';
import { Meteor } from './meteor';
import http from 'http';

class HighScore {
  points: number;
  initials: string;
}

/**
 * Space shooter scene
 * 
 * Learn more about Phaser scenes at 
 * https://photonstorm.github.io/phaser3-docs/Phaser.Scenes.Systems.html.
 */
class ShooterScene extends Scene {
  private options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/highscores',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'Access-Control-Allow-Origin': '*'
    }
  }

  private highscores: HighScore[] = [];

  private spaceShip: Spaceship;
  private meteors: Physics.Arcade.Group;
  private bullets: Physics.Arcade.Group;
  private points: GameObjects.Text;

  private bulletTime = 0;
  private meteorTime = 0;

  private cursors: Types.Input.Keyboard.CursorKeys;
  private spaceKey: Input.Keyboard.Key;
  private isGameOver = false;
  private hits = 0;

  preload() {
    // Preload images so that we can use them in our game
    this.load.image('space', 'images/deep-space.jpg');
    this.load.image('bullet', 'images/scratch-laser.png');
    this.load.image('ship', 'images/scratch-spaceship.png');
    this.load.image('meteor', 'images/scratch-meteor.png');
  }

  create() {
    if (this.isGameOver) {
      return;
    }

    //  Add a background
    this.add.tileSprite(0, 0, this.game.canvas.width, this.game.canvas.height, 'space').setOrigin(0, 0);

    this.points = this.add.text(this.game.canvas.width * 0.1, this.game.canvas.height * 0.1, "0",
      { font: "32px Arial", fill: "#ff0044", align: "left" });

    // Create bullets and meteors
    this.bullets = this.physics.add.group({
      classType: Bullet,
      maxSize: 10,
      runChildUpdate: true
    });
    this.meteors = this.physics.add.group({
      classType: Meteor,
      maxSize: 20,
      runChildUpdate: true
    });

    // Add the sprite for our space ship.
    this.spaceShip = new Spaceship(this);
    this.physics.add.existing(this.children.add(this.spaceShip));

    // Position the spaceship horizontally in the middle of the screen
    // and vertically at the bottom of the screen.
    this.spaceShip.setPosition(this.game.canvas.width / 2, this.game.canvas.height * 0.9);

    // Setup game input handling
    this.cursors = this.input.keyboard.createCursorKeys();
    this.input.keyboard.addCapture([' ']);
    this.spaceKey = this.input.keyboard.addKey(Input.Keyboard.KeyCodes.SPACE);

    this.physics.add.collider(this.bullets, this.meteors, (bullet: Bullet, meteor: Meteor) => {
      if (meteor.active && bullet.active) {
        this.points.setText((++this.hits).toString())
        meteor.kill();
        bullet.kill();
      }
    }, null, this);
    this.physics.add.collider(this.spaceShip, this.meteors, this.gameOver, null, this);
  }

  update(_, delta: number) {
    // Move ship if cursor keys are pressed
    if (this.cursors.left.isDown) {
      this.spaceShip.move(delta, Direction.Left);
    }
    else if (this.cursors.right.isDown) {
      this.spaceShip.move(delta, Direction.Right);
    }

    if (this.spaceKey.isDown) {
      this.fireBullet();
    }

    this.handleMeteors();
  }

  fireBullet() {
    if (this.time.now > this.bulletTime && !this.isGameOver) {
      // Find the first unused (=unfired) bullet
      const bullet = this.bullets.get() as Bullet;
      if (bullet) {
        bullet.fire(this.spaceShip.x, this.spaceShip.y);
        this.bulletTime = this.time.now + 100;
      }
    }
  }

  handleMeteors() {
    // Check if it is time to launch a new meteor.
    if (this.time.now > this.meteorTime && !this.isGameOver) {
      // Find first meteor that is currently not used
      const meteor = this.meteors.get() as Meteor;
      if (meteor) {
        meteor.fall();
        this.meteorTime = this.time.now + 500 + 1000 * Math.random();
      }
    }
  }

  async gameOver() {
    this.physics.destroy();
    this.isGameOver = true;

    this.bullets.getChildren().forEach((b: Bullet) => b.kill());
    this.meteors.getChildren().forEach((m: Meteor) => m.kill());
    this.spaceShip.kill();

    this.points.destroy();

    // Display "game over" text
    this.points.destroy();
    const textGameOver = this.add.text(this.game.canvas.width * 0.5, this.game.canvas.height * 0.2, "Game Over :-(",
      { font: "65px Arial", fill: "#ff0044", align: "center" });
    textGameOver.setOrigin(0.5, 0.5);

    // Display HighScore List and input field
    this.showHighscore()
  }

  async showHighscore() {
    const data = await this.getHigscore();

    this.highscores = JSON.parse(data);
    this.highscores = this.highscores.sort((a, b) => b.points - a.points);

    const textPoints = this.add.text(this.game.canvas.width * 0.5, this.game.canvas.height * 0.4, "You got " + this.hits,
      { font: "30px Arial", fill: "#ff0044", align: "center" }).setOrigin(0.5, 0.5);

    this.hits === 1 ? textPoints.setText(textPoints.text + " Point") : textPoints.setText(textPoints.text + " Points");

    this.add.text(this.game.canvas.width * 0.5, this.game.canvas.height * 0.9, "Type your initials and press ENTER",
      { font: "26px Arial", fill: "#ff0044", align: "center" }).setOrigin(0.5, 0.5);

    let myPlace = 0;

    console.log(this.highscores);

    let i = 0;
    for (let plc = 1; plc < 6 && i < this.highscores.length; plc++) {
      console.log(i + "|" + plc);
      if (this.hits > this.highscores[i].points && myPlace < 1) {
        myPlace = plc;
      } else {
        this.add.text(this.game.canvas.width * 0.3, this.game.canvas.height * 0.5 + 40 * plc, plc + '',
          { font: "30px Arial", fill: "#ff0044", align: "center" });
        this.add.text(this.game.canvas.width * 0.5, this.game.canvas.height * 0.5 + 40 * plc, this.highscores[i].points + '',
          { font: "30px Arial", fill: "#ff0044", align: "center" });
        this.add.text(this.game.canvas.width * 0.7, this.game.canvas.height * 0.5 + 40 * plc, this.highscores[i].initials,
          { font: "30px Arial", fill: "#ff0044", align: "center" });
        i++;
      }
    }

    const blinker: NodeJS.Timeout[] = [];

    blinker.push(
      this.blinkingText(
        this.add.text(this.game.canvas.width * 0.3, this.game.canvas.height * 0.5 + 40 * myPlace, myPlace + '',
          { font: "30px Arial", fill: "#ff0044", align: "center" })));
    blinker.push(
      this.blinkingText(this.add.text(this.game.canvas.width * 0.5, this.game.canvas.height * 0.5 + 40 * myPlace, this.hits + '',
        { font: "30px Arial", fill: "#ff0044", align: "center" })));

    // Field to type the Initials
    let inputInitials: GameObjects.Text;
    blinker.push(
      this.blinkingText(inputInitials = this.add.text(this.game.canvas.width * 0.7, this.game.canvas.height * 0.5 + 40 * myPlace, '',
        { font: "30px Arial", fill: "#ff0044", align: "center" })));

    // Key-Listener
    document.addEventListener('keydown', ev => {
      // Prevent Browser default Shortcuts (e.q. Backspace for redirecting back)
      ev.preventDefault();
      if (ev.key == 'Enter' && inputInitials.text.length == 3) {
        // Enter saves new Highscore
        this.postHighscore(inputInitials.text);
        // stop blinking to indicate success
        blinker.forEach(el => {
          clearTimeout(el);
        });
      } else if (ev.key == 'Backspace') {
        // Backspace deletes current input
        inputInitials.setText('');
      } else if (ev.key.length == 1 && inputInitials.text.length < 3) {
        // sets initials
        if (ev.key.charAt(0) >= 'a' && ev.key.charAt(0) <= 'z') {
          inputInitials.setText(inputInitials.text + ev.key.toUpperCase());
        }
      }
    });
  }

  blinkingText(object: GameObjects.Text) {
    let cursor = true;
    const speed = 250;
    return setInterval(() => {
      if (cursor) {
        object.setStyle({ color: '#ffffff' });
        cursor = false;
      } else {
        object.setStyle({ color: '#ff0044' });
        cursor = true;
      }
    }, speed);
  }

  getHigscore() {
    this.options.method = 'GET';
    return new Promise<string>((resolve, reject) => {
      http.get(this.options, (res) => {
        res.on('data', d => {
          resolve(d);
        });
        res.on('error', (error) => {
          reject(error);
        });
      });
    });
  }

  postHighscore(initials: string) {
    const data = JSON.stringify({
      points: this.hits,
      initials: initials
    });

    this.options.method = 'POST';
    this.options.headers['Content-Length'] = data.length;

    const req = http.request(this.options, (res) => {
      console.log(`statusCode: ${res.statusCode}`);
    });

    req.on('error', (error) => {
      console.error(error);
    });

    req.write(data);
    req.end();
  }
}

const size = window.innerWidth < window.innerHeight ? window.innerWidth - 50 : window.innerHeight - 50;

const config = {
  type: CANVAS,
  width: size,
  height: size,
  scene: [ShooterScene],
  physics: { default: 'arcade' },
  audio: { noAudio: false }
};

new Game(config);
