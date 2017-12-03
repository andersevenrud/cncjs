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

    /**
     * Game Engine reference
     * @type {Engine}
     */
    this.engine = engine;

    /**
     * Object Sprite
     * @type {Sprite}
     */
    this.sprite = null;

    /**
     * Current sprite frame
     * @type {Number}
     */
    this.spriteFrame = 0;

    /**
     * Sprite sheet index
     * @type {Number}
     */
    this.spriteSheet = 0;

    /**
     * Sprite name/id
     * @type {String}
     */
    this.spriteId = spriteId;

    /**
     * Sprite color used for debugging
     * @type {String}
     */
    this.spriteColor = '#0000ff';

    /**
     * Sprite has debugging
     * @type {Boolean}
     */
    this.spriteDebug = true;

    /**
     * Sprite animation
     * @type {Animation}
     */
    this.animation = null;

    /**
     * Animations
     * @type {Map}
     */
    this.animations = {};

    /**
     * Object width
     * @type {Number}
     */
    this.width = 0;

    /**
     * Object height
     * @type {Number}
     */
    this.height = 0;

    /**
     * Object x position
     * @type {Number}
     */
    this.x = 0;

    /**
     * Object y position
     * @type {Number}
     */
    this.y = 0;
  }

  /**
   * Loads object data etc.
   */
  load() {
    if ( this.spriteId ) {
      const sprite = Sprite.instance(this.spriteId);
      if ( sprite ) {
        this.sprite = sprite;

        if ( this.width === 0 && this.height === 0 ) {
          this.width = sprite.width;
          this.height = sprite.height;
        }
      }
    }
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
      target.strokeRect(x,
                        y,
                        this.sprite.width, this.sprite.height);

      target.strokeStyle = 'rgba(255, 255, 255, .2)';
      target.strokeRect(x1, y1, (x2 - x1), (y2 - y1));
    }

    if ( this.animation ) {
      this.animation.render(target, x, y, this.spriteSheet);
    } else if ( this.sprite && this.sprite.render ) {
      this.sprite.render(target, x, y, this.spriteFrame, this.spriteSheet);
    } else {
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
   * @param {Boolean} [check=true] Don't update if the animation name is the same as current
   */
  setAnimation(name, options, check = true) {
    const anim = this.animations[name] || {};
    if ( this.animation ) {
      this.animation.setOptions(Object.assign({}, {
        sprite: this.sprite,
        name
      }, anim, options), check);
    }
  }

  /**
   * Gets the position of the object
   * @param {Boolean} [world=false] Use game coordinates
   * @return {Number[]}
   */
  getPosition(world = false) {
    let x = this.x;
    let y = this.y;

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
    const w = this.width;
    const h = this.height;
    const [dx, dy] = this.getRenderOffset();
    const [x, y] = this.getPosition(world);

    const sx = x - dx;
    const sy = y - dy;

    return {
      w, h,
      x: sx,
      y: sy,
      x1: x,
      x2: x + w,
      y1: y,
      y2: y + h
    };
  }

  /**
   * Gets the render offset of our sprite
   * @return {Number[]}
   */
  getRenderOffset() {
    return [0, 0];
  }

}
