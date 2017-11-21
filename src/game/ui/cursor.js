/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Sprite from '../../engine/sprite';
import {CURSOR_SPRITES} from '../globals';

/**
 * Game Cursor Class
 */
export default class Cursor {

  /**
   * @param {Engine} engine Game Engine reference
   */
  constructor(engine) {
    this.engine = engine;
    this.cursorName = 'default';
    this.sprite = null;
    this.left = 0;
    this.top = 0;
    this.index = 0;
    this.offset = 0;
    this.timer = 0;
  }

  /**
   * Loads the cursor
   */
  async load() {
    this.sprite = Sprite.instance('mouse');
  }

  /**
   * Updates the cursor
   */
  update() {
    if ( !this.sprite ) {
      return;
    }

    let found = CURSOR_SPRITES[this.cursorName];
    if ( typeof found === 'undefined' ) {
      console.warn('Invalid cursor', this.cursorName);
      found = CURSOR_SPRITES.default;
    }

    const spriteOffset = found.index || 0;
    const spriteCount = found.count || 1;
    const offsetX = typeof found.offsetX === 'undefined'
      ? this.sprite.width / 2 : this.sprite.width * found.offsetX;
    const offsetY = typeof found.offsetY === 'undefined'
      ? this.sprite.height / 2 : this.sprite.height * found.offsetY;

    let spriteIndex = spriteCount ? this.index : 0;
    if ( spriteCount && this.timer === 0 ) {
      spriteIndex = (spriteIndex + 1) % spriteCount;
    }

    this.index = spriteIndex;
    this.offset = spriteOffset;
    this.left = offsetX;
    this.top = offsetY;
    this.timer = (this.timer + 1) % 4;
  }

  /**
   * Draws the Cursor
   * @param {CanvasRenderingContext2D} target Render context
   */
  render(target) {
    if ( this.sprite ) {
      const [mouseX, mouseY] = this.engine.mouse.getPosition();
      this.sprite.render(target,
                         Math.round(mouseX - this.left),
                         Math.round(mouseY - this.top),
                         Math.round(this.index) + this.offset);
    }
  }

  setCursor(name) {
    this.cursorName = name;
  }

}
