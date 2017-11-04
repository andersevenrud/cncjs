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

    this.earthSprite = null;
    this.zoomSprite = null;
    this.selectSprite = null;
    this.clickSprite = null;
    this.sprite = null;
    this.spriteIndex = 0;
    this.stage = 0;
  }

  async load() {
    const spriteNames = [
      'e-bwtocl', // spinning earth
      'greyerth', // spinning earth
      'hbosnia', // zoom on bosnia
      'hearth_a', // zoom on africa
      'africa', // african mission selection
      'hsafrica', // zoom on south africa
      'hearth_e', // zoom on europe
      'europe' // european mission selection

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

    this.earthSprite = await Sprite.loadFile(this.engine, 'e-bwtocl');
    this.zoomSprite = await Sprite.loadFile(this.engine, 'hearth_e');
    this.selectSprite = await Sprite.loadFile(this.engine, 'europe');

    this.engine.sounds.playSong('loopie6m', 'music', true);

    console.log(this);
  }

  update() {
    super.update(...arguments);

    if ( this.stage < 2 ) {
      this.sprite = this.stage === 0 ? this.earthSprite : this.zoomSprite;

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
      this.sprite = this.selectSprite;

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
