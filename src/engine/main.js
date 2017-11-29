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
import Graph from './ui/graph';

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
   * @param {Object} [options.minWidth=640] Minimum canvas width
   * @param {Object} [options.minHeight=480] Minimum canvas height
   * @param {Boolean} [options.debugMode=false] Debug mode
   * @param {Boolean} [options.cursorLock=false] Cursor Locking feature
   * @param {Boolean} [options.positionalAudio=false] Positional audio feature
   */
  constructor(canvas, configuration, options = {}) {
    console.group('Engine::constructor()');

    /**
     * Game Engine options (see constrctor)
     * @type {Object}
     */
    this.options = Object.assign({}, {
      gui: {},
      scenes: {},
      debug: false,
      version: '0.0.0',
      debugMode: false,
      dataFile: 'data.zip',
      cursorLock: false,
      updateRate: 1000 / 30,
      positionalAudio: false,
      minWidth: 640,
      minHeight: 480
    }, options);

    /**
     * Root DOM element
     * @type {Node}
     */
    this.$root = canvas.parentNode;

    /**
     * Root DOM element top position
     * @type {Number}
     */
    this.$rootTop = 0;

    /**
     * Root DOM element left position
     * @type {Number}
     */
    this.$rootLeft = 0;

    /**
     * Canvas DOM element
     * @type {HTMLCanvasElement}
     */
    this.canvas = canvas;

    /**
     * Canvas rendering context
     * @type {CanvasRenderingContext2D}
     */
    this.context = this.canvas.getContext('2d');

    /**
     * Game Data archive
     * @type {Zip}
     */
    this.zip = new Zip(this, this.options.dataFile);

    /**
     * Mouse IO Handler
     * @type {Mouse}
     */
    this.mouse = new Mouse(this, {
      cursorLock: this.options.cursorLock
    });

    /**
     * Keyboard IO Handler
     * @type {Keyboard}
     */
    this.keyboard = new Keyboard(this);

    /**
     * Sound IO Handler
     * @type {Sound}
     */
    this.sounds = new Sound(this, {
      positionalAudio: options.positionalAudio
    });

    /**
     * Configuration Handler
     * @type {Configuration}
     */
    this.configuration = new Configuration(options, configuration);

    /**
     * Current scene
     * @type {Scene}
     */
    this.scene = null;

    /**
     * Scene Queue
     * @type {Scene[]}
     */
    this.sceneQueue = [];

    /**
     * Sprite library
     * @type {Object}
     */
    this.spriteLibrary = {};

    /**
     * Engine running state
     * @type {Boolean}
     */
    this.running = false;

    /**
     * Engine started state
     * @type {Boolean}
     */
    this.started = false;

    /**
     * Engine loading state
     * @type {Boolean}
     */
    this.loading = false;

    /**
     * Engine rendering width
     * @type {Number}
     */
    this.width = 0;

    /**
     * Engine rendering height
     * @type {Number}
     */
    this.height = 0;

    /**
     * Engine rendering delta
     * @type {Float}
     */
    this.delta = 0;

    /**
     * Engine rendering FPS
     * @type {Float}
     */
    this.fps = 0;

    /**
     * Engine rendering FPS (average)
     * @type {Float}
     */
    this.fpsAverage = 0;

    /**
     * Engine tick counter
     * @type {Number}
     */
    this.currentTick = 0;

    /**
     * Engine next tick (internal)
     * @type {Number}
     */
    this.nextTick = 0;

    /**
     * Engine pause tick
     * @type {Boolean}
     */
    this.pauseTick = false;

    /**
     * Engine paused state
     * @type {Boolean}
     */
    this.paused = false;

    /**
     * Engine paused state (past)
     * @type {Boolean}
     */
    this.wasPaused = false;

    /**
     * Stat graphs
     * @type {Graph[]}
     */
    this.graphs = [
      new Graph('FPS', '#0ff', '#002', () => {
        return [Math.round(this.fps), 80];
      }),
      new Graph('MS', '#0f0', '#020', () => {
        return [Math.round(this.delta * 1000), 100];
      })
    ];

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
    if ( this.paused ) {
      /**
       * NOTE: This is a workaround for browsers throttling tabs
       * when blurring. requestAnimationFrame does not react when
       * no focus is active, Without this the browser would simply
       * "freeze" when returning to tab after a while of inactivity.
       */
      this.nextTick = performance.now();
    }

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

    const now = performance.now();

    let lastFrame;
    let skipTicks = 1000 / this.options.updateRate;
    let lastTick = now;

    const step = (t) => {
      if ( !this.running ) {
        window.cancelAnimationFrame(lastFrame);
        return;
      }

      this.delta = (t - lastTick) / 1000;
      this.fps = 1 / this.delta;

      /**
       * NOTE: This is for our variable update rate. This makes sure that
       * it runs at a steady frequency (always "catches up").
       */
      while ( t > this.nextTick ) {
        this.fpsAverage += (this.fps - this.fpsAverage) / 10;
        this.nextTick += skipTicks;
        this.onupdate();
      }

      lastTick = t;

      this.onrender(t);

      lastFrame = window.requestAnimationFrame(() => step(performance.now()));
    };

    this.running = true;
    this.nextTick = now;

    step(performance.now());
  }

  /**
   * Event: On update
   */
  onupdate() {
    if ( this.loading ) {
      return;
    }

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

    if ( this.scene && !this.paused && !this.scene.destroying ) {
      this.scene.update();
    }

    this.keyboard.update();
    this.mouse.update();
    this.sounds.update();

    if ( !this.pauseTick ) {
      this.currentTick++;
    }

    if ( this.options.debug >= MAX_DEBUG ) {
      for ( let i = 0; i < this.graphs.length; i++ ) {
        this.graphs[i].update();
      }
    }
  }

  /**
   * Event: On render
   * @param {Number} delta Render delta time
   */
  onrender(delta) {
    if ( this.paused || this.loading ) {
      return;
    }
    //this.canvas.width = this.canvas.width;

    this.context.clearRect(0, 0, this.width, this.height);
    this.context.textBaseline = 'alphabetic';
    this.context.textAlign = 'start';

    if ( this.scene && !this.scene.destroying ) {
      this.scene.render(this.context, delta);
    }

    if ( this.options.debug >= MAX_DEBUG ) {
      for ( let i = 0; i < this.graphs.length; i++ ) {
        const p = this.graphs[i];
        p.render(this.context, this.width - p.width, i * p.height);
      }
    }
  }

  /**
   * Handles resize of screen
   */
  onresize() {
    const w = Math.max(this.options.minWidth, this.$root.offsetWidth);
    const h = Math.max(this.options.minHeight, this.$root.offsetHeight);
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
    this.graphs = this.graphs.splice(0, 2);

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
    this.loading = t;

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
   * Add a custom graph to the debugging
   * @param {String} label Graph label
   * @param {String} fg Foreground color
   * @param {String} bg Background color
   * @param {Function} cb Callback function => [value, max]
   */
  addGraph(label, fg, bg, cb) {
    this.graphs.push(new Graph(label, fg, bg, cb));
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
