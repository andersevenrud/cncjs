/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';

export default class TerrainObject extends MapObject {

  constructor(engine, args) {
    super(engine, {
      id: args.id,
      type: 'terrain',
      tileX: args.tileX,
      tileY: args.tileY
    }, engine.mix.getTerrain(args.id));

    this.spriteColor = '#663300';
  }

  update() {
    // null
  }

}
