/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import GameScene from '../scene';
import {collidePoint} from '../../engine/physics';

export default class ChooseScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);
    this.spriteIndex = 0;
  }

  update() {
    super.update(...arguments);

    const click = this.engine.mouse.buttonClicked('LEFT');
    if ( click ) {
      const {vw, vh} =  this.getViewport();
      const [width, height] = this.sprite ? this.sprite.getSize() : [vw, vh];
      const ratio = Math.min(vw / width, vh / height);
      const left = (vw - (width * ratio)) / 2;

      const gdiRect = {
        x1: left,
        x2: left  + (160 * ratio),
        y1: 0,
        y2: vh
      };

      const nodRect = {
        x1: (vw / 2),
        x2: (vw / 2) + (160 * ratio),
        y1: 0,
        y2: vh
      };

      if ( collidePoint(click, gdiRect) ) {
        this.destroy({team: 'GDI'});
      } else if ( collidePoint(click, nodRect) ) {
        this.destroy({team: 'NOD'});
      }
    }

    if ( this.sprite ) {
      this.spriteIndex = (this.spriteIndex + .5) % this.sprite.count;
    }
  }

  render(target, delta) {
    if ( this.sprite ) {
      const [width, height] = this.sprite.getSize();
      const {vw, vh} =  this.getViewport();
      const ratio = Math.min(vw / width, vh / height);
      const cx = (vw / 2) - (width * ratio / 2);

      this.sprite.renderScaled(target, cx, 0, width * ratio, height * ratio, Math.floor(this.spriteIndex));

      /*
      const left = (vw - (width * ratio)) / 2;
      target.strokeStyle = '#ff0000';
      target.strokeRect(left, 0, 160 * ratio, vh);
      target.strokeRect((vw / 2), 0, 160 * ratio, vh);
      */
    }
    super.render(...arguments);
  }

  async load() {
    await super.load([
      'choose'
    ]);

    this.sprite = Sprite.getFile('choose');
    this.engine.sounds.playSong('struggle', 'music', true);
  }

}
