/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

/**
 * Game Engine Configuration Handler Class
 */
export default class Configuration {

  /**
   * @param {Object} [options] Game Options
   * @param {Object} config Configuration tree to merge
   */
  constructor(options, config) {
    config = config || {};

    /**
     * Configuration tree
     * @type {Object}
     */
    this.configuration = Object.assign({}, {
      soundVolume: 0.9,
      musicVolume: 1.0,
      audio: options.debug === 0,
      scale: options.scale || 2,
      keymap: {}
    }, config);

    console.info('Created configuration', this.configuration);

    this.debounce = null;
  }

  /**
   * Loads configuration
   */
  async load() {
    // TODO
  }

  /**
   * Saves configuration
   */
  async save() {
    // TODO
  }

  /**
   * Sets a configuration entry
   * @param {String} key Configuration key
   * @param {*} value Configuration value
   */
  async setConfig(key, value) {
    if ( typeof this.configuration[key] !== 'undefined' ) {
      this.configuration[key] = value;
    }

    clearTimeout(this.debounce);
    this.debounce = setTimeout(() => this.save(), 10);
  }

  /**
   * Gets configuration entry
   * @param {String} [key] Configuration key
   * @param {*} [defaultValue] Default value if none was found
   * @return {*} If no key was give, entire tree is returned
   */
  getConfig(key, defaultValue) {
    let value = Object.assign({}, this.configuration);

    if ( typeof key !== 'undefined' ) {
      value = value[key];
      if ( typeof value === 'undefined' ) {
        return defaultValue;
      }
    }

    return value;
  }

  /**
   * Gets a key from map
   * @param {String} mapName Mapped key name
   * @return {String}
   */
  getKey(mapName) {
    return this.configuration.keymap[mapName];
  }

}
