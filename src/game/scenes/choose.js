/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import GameScene from '../scene';
import {collidePoint} from '../../engine/physics';

export default class ChooseScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);
    this.spriteIndex = 0;
    this.selected = false;
  }

  destroy(options) {
    if ( this.destroying ) {
      return;
    }

    const mapName = options.team === 'GDI' ? 'scg01ea' : 'scb01ea';
    const level = this.engine.mix.getLevel(mapName);
    const brief = level.info.Brief;

    this.engine.pushScene('movie', {
      movie: brief
    });

    this.engine.pushScene('theater', {
      team: options.team,
      map: mapName
    });

    super.destroy();
  }

  update() {
    super.update(...arguments);

    if ( this.selected ) {
      return;
    }

    const click = this.engine.mouse.buttonClicked('LEFT');
    if ( click ) {
      const {vw, vh} =  this.getViewport();
      const [width, height] = this.sprite ? this.sprite.getSize() : [vw, vh];
      const ratio = Math.min(vw / width, vh / height);
      const left = (vw - (width * ratio)) / 2;

      const gdiRect = {
        x1: left,
        x2: left  + (160 * ratio),
        y1: 0,
        y2: vh
      };

      const nodRect = {
        x1: (vw / 2),
        x2: (vw / 2) + (160 * ratio),
        y1: 0,
        y2: vh
      };

      if ( collidePoint(click, gdiRect) ) {
        this.selectTeam('gdi');
      } else if ( collidePoint(click, nodRect) ) {
        this.selectTeam('nod');
      }
    }

    if ( this.sprite ) {
      this.spriteIndex = (this.spriteIndex + .5) % this.sprite.count;
    }
  }

  render(target, delta) {
    if ( this.sprite ) {
      const {vw, vh} =  this.getViewport();
      this.sprite.renderFilled(target, vw, vh, Math.floor(this.spriteIndex));

      /*
      const left = (vw - (width * ratio)) / 2;
      target.strokeStyle = '#ff0000';
      target.strokeRect(left, 0, 160 * ratio, vh);
      target.strokeRect((vw / 2), 0, 160 * ratio, vh);
      */
    }
    super.render(...arguments);
  }

  async load() {
    await super.load([
      'sprite:choose'
    ]);

    this.sprite = Sprite.instance('choose');
    this.engine.sounds.playSong('struggle', {loop: true});
  }

  selectTeam(teamName) {
    this.selected = true;
    const done = () => {
      this.destroy({team: teamName.toUpperCase()});
    };

    this.engine.sounds.playSong(`${teamName}_slct`, {}, (el) => done());
  }

}
