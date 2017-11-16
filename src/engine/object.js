/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Sprite from './sprite';

/**
 * Base Engine Object Class
 */
export default class EngineObject {

  /**
   * @param {Engine} engine Game Engine reference
   * @param {String} [spriteId] Sprite ID
   */
  constructor(engine, spriteId) {
    this.engine = engine;
    this.sprite = Sprite.instance(spriteId);
    this.spriteFrame = 0;
    this.spriteId = spriteId;
    this.animation = null;
    this.animations = {};
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
    if ( this.animation ) {
      this.animation.update();
    }
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

    if ( this.animation ) {
      this.animation.render(target, x, y, this.spriteSheet);
    } else if ( this.sprite && this.sprite.render ) {
      this.sprite.render(target, x, y, this.spriteFrame, this.spriteSheet);
    } else {
      target.font = '10px Monospace';
      target.fillStyle = this.spriteColor;
      target.fillRect(x, y, w, h);
      target.fillStyle = '#ffffff';
      target.fillText(this.spriteId, x + 2, y + 12);
    }
  }

  /**
   * Sets current animation
   * @param {String} name Animation Name
   * @param {Object} options Animation options
   */
  setAnimation(name, options) {
    const anim = this.animations[name] || {};
    if ( this.animation ) {
      this.animation.setOptions(Object.assign({}, {
        sprite: this.sprite,
        name
      }, anim, options));
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

    return {w, h, x, y,
      x1: x,
      x2: x + w,
      y1: y,
      y2: y + h
    };
  }

}
