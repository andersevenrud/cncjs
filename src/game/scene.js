/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Scene from '../engine/scene';
import Sprite from '../engine/sprite';
import {CURSOR_SPRITES} from './globals';

/**
 * Base Game Scene class
 */
export default class GameScene extends Scene {

  /**
   * @param {Engine} engine Game Engine reference
   * @param {Object} options Options
   */
  constructor(engine, options) {
    super(engine, options);

    this.cursorName = 'default';
    this.loaded = false;
    this.mouse = {
      sprite: null,
      left: 0,
      top: 0,
      index: 0,
      offset: 0,
      timer: 0
    };
  }

  /**
   * Loads the Scene
   * @param {String[]} [additional] Additional sprites to load
   */
  async load(additional = []) {
    const list = [
      'btexture',
      'mouse'
    ].concat(additional);

    await super.load(list);

    this.mouse.sprite = Sprite.getFile('mouse');
  }

  /**
   * Updates the Scene
   */
  update() {
    // Keyboard
    const kbd = this.engine.keyboard;
    if ( kbd.keyClicked('F2') ) {
      this.engine.toggleDebug();
    } else if ( kbd.keyClicked('F5') ) {
      this.engine.setScale((Math.round(this.engine.getScale() + 1) % 4) || 1);
    } else if ( kbd.keyClicked('F6') ) {
      this.engine.sounds.toggleSound();
    } else if ( kbd.keyClicked('F7') ) {
      this.engine.sounds.toggleMusic();
    }

    // Sprites
    const found = CURSOR_SPRITES[this.cursorName];
    let spriteOffset = typeof found === 'number' ? found : found[0];
    let spriteCount = typeof found === 'number' ? 0 : found[1];
    let spriteIndex = spriteCount ? this.mouse.index : 0;

    if ( spriteCount && this.mouse.timer === 0 ) {
      spriteIndex = (spriteIndex + 1) % spriteCount;
    }

    // Mouse
    this.mouse.index = spriteIndex;
    this.mouse.offset = spriteOffset;
    this.mouse.left = this.cursorName === 'default' ? 0 : this.mouse.sprite.width / 2;
    this.mouse.top = this.cursorName === 'default' ? 0 : this.mouse.sprite.height / 2;
    this.mouse.timer = (this.mouse.timer + 1) % 4;
  }

  /**
   * Draws the Scene
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    // Mouse
    if ( this.mouse.sprite ) {
      const [mouseX, mouseY] = this.engine.mouse.getPosition();
      this.mouse.sprite.render(target,
                               Math.round(mouseX - this.mouse.left),
                               Math.round(mouseY - this.mouse.top),
                               Math.round(this.mouse.index) + this.mouse.offset);
    }

    super.render(...arguments);
  }

}
