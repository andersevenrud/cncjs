/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

const MOUSE_LEFT = 1;
const MOUSE_RIGHT = 2;

/**
 * Makes a fake mouse event
 * @param {String} name Event name
 * @param {Object} ev Event data
 * @param {Number} [button=0] Button
 * @return {MouseEvent}
 */
function makeFakeEvent(name, ev, button) {
  const touch = ev.touches || ev.changedTouches || [];
  const pos = touch.length
    ? {x: touch[0].clientX, y: touch[0].clientY}
    : {x: ev.clientX, y: ev.clientY};

  const x = Math.round(pos.x);
  const y = Math.round(pos.y);

  return new MouseEvent(name, Object.assign({
    button: button || MOUSE_LEFT,
    clientX: x,
    clientY: y,
    x, y
  }, ev));
}

/**
 * Game Mouse Handling Class
 */
export default class Mouse {

  /**
   * @param {Engine} engine Game Engine
   */
  constructor(engine) {
    this.engine = engine;

    this.x = 0;
    this.y = 0;
    this.panX = null;
    this.panY = null;
    this.startX = 0;
    this.startY = 0;
    this.tmpGameX = null;
    this.tmpGameY = null;
    this.dragging = false;
    this.panning = false;
    this.captured = false;
    this.pressed = false;
    this.moved = false;
    this.rect = null;
    this.buttonsDown = {};
    this.buttonsPressed = {};

    this.options = { // TODO
      capture: false
    };

    const events = ['mousemove', 'click', 'contextmenu', 'mousedown', 'mouseup', 'leave', 'enter'];
    const callback = (evName) => (ev) => {
      if ( this.engine && this.engine.running ) {
        this[`on${evName}`](ev);
      }
    };

    events.forEach((evName) => window.addEventListener(evName, callback(evName)));

    if ( typeof window.MouseEvent !== 'undefined' ) {
      this.bindTouchClick(window);
      this.bindTouchMove(window);
    }

    this.onenter();

    console.log('Mouse::constructor()');
  }

  /**
   * Reset states
   */
  reset() {
    this.update(0);
    this.buttonsDown = {};
    this.panX = null;
    this.panY = null;
    this.startX = 0;
    this.startY = 0;
    this.tmpGameX = null;
    this.tmpGameY = null;
    this.dragging = false;
    this.panning = false;
    this.pressed = false;
    this.moved = false;
  }

  /**
   * Updates the Mouse
   */
  update() {
    this.buttonsPressed = {};
    this.rect = null;
  }

  /**
   * Get real mouse position
   * @param {Event} ev Browser event
   * @return {Object}
   */
  getMousePosition(ev) {
    const s = this.engine.getConfig('scale');
    const x = ev.clientX / s;
    const y = ev.clientY / s;
    return {x, y};
  }

  /**
   * Gets the current pan offset
   * @return {Number[]}
   */
  getPan() {
    return [this.panX, this.panY];
  }

  /**
   * Check if button was clicked
   * @param {String} buttonName Button name
   * @return {Object|Boolean} False on no
   */
  buttonClicked(buttonName) {
    buttonName = String(buttonName).toUpperCase();
    return this.buttonsPressed[buttonName] || false;
  }

  /**
   * Check if button was pressed
   * @param {String} buttonName Button name
   * @return {Object|Boolean} False on no
   */
  buttonDown(buttonName) {
    buttonName = String(buttonName).toUpperCase();
    return this.buttonsDown[buttonName] || false;
  }

  /**
   * On Mouse Move
   * @param {Event} ev Browser Event
   */
  onmousemove(ev) {
    const {x, y} = this.getMousePosition(ev);

    this.x = x;
    this.y = y;
    this.moved = true;

    if ( this.pressed === MOUSE_LEFT ) {
      this.dragging = true;
    } else if ( this.pressed === MOUSE_RIGHT ) {
      if ( !this.panning ) {
        const {offsetX, offsetY} = this.engine.scene.getOffset();
        this.tmpGameX = offsetX;
        this.tmpGameY = offsetY;
      }
      this.panning = true;

      const deltaX = this.startX - x;
      const deltaY = this.startY - y;

      this.panX = Math.round(this.tmpGameX + deltaX);
      this.panY = Math.round(this.tmpGameY + deltaY);
    }
  }

  /**
   * On Mouse Down
   * @param {Event} ev Browser Event
   */
  onmousedown(ev) {
    ev.preventDefault();

    const pos = this.getMousePosition(ev);

    this.moved = false;
    this.panX = null;
    this.panY = null;
    this.startX = pos.x;
    this.startY = pos.y;

    const which = (ev.touches ? ev.detail : ev.which) || MOUSE_LEFT;
    if ( which === MOUSE_LEFT ) {
      this.pressed = MOUSE_LEFT;
      this.buttonsDown.LEFT = pos;
    } else {
      this.pressed = MOUSE_RIGHT;
      this.buttonsDown.RIGHT = pos;
    }
  }

  /**
   * On Mouse Up
   * @param {Event} ev Browser Event
   */
  onmouseup(ev) {
    const {x, y} = this.getMousePosition(ev);

    if ( this.dragging ) {
      this.rect = this.getCurrentRect(x, y);
    }

    if ( !this.dragging && !this.panning ) {
      this.buttonsPressed = Object.assign({}, this.buttonsDown);
    }

    if ( this.pressed === MOUSE_RIGHT ) {
      this.buttonsDown.RIGHT = false;
    } else {
      this.buttonsDown.LEFT = false;
    }

    this.pressed = false;
    this.dragging = false;
    this.panning = false;
    this.panX = null;
    this.panY = null;
  }

  /**
   * Gets the drag rectangle
   * @return {Object}
   */
  getRect() {
    return this.rect;
  }

  /**
   * Gets a drag rectangle
   * @param {Number} [endX] Ending position X
   * @param {Number} [endY] Ending position Y
   * @return {Object}
   */
  getCurrentRect(endX, endY) {
    if ( typeof endX === 'undefined' ) {
      endX = this.x;
    }
    if ( typeof endY === 'undefined' ) {
      endY = this.y;
    }

    return {
      x1: Math.min(this.startX, endX),
      x2: Math.max(this.startX, endX),
      y1: Math.min(this.startY, endY),
      y2: Math.max(this.startY, endY)
    };
  }

  /**
   * On Mouse Enter
   * @param {Event} ev Browser Event
   */
  onenter(ev) {
    this.captured = true;
  }

  /**
   * On Mouse Leave
   * @param {Event} ev Browser Event
   */
  onleave(ev) {
    this.captured = false;
  }

  /**
   * On Mouse Context Menu
   * @param {Event} ev Browser Event
   */
  oncontextmenu(ev) {
    ev.preventDefault();
  }

  /**
   * On Mouse Click
   * @param {Event} ev Browser Event
   */
  onclick(ev) {
  }

  /**
   * Emulates movement on a touch device
   * @param {Node} el DOM Element
   */
  bindTouchMove(el) {
    let firstEvent;

    const tempMove = (ev) => {
      el.dispatchEvent(makeFakeEvent('mousemove', ev, MOUSE_RIGHT));
    };

    el.addEventListener('touchcancel', (ev) => {
      window.removeEventListener('touchmove', tempMove);
    });

    el.addEventListener('touchstart', (ev) => {
      firstEvent = ev;
      el.dispatchEvent(makeFakeEvent('mousedown', ev, MOUSE_RIGHT));
      window.addEventListener('touchmove', tempMove);
    });

    el.addEventListener('touchend', (ev) => {
      el.dispatchEvent(makeFakeEvent('mouseup', firstEvent, MOUSE_RIGHT));
      window.removeEventListener('touchmove', tempMove);
    });
  }

  /**
   * Emulates clicks on a touch device
   * @param {Node} el DOM Element
   */
  bindTouchClick(el) {
    let cancelled = false;
    let timeout, firstTarget, firstEvent;

    const tempMove = () => (cancelled = true);

    el.addEventListener('touchcancel', (ev) => {
      clearTimeout(timeout);
      firstTarget = null;
      cancelled = true;

      window.removeEventListener('touchmove', tempMove);
    });

    el.addEventListener('touchstart', (ev) => {
      firstEvent = ev;
      firstTarget = ev.target;
      timeout = setTimeout(() => {
        cancelled = true;
      }, 300);
      window.addEventListener('touchmove', tempMove);
    });

    el.addEventListener('touchend', (ev) => {
      clearTimeout(timeout);
      window.removeEventListener('touchmove', tempMove);
      if ( !cancelled && ev.target === firstTarget ) {
        ev.target.dispatchEvent(makeFakeEvent('click', firstEvent));
      }
    });
  }

  /**
   * Gets mouse position
   * @return {Number[]}
   */
  getPosition() {
    return [this.x, this.y];
  }

}
