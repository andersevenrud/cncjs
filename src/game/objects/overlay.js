/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from 'game/theater/mapobject';
import {WALLS} from 'game/globals';

export default class OverlayObject extends MapObject {

  constructor(engine, args) {
    const theatre = engine.scene.level.theatre;
    const isWall = WALLS.indexOf(args.id) !== -1;

    super(engine, {
      id: args.id,
      type: args.type || 'overlay',
      path: isWall ? 'CONQUER.MIX' : theatre,
      tileX: args.tileX,
      tileY: args.tileY
    }, engine.data.overlays[args.id]);

    this.spriteColor = '#669999';
    this.isWall = isWall;
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
