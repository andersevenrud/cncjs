/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import Sprite from '../../engine/sprite';
import {FONTS} from '../globals';

function calculateString(str, font) {
  const letters = str.split('');

  let width = 0;
  let height = font.height;

  const calculated = [];
  for ( let i = 0; i < letters.length; i++ ) {
    const cc =  letters[i].charCodeAt(0);
    const index = cc - 33;

    if ( index >= 0 ) {
      const [w, h] = font.letters[index];
      calculated.push({index, w, h, left: width});
      width += w;
    } else {
      calculated.push({index, w: font.width, h: height, left: width});
      width += 8;
    }
  }

  return {width, height, calculated};
}

function createImage(str, fontName, color) {
  const sprite = Sprite.instance(fontName);
  const font = FONTS[fontName];
  const {calculated, width, height} = calculateString(str, font);

  const canvas = document.createElement('canvas');
  canvas.height = height;
  canvas.width = width;

  const context = canvas.getContext('2d');

  for ( let i = 0; i < calculated.length; i++ ) {
    const {left, index} = calculated[i];

    if ( index >= 0 ) {
      sprite.render(context, left, 0, index, color);
    }
  }

  return canvas;
}

/**
 * Creates a new Font sprite with given text
 * @param {String} str Text
 * @param {Number} [color=0] Color (0=Green)
 * @param {String} [fontName=8point] Font sprite name
 * @return {HTMLCanvasElement}
 */
export function createFontSprite(str, color = 0, fontName = '8point') {
  return createImage(str, fontName, color);
}
