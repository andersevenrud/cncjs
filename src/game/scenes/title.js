/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import GameScene from '../scene';
import Sprite from '../../engine/sprite';
import {loadImage} from '../../engine/util';
import {collidePoint} from '../../engine/physics';

export default class TitleScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);

    this.tileImage = null;
  }

  update() {
    const click = this.engine.mouse.buttonClicked('LEFT');
    if ( click ) {
      this.getUIElements().forEach(el => {
        const box = {
          x1: el.x,
          y1: el.y,
          x2: el.w + el.x,
          y2: el.h + el.y
        };

        if ( collidePoint(click, box) ) {
          el.cb();
        }
      });
    }
    super.update(...arguments);
  }

  render(target, delta) {
    const {vw, vh} =  this.getViewport();

    if ( this.titleImage ) {
      const {width, height} = this.titleImage;
      const ratio = Math.min(vw / width, vh / height);
      const cx = (vw / 2) - (width * ratio / 2);

      target.drawImage(this.titleImage, 0, 0, width, height, cx, 0, width * ratio, height * ratio);
      target.lineWidth = 1;

      const elements = this.getUIElements();
      elements.forEach((el) => {
        const {x, y, w, h, type} = el;

        target.fillStyle = type === 'button' ? '#111111' : '#000000';
        target.strokeStyle = '#a0a7a0';
        target.fillRect(x, y, w, h);

        if ( type === 'box' ) {
          const sprite = Sprite.getFile('options');
          target.strokeRect(x + .5, y + .5, w, h);
          const spriteSpace = 10;
          const spriteTop = -(sprite.height / 2) + spriteSpace;
          sprite.render(target, x - (sprite.width / 2) + spriteSpace, spriteTop, 0);
          sprite.render(target, x + w - (sprite.width / 2) - spriteSpace, spriteTop, 1);
        } else if ( type === 'button' ) {
          const backTexture = Sprite.getFile('btexture').createImage(1);
          const ptrn = target.createPattern(backTexture, 'repeat');
          target.fillStyle = ptrn;
          target.fillRect(x + 1, y + 1, w - 2, h - 2);

          target.moveTo(x, y);
          target.lineTo(x + w, y);
          target.moveTo(x, y);
          target.lineTo(x, y + h);
          target.stroke();

          target.fillStyle = '#50f850'; // #50af20
          target.font = String(h) + 'px cnc';

          const textOffset = target.measureText(el.label).width;
          target.fillText(el.label, x + (w / 2) - textOffset / 2, y + (h / 2) + (4 * ratio));
        }
      });
    }

    const versionText = `Version ${this.engine.options.version} | andersevenrud@gmail.com`;
    const versionWidth = target.measureText(versionText).width;
    target.fillStyle = '#ffffff';
    target.fillText(versionText, vw - versionWidth - 10, vh - 10);

    super.render(...arguments);
  }

  async load() {
    await super.load([
      'options'
    ]);

    let img;
    try {
      const src = require('!file-loader!../../data/UPDATE.MIX/htitle.png');
      img = await loadImage(src);
    } catch ( e ) {
      console.warn(e);
    }

    this.engine.sounds.playSong('map1', 'music', true);

    this.titleImage = img;
  }

  getUIElements() {
    const elements = [{
      type: 'box',
      x1: 171,
      x2: 472,
      y1: 0,
      y2: 271
    }, {
      type: 'button',
      label: 'Start New Game',
      x1: 195,
      x2: 445,
      y1: 50,
      y2: 68,
      cb: () => this.destroy() // FIXME
    }];

    const {width, height} = this.titleImage;
    const {vw, vh} =  this.getViewport();
    const ratio = Math.min(vw / width, vh / height);
    const left = (vw - (width * ratio)) / 2;

    return elements.map((el) => {
      return Object.assign({
        cb: function() {}
      }, el, {
        x: left  + (el.x1 * ratio),
        y: el.y1 * ratio,
        w: (el.x2 - el.x1) * ratio,
        h: (el.y2 - el.y1) * ratio
      });
    });
  }

}
