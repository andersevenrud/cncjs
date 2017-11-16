/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';

export default class OverlayObject extends MapObject {

  constructor(engine, args) {
    super(engine, {
      id: args.id,
      type: args.type || 'overlay',
      tileX: args.tileX,
      tileY: args.tileY,
      xOffset: args.xOffset,
      yOffset: args.yOffset
    }, engine.mix.getOverlay(args.id));

    this.tiberium = this.options.Tiberium ? 12 : 0;
    this.spriteColor = '#669999';
    this.isWall = ['sbag', 'cycl', 'brik', 'wood'].indexOf(this.id) !== -1;
  }

  update() {
    let f = 0;
    if ( this.isWall ) {
      const map = this.engine.scene.map;
      const top = map.queryGrid(this.tileX, this.tileY - 1, 'id', this.id, true);
      const bottom = map.queryGrid(this.tileX, this.tileY + 1, 'id', this.id, true);
      const left = map.queryGrid(this.tileX - 1, this.tileY, 'id', this.id, true);
      const right = map.queryGrid(this.tileX + 1, this.tileY, 'id', this.id, true);

      // FIXME
      f = (true ? 0 : 16) + (top ? 1 : 0) + (right ? 2 : 0) + (bottom ? 4 : 0) + (left ? 8 : 0);
    } else {
      f = this.options.Tiberium ? (this.tiberium - 1) : this.spriteFrame; // FIXME
    }

    this.spriteFrame = f;
  }
}
