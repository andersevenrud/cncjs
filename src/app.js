/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import 'babel-polyfill';
import Game from 'game/main';

window.addEventListener('DOMContentLoaded', () => {
  const canvas = document.querySelector('canvas');
  const e = new Game(canvas, {
    version: VERSION, // webpack global
    debugMode: DEBUG // webpack global
  });

  // DEBUG is a global from Webpack
  if ( DEBUG ) {
    window.GameEngine = e;
  }

  e.load()
    .then(() => e.run())
    .catch((err) => console.error(err));
});
