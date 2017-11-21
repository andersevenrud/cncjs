/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Sprite from '../../engine/sprite';
import {tileFromPoint} from '../physics';
import {TILE_SIZE} from '../globals';

/**
 * Construction "Pattern" Object
 */
export default class ConstructObject {

  constructor(engine, entry, cb) {
    this.engine = engine;
    this.entry = entry;
    this.cb = cb;
    this.valid = false;
    this.pattern = null;
    this.x = null;
    this.y = null;
  }

  move(x, y) {
    this.x = x;
    this.y = y;
  }

  update() {
    if ( this.x === null || this.y === null ) {
      return;
    }

    const pattern = this.entry.OccupyList ? [...this.entry.OccupyList] : [[1]];
    const {offsetX, offsetY} = this.engine.getOffset();
    const {tileX, tileY} = tileFromPoint(this.x + offsetX, this.y + offsetY);

    if ( pattern ) {
      if ( this.entry.HasBib ) {
        pattern.push(Array(pattern[0].length).fill(1));
      }

      const result = [];
      const map = this.engine.scene.map;

      for ( let row = 0; row < pattern.length; row++ ) {
        for ( let col = 0; col < pattern[row].length; col++ ) {
          const num = pattern[row][col];
          if ( num > 0 ) {
            let spriteImage;

            const valid = map.queryGrid(tileX + col, tileY + row, 'value') === 0;
            if ( valid ) {
              if ( num === 2 ) {
                spriteImage = Sprite.instance('trans').createImage(1);
              } else {
                spriteImage = Sprite.instance('trans').createImage(0);
              }
            } else {
              spriteImage = Sprite.instance('trans').createImage(2);
            }

            result.push({
              valid,
              sprite: spriteImage,
              x: this.x + (col * TILE_SIZE),
              y: this.y + (row * TILE_SIZE),
              w: TILE_SIZE,
              h: TILE_SIZE
            });
          }
        }
      }

      this.pattern = result;
      this.valid = result.filter(iter => iter.valid === false).length === 0;
    } else {
      // FIXME
      this.pattern = null;
      this.valid = true;
    }
  }

  render(target) {
    if ( this.x !== null && this.y !== null ) {
      for ( let i = 0; i < this.pattern.length; i++ ) {
        const p = this.pattern[i];
        target.fillStyle = target.createPattern(p.sprite, 'repeat');
        target.fillRect(p.x, p.y, p.w, p.h);
      }
    }
  }

}
