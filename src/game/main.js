/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import TitleScene from './scenes/title';
import MovieScene  from './scenes/movie';
import ChooseScene from './scenes/choose';
import TheaterScene from './scenes/theater';

import Engine from '../engine/main';
import {queryParameter} from '../engine/util';

export default class Game extends Engine {

  async run() {
    // FIXME
    const map = queryParameter('map');
    if ( this.options.debugMode && map ) {
      this.sceneQueue.push((options) => new TheaterScene(this, {map}));
    } else {
      this.sceneQueue.push((options) => new TitleScene(this, options));

      this.sceneQueue.push((options) => new ChooseScene(this, options));

      this.sceneQueue.push((options) => {
        const mapName = options.team === 'GDI' ? 'scg01ea' : 'scb01ea';
        const level = this.mix.getLevel(mapName);
        const brief = level.info.Brief;
        return new MovieScene(this, {movie: brief, team: options.team, map: mapName});
      });

      this.sceneQueue.push((options) => new TheaterScene(this, options));
    }

    try {
      await super.run(...arguments);
    } catch ( e ) {
      if ( !DEBUG ) { // Webpack global
        alert('Failed to run: ' + e);
      }
      console.error(e);
    }
  }

}
