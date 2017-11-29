/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Level from 'game/theater/level';
import GameScene from 'game/scene';
import Sprite from 'engine/sprite';
import UIContainer from 'engine/ui/container';
import {LEVELS} from 'game/globals';

export default class GlobeScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);

    this.sprite = null;
    this.spriteIndex = 0;
    this.stage = 0;
  }

  async load() {
    const spriteNames = [
      'sprite:options',
      'sprite:e-bwtocl', // spinning earth
      'sprite:greyerth', // spinning earth
      'sprite:hbosnia', // zoom on bosnia
      'sprite:hearth_a', // zoom on africa
      'sprite:africa', // african mission selection
      'sprite:hsafrica', // zoom on south africa
      'sprite:hearth_e', // zoom on europe
      'sprite:europe' // european mission selection

      /*
      'click_a', // african hotspots
      'click_e', // european hotspots
      'click_eb', // bosnian hotspots
      'click_sa' // south african hotspots
      */

      //'bosnia', // zoom on bosnia
      //'s_africa' // zoom on south africa
    ];

    await super.load(spriteNames);

    const levels = LEVELS[this.options.player.teamName.toLowerCase()];
    const from = this.options.level;
    const current = levels.indexOf(from);
    const matcher = /([a-z]+)(\d+)([a-z]+)/;

    const currentStage = parseInt(from.match(matcher)[2], 10);
    const list = levels.filter((name, index) => {
      if ( index < current ) {
        return false;
      }

      const stage = parseInt(name.match(matcher)[2], 10);
      return stage === currentStage + 1;
    });

    const buttons = list.map((name, index) => {
      return {type: 'button', label: name, x: 24, y: 24 + (index * 22), w: 152, h: 18, cb: () => {
        this.destroy({
          map: name,
          team: this.options.team
        });
      }};
    });

    const ui = new UIContainer(this.engine, [
      {type: 'box', corners: true, x: 0, y: 0, w: 200, h: 200},
      ...buttons
    ], {center: {width: 200, height: 200}});

    this.gui = [ui];
    this.engine.sounds.playSong('loopie6m', {loop: true});
  }

  update() {
    super.update(...arguments);

    if ( this.stage < 2 ) {
      this.sprite = this.stage === 0
        ? Sprite.instance('e-bwtocl')
        : Sprite.instance('hearth_e');

      if ( !this.sprite ) {
        return;
      }

      const index = Math.round(this.spriteIndex);
      if ( index < this.sprite.count - 1 ) {
        this.spriteIndex += .5;
      } else {
        this.spriteIndex = 0;
        this.stage++;

        console.debug('Advanced to globe stage', this.stage);
      }
    }

    /*
    if ( this.stage >= 2 ) {
      // TODO
      this.spriteIndex = 0;
      this.sprite = Sprite.instance('europe');
    }
    */
  }

  render(target, delta) {
    const {vw, vh} =  this.getViewport();

    if ( this.sprite ) {
      this.sprite.renderFilled(target, vw, vh, Math.round(this.spriteIndex));
    }

    super.render(...arguments);
  }

  ondestroy(options) {
    Level.queue(this.engine, options.map, {
      team: options.team
    });
  }

}
