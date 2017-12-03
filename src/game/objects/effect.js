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
      type: 'effect',
      path: 'CONQUER.MIX'
    }), engine.data.overlays[args.id]);

    this.spriteColor = '#ff9900';
    this.repeat = args.repeat === true;
  }

  async load() {
    await super.load();

    this.animation = new Animation({
      sprite: this.sprite,
      name: this.id,
      repeat: this.repeat === true
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
