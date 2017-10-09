/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Mouse from './io/mouse';
import Keyboard from './io/keyboard';
import Sound from './io/sound';
import MIX from './io/mix';
import {MAX_DEBUG, UPDATE_RATE} from './globals';

/**
 * Base Game Engine Class
 */
export default class Engine {

  /**
   * @param {Node} canvas The root canvas element
   * @param {Object} [options] Options
   * @param {String} [options.version] Version stamp
   * @param {String} [options.dataFile] Data file (zip file)
   * @param {Number} [options.debug=0] Debug mode
   * @param {Number} [options.scale=1] Scale mode
   * @param {Boolean} [options.debugMode=false] Debug mode
   * @param {Boolean} [options.audio=true] Audio toggle
   */
  constructor(canvas, options = {}) {
    this.options = Object.assign({}, {
      version: '0.0.0',
      loading: null,
      scale: 1,
      debug: 0,
      debugMode: false,
      audio: true,
      dataFile: 'data.zip'
    }, options);

    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');

    this.mix = new MIX(this, this.options.dataFile);
    this.mouse = new Mouse(this);
    this.keyboard = new Keyboard(this);
    this.sounds = new Sound(this);
    this.scene = null;

    this.sceneQueue = [];
    this.running = false;
    this.started = false;
    this.width = 0;
    this.height = 0;
    this.delta = 0;
    this.fps = 0;
    this.fpsAverage = 0;
    this.updateTime = 0;
    this.currentTick = 0;
    this.paused = false;
    this.$loading = options.loading;

    let debounce;
    window.addEventListener('blur', () => this.pause());
    window.addEventListener('focus', () => this.unpause());
    window.addEventListener('resize', () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this.resize(), 100);
    });

    console.log('Engine::constructor()', this.options);
  }

  /**
   * Destroys the game engine
   */
  destroy() {
    this.running = false;
  }

  /**
   * Loads game engine
   * @return {Boolean}
   */
  async load() {
    console.group('Engine::load()');

    this.toggleLoading(true);
    this.setScale(this.options.scale);
    this.toggleDebug(this.options.debug);
    this.sounds.toggleSound(this.options.audio);
    this.sounds.toggleMusic(this.options.audio);

    await this.mix.load();

    this.toggleLoading(false);

    console.groupEnd();

    return true;
  }

  /**
   * Toggle debug state
   * @param {Number|Boolean} [t] Set state manually
   */
  toggleDebug(t) {
    if ( typeof t === 'boolean' ) {
      this.options.debug = t === true ? MAX_DEBUG : 0;
    } else if ( typeof t === 'number' ) {
      this.options.debug = Math.min(MAX_DEBUG, t);
    } else {
      this.options.debug = (this.options.debug + 1) % (MAX_DEBUG + 1);
    }

    console.debug('Debug level is now', this.options.debug);

    this.canvas.style.cursor = this.options.debug ? 'default' : 'none';
  }

  /**
   * Pause game engine
   * @param {Boolean} [t] Set pause state manually
   * @return {Boolean} state
   */
  pause(t) {
    this.paused = (typeof t === 'undefined' ? !this.paused : t === true);
    this.sounds.pause(!this.paused);
    return this.paused;
  }

  /**
   * Un-pause the game
   * @return {Boolean} state
   */
  unpause() {
    return this.pause(false);
  }

  /**
   * Run the game
   */
  async run() {
    this.start();
    await this.nextScene();
  }

  /**
   * Starts rendering
   */
  start() {
    if ( this.running ) {
      return;
    }

    console.info('Strating rendering loop...');

    let lastFrame;
    let skipTicks = 1000 / UPDATE_RATE;
    let nextGameTick = performance.now();
    let lastTick = nextGameTick;

    const step = (t) => {
      if ( !this.running ) {
        window.cancelAnimationFrame(lastFrame);
        return;
      }

      this.delta = (t - lastTick) / 1000;
      this.fps = 1 / this.delta;

      while ( t > nextGameTick ) {
        this.fpsAverage += (this.fps - this.fpsAverage) / 10;
        nextGameTick += skipTicks;
        this.onupdate();
      }

      lastTick = t;

      this.onrender(t);

      lastFrame = window.requestAnimationFrame(() => step(performance.now()));
    };

    this.running = true;

    step(performance.now());
  }

  /**
   * Event: On update
   */
  onupdate() {
    const now = performance.now();
    if ( this.scene && !this.paused ) {
      this.scene.update();
    }

    this.keyboard.update();
    this.mouse.update();

    this.updateTime = (performance.now() - now);
    this.currentTick++;
  }

  /**
   * Event: On render
   * @param {Number} delta Render delta time
   */
  onrender(delta) {
    if ( this.paused ) {
      return;
    }

    this.context.clearRect(0, 0, this.width, this.height);
    this.context.textBaseline = 'alphabetic';
    this.context.textAlign = 'start';
    if ( this.scene ) {
      this.scene.render(this.context, delta);
    }
  }

  /**
   * Handles resize of screen
   */
  resize() {
    const w = Math.max(640, window.innerWidth);
    const h = Math.max(535, window.innerHeight);

    this.width = Math.round(w / this.options.scale);
    this.height = Math.round(h / this.options.scale);

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    console.info('Resized to', [this.width, this.height]);
  }

  /**
   * Go to next scene
   * @param {Object} [args] Arguments to pass on
   */
  async nextScene(args) {
    console.info('Going to next scene', this.started);

    this.toggleLoading(true);

    if ( this.started ) {
      this.sceneQueue.splice(0, 1);
    } else {
      this.started = true;
    }

    this.paused = true;
    this.scene = null;

    this.sounds.reset();
    this.mouse.reset();
    this.keyboard.reset();

    if ( !this.sceneQueue.length ) {
      console.error('No more scenes');
      return;
    }

    const scene = this.sceneQueue[0](args);
    this.scene = scene;
    await this.scene.load();

    this.paused = false;
    this.toggleLoading(false);
  }

  toggleLoading(t) {
    if ( !this.$loading ) {
      return;
    }

    this.$loading.style.display = t ? 'block' : 'none';
  }

  /**
   * Sets the scaling
   * @param {Number} scale Scale factor
   */
  setScale(scale) {
    this.options.scale = scale;
    this.resize();
    this.canvas.className = scale > 1 ? 'sharpen' : '';
  }

  /**
   * Sets the game world position
   * @param {Number} x X
   * @param {Number} y Y
   */
  setOffset(x, y) {
    this.scene.setOffset(x, y);
  }

  /**
   * Gets scale
   * @return {Number}
   */
  getScale() {
    return this.options.scale;
  }

  /**
   * Gets game offset
   * @return {Object}
   */
  getOffset() {
    return this.scene.getOffset();
  }

  /**
   * Get viewport rect
   * @return [Object]
   */
  getViewport() {
    return this.scene.getViewport();
  }
}
