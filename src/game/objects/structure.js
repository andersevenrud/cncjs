/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';
import Sprite from '../../engine/sprite';
import {TILE_SIZE} from '../../engine/globals';

export default class StructureObject extends MapObject {

  constructor(engine, args) {
    super(engine, args, engine.mix.getObject(args.id));

    this.currentAnimation = 'Idle';

    if ( this.options.HasBib ) {
      this.bibCanvas = document.createElement('canvas');
      this.bibContext = this.bibCanvas.getContext('2d');

      const [tmpSizeX, tmpSizeY] = this.options.Dimensions.split('x').map(i => parseInt(i, 10));

      const bibId = tmpSizeX > 3 ? 1 : (tmpSizeX > 2 ? 2 : 3);
      const bib = Sprite.getFile('bib' + String(bibId));
      const sizeX = bib.count / 2;
      const sizeY = 2;

      this.bibCanvas.width = sizeX * TILE_SIZE;
      this.bibCanvas.height = sizeY * TILE_SIZE;
      this.bibOffsetY = (tmpSizeY - 1) * TILE_SIZE;

      let i = 0;
      for ( let y = 0; y < sizeY; y++ ) {
        for ( let x = 0; x < sizeX; x++ ) {
          bib.render(this.bibContext, x * TILE_SIZE, y * TILE_SIZE, i);
          i++;
        }
      }
    }

    this.spriteColor = this.isFriendly() ? '#00ff00' : '#ff0000';
  }

  update() {
    if ( this.health <= 0 && !this.destroying ) {
      this.engine.sounds.playSound('xplobig4');
      this.engine.scene.map.addEffect({
        id: 'art-exp1',
        tileX: this.tileX,
        tileY: this.tileY
      });
    }

    super.update();
  }

  renderOverlay(target, delta) {
    if ( this.bibCanvas ) {
      const rect = this.getRect(true);
      target.drawImage(this.bibCanvas, rect.x, rect.y + this.bibOffsetY);
    }
  }

}
