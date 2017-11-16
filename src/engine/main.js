/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Mouse from './io/mouse';
import Keyboard from './io/keyboard';
import Sound from './io/sound';
import MIX from './io/mix';
import Sprite from './sprite';
import Configuration from './configuration';

const MAX_DEBUG = 3;

/**
 * Base Game Engine Class
 */
export default class Engine {

  /**
   * @param {Node} canvas The root canvas element
   * @param {Object} configuration Game configuration
   * @param {Object} [options] Game Options
   * @param {String} [options.version] Version stamp
   * @param {String} [options.dataFile] Data file (zip file)
   * @param {Number} [options.debug=0] Debug mode
   * @param {Object} [options.gui] GUI Element map
   * @param {Object} [options.scenes] Scene map
   * @param {Boolean} [options.debugMode=false] Debug mode
   */
  constructor(canvas, configuration, options = {}) {
    this.options = Object.assign({}, {
      gui: {},
      scenes: {},
      debug: false,
      version: '0.0.0',
      loading: null,
      loadingBar: null,
      debugMode: false,
      dataFile: 'data.zip',
      updateRate: 1000 / 30
    }, options);

    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');

    this.mix = new MIX(this, this.options.dataFile);
    this.mouse = new Mouse(this);
    this.keyboard = new Keyboard(this);
    this.sounds = new Sound(this);
    this.configuration = new Configuration(options, configuration);
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
    this.pauseTick = false;
    this.paused = false;
    this.wasPaused = false;
    this.$loading = options.loading;
    this.$loadingBar = options.loadingBar;

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

    await this.configuration.load();
    await this.mix.load();

    this.setScale(this.getConfig('scale'));
    this.toggleDebug(this.options.debug);
    this.sounds.setSoundVolume(this.getConfig('soundVolume'));
    this.sounds.setMusicVolume(this.getConfig('musicVolume'));
    this.sounds.toggleSound(this.getConfig('audio'));
    this.sounds.toggleMusic(this.getConfig('audio'));

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

    const state = this.options.debug;
    console.debug('Debug level is now', state);

    this.canvas.style.cursor = state ? 'default' : 'none';
  }

  /**
   * Pause game engine
   * @param {Boolean} [t] Set pause state manually
   * @return {Boolean} state
   */
  pause(t) {
    this.paused = (typeof t === 'undefined' ? !this.paused : t === true);
    this.sounds.pause(!this.paused);

    if ( this.scene ) {
      this.scene.pause(this.paused);
    }

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
    let skipTicks = 1000 / this.options.updateRate;
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
    if ( this.paused ) {
      this.wasPaused = true;
      return;
    }

    // Makes sure input is ignored whenever we return to browser
    // from a paused state
    if ( this.wasPaused ) {
      this.keyboard.reset();
      this.mouse.reset();
      this.wasPaused = false;
      return;
    }

    const now = performance.now();
    if ( this.scene && !this.paused && !this.scene.destroying ) {
      this.scene.update();
    }

    this.keyboard.update();
    this.mouse.update();
    this.sounds.update();

    this.updateTime = (performance.now() - now);
    if ( !this.pauseTick ) {
      this.currentTick++;
    }
  }

  /**
   * Event: On render
   * @param {Number} delta Render delta time
   */
  onrender(delta) {
    if ( this.paused ) {
      return;
    }
    //this.canvas.width = this.canvas.width;

    this.context.clearRect(0, 0, this.width, this.height);
    this.context.textBaseline = 'alphabetic';
    this.context.textAlign = 'start';
    if ( this.scene && !this.scene.destroying ) {
      this.scene.render(this.context, delta);
    }
  }

  /**
   * Handles resize of screen
   */
  resize() {
    const w = Math.max(640, window.innerWidth);
    const h = Math.max(535, window.innerHeight);
    const s = this.getConfig('scale');

    this.width = Math.round(w / s);
    this.height = Math.round(h / s);

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if ( this.scene ) {
      this.scene.resize();
    }

    console.info('Resized to', [this.width, this.height]);
  }

  /**
   * Go to next scene
   * @param {Object} [args] Arguments to pass on
   */
  async nextScene() {
    console.info('Going to next scene', this.started);

    Sprite.destroyCache();

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

    const scene = this.sceneQueue[0]();
    this.scene = scene;
    await this.scene.load();

    this.paused = false;
    this.toggleLoading(false);
  }

  /**
   * Push a scene
   * @param {String} sceneName Scene Name
   * @param {Object} [options] Instanciation options
   */
  pushScene(sceneName, options) {
    const ClassRef = this.options.scenes[sceneName];
    console.info('Pushing Scene', sceneName, ClassRef);

    this.sceneQueue.push(() => {
      return new ClassRef(this, options);
    });
  }

  /**
   * Toggle DOM loading indication
   * @param {Boolean} t State
   * @param {Number} [p] Percentage in progress
   */
  toggleLoading(t, p) {
    if ( !this.$loading ) {
      return;
    }

    this.$loading.style.display = t ? 'block' : 'none';

    if ( this.$loadingBar ) {
      if ( !t || typeof p === 'undefined' ) {
        this.$loadingBar.style.display = 'none';
      } else {
        this.$loadingBar.style.display = 'block';
        this.$loadingBar.style.width = String(Math.round(p || 0)) + '%';
      }
    }
  }

  /**
   * Sets the scaling
   * @param {Number} scale Scale factor
   */
  setScale(scale) {
    this.configuration.setConfig('scale', scale);
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
    return this.getConfig('scale');
  }

  /**
   * Gets configuration entry
   * @param {String} [key] Configuration key
   * @param {*} [defaultValue] Default value if none was found
   * @return {*} If no key was give, entire tree is returned
   */
  getConfig(key, defaultValue) {
    return this.configuration.getConfig(key, defaultValue);
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
   * @return {Object}
   */
  getViewport() {
    return {
      vx: 0,
      vy: 0,
      vw: this.width,
      vh: this.height
    };
  }
}
