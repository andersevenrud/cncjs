/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import TitleScene from './scenes/title';
import MovieScene from './scenes/movie';
import TheaterScene from './scenes/theater';
import GlobeScene from './scenes/globe';
import ScoreScene from './scenes/scores';
import ChooseScene from './scenes/choose';

import TabElement from './ui/tab';
import BoxElement from './ui/box';
import RectElement from './ui/rect';
import TextElement from './ui/text';
import SpriteElement from './ui/sprite';
import ButtonElement from './ui/button';

import Engine from '../engine/main';
import {queryParameter} from '../engine/util';

export default class Game extends Engine {

  constructor(canvas, options) {
    const debugType = options.debugMode ? parseInt(queryParameter('debug'), 10) || 0 : 0;
    options.debug = debugType;
    options.scale = parseInt(queryParameter('scale'), 10);

    super(canvas, {
      keymap: {
        CANCEL: 'ESC',
        PAN_UP: ['W', 'UP'],
        PAN_LEFT: ['A', 'LEFT'],
        PAN_DOWN: ['S', 'DOWN'],
        PAN_RIGHT: ['D', 'RIGHT'],
        THEME_PREV: ',',
        THEME_NEXT: '.',
        DEBUG_TOGGLE: 'F2',
        DEBUG_FOG: 'F3',
        DEBUG_SCALE: 'F5',
        DEBUG_SOUND: 'F6',
        DEBUG_MUSIC: 'F7',
        DEBUG_DESTROY: 'DELETE'
      }
    }, Object.assign({}, {
      scenes: {
        title: TitleScene,
        choose: ChooseScene,
        movie: MovieScene,
        globe: GlobeScene,
        theater: TheaterScene,
        score: ScoreScene
      },
      gui: {
        tab: TabElement,
        box: BoxElement,
        rect: RectElement,
        sprite: SpriteElement,
        button: ButtonElement,
        text: TextElement
      }
    }, options));
  }

  async run() {
    // FIXME
    const map = queryParameter('map');
    const movie = queryParameter('movie');
    const globe = queryParameter('globe');
    const score = queryParameter('score');
    if ( this.options.debugMode && movie ) {
      this.pushScene('movie', {movie});
    } else if ( this.options.debugMode && score ) {
      this.pushScene('score', {score});
    } else if ( this.options.debugMode && globe ) {
      this.pushScene('globe', {globe});
    } else if ( this.options.debugMode && map ) {
      this.pushScene('theater', {map});
    } else {
      this.pushScene('title');
    }

    try {
      await super.run(...arguments);
    } catch ( e ) {
      if ( !this.options.debugMode ) { // Webpack global
        alert('Failed to run: ' + e);
      }
      console.error(e);
    }
  }

}
