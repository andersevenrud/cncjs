/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Bib from './bib';
import MapObject from 'game/theater/mapobject';
import Sprite from 'engine/sprite';
import Animation from 'engine/animation';
import {TILE_SIZE, WALLS} from 'game/globals';

const DAMAGE_SUFFIX = ['', '-Damaged', '-Destroyed'];

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

    if ( !this.isWall ) {
      this.constructionSprite = engine.scene.loaded ? Sprite.instance(args.id + 'make') : null;
      this.constructing = !!this.constructionSprite && engine.scene.loaded;
      this.constructed = !this.constructing;
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
          step: 0.25,
          sprite: this.constructionSprite
        });
      }

      if ( this.engine.scene.loaded && this.isFriendly() ) {
        this.engine.sounds.playSound('constru2', {source: this});
      }
    }
  }

  die() {
    if ( !this.destroying ) {
      this.engine.sounds.playSound('crumble', {source: this});

      this.map.addEffect({
        id: 'art-exp1',
        x: this.x + (this.width / 2),
        y: this.y + (this.height / 2)
      });

      this.destroy();
    }
  }

  sell() {
    this.deconstructing = true;

    this.setAnimation('unmake', {
      step: 0.25,
      sprite: this.constructionSprite,
      reverse: true
    });

    if ( this.isFriendly() ) {
      this.engine.sounds.playSound('cashturn', {source: this});
    }

    if ( this.player && this.options.Cost ) {
      this.player.addCredits(this.options.Cost);
    }
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
      if ( this.health <= 0 ) {
        this.die();
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

        const animationName = 'Idle' + DAMAGE_SUFFIX[this.getDamageState()];
        this.setAnimation(this.animations[animationName] ? animationName : 'Idle', {
          step: 0.25,
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

}
