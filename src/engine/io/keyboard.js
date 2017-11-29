/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

const KEYMAP = (function() {
  const list = {
    112: 'F1',
    113: 'F2',
    114: 'F3',
    115: 'F4',
    116: 'F5',
    117: 'F6',
    118: 'F7',

    220: 'TILDE',
    192: 'GRAVE',

    17: 'CMD',
    91: 'LSUPER',
    92: 'RSUPER',

    46: 'DELETE',
    45: 'INSERT',
    36: 'HOME',
    35: 'END',
    34: 'PGDOWN',
    33: 'PGUP',
    19: 'PAUSE',
    19: 'BREAK',
    20: 'CAPS_LOCK',
    186: 'SCROLL_LOCK',

    188: ',',
    190: '.',
    189: '-',

    8: 'BACKSPACE',
    32: 'SPACE',
    9: 'TAB',
    13: 'ENTER',
    27: 'ESC',
    37: 'LEFT',
    39: 'RIGHT',
    38: 'UP',
    40: 'DOWN'
  };

  // Add all ASCII chacters to the map
  for ( let n = 48; n <= 90; n++ ) {
    list[n] = String.fromCharCode(n);
  }

  return Object.freeze(list);
})();

/**
 * Game Keyboard Handling Class
 */
export default class Keyboard {

  /**
   * @param {Engine} engine Game Engine
   * @param {Object} [options] Options
   */
  constructor(engine, options = {}) {

    /**
     * Game Engine reference
     * @type {Engine}
     */
    this.engine = engine;

    /**
     * Keys down map
     * @type {Object}
     */
    this.keysDown = {};

    /**
     * Keys pressed map
     * @type {Object}
     */
    this.keysPressed = {};

    /**
     * Options
     * @type {Object}
     */
    this.options = Object.assign({}, options);

    const events = ['keydown', 'keyup', 'keypress'];
    const callback = (evName) => (ev) => {
      if ( this.engine && this.engine.running ) {
        this[`on${evName}`](ev);
      }
    };

    events.forEach((evName) => window.addEventListener(evName, callback(evName)));

    console.log('Keyboard::constructor()', this.options);
  }

  /**
   * Reset states
   */
  reset() {
    this.update(0);
    this.keysDown = {};
  }

  /**
   * Updates the Keyboard
   */
  update() {
    this.keysPressed = {};
  }

  /**
   * Check if key was clicked
   * @param {String|String[]} [keyName] Key name
   * @param {Boolean} [all=false] Test for keys
   * @return {Boolean}
   */
  keyClicked(keyName, all = false) {
    if ( !(keyName instanceof Array) ) {
      keyName = [keyName];
    }

    return keyName[all ? 'every' : 'some'](n => this.keysPressed[n] === true);
  }

  /**
   * Check if key is pressed
   * @param {String|String[]} [keyName] Key name
   * @param {Boolean} [all=false] Test for keys
   * @return {Boolean}
   */
  keyDown(keyName, all = false) {
    if ( !keyName ) {
      return Object.keys(this.keysDown).length > 0;
    }

    if ( !(keyName instanceof Array) ) {
      keyName = [keyName];
    }

    return keyName[all ? 'every' : 'some'](n => this.keysDown[n] === true);
  }

  /**
   * Gets key name from key code
   * @param {Number} keyCode Key code
   * @return {String}
   */
  getKeyName(keyCode) {
    return KEYMAP[keyCode];
  }

  /**
   * On Key Down
   * @param {Event} ev Browser Event
   */
  onkeydown(ev) {
    const keyCode = ev.keyCode || ev.which;
    const character = String(this.getKeyName(keyCode)).toUpperCase();

    if ( !ev.ctrlKey && keyCode !== 122 ) {
      ev.preventDefault();
    }

    this.keysDown[character] = true;
  }

  /**
   * On Key Up
   * @param {Event} ev Browser Event
   */
  onkeyup(ev) {
    const keyCode = ev.keyCode || ev.which;
    const character = String(this.getKeyName(keyCode)).toUpperCase();

    this.keysPressed = Object.assign({}, this.keysDown);

    if ( this.keysDown[character] ) {
      delete this.keysDown[character];
    }
  }

  /**
   * On Key Press
   * @param {Event} ev Browser Event
   */
  onkeypress(ev) {
  }

}
