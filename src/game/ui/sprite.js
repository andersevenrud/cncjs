/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import UIElement from '../../engine/ui/element';

export default class SpriteElement extends UIElement {
  constructor(options) {
    const sprite = Sprite.getFile(options.name);

    super(Object.assign({}, {
      w: sprite.width,
      h: sprite.height,
      index: 0,
      name: null
    }, options));

    this.index = this.options.index;
    this.loaded = false;
  }

  render(target) {
    if ( this.rect ) {
      const sprite = Sprite.getFile(this.options.name);
      if ( sprite ) {
        const {x, y} = this.rect;
        sprite.render(target, x, y, this.index);
        return true;
      }
    }

    return false;
  }
}
