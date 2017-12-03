/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from 'game/theater/mapobject';

export default class TerrainObject extends MapObject {

  constructor(engine, args) {
    const theatre = engine.scene.level.theatre;
    super(engine, {
      id: args.id,
      type: 'terrain',
      path: theatre,
      tileX: args.tileX,
      tileY: args.tileY
    }, engine.data.terrain[args.id]);

    this.spriteColor = '#663300';
  }

  update() {
    // null
  }

}
