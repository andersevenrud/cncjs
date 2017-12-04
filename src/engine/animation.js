/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
const DEFAULTS = {
  name: null,
  frames: 0,
  offset: 0,
  step: 1,
  loop: false,
  reverse: false,
  sprite: null
};

/**
 * Animation Handler Class
 */
export default class Animation {

  /**
   * @param {Object} options Options
   * @see setOptions
   */
  constructor(options) {
    /**
     * Frame index (offset)
     * @type {Number}
     */
    this.index = 0;

    /**
     * Frame index (absolute)
     * @type {Number}
     */
    this.frame = 0;

    /**
     * Done state
     * @type {Boolean}
     */
    this.done = false;

    /**
     * Options
     * @type {Object}
     */
    this.options = {};

    this.setOptions(options);
  }

  /**
   * Sets animation options
   * @param {Object} options Options
   * @param {String} [options.name] A name
   * @param {Boolean} [options.loop=false] Loop animation
   * @param {Boolean} [options.reverse=fase] Reverse animation
   * @param {Number} [options.step=1] Number of steps each update
   * @param {Number} [options.frames=<auto>] Number of total frames
   * @param {Number} [options.offset=0] Sprite offset
   * @param {Sprite} [options.sprite] The sprite
   * @param {Function} [options.getOffset] Gets a dynamic offset
   * @param {Boolean} [check=true] Don't update if the animation name is the same as current
   */
  setOptions(options, check = true) {
    if ( check && this.name === options.name ) {
      return;
    }

    options = Object.assign({}, DEFAULTS, options);

    this.options = {};

    Object.keys(options)
      .filter(k => typeof DEFAULTS[k] === 'undefined')
      .forEach(k => (this.options[k] = options[k]));

    if ( !options.frames && options.sprite ) {
      options.frames = options.sprite.count;
    }

    this.name = options.name;
    this.loop = options.loop === true;
    this.reverse = options.reverse === true;
    this.step = options.step;
    this.frames = options.frames;
    this.offset = options.offset;
    this.sprite = options.sprite;

    this.reset();
  }

  /**
   * Resets the animation
   */
  reset() {
    this.done = false;
    this.frame = this.getOffset();
    this.index = 0;
  }

  /**
   * Updates the Animation
   */
  update() {
    if ( this.frames < 2 ) {
      this.frame = this.getOffset();
      this.index = 0;
      this.done = true;
      return;
    }

    this.done = this.index >= this.frames;

    if ( this.done ) {
      if ( this.loop ) {
        this.reset();
      } else {
        return;
      }
    }

    const off = this.getOffset();
    if ( this.reverse ) {
      this.frame = off + parseInt(this.frames - this.index - 1, 10);
    } else {
      this.frame = off + parseInt(this.index, 10);
    }

    this.index += this.step;
  }

  /**
   * Renders attached sprite with current animation parameters
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} x X position
   * @param {Number} y Y position
   * @param {Number} [col=0] Column in sprite
   */
  render(target, x, y, col = 0) {
    if ( this.sprite && this.sprite.render ) {
      this.sprite.render(target, x, y, this.frame, col);
    }
  }

  /**
   * Check if animation has ended
   * @return {Boolean}
   */
  isFinished() {
    return this.done;
  }

  /**
   * Set offset
   * @param {Number} offset The offset
   */
  setOffset(offset) {
    this.offset = offset;
  }

  /**
   * Gets the offset of the sprite
   * @return {Number}
   */
  getOffset() {
    if ( typeof this.options.getOffset === 'function' ) {
      return this.options.getOffset(this);
    }
    return this.offset;
  }

  /**
   * Gets animation name
   * @return {String}
   */
  getName() {
    return this.name;
  }

}
