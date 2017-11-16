/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import SpriteElement from './sprite';

export default class TabElement extends SpriteElement {
  constructor(engine, options) {
    super(engine, Object.assign({}, {
      label: 'Tab',
      name: 'htabs'
    }, options));
  }

  render(target) {
    if ( super.render(target) ) {
      target.fillStyle = '#eeeeee';
      target.font = '12px cnc';

      const label = typeof this.options.label === 'function' ? this.options.label() : this.options.label;

      const mw = target.measureText(label).width;

      target.fillText(label,
                      this.rect.x + (this.rect.w / 2) - (mw / 2),
                      this.rect.y + 11);
    }
  }
}
