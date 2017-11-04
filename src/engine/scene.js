/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Sprite from './sprite';

/**
 * The base Scene class
 */
export default class Scene {

  /**
   * @param {Engine} engine Game Engine reference
   * @param {Object} options Options
   */
  constructor(engine, options) {
    this.engine = engine;
    this.options = options;
    this.gameX = 0;
    this.gameY = 0;
    this.gui = [];
    this.destroying = false;
    this.debugOutput = [];

    console.log('scene::construct()');
  }

  /**
   * Destroys the scene
   * @param {Object} [args] Arguments to pass on
   */
  destroy(args) {
    this.destroying = true;
    this.engine.nextScene();
  }

  /**
   * Loads the Scene
   * @param {String[]} [list] List of sprites to load
   */
  async load(list = []) {

    const total = list.length;

    console.info('Loading', total, 'sprites');

    for ( let i = 0; i < total; i++ ) {
      const [sub, name] = list[i].indexOf('/') !== -1 ? list[i].split('/') : [null, list[i]];
      try {
        await Sprite.loadFile(this.engine, name, sub);
      } catch ( e ) {
        console.error('Failed to load sprite', list[i], e);
      }

      this.engine.toggleLoading(true, (i / total) * 100);
    }

    this.loaded = true;
  }

  /**
   * Updates the Scene
   * @return {Boolean} If GUI was clicked
   */
  update() {
    let clicked = false;

    if ( this.gui.length ) {
      const click = this.engine.mouse.buttonClicked('LEFT');
      const viewport = this.getViewport(true);

      for ( let i = 0; i < this.gui.length; i++ ) {
        const gui = this.gui[i];
        gui.update(viewport);

        if ( !clicked && click ) {
          clicked = gui.click(click) === true;
        }
      }
    }

    return clicked;
  }

  /**
   * Draws the Scene
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    for ( let i = 0; i < this.gui.length; i++ ) {
      this.gui[i].render(target, delta);
    }
  }

  /**
   * When viewport is resized
   */
  resize() {

  }

  /**
   * When game is paused
   * @param {Boolean} paused Paused state
   */
  pause(paused) {

  }

  /**
   * Sets the game world position
   * @param {Number} x X
   * @param {Number} y Y
   */
  setOffset(x, y) {
    this.gameX = Math.round(x);
    this.gameY = Math.round(y);
  }

  /**
   * Gets game offset
   * @return {Object}
   */
  getOffset() {
    return {
      offsetX: this.gameX,
      offsetY: this.gameY
    };
  }

  /**
   * Get viewport rect
   * @return [Object]
   */
  getViewport() {
    return {
      vx: 0,
      vy: 0,
      vw: this.engine.width,
      vh: this.engine.height
    };
  }

}
