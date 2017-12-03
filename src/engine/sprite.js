/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import {loadImage} from './util';

let CACHE = {};

/**
 * Sprite Instance Class
 */
export default class Sprite {

  /**
   * @param {String} filename The sprite URI
   * @param {Number[]} size The sprite size
   * @param {Number[]} clip The sprite clip area
   * @param {Number} count Number of frames in sprite
   */
  constructor(filename, size, clip, count = 1) {
    const [w, h] = size;

    /**
     * Sprite canvas
     * @type {HTMLCanvasElement}
     */
    this.canvas = document.createElement('canvas');

    /**
     * Sprite Filename
     * @type {String}
     */
    this.filename = filename;

    /**
     * Sprite frame count
     * @type {Number}
     */
    this.count = count;

    /**
     * Sprite frame width
     * @type {Number}
     */
    this.width = w;

    /**
     * Sprite frame height
     * @type {Number}
     */
    this.height = h;

    /**
     * Sprite clip parameters
     * @type {Number[]}
     */
    this.clip = clip;

    /**
     * Sprite image caches
     * @type {Image[]}
     */
    this.imageCache = [];
  }

  /**
   * Loads the Sprite
   * @param {Engine} engine Game Engine
   * @param {String} [type] Sprite type
   * @return {Boolean}
   */
  async load(engine, type) {
    const asset = await engine.zip.getDataFile(this.filename);
    const url = URL.createObjectURL(asset);
    const img = await loadImage(url);

    this.canvas.width = img.width;
    this.canvas.height = img.height;

    if ( img.width > 32767 || img.height > 32767 ) {
      console.warn('The sprite', this.filename, 'is exceeding the browser pixel limit!');
    }

    const context = this.canvas.getContext('2d');
    context.mozImageSmoothingEnabled = false;
    context.webkitImageSmoothingEnabled = false;
    context.msImageSmoothingEnabled = false;
    context.imageSmoothingEnabled = false;
    context.drawImage(img, 0, 0);

    try {
      URL.revokeObjectURL(url);
    } catch ( e ) {
      console.warn(e);
    }

    console.debug('Sprite::load()',  type, this.filename, [img.width, img.height]);

    return true;
  }

  /**
   * Draws the Sprite onto target
   *
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} dx Desination X
   * @param {Number} dy Destination Y
   * @param {Number} [frame=0] Sprite image frame (column)
   * @param {Number} [row=0] The row (color variant)
   */
  render(target, dx, dy, frame = 0, row = 0) {
    const [w, h] = this.getSize();
    const [sx, sy] = this.getFrameOffset(frame, row);

    target.drawImage(this.canvas, sx, sy, w, h, dx, dy, w, h);
  }

  /**
   * Draws the Sprite onto target, but scaled
   *
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} dx Desination X
   * @param {Number} dy Destination Y
   * @param {Number} dw Destination width
   * @param {Number} dh Destination height
   * @param {Number} [frame=0] Sprite image frame (column)
   * @param {Number} [row=0] The row (color variant)
   */
  renderScaled(target, dx, dy, dw, dh, frame = 0, row = 0) {
    const [w, h] = this.getSize();
    const [sx, sy] = this.getFrameOffset(frame, row);

    target.drawImage(this.canvas, sx, sy, w, h, dx, dy, dw, dh);
  }

  /**
   * Draws the Sprite onto target, but scaled to fill (and centered)
   *
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} dw Destination width
   * @param {Number} dh Destination height
   * @param {Number} [frame=0] Sprite image frame (column)
   * @param {Number} [row=0] The row (color variant)
   * @return {Object} The rectangle it made
   */
  renderFilled(target, dw, dh, frame = 0, row = 0) {
    // TODO: Portrait mode
    // TODO: Make sure it does not overflow
    const [width, height] = this.getSize();

    const h = dh;
    const w = dh * (width / height);
    const x = (dw / 2) - (w / 2);
    const y = 0;

    this.renderScaled(target, x, y, w, h, frame, row);

    return {w, h, x, y};
  }

  /**
   * Creates Image from given frame
   * @param {Number} [frame=0] Sprite image frame
   * @return {HTMLImageElement}
   */
  createImage(frame = 0) {
    if ( !this.imageCache[frame] ) {
      const img = new Image();
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;

      const context = canvas.getContext('2d');
      this.render(context, 0, 0, frame);

      img.src = canvas.toDataURL('image/png');
      this.imageCache[frame] = img;
    }

    return this.imageCache[frame];
  }

  /**
   * Gets the offset of a sprite frame
   * @param {Number} [frame=0] Sprite image frame (column)
   * @param {Number} [row=0] The row (color variant)
   * @return {Number[]}
   */
  getFrameOffset(frame = 0, row = 0) {
    row = Math.max(0,  row); // -1 from 'no team'

    const sx = (row * this.width);
    const sy = (frame * this.height);
    return [sx, sy];
  }

  /**
   * Gets the size of a frame
   * @return {Number[]}
   */
  getSize() {
    return [this.width, this.height];
  }

  /**
   * Loads given sprite from file
   *
   * @param {Engine} engine Engine reference
   * @param {String} name Sprite name
   * @return {Sprite}
   */
  static async preload(engine, name) {

    if ( !CACHE[name] ) {
      const tempName = name.split('/').reverse()[0];
      const found = engine.spriteLibrary[name] || engine.spriteLibrary[tempName];

      if ( found ) {
        const {type, size, clip, count} = found;
        const sprite = new Sprite(`sprites/${name}.png`, size, clip, count);
        await sprite.load(engine, type);

        CACHE[name] = sprite;
      }
    }

    return CACHE[name];
  }

  /**
   * Get a sprite instance by name
   * @param {String} name The sprite ID
   * @return {Sprite}
   */
  static instance(name) {
    return CACHE[name];
  }

  /**
   * Destroys the Sprite cache
   */
  static destroyCache() {
    console.info('Destroying sprite cache');

    CACHE = {};
  }

  /**
   * Get number of entries in cache
   * @return {Number}
   */
  static getCacheCount() {
    return Object.keys(CACHE).length;
  }

}
