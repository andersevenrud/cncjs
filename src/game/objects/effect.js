/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';

export default class EffectObject extends MapObject {

  constructor(engine, args) {
    super(engine, Object.assign({}, args, {
      type: 'effect'
    }), engine.mix.getOverlay(args.id));

    this.repeat = args.repeat === true;
    this.spriteColor = '#ff9900';
  }

  update() {
    if ( this.currentAnimationTime >= 4 ) { // FIXME
      this.currentAnimationTime = 0;
      this.spriteFrame++;

      if ( this.spriteFrame > this.sprite.count ) {
        if ( this.repeat ) {
          this.spriteFrame = 0;
        } else {
          this.destroy();
          return;
        }
      }
    }

    this.currentAnimationTime++;
  }
}
