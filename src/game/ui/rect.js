/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import UIElement from '../../engine/ui/element';

export default class RectElement extends UIElement {
  constructor(options) {
    super(Object.assign({}, {
      color: '#000000',
      texture: false
    }, options));
  }

  render(target) {
    if ( !super.render(...arguments) ) {
      return;
    }

    const {x, y, w, h} = this.rect;

    const sprite = this.options.texture ? Sprite.getFile('btexture') : null;
    const backTexture = sprite ? Sprite.getFile('btexture').createImage(1) : null;
    const ptrn = backTexture ? target.createPattern(backTexture, 'repeat') : null;

    target.fillStyle = ptrn ? ptrn : this.options.color;
    target.fillRect(x, y, w, h);
  }
}
