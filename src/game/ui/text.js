/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import UIElement from '../../engine/ui/element';
import {createFontSprite} from './font';

export default class TextElement extends UIElement {

  constructor(engine, options) {
    super(engine, Object.assign({}, {
      underline: false,
      center: false,
      text: 'Text'
    }, options));

    this.label = [];
  }

  drawText(target, str, line) {
    const {x, y, w} = this.rect;

    if ( !this.label[line] ) {
      this.label[line] = createFontSprite(str, 0, '6point');
    }

    const label = this.label[line];
    const px = this.options.center ? x + Math.round((w / 2) - (label.width / 2)) : x;
    const py = y + (line * label.height);

    target.drawImage(label, Math.round(px), Math.round(py));

    if ( this.options.underline ) {
      target.strokeStyle = '#3c9838';
      target.beginPath();
      target.moveTo(px, py + label.height);
      target.lineTo(px + label.width, py + label.height);
      target.stroke();
      target.closePath();
    }
  }

  render(target) {
    if ( !super.render(...arguments) ) {
      return;
    }

    if ( this.options.text instanceof Array ) {
      for ( let i = 0; i < this.options.text.length; i++ ) {
        this.drawText(target, this.options.text[i], i);
      }
    } else {
      this.drawText(target, this.options.text, 0);
    }
  }

}
