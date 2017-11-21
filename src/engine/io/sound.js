/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

const WebAudioAPI = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;
const MUSIC_VOLUME = 1.0;
const SOUND_VOLUME = 0.9;

/**
 * Sound Manager Class
 */
export default class Sound {

  /**
   * @param {Engine} engine Game Engine reference
   * @param {Object} [options] Sound Options
   * @param {String} [options.path=audio] Sound path
   * @param {String} [options.format=wav] Sound format
   * @param {Boolean} [options.positionalAudio=false] Positional audio feature
   */
  constructor(engine, options = {}) {
    this.options = Object.assign({}, {
      path: 'audio',
      format: 'wav',
      positionalAudio: false
    }, options);

    this.engine = engine;
    this.soundEnabled = false;
    this.soundVolume = SOUND_VOLUME;
    this.soundsPlaying = 0;
    this.musicEnabled = false;
    this.musicVolume = MUSIC_VOLUME;
    this.musicElement = null;
    this.soundQueue = [];
    this.soundHandler = null;
    this.audio = {};
    this.soundsContextCounter = 0;
    this.soundsContexts = {};

    this.context = WebAudioAPI ? new WebAudioAPI() : null;
    this.soundGain = null;
    this.soundPan = null;

    if ( this.context ) {
      this.soundGain = this.context.createGain();
      this.soundGain.connect(this.context.destination);

      this.setSoundVolume(this.soundVolume);

      console.info('Audio Context was found');
    }

    console.log('Sound::constructor()', this.options);
  }

  /**
   * Preloads an audio file
   * @param {String} name Audio name
   */
  async preload(name) {
    const src = `${this.options.path}/${name}.${this.options.format}`;

    try {
      const raw = await this.engine.zip.getDataFile(src);
      const buffer = await this.context.decodeAudioData(raw.buffer);
      this.audio[name] = buffer;
    } catch ( e ) {
      console.warn('Failed to preload audio', src, e);
    }
  }

  /**
   * Updates internals
   */
  update() {
    if ( this.context && this.options.positionalAudio ) {
      const {vw, vh} = this.engine.getViewport();

      let x = 0;
      let y = 0;

      if ( this.engine.scene ) {
        const {offsetX, offsetY} = this.engine.scene.getOffset();
        x = offsetX + (vw / 2);
        y = offsetY + (vh / 2);
      }

      this.context.listener.setPosition(x, y, 0);
    }

    if ( this.soundQueue.length && !this.soundsPlaying ) {
      const [soundId, options, cb] = this.soundQueue.shift();

      if ( options && typeof options.queue !== 'undefined' ) {
        delete options.queue;
      }

      this.playSound(soundId, options, cb);
    }
  }

  /**
   * Reset states
   */
  reset() {
    if ( this.musicElement ) {
      this.musicElement.src = '';
      this.musicElement.load();
      this.musicElement = null;
    }

    this.setSoundVolume(SOUND_VOLUME);
    this.setMusicVolume(MUSIC_VOLUME);

    this.soundHandler = null;
    this.audio = {};
  }

  /**
   * Toggles pause mode
   * @param {Boolean} t Toggle
   */
  pause(t) {
    if ( this.musicElement && this.musicEnabled ) {
      if ( t ) {
        this.musicElement.play();
      } else {
        this.musicElement.pause();
      }
    }
  }

  /**
   * Toggle sound state
   * @param {Boolean} [t] Set state manually
   */
  toggleSound(t) {
    this.soundEnabled = typeof t === 'undefined' ? !this.soundEnabled : t === true;
  }

  /**
   * Toggle music state
   * @param {Boolean} [t] Set state manually
   */
  toggleMusic(t) {
    this.musicEnabled = typeof t === 'undefined' ? !this.musicEnabled : t === true;
    if ( this.musicElement ) {
      if ( this.musicEnabled ) {
        this.musicElement.play();
      } else {
        this.musicElement.pause();
      }
    }
  }

  /**
   * Sets the music volume
   * @param {Float} v Volume
   */
  setMusicVolume(v) {
    this.musicVolume = parseFloat(v);
    if ( this.musicElement ) {
      this.musicElement.volume = this.musicVolume;
    }

    console.info('Music volume now', this.musicVolume);
  }

  /**
   * Sets the sound volume
   * @param {Float} v Volume
   */
  setSoundVolume(v) {
    this.soundVolume = parseFloat(v);
    if ( this.soundGain ) {
      this.soundGain.gain.value = this.soundVolume;
    }

    console.info('Sound volume now', this.soundVolume);
  }

  /**
   * Plays given song
   * @param {String} filename Song filename
   * @param {Object} [options] Options
   * @param {Boolean} [options.loop=false] Loop
   * @param {Function} [cb] Callback when done
   */
  playSong(filename, options = {}, cb = null) {
    options = options || {};
    cb = cb || function() {};

    if ( this.musicElement ) {
      this.musicElement.pause();

      // This part is *very* important. Without it some browsers does not seem
      // to propery destroy the audio stream, leading to "pending" network requests
      try {
        this.musicElement.src = '';
        this.musicElement.load();
      } catch ( e ) {
        console.warn(e);
      }
    }

    const src = `${this.options.path}/${filename}.${this.options.format}`;
    console.debug('Requesting song', src);

    this.musicElement = new Audio(src);
    this.musicElement.volume = this.musicVolume;

    this.musicElement.addEventListener('ended', () => {
      if ( options.loop ) {
        this.musicElement.currentTime = 0;
        this.musicElement.play();
      } else {
        setTimeout(() => cb(true), 1);
      }
    });

    if ( !this.musicEnabled ) {
      setTimeout(() => cb(false), 1);
      return;
    }

    this.musicElement.addEventListener('error', () => {
      console.error('Failed to play', src);
      cb(false);
    });

    this.musicElement.addEventListener('canplay', () => {
      console.info('Playing', src);
      this.musicElement.play();
    });
  }

  /**
   * Plays given sound
   * @param {String} soundId Sound ID
   * @param {Object} [options] Options
   * @param {Float} [options.volume] Sound Volume
   * @param {Object} [options.source] Sound position source
   * @param {Number} [options.source.x] Sound source X
   * @param {Number} [options.source.y] Sound source Y
   * @param {Function} [cb] Callback when done
   */
  playSound(soundId, options = {}, cb = null) {
    options = options || {};
    cb = cb || function() {};

    if ( !this.context || !this.soundEnabled ) {
      // TODO: Fallback to regular Audio with URL
      cb(false);
      return;
    }

    if ( typeof this.soundHandler === 'function' ) {
      this.soundHandler(soundId, (id) => {
        this._playSound(id, options, cb);
      });
    } else if ( !this.audio[soundId] ) {
      console.warn('Sound not found in library', soundId);
      cb(false);
    } else {
      this._playSound(soundId, options, cb);
    }
  }

  _playSound(id, options, cb) {
    const queue = options.queue === true;
    if ( queue && this.soundsPlaying > 0 ) {
      this.soundQueue.push([id, options, cb]);
      return;
    }

    const contextId = this.soundsContextCounter;
    const volume = options.volume || 1.0;

    console.debug('Playing sound %s (%d) @ %s', id, contextId, volume);

    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(this.soundGain);

    const source = this.context.createBufferSource();
    source.buffer = this.audio[id];

    if ( typeof options.source !== 'undefined' && this.options.positionalAudio ) {
      const panNode = this.createPanNode(options.source);
      panNode.connect(gainNode);
      source.connect(panNode);

      this.soundsContexts[contextId] = panNode;
    } else {
      source.connect(gainNode);
    }

    source.addEventListener('ended', () => {
      this.soundsPlaying = Math.max(0, this.soundsPlaying - 1);

      delete this.soundsContexts[contextId];

      cb(true);
    });

    this.soundsContextCounter++;
    this.soundsPlaying++;

    source.start(0);
  }

  /**
   * Creates a new panner used for positional audio
   * @param {Object} options Options
   * @param {Number} objects.x X position
   * @param {Number} objects.y Y position
   * @return {PannerNode}
   */
  createPanNode(options) {
    const panner = this.context.createPanner();
    panner.panningModel = 'HRTF';
    panner.maxDistance = 10000;
    panner.refDistance = 100;

    const x = options.x;
    const y = options.y;

    console.debug('Positional sound @', [x, y]);

    panner.setPosition(x, y, 0);

    return panner;
  }

  /**
   * Sets the sound handler
   *
   * NOTE: This resets after scene changes
   *
   * @param {Function} fn Handler function
   */
  setSoundHandler(fn) {
    this.soundHandler = fn || null;
  }

}
