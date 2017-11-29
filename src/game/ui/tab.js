/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import SpriteElement from './sprite';
import {createFontSprite} from './font';

export default class TabElement extends SpriteElement {
  constructor(engine, options) {
    super(engine, Object.assign({}, {
      pressIndex: 1,
      label: 'Tab',
      name: 'htabs'
    }, options));

    this.label = null;
    this.lastText = null;
  }

  render(target) {
    if ( super.render(target) ) {
      const txt = typeof this.options.label === 'function' ? this.options.label() : this.options.label;

      if ( !this.label || txt !== this.lastText ) {
        this.label = createFontSprite(this.engine, txt, 0);
      }

      target.drawImage(this.label,
                       Math.round(this.rect.x + (this.rect.w / 2) - (this.label.width / 2)),
                       Math.round(this.rect.y + (this.rect.h / 2) - (this.label.height / 2) + 1));
    }
  }
}
