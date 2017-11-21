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
    this.guiHit = false;
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
   * @param {String[]} [list] List of assets to load
   */
  async load(list = []) {
    const loadSprites = list.filter(str => str.match(/^sprite:/))
      .map(str => str.replace(/^sprite:/, ''));

    const loadAudio = list.filter(str => str.match(/^audio:/))
      .map(str => str.replace(/^audio:/, ''));

    console.info('Loading', list.length, 'assets');
    console.info('...', loadSprites.length, 'sprite files');
    console.info('...', loadAudio.length, 'audio files');

    for ( let i = 0; i < loadSprites.length; i++ ) {
      const [sub, name] = loadSprites[i].indexOf('/') !== -1 ? loadSprites[i].split('/') : [null, loadSprites[i]];

      try {
        await Sprite.preload(this.engine, name, sub);
      } catch ( e ) {
        console.error('Failed to load sprite', loadSprites[i], e);
      }

      this.engine.toggleLoading(true, (i / list.length) * 100, `Loading sprite '${loadSprites[i]}'`);
    }

    for ( let i = 0; i < loadAudio.length; i++ ) {
      const name = loadAudio[i];

      try {
        await this.engine.sounds.preload(name);
      } catch ( e ) {
        console.error('Failed to load audio', name, e);
      }

      this.engine.toggleLoading(true, ((i + loadSprites.length) / list.length) * 100, `Loading audio '${name}'`);
    }

    this.engine.toggleLoading(true, 100, 'Please Stand By');
  }

  /**
   * Updates the Scene
   */
  update() {
    let hit = false;

    if ( this.gui.length ) {
      const viewport = this.engine.getViewport();

      for ( let i = 0; i < this.gui.length; i++ ) {
        const gui = this.gui[i];
        gui.update(viewport);

        hit = !!gui.clicked || !!gui.pressed;
      }
    }

    this.guiHit = hit;
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
  onresize() {

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
   * @return {Object}
   */
  getViewport() {
    return this.engine.getViewport();
  }

}
