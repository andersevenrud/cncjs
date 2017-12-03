/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Sprite from 'engine/sprite';
import {TILE_SIZE} from 'game/globals';

let CACHE = {};

/**
 * Building underlay Class
 */
export default class Bib {

  constructor(theatre, bibId) {
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');

    const bib = Sprite.instance(`${theatre}/bib${bibId}`);
    const sizeX = bib.count / 2;
    const sizeY = 2;

    this.canvas.width = sizeX * TILE_SIZE;
    this.canvas.height = sizeY * TILE_SIZE;

    let i = 0;
    for ( let y = 0; y < sizeY; y++ ) {
      for ( let x = 0; x < sizeX; x++ ) {
        bib.render(this.context, x * TILE_SIZE, y * TILE_SIZE, i);
        i++;
      }
    }
  }

  /**
   * Draws the Bib onto target
   *
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} x X position
   * @param {Number} y Y position
   */
  render(target, x, y) {
    if ( this.canvas ) {
      target.drawImage(this.canvas, x, y);
    }
  }

  /**
   * Gets given Bib instance
   * @param {Number} id Bib Id
   * @return {Bib}
   */
  static instance(id) {
    return CACHE[id];
  }

  /**
   * Preloads given Bib
   * @param {String} theatre Theatre pack
   * @param {Number} id Bib Id
   */
  static preload(theatre, id) {
    console.debug('Creating new bib', theatre, id);
    CACHE[id] = new Bib(theatre, id);
  }

  /**
   * Destroys the Sprite cache
   */
  static destroyCache() {
    console.info('Destroying Bib sprite cache');

    CACHE = {};
  }
}
