/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import GameScene from '../scene';
import Sprite from '../../engine/sprite';

// TODO
export default class ScoreScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);

    this.sprite = null;
    this.spriteIndex = 0;
  }

  async load() {
    await super.load([
      's-gdiin2',
      'scrscn1'
    ]);

    this.engine.sounds.playSong('win1', 'music', true);

    this.sprite = Sprite.getFile(this.options.player === 'GoodGuy' ? 's-gdiin2' : 'scrscn1');
  }

  update(options) {
    super.update(...arguments);

    const mouseClick = this.engine.mouse.buttonClicked('LEFT');
    const keyClick = this.engine.keyboard.keyClicked();
    if ( mouseClick || keyClick ) {
      this.destroy();
      return;
    }

    if ( Math.ceil(this.spriteIndex) < this.sprite.count ) {
      this.spriteIndex = (this.spriteIndex + .5);
    }
  }

  render(target, delta) {
    if ( this.sprite ) {
      const {vw, vh} =  this.getViewport();
      this.sprite.renderFilled(target, vw, vh, Math.floor(this.spriteIndex));
    }

    super.render(...arguments);
  }

}
