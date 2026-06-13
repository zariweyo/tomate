export class InputSystem {
  constructor(scene) {
    this.scene = scene;
    this.touchState = {
      turningLeft: false,
      turningRight: false,
      accelerating: false
    };

    this.createKeyboardControls();
    this.createTouchControls();
  }

  createKeyboardControls() {
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.keys = this.scene.input.keyboard.addKeys({
      left: Phaser.Input.Keyboard.KeyCodes.A,
      right: Phaser.Input.Keyboard.KeyCodes.D,
      accelerate: Phaser.Input.Keyboard.KeyCodes.W
    });
  }

  createTouchControls() {
    const y = 565;
    this.leftButton = this.createButton(230, y, 'IZQ');
    this.accelerateButton = this.createButton(450, y, 'ACELERAR');
    this.rightButton = this.createButton(670, y, 'DER');

    this.bindButton(this.leftButton, 'turningLeft');
    this.bindButton(this.accelerateButton, 'accelerating');
    this.bindButton(this.rightButton, 'turningRight');
  }

  createButton(x, y, label) {
    const button = this.scene.add.container(x, y);
    const background = this.scene.add.rectangle(0, 0, 150, 54, 0xb22222, 0.92).setStrokeStyle(2, 0xffffff);
    const text = this.scene.add.text(0, 0, label, {
      fontFamily: 'Arial',
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    button.add([background, text]);
    button.setSize(150, 54);
    button.setInteractive({ useHandCursor: true });

    return button;
  }

  bindButton(button, stateKey) {
    button.on('pointerdown', () => {
      this.touchState[stateKey] = true;
    });

    button.on('pointerup', () => {
      this.touchState[stateKey] = false;
    });

    button.on('pointerout', () => {
      this.touchState[stateKey] = false;
    });
  }

  update() {
    return {
      turningLeft: this.touchState.turningLeft || this.cursors.left.isDown || this.keys.left.isDown,
      turningRight: this.touchState.turningRight || this.cursors.right.isDown || this.keys.right.isDown,
      accelerating: this.touchState.accelerating || this.cursors.up.isDown || this.keys.accelerate.isDown
    };
  }
}
