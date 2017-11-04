/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import UIElement from '../../engine/ui/element';

export default class ButtonElement extends UIElement {
  constructor(options) {
    super(Object.assign({}, {
      color: '#50f850', // #50af20
      texture: null,
      label: 'Label'
    }, options));
  }

  render(target) {
    if ( !super.render(...arguments) ) {
      return;
    }

    const {x, y, w, h, ratio} = this.rect;
    const sprite = Sprite.getFile('options');
    const backTexture = sprite ? Sprite.getFile('btexture').createImage(1) : null;
    const ptrn = backTexture ? target.createPattern(backTexture, 'repeat') : null;

    target.lineWidth = 1;
    target.fillStyle = ptrn ? ptrn : '#000000';
    target.fillRect(x + 1, y + 1, w - 2, h - 2);

    target.beginPath();
    target.moveTo(x, y);
    target.lineTo(x + w, y);
    target.stroke();
    target.closePath();

    target.beginPath();
    target.moveTo(x, y);
    target.lineTo(x, y + h);
    target.stroke();
    target.closePath();

    target.fillStyle = this.options.color;
    target.font = String(h) + 'px cnc';

    const textOffset = target.measureText(this.options.label).width;
    target.fillText(this.options.label, x + (w / 2) - textOffset / 2, y + (h / 2) + (4 * ratio));
  }
}
