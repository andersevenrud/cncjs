/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from 'game/theater/mapobject';
import Animation from 'engine/animation';

export default class EffectObject extends MapObject {

  constructor(engine, args) {
    super(engine, Object.assign({}, args, {
      type: 'effect'
    }), engine.data.overlays[args.id]);

    this.spriteColor = '#ff9900';
    this.animation = new Animation({
      sprite: this.sprite,
      name: args.id,
      repeat: args.repeat === true
    });

    this.x -= (this.sprite.width / 2);
    this.y -= (this.sprite.height / 2);
  }

  update() {
    this.animation.update();

    if ( !this.animation.loop && this.animation.isFinished() ) {
      this.destroy();
    }
  }
}
