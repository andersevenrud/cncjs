/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';
import {WALLS} from '../globals';

export default class OverlayObject extends MapObject {

  constructor(engine, args) {
    super(engine, {
      id: args.id,
      type: args.type || 'overlay',
      tileX: args.tileX,
      tileY: args.tileY,
      xOffset: args.xOffset,
      yOffset: args.yOffset
    }, engine.data.overlays[args.id]);

    this.spriteColor = '#669999';
    this.isWall = WALLS.indexOf(this.id) !== -1;
    this.isTiberium = this.options.Tiberium;
  }

  update() {
    if ( this.isWall ) {
      const {left, right, bottom, top} = this.checkSurrounding();
      this.spriteFrame = (true ? 0 : 16) + (top ? 1 : 0) + (right ? 2 : 0) + (bottom ? 4 : 0) + (left ? 8 : 0); // FIXME
    } else if ( this.isTiberium ) {
      this.spriteFrame = 11; // FIXME
    }
  }
}
