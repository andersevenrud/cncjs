/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Sprite from './sprite';
import {TILE_SIZE} from './globals';

/**
 * Base Engine Object Class
 */
export default class EngineObject {

  /**
   * @param {Engine} engine Game Engine reference
   * @param {String} [spriteId] Sprite ID
   */
  constructor(engine, spriteId) {
    const sprite = Sprite.getFile(spriteId) || {
      width: TILE_SIZE,
      height: TILE_SIZE,
      count: 0
    };

    this.engine = engine;
    this.sprite = sprite;
    this.spriteId = spriteId;
    this.spriteFrame = 0;
    this.spriteSheet = 0;
    this.spriteColor = '#0000ff';
    this.spriteDebug = true;
    this.tileX = 0;
    this.tileY = 0;
    this.xOffset = 0;
    this.yOffset = 0;
    this.x = 0;
    this.y = 0;
  }

  /**
   * Updates the internal states
   */
  update() {
  }

  /**
   * Draws onto a target
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    const rect = this.getRect(true);
    const {x, y, w, h, x1, y1, x2, y2} = rect;

    if ( this.engine.options.debug && this.spriteDebug ) {
      target.strokeStyle = 'rgba(0, 0, 255, .2)';
      target.strokeRect(x, y, w, h);

      target.strokeStyle = 'rgba(255, 255, 255, .2)';
      target.strokeRect(x1, y1, (x2 - x1), (y2 - y1));
    }

    if ( this.sprite && this.sprite.render ) {
      this.sprite.render(target, x, y, this.spriteFrame, this.spriteSheet);
    } else {
      target.fillStyle = this.spriteColor;
      target.fillRect(x, y, w, h);
      target.fillStyle = '#ffffff';
      target.fillText(this.spriteId, x + 2, y + (TILE_SIZE / 2));
    }
  }

  /**
   * Gets the position of the object
   * @param {Boolean} [world=false] Use game coordinates
   * @return {Number[]}
   */
  getPosition(world = false) {
    let x = this.x - this.xOffset;
    let y = this.y - this.yOffset;

    if ( world ) {
      const {offsetX, offsetY} = this.engine.getOffset();
      x -= offsetX;
      y -= offsetY;
    }

    return [x, y];
  }

  /**
   * Gets the rectangle of the object
   * @param {Boolean} [world=false] Use game coordinates
   * @return {Object}
   */
  getRect(world = false) {
    const w = this.sprite.width;
    const h = this.sprite.height;
    const [x, y] = this.getPosition(world);

    // FIXME!
    const clip = this.sprite.clip;
    const x1 = clip ? x + this.xOffset : x;
    const x2 = clip ? x1 + TILE_SIZE : x1 + w;
    const y1 = clip ? y + this.yOffset : y;
    const y2 = clip ? y1 + TILE_SIZE : y1 + h;

    return {w, h, x, y, x1, x2, y1, y2};
  }

}
