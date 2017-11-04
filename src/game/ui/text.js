/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import UIElement from '../../engine/ui/element';
import {drawText, drawWrappedText} from '../../engine/util';

export default class TextElement extends UIElement {

  constructor(options) {
    super(Object.assign({}, {
      text: 'Text'
    }, options));
  }

  render(target) {
    if ( !super.render(...arguments) ) {
      return;
    }

    const {x, y, w} = this.rect;
    const opts = {
      fillStyle: '#ffffff',
      left: x,
      top: y
    };

    if ( this.options.text instanceof Array ) {
      drawText(target, this.options.text, opts);
    } else {
      drawWrappedText(target, this.options.text, opts, w);
    }
  }

}
