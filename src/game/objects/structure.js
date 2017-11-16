/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';
import Sprite from '../../engine/sprite';
import Animation from '../../engine/animation';
import {TILE_SIZE} from '../globals';

export default class StructureObject extends MapObject {

  constructor(engine, args) {
    super(engine, args, engine.mix.getObject(args.id));

    this.constructionSprite = this.options.Buildable ? Sprite.instance(args.id + 'make') : null;
    this.constructed = !engine.scene.loaded;
    this.constructing = !!this.constructionSprite && !this.constructed;
    this.deconstructing = false;
    this.animation = this.sprite && this.sprite.render ? new Animation({}) : null;

    if ( !Object.keys(this.animations).length ) {
      this.animations = { // FIXME
        Idle: {frames: 1}
      };
    }

    if ( this.options.HasBib ) {
      this.bibCanvas = document.createElement('canvas');
      this.bibContext = this.bibCanvas.getContext('2d');

      const [tmpSizeX, tmpSizeY] = this.options.Dimensions.split('x').map(i => parseInt(i, 10));

      const bibId = tmpSizeX > 3 ? 1 : (tmpSizeX > 2 ? 2 : 3);
      const bib = Sprite.instance('bib' + String(bibId));
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

    if ( this.constructing ) {
      this.setAnimation('make', {
        sprite: this.constructionSprite
      });
    }

    if ( this.engine.scene.loaded && this.isFriendly() ) {
      this.engine.sounds.playSound('constru2');
    }
  }

  sell() {
    this.deconstructing = true;

    this.setAnimation('unmake', {
      sprite: this.constructionSprite,
      reverse: true
    });

    if ( this.isFriendly() ) {
      this.engine.sounds.playSound('cashturn');
    }
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

    if ( this.deconstructing ) {
      if ( this.animation.isFinished() ) {
        this.deconstructing = false;

        this.destroy();
        return;
      }
    } else if ( this.constructed || (this.constructing && this.animation.isFinished()) ) {
      this.constructing = false;
      this.constructed = true;

      this.setAnimation('Idle', {
        loop: true,
        sprite: this.sprite
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

  isSellable() {
    return this.isFriendly();
  }

  isRepairable() {
    return this.isFriendly(); // FIXME
  }

}
