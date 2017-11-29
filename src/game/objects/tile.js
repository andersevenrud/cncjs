/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import GameObject from 'engine/object';
import {TILE_SIZE} from 'game/globals';

export default class TileObject extends GameObject {

  constructor(engine, tileX, tileY, tileData) {
    super(engine, tileData[0]);

    this.tileX = tileX;
    this.tileY = tileY;
    this.x = tileX * TILE_SIZE;
    this.y = tileY * TILE_SIZE;
    this.spriteFrame = tileData[1];
    this.spriteColor = '#0000ff';
    this.spriteDebug = false;
  }

}
