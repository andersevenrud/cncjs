/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Scene from 'engine/scene';
import Cursor from 'game/ui/cursor';
import {drawText} from 'engine/ui/util';

/**
 * Base Game Scene class
 */
export default class GameScene extends Scene {

  /**
   * @param {Engine} engine Game Engine reference
   * @param {Object} options Options
   */
  constructor(engine, options) {
    super(engine, options);

    this.cursor = new Cursor(engine);
    this.loaded = false;
  }

  /**
   * Loads the Scene
   * @param {String[]} [additional] Additional assets to load
   */
  async load(additional = []) {
    console.group('Scene::load()');

    const list = [
      'sprite:btexture',
      'sprite:mouse',
      'sprite:3point',
      'sprite:6point',
      'sprite:8point',
      'sprite:vcr'
    ].concat(additional);

    await super.load(list);

    await this.cursor.load();

    console.groupEnd();
  }

  /**
   * Updates the Scene
   */
  update() {
    // Keyboard
    const kbd = this.engine.keyboard;
    const cfg = this.engine.configuration;

    if ( kbd.keyClicked(cfg.getKey('DEBUG_TOGGLE')) ) {
      this.engine.toggleDebug();
    } else if ( kbd.keyClicked(cfg.getKey('DEBUG_SCALE')) ) {
      this.engine.setScale((Math.round(this.engine.getScale() + 1) % 4) || 1);
    } else if ( kbd.keyClicked(cfg.getKey('DEBUG_SOUND')) ) {
      this.engine.sounds.toggleSound();
    } else if ( kbd.keyClicked(cfg.getKey('DEBUG_MUSIC')) ) {
      this.engine.sounds.toggleMusic();
    }

    // Mouse
    this.cursor.update();

    super.update(...arguments);
  }

  /**
   * Draws the Scene
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    super.render(...arguments);

    this.cursor.render(target);

    if ( this.engine.options.debug ) {
      const {vw, vh} = this.getViewport();
      const km = this.engine.getConfig('keymap');

      const debug = [
        `Render: ${(this.engine.fpsAverage).toFixed(0)} (${(this.engine.delta * 1000).toFixed(2)}ms) @ ${Math.round(1000 / this.engine.options.updateRate)}Hz tick`,
        `Viewport: ${vw}x${vh} (${this.engine.getConfig('scale').toFixed(1)}x) @ ${this.gameX}x${this.gameY}`,
        ...this.debugOutput,
        '',
        `<${km.DEBUG_TOGGLE}> Debug, <${km.DEBUG_SCALE}> Scale`,
        `<${km.DEBUG_SOUND}> Sound, <${km.DEBUG_MUSIC}> Music`,
        `<${km.DEBUG_FOG}> Fog`
      ];

      const scale = this.engine.getConfig('scale');
      const lineHeight = scale > 1 ? 12 : 16;
      drawText(target, debug, {
        lineHeight: lineHeight,
        top: this.engine.height - (debug.length * lineHeight),
        font: scale > 1 ? '8px monospace' : '12px monospace',
        fillStyle: '#fff'
      });
    }
  }

}
