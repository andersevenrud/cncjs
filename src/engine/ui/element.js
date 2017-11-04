/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import {collidePoint} from '..//physics';

/**
 * GUI Element base class
 */
export default class UIElement {

  /**
   * Construct a new element with the following options
   *
   * Use either a rectangle or dimension/position.
   *
   * @param {Object} options Element options
   * @param {Boolean} [options.visible] Visibility
   * @param {Number} [options.x1] Left position
   * @param {Number} [options.x2] Rigth position
   * @param {Number} [options.y1] Top position
   * @param {Number} [options.y2] Bottom position
   * @param {Number} [options.x] Left position
   * @param {Number} [options.y] Top position
   * @param {Number} [options.w] Width
   * @param {Number} [options.h] Height
   * @param {Function} [options.cb] A callback function
   */
  constructor(options) {
    this.callback = null;
    this.options = null;
    this.rect = null;
    this.setOptions(options);

    console.debug('Created UI Element', this);
  }

  /**
   * Sets element options
   * @param {Object} options Options
   */
  setOptions(options) {
    const merged = Object.assign({}, {
      visible: true
    }, options);

    this.options = this.options ? Object.assign(this.options, merged) : merged;

    if ( typeof this.options.visible === 'function' ) {
      this.visible = this.options.visible();
    } else {
      this.visible = this.options.visible === true;
    }

    if ( this.options.cb ) {
      this.callback = this.options.cb;
    }

    this.updateRect();
  }

  /**
   * Updates rect according to options
   */
  updateRect() {
    this.x1 = typeof this.options.x1 === 'undefined' ? this.options.x : this.options.x1;
    this.y1 = typeof this.options.y1 === 'undefined' ? this.options.y : this.options.y1;
    this.x2 = typeof this.options.x2 === 'undefined' ? this.x1 + this.options.w : this.options.x2;
    this.y2 = typeof this.options.y2 === 'undefined' ? this.y1 + this.options.h : this.options.y2;
    this.x = typeof this.options.x === 'undefined' ? this.x1 : this.options.x;
    this.y = typeof this.options.y === 'undefined' ? this.y1 : this.options.y;
    this.w = typeof this.options.w === 'undefined' ? this.x2 - this.x1 : this.options.w;
    this.h = typeof this.options.h === 'undefined' ? this.y2 - this.y1 : this.options.h;
  }

  /**
   * Updates element
   */
  update() {
  }

  /**
   * Renders element
   * @param {CanvasRenderingContext2D} target Render context
   * @return {Boolean}
   */
  render(target) {
    return target && this.isVisible() && this.rect;
  }

  /**
   * Checks if a click collides with element
   * @param {Object} click A mouse click
   * @param {Boolean} [emit=true] Emit callback
   * @return {Boolean}
   */
  click(click, emit = true) {
    if ( this.isVisible() && collidePoint(click, this.rect) ) {
      console.info('Clicked UI element', this);

      if ( emit && this.callback ) {
        this.callback();
      }

      return true;
    }

    return false;
  }

  /**
   * Check if element is visible
   * @return {Boolean}
   */
  isVisible() {
    if ( typeof this.options.visible === 'function' ) {
      return this.options.visible();
    }

    return this.visible;
  }

}
