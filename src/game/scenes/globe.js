/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import GameScene from '../scene';
import Sprite from '../../engine/sprite';

export default class GlobeScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);

    this.sprite = null;
    this.spriteIndex = 0;
    this.stage = 0;
  }

  async load() {
    const spriteNames = [
      'sprite:e-bwtocl', // spinning earth
      'sprite:greyerth', // spinning earth
      'sprite:hbosnia', // zoom on bosnia
      'sprite:hearth_a', // zoom on africa
      'sprite:africa', // african mission selection
      'sprite:hsafrica', // zoom on south africa
      'sprite:hearth_e', // zoom on europe
      'sprite:europe' // european mission selection

      /*
      'click_a', // african hotspots
      'click_e', // european hotspots
      'click_eb', // bosnian hotspots
      'click_sa' // south african hotspots
      */

      //'bosnia', // zoom on bosnia
      //'s_africa' // zoom on south africa
    ];

    await super.load(spriteNames);

    this.engine.sounds.playSong('loopie6m', {loop: true});

    console.log(this);
  }

  update() {
    super.update(...arguments);

    if ( this.stage < 2 ) {
      this.sprite = this.stage === 0
        ? Sprite.instance('e-bwtocl')
        : Sprite.instance('hearth_e');

      const index = Math.round(this.spriteIndex);
      if ( index < this.sprite.count - 1 ) {
        this.spriteIndex += .5;
      } else {
        this.spriteIndex = 0;
        this.stage++;

        console.debug('Advanced to globe stage', this.stage);
      }
    }

    if ( this.stage >= 2 ) {
      // TODO
      this.spriteIndex = 0;
      this.sprite = Sprite.instance('europe');

      if ( this.engine.mouse.buttonDown('LEFT') || this.engine.keyboard.keyDown() ) {
        this.destroy();
      }
    }
  }

  render(target, delta) {
    const {vw, vh} =  this.getViewport();

    if ( this.sprite ) {
      this.sprite.renderFilled(target, vw, vh, Math.round(this.spriteIndex));
    }

    if ( this.stage === 2 ) {
      // FIXME
      const text = 'Sorry this is not done. Press any key to continue...';

      target.fillStyle = '#ff0000';
      target.font = '12px Monospace';
      target.textBaseline = 'middle';
      target.textAlign = 'center';
      target.fillText(text, vw / 2, vh / 2);
    }

    super.render(...arguments);
  }

}
