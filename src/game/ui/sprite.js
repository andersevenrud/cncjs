/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Sprite from 'engine/sprite';
import UIElement from 'engine/ui/element';

export default class SpriteElement extends UIElement {
  constructor(engine, options) {
    const sprite = Sprite.instance(options.name);

    super(engine, Object.assign({}, {
      w: sprite.width,
      h: sprite.height,
      index: 0,
      pressIndex: -1,
      name: null
    }, options));

    this.index = this.options.index;
    this.pressIndex = this.options.pressIndex === -1 ? this.index : this.options.pressIndex;
    this.loaded = false;
  }

  render(target) {
    if ( this.rect ) {
      const sprite = Sprite.instance(this.options.name);
      if ( sprite ) {
        const {x, y} = this.rect;
        sprite.render(target, x, y, this.pressed ? this.pressIndex : this.index);
        return true;
      }
    }

    return false;
  }
}
