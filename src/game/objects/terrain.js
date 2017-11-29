/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from 'game/theater/mapobject';

export default class TerrainObject extends MapObject {

  constructor(engine, args) {
    super(engine, {
      id: args.id,
      type: 'terrain',
      tileX: args.tileX,
      tileY: args.tileY
    }, engine.data.terrain[args.id]);

    this.spriteColor = '#663300';
  }

  update() {
    // null
  }

}
