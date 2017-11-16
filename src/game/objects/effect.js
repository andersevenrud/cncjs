/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';
import Animation from '../../engine/animation';

export default class EffectObject extends MapObject {

  constructor(engine, args) {
    super(engine, Object.assign({}, args, {
      type: 'effect'
    }), engine.mix.getOverlay(args.id));

    this.spriteColor = '#ff9900';
    this.animation = new Animation({
      sprite: this.sprite,
      name: args.id,
      repeat: args.repeat === true
    });
  }

  update() {
    this.animation.update();
    if ( !this.animation.loop && this.animation.isFinished() ) {
      this.destroy();
    }
  }
}
