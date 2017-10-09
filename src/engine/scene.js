/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Sprite from './sprite';
import {drawText} from './util';

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
    this.debugOutput = null;

    console.log('scene::construct()');
  }

  /**
   * Destroys the scene
   * @param {Object} [args] Arguments to pass on
   */
  destroy(args) {
    this.engine.nextScene(args);
  }

  /**
   * Loads the Scene
   * @param {String[]} [list] List of sprites to load
   */
  async load(list = []) {
    for ( let i = 0; i < list.length; i++ ) {
      const [sub, name] = list[i].indexOf('/') !== -1 ? list[i].split('/') : [null, list[i]];
      try {
        await Sprite.loadFile(this.engine, name, sub);
      } catch ( e ) {
        console.error('Failed to load sprite', list[i], e);
      }
    }

    this.loaded = true;
  }

  /**
   * Updates the Scene
   */
  update() {
  }

  /**
   * Draws the Scene
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    // Debug
    if ( this.debugOutput ) {
      const lineHeight = this.engine.options.scale > 1 ? 12 : 16;
      drawText(target, this.debugOutput, {
        lineHeight: lineHeight,
        top: this.engine.height - (this.debugOutput.length * lineHeight),
        font: this.engine.options.scale > 1 ? '8px monospace' : '12px monospace',
        fillStyle: '#fff'
      });
    }
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
