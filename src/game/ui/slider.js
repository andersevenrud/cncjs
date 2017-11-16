/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import UIElement from '../../engine/ui/element';

export default class SliderElement extends UIElement {
  constructor(engine, options) {
    super(engine, Object.assign({}, {
      value: 0.0
    }, options));

    this.value = this.options.value;
  }

  drawBackground(target) {
    const {x, y, w, h} = this.rect;

    target.fillRect(x + 1, y + 1, w - 2, h - 2);

    target.beginPath();
    target.moveTo(x, y + h);
    target.lineTo(x + w, y + h);
    target.stroke();
    target.closePath();

    target.beginPath();
    target.moveTo(x + w, y);
    target.lineTo(x + w, y + h);
    target.stroke();
    target.closePath();
  }

  drawButton(target) {
    let {x, y, w, h} = this.rect;

    w -= 2;
    h -= 2;

    const buttonWidth = w / 5;
    x += (w * this.value) - (buttonWidth / 2);
    x += 1;
    y += 1;

    target.beginPath();
    target.moveTo(x, y);
    target.lineTo(x + buttonWidth, y);
    target.stroke();
    target.closePath();

    target.beginPath();
    target.moveTo(x, y);
    target.lineTo(x, y + h);
    target.stroke();
    target.closePath();

    target.strokeStyle = '#000000';
    target.beginPath();
    target.moveTo(x + buttonWidth, y);
    target.lineTo(x + buttonWidth, y + h);
    target.stroke();
    target.closePath();

    target.beginPath();
    target.moveTo(x, y + h);
    target.lineTo(x + buttonWidth, y + h);
    target.stroke();
    target.closePath();
  }

  render(target) {
    if ( !super.render(...arguments) ) {
      return;
    }

    const sprite = Sprite.instance('options');
    const backTexture = sprite ? Sprite.instance('btexture').createImage(1) : null;
    const ptrn = backTexture ? target.createPattern(backTexture, 'repeat') : null;

    target.lineWidth = 1;
    target.fillStyle = ptrn ? ptrn : '#000000';
    target.strokeStyle = '#a0a7a0';

    this.drawBackground(target);
    this.drawButton(target);
  }
}
