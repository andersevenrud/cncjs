/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import UIElement from '../../engine/ui/element';
import {drawText, drawWrappedText} from '../../engine/ui/util';

export default class TextElement extends UIElement {

  constructor(engine, options) {
    super(engine, Object.assign({}, {
      font: 'cnc',
      underline: false,
      center: false,
      color: '#ffffff',
      size: 12,
      text: 'Text'
    }, options));
  }

  render(target) {
    if ( !super.render(...arguments) ) {
      return;
    }

    const {x, y, w, h} = this.rect;
    const opts = {
      fillStyle: this.options.color,
      font: String(this.options.size) + 'px ' + this.options.font,
      lineHeight: this.options.size + 2,
      center: this.options.center,
      underline: this.options.underline,
      left: x,
      top: y,
      width: w,
      height: h
    };

    if ( this.options.text instanceof Array ) {
      drawText(target, this.options.text, opts);
    } else {
      drawWrappedText(target, this.options.text, opts, w);
    }
  }

}
