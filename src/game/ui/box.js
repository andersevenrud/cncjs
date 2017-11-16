/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import UIElement from '../../engine/ui/element';

export default class BoxElement extends UIElement {

  constructor(engine, options) {
    super(engine, Object.assign({}, {
      corners: false
    }, options));
  }

  render(target) {
    if ( !super.render(...arguments) ) {
      return;
    }

    const {x, y, w, h} = this.rect;

    target.lineWidth = 1;
    target.fillStyle = '#000000';
    target.strokeStyle = '#a0a7a0';
    target.fillRect(x, y, w, h);

    if ( this.options.corners ) {
      const sprite = Sprite.instance('options');

      if ( sprite ) {
        target.strokeRect(x + .5, y + .5, w, h);
        const spriteSpace = 10;
        const spriteTop = y - (sprite.height / 2) + spriteSpace;
        sprite.render(target, x - (sprite.width / 2) + spriteSpace, spriteTop, 0);
        sprite.render(target, x + w - (sprite.width / 2) - spriteSpace, spriteTop, 1);
      }
    }
  }

}
