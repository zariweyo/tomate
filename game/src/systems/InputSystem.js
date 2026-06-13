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
    this.layoutControls();

    this.scene.scale.on('resize', () => this.layoutControls());
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
    this.accelerateButton = this.createButton('▲', 86, true);
    this.leftButton = this.createButton('←', 74, false);
    this.rightButton = this.createButton('→', 74, false);

    this.bindButton(this.accelerateButton, 'accelerating');
    this.bindButton(this.leftButton, 'turningLeft');
    this.bindButton(this.rightButton, 'turningRight');
  }

  createButton(label, size, isPrimary) {
    const button = this.scene.add.container(0, 0);
    const background = this.scene.add.circle(0, 0, size / 2, isPrimary ? 0xb22222 : 0x24242c, 0.9).setStrokeStyle(4, 0xffffff, 0.95);
    const text = this.scene.add.text(0, -2, label, {
      fontFamily: 'Arial',
      fontSize: isPrimary ? '42px' : '38px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    button.add([background, text]);
    button.setSize(size, size);
    button.setInteractive({ useHandCursor: true });
    button.setDepth(10);

    return button;
  }

  layoutControls() {
    const width = this.scene.scale.width;
    const height = this.scene.scale.height;
    const bottom = height - 72;

    this.accelerateButton.setPosition(86, bottom);
    this.leftButton.setPosition(width - 158, bottom);
    this.rightButton.setPosition(width - 68, bottom);
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

    button.on('pointerupoutside', () => {
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
