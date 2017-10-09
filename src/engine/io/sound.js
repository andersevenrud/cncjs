/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import {randomInteger} from '../util';

/**
 * Sound Manager Class
 */
export default class Sound {

  /**
   * @param {Engine} engine Game Engine reference
   */
  constructor(engine) {
    this.engine = engine;
    this.musicElement = null;
    this.soundEnabled = false;
    this.soundVolume = 0.9;
    this.musicEnabled = false;
    this.musicVolume = 1.0;
    this.soundDebounce = {};
    this.soundLibrary = {};

    console.log('Sound::constructor()');
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
    this.soundLibrary = {};
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
  }

  /**
   * Sets the sound volume
   * @param {Float} v Volume
   */
  setSoundVolume(v) {
    this.soundVolume = parseFloat(v);
  }

  /**
   * Plays given song
   * @param {String} filename Song filename
   * @param {String} [type=music] Type
   * @param {Boolean} [loop=false] Loop
   * @return {Promise<src, Error>}
   */
  playSong(filename, type = 'music', loop = false) {
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

    const src = `${type}/${filename}.wav`;
    console.debug('Requesting song', src);

    this.musicElement = new Audio(src);
    this.musicElement.volume = this.musicVolume;

    if ( loop ) {
      this.musicElement.addEventListener('ended', () => {
        this.musicElement.currentTime = 0;
        this.musicElement.play();
      });
    }

    if ( !this.musicEnabled ) {
      return Promise.resolve(this.musicElement);
    }

    return new Promise((resolve, reject) => {
      this.musicElement.addEventListener('canplay', () => {
        console.info('Playing song', src);
        this.musicElement.play();
        resolve(this.musicElement);
      });

      this.musicElement.addEventListener('error', reject);
    });
  }

  /**
   * Plays given sound
   * @param {String} soundId Sound ID
   * @param {Float} [volume] Sound Volume
   */
  playSound(soundId, volume) {
    volume = volume || this.soundVolume;

    if ( !this.soundEnabled ) {
      return;
    }

    const origSoundId = soundId;
    const sound = this.soundLibrary[soundId];

    if ( sound ) {
      const tmp = sound.count;
      const index = tmp instanceof Array ? randomInteger(0, tmp.length - 1) : randomInteger(1, tmp);
      soundId += (sound.separator || '') + String(tmp instanceof Array ? tmp[index] : index);

      // FIXME: This is here because usually it's the "multiple" ones we don't want
      if ( typeof this.soundDebounce[origSoundId] !== 'undefined' ) {
        clearTimeout(this.soundDebounce[origSoundId]);
        delete this.soundDebounce[origSoundId];
      }
    }

    const src = `sounds/${soundId}.wav`;

    this.soundDebounce[origSoundId] = setTimeout(() => {
      console.debug('Playing sound', src);
      const audio = new Audio(src);
      audio.volume = volume;
      audio.play();
    }, 10);
  }

  /**
   * Sets the sound library
   * @param {Object} lib Library
   */
  setSoundLibrary(lib) {
    this.soundLibrary = lib || {};
  }
}
