/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

/**
 * GUI Element base class
 */
export default class UIElement {

  /**
   * Construct a new element with the following options
   *
   * Use either a rectangle or dimension/position.
   *
   * @param {Engine} engine Game Engine reference
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
  constructor(engine, options) {
    this.engine = engine;
    this.options = null;
    this.rect = null;
    this.pressed = false;
    this.clicked = false;
    this.hovering = false;
    this.visible = true;
    this.disabled = false;
    this.setOptions(options);

    console.debug('Created UI Element', this);
  }

  /**
   * Sets element options
   * @param {Object} options Options
   */
  setOptions(options) {
    const merged = Object.assign({}, {
      disabled: false,
      visible: true
    }, options);

    this.options = this.options ? Object.assign(this.options, merged) : merged;

    ['visible', 'disabled'].forEach((k) => {
      this[k] = typeof this.options[k] === 'function'
        ? this.options[k]()
        : this.options[k] === true;
    });

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
   * Resets internals
   */
  reset() {
    this.pressed = false;
    this.hovering = false;
    this.clicked = false;
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
   * Trigger event
   * @param {String} name Event name
   * @param {Object} data Event data
   * @param {Boolean} [fire=true] Fires callback
   */
  emit(name, data, fire = true) {
    this[name + 'ed'] = data;
    this['on' + name](data);

    if ( name === 'click' && fire && this.options.cb ) {
      console.debug('Clicked UI element', this);
      this.options.cb();
    }
  }

  /**
   * On hover event
   * @param {Object} pos A mouse position
   */
  onhover(pos) {}

  /**
   * On press event
   * @param {Object} press A mouse press
   */
  onpress(press) {}

  /**
   * On click event
   * @param {Object} click A mouse click
   */
  onclick(click) {}

  _checkIs(k) {
    if ( typeof this.options[k] === 'function' ) {
      return this.options[k]();
    }

    return this[k];
  }

  /**
   * Check if element is disabled
   * @return {Boolean}
   */
  isDisabled() {
    return this._checkIs('disabled');
  }

  /**
   * Check if element is visible
   * @return {Boolean}
   */
  isVisible() {
    return this._checkIs('visible');
  }

}
