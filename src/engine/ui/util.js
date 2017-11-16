/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

const DEFAULT_TEXT = {
  left: 4,
  top: 4,
  lineHeight: 12,
  font: '12px monospace',
  fillStyle: '#000000'
};

/**
 * Draws text over multiple lines
 * @param {CanvasRenderingContext2D} target Render context
 * @param {String[]} text Text
 * @param {Object} options Options
 * @param {Number} [options.top=0] Top position
 * @param {Number} [options.lineHeight=10] Line height
 * @param {String} [options.font=monospace] Font name
 * @param {String} [options.fillStyle=black] Fill style
 * @param {Boolean} [options.center=false] Center the text
 * @param {Number} [options.width] Width required for centering
 * @param {Boolean} [options.underline=false] Underline the text
 */
export function drawText(target, text, options) {
  options = Object.assign({}, DEFAULT_TEXT, options || {});

  if ( !(text instanceof Array) ) {
    text = [text];
  }

  target.font = options.font;
  target.fillStyle = options.fillStyle;
  target.strokeStyle = options.fillStyle;
  const fontSize = parseInt(options.font, 10);

  for ( let i = 0; i < text.length; i++ ) {
    let sentence = text[i];
    let left = options.left;
    let top = options.top + (i * options.lineHeight);
    let width = target.measureText(sentence).width;

    if ( options.center ) {
      left += (options.width / 2) - (width / 2);
    }
    if ( options.underline ) {
      target.beginPath();
      target.moveTo(left, top + fontSize / 2);
      target.lineTo(left + width, top + fontSize / 2);
      target.stroke();
      target.closePath();
    }

    target.fillText(text[i], left, top);
  }
}

/**
 * Draws text over multiple lines
 * @param {CanvasRenderingContext2D} target Render context
 * @param {String} text Text
 * @param {Object} options Options
 * @param {Number} [options.top=0] Top position
 * @param {Number} [options.lineHeight=10] Line height
 * @param {String} [options.font=monospace] Font name
 * @param {String} [options.fillStyle=black] Fill style
 * @param {Number} wrap Wrap after this width
 */
export function drawWrappedText(target, text, options, wrap) {
  options = Object.assign({}, DEFAULT_TEXT, options || {});

  target.font = options.font;
  target.fillStyle = options.fillStyle;

  const words = text.split(' ');

  let top = options.top;
  let line = '';
  for ( let i = 0; i < words.length; i++ ) {
    const testLine = line + words[i] + ' ';
    const {width} = target.measureText(testLine);

    if ( width > wrap && i > 0 ) {
      target.fillText(line, options.left, top);
      line = words[i] + ' ';
      top += options.lineHeight;
    } else {
      line = testLine;
    }
  }
}
