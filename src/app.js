/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import 'babel-polyfill';
import Game from './game/main';
import {queryParameter} from './engine/util';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('canvas');
  const debugType = DEBUG ? parseInt(queryParameter('debug'), 10) || 0 : 0;
  const e = new Game(canvas, {
    loading: document.getElementById('loading'),
    version: VERSION, // webpack global
    debugMode: DEBUG, // webpack global
    debug: debugType,
    audio: debugType === 0,
    scale: parseInt(queryParameter('scale'), 10) || 2
  });

  // DEBUG is a global from Webpack
  if ( DEBUG ) {
    window.GameEngine = e;
  }

  e.load()
    .then(() => e.run())
    .catch((err) => console.error(err));
});
