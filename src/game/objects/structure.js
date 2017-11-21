/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Bib from './bib';
import MapObject from '../mapobject';
import Sprite from '../../engine/sprite';
import Animation from '../../engine/animation';
import {TILE_SIZE, WALLS} from '../globals';

export default class StructureObject extends MapObject {

  constructor(engine, args) {
    super(engine, args, engine.data.structures[args.id]);

    this.isWall = WALLS.indexOf(this.id) !== -1;
    this.bib = null;
    this.constructed = this.isWall;
    this.constructing = this.constructed;
    this.deconstructing = false;
    this.bibOffsetY = null;
    this.constructionSprite = null;
    this.animation = null;
    this.spriteColor = this.isFriendly() ? '#00ff00' : '#ff0000';

    if ( !this.isWall ) {
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
        const [tmpSizeX, tmpSizeY] = this.options.Dimensions.split('x').map(i => parseInt(i, 10));
        const bibId = tmpSizeX > 3 ? 1 : (tmpSizeX > 2 ? 2 : 3);

        this.bib = Bib.instance(bibId);
        this.bibOffsetY = (tmpSizeY - 1) * TILE_SIZE;
      }

      if ( this.constructing ) {
        this.setAnimation('make', {
          sprite: this.constructionSprite
        });
      }

      if ( this.engine.scene.loaded && this.isFriendly() ) {
        this.engine.sounds.playSound('constru2', {source: this});
      }
    }
  }

  sell() {
    this.deconstructing = true;

    this.setAnimation('unmake', {
      sprite: this.constructionSprite,
      reverse: true
    });

    if ( this.isFriendly() ) {
      this.engine.sounds.playSound('cashturn', {source: this});
    }

    return this.options.Cost;
  }

  update() {
    if ( this.isWall ) {
      const {left, right, bottom, top} = this.checkSurrounding();

      if ( this.health <= 0 ) {
        if ( !this.destroying ) {
          this.destroy();
        }
      }

      this.spriteFrame = (true ? 0 : 16) + (top ? 1 : 0) + (right ? 2 : 0) + (bottom ? 4 : 0) + (left ? 8 : 0); // FIXME
    } else {
      if ( this.health <= 0 && !this.destroying ) {
        this.engine.sounds.playSound('xplobig4', {source: this});

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
    }

    super.update();
  }

  renderOverlay(target, delta) {
    if ( this.bib ) {
      const rect = this.getRect(true);
      this.bib.render(target, rect.x, rect.y + this.bibOffsetY);
    }
  }

  isSellable() {
    return this.isFriendly();
  }

  isRepairable() {
    return this.isFriendly(); // FIXME
  }

}
