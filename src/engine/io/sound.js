/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

const WebAudioAPI = window.AudioContext || window.webkitAudioContext || window.mozAudioContext;

/**
 * Sound Manager Class
 */
export default class Sound {

  /**
   * @param {Engine} engine Game Engine reference
   */
  constructor(engine) {
    this.engine = engine;
    this.soundEnabled = false;
    this.soundVolume = 0.9;
    this.soundsPlaying = 0;
    this.musicEnabled = false;
    this.musicVolume = 1.0;
    this.musicElement = null;
    this.soundQueue = [];
    this.soundHandler = null;

    this.context = WebAudioAPI ? new WebAudioAPI() : null;
    this.audio = {};

    console.log('Sound::constructor()');
  }

  /**
   * Preloads an audio file
   * @param {String} name Audio name
   */
  async preload(name) {
    const src = `audio/${name}.wav`;

    try {
      const raw = await this.engine.mix.getDataFile(src);
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

    const src = `audio/${filename}.wav`;
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
   * @param {Function} [cb] Callback when done
   */
  playSound(soundId, options = {}, cb = null) {
    options = options || {};
    cb = cb || function() {};

    if ( !this.context || !this.soundEnabled ) {
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

    console.debug('Playing sound', id);

    const volume = options.volume || this.soundVolume;

    const gainNode = this.context.createGain();
    gainNode.gain.value = volume;
    gainNode.connect(this.context.destination);

    const source = this.context.createBufferSource();
    source.buffer = this.audio[id];
    source.connect(gainNode);
    source.addEventListener('ended', () => {
      this.soundsPlaying = Math.max(0, this.soundsPlaying - 1);
      cb(true);
    });

    this.soundsPlaying++;
    source.start(0);
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
