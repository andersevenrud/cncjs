/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Mouse from './io/mouse';
import Keyboard from './io/keyboard';
import Sound from './io/sound';
import Zip from './io/zip';
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
   * @param {Boolean} [options.cursorLock=false] Cursor Locking feature
   * @param {Boolean} [options.positionalAudio=false] Positional audio feature
   */
  constructor(canvas, configuration, options = {}) {
    console.group('Engine::constructor()');

    this.options = Object.assign({}, {
      gui: {},
      scenes: {},
      debug: false,
      version: '0.0.0',
      debugMode: false,
      dataFile: 'data.zip',
      cursorLock: false,
      updateRate: 1000 / 30,
      positionalAudio: false
    }, options);

    this.$root = canvas.parentNode;
    this.$rootTop = 0;
    this.$rootLeft = 0;

    this.canvas = canvas;
    this.context = this.canvas.getContext('2d');

    this.zip = new Zip(this, this.options.dataFile);
    this.mouse = new Mouse(this, {
      cursorLock: this.options.cursorLock
    });
    this.keyboard = new Keyboard(this);
    this.sounds = new Sound(this, {
      positionalAudio: options.positionalAudio
    });
    this.configuration = new Configuration(options, configuration);
    this.scene = null;

    this.sceneQueue = [];
    this.spriteLibrary = {};
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

    let debounce;
    const onresize = () => {
      clearTimeout(debounce);
      debounce = setTimeout(() => this.onresize(), 100);
    };

    window.addEventListener('blur', () => this.pause());
    window.addEventListener('focus', () => this.unpause());
    window.addEventListener('resize', () => onresize());
    window.addEventListener('scroll', () => onresize());

    console.groupEnd();
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

    this.setScale(this.getConfig('scale'));

    this.toggleLoading(true);

    await this.configuration.load();
    await this.zip.load();

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
  onresize() {
    const w = Math.max(640, this.$root.offsetWidth);
    const h = Math.max(535, this.$root.offsetHeight);
    const s = this.getConfig('scale');

    this.width = Math.round(w / s);
    this.height = Math.round(h / s);

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    if ( this.scene ) {
      this.scene.onresize();
    }

    // FIXME: Does not take scroll into account
    const {left, top} = this.$root.getBoundingClientRect();
    this.$rootTop = top;
    this.$rootLeft = left;

    console.info('Resized to', [this.width, this.height]);
  }

  /**
   * Go to next scene
   * @param {Object} [args] Arguments to pass on
   */
  async nextScene() {
    console.group('Engine::nextScene()');

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
    console.groupEnd();
  }

  /**
   * Push a scene
   * @param {String} sceneName Scene Name
   * @param {Object} [options] Instanciation options
   */
  pushScene(sceneName, options) {
    const ClassRef = this.options.scenes[sceneName];
    console.info('Pushing Scene', sceneName);

    this.sceneQueue.push(() => {
      return new ClassRef(this, options);
    });
  }

  /**
   * Toggle DOM loading indication
   * @param {Boolean} t State
   * @param {Number} [p] Percentage in progress
   * @param {String} [s] Show text
   */
  toggleLoading(t, p, s) {

    this.canvas.style.backgroundColor = t ? 'transparent' : '#000000';

    if ( t ) {
      s = s || 'Loading...';

      const outerMargin = 80;
      const innerMargin = 2;
      const outerWidth = (this.width - (outerMargin * 2));
      const fullWidth = outerWidth - (innerMargin * 2);
      const width = Math.round(fullWidth * (p / 100));

      let height = 20;
      let left = outerMargin;
      let top = (this.height / 2) - (height / 2);

      this.context.clearRect(0, 0, this.width, this.height);

      this.context.fillStyle = '#222222';
      this.context.fillRect(left, top, outerWidth, height);

      left += innerMargin;
      top += innerMargin;
      height -= (innerMargin * 2);

      this.context.fillStyle = '#089118';
      this.context.fillRect(left, top, width, height);

      if ( s ) {
        const ts = height - 4;
        const tw = this.context.measureText(s).width;
        const y = top + ts;
        const x = left + (fullWidth / 2) - (tw / 2);

        this.context.font = String(ts) + 'px monospace';
        this.context.fillStyle = '#ffffff';
        this.context.fillText(s, x, y);
      }
    }
  }

  /**
   * Sets the scaling
   * @param {Number} scale Scale factor
   */
  setScale(scale) {
    this.configuration.setConfig('scale', scale);
    this.onresize();
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
