/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import UIElement from '../../engine/ui/element';

export default class TickerElement extends UIElement {
  constructor(type, options) {
    super(Object.assign({}, {
      w: 64,
      h: 48 * 5,
      offset: 0,
      buildables: []
    }, options));

    this.type = type;
    this.offset = this.options.offset;
    this.buildables = this.options.buildables;
    this.elements = [];
  }

  up() {
    this.offset = Math.max(0, this.offset - 1);
  }

  down() {
    this.offset = Math.min(this.offset + 1, this.buildables.length - 5);
  }

  click(click) {
    if ( click && this.rect && super.click(click, false) ) {
      const relY = click.y - this.rect.y;
      const relIndex = Math.floor(relY / 48);
      const realIndex = this.offset + relIndex;

      if ( this.buildables[realIndex] ) {
        this.callback(this.buildables[realIndex]);
      }

      return true;
    }

    return false;
  }

  update() {
    const {x, y} = this.rect;
    const max = Math.min(4, this.buildables.length - 1 - this.offset);
    const elements = [];

    for ( let i = 0; i < max; i++ ) {
      const o = this.buildables[i + this.offset];
      const s = Sprite.getFile(o.Icon);

      elements.push([s, x, y + (i * s.height)]);
    }

    this.elements = elements;
  }

  render(target) {
    for ( let i = 0; i < this.elements.length; i++ ) {
      const [s, x, y] = this.elements[i];
      s.render(target, x, y);
    }
  }
}
