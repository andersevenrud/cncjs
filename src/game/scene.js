/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Scene from '../engine/scene';
import Sprite from '../engine/sprite';
import {drawText} from '../engine/ui/util';
import {CURSOR_SPRITES} from './globals';

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

    this.cursorName = 'default';
    this.loaded = false;
    this.mouse = {
      sprite: null,
      left: 0,
      top: 0,
      index: 0,
      offset: 0,
      timer: 0
    };
  }

  /**
   * Loads the Scene
   * @param {String[]} [additional] Additional assets to load
   */
  async load(additional = []) {
    const list = [
      'sprite:btexture',
      'sprite:mouse'
    ].concat(additional);

    await super.load(list);

    this.mouse.sprite = Sprite.instance('mouse');
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

    // Sprites
    const found = CURSOR_SPRITES[this.cursorName];
    let spriteOffset = typeof found === 'number' ? found : found[0];
    let spriteCount = typeof found === 'number' ? 0 : found[1];
    let spriteIndex = spriteCount ? this.mouse.index : 0;

    if ( spriteCount && this.mouse.timer === 0 ) {
      spriteIndex = (spriteIndex + 1) % spriteCount;
    }

    // Mouse
    this.mouse.index = spriteIndex;
    this.mouse.offset = spriteOffset;
    this.mouse.left = this.cursorName === 'default' ? 0 : this.mouse.sprite.width / 2;
    this.mouse.top = this.cursorName === 'default' ? 0 : this.mouse.sprite.height / 2;
    this.mouse.timer = (this.mouse.timer + 1) % 4;

    super.update(...arguments);
  }

  /**
   * Draws the Scene
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    super.render(...arguments);

    // Mouse
    if ( this.mouse.sprite ) {
      const [mouseX, mouseY] = this.engine.mouse.getPosition();
      this.mouse.sprite.render(target,
                               Math.round(mouseX - this.mouse.left),
                               Math.round(mouseY - this.mouse.top),
                               Math.round(this.mouse.index) + this.mouse.offset);
    }

    // Debug info
    if ( this.engine.options.debug ) {
      const {vw, vh} = this.getViewport();
      const km = this.engine.getConfig('keymap');

      const debug = [
        `FPS: ${(this.engine.fpsAverage).toFixed(0)} (${(this.engine.fps).toFixed(0)} / ${(this.engine.delta * 1000).toFixed(2)}ms)`,
        `Update: ${this.engine.updateTime.toFixed(2)} (${Math.round(1000 / this.engine.options.updateRate)}Hz) (${Sprite.getCacheCount()} sprites)`,
        `Viewport: ${vw}x${vh} (${this.engine.getConfig('scale').toFixed(1)}x) @ ${this.gameX}x${this.gameY}`,
        `Sound: s:${String(this.engine.sounds.soundEnabled)} m:${String(this.engine.sounds.musicEnabled)}`,
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
