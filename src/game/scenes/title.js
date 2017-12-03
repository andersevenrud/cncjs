/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import GameScene from 'game/scene';
import UIContainer from 'engine/ui/container';
import {loadImage} from 'engine/util';

const ABOUT_TEXT = [
  'Command & Conquer - Tiberian Dawn',
  '',
  'JavaScript remake by:',
  '',
  'Anders Evenrud',
  'andersevenrud@gmail.com',
  'github.com/andersevenrud',
  '',
  'Game data:',
  '(c) Westwood Studios Inc'
];

export default class TitleScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);

    this.tileImage = null;
    this.guiContainers = [];
    this.currentGUI = 0;
  }

  ondestroy() {
    this.engine.pushScene('choose');
  }

  update() {
    this.gui = [
      this.guiContainers[this.currentGUI]
    ];

    super.update(...arguments);
  }

  render(target, delta) {
    const {vw, vh} =  this.getViewport();

    if ( this.titleImage ) {
      const {width, height} = this.titleImage;
      const ratio = Math.min(vw / width, vh / height);
      const cx = (vw / 2) - (width * ratio / 2);

      target.drawImage(this.titleImage, 0, 0, width, height, cx, 0, width * ratio, height * ratio);
    }

    super.render(...arguments);

    const versionText = `Version ${this.engine.options.version} | andersevenrud@gmail.com`;
    const versionWidth = target.measureText(versionText).width;
    target.fillStyle = '#ffffff';
    target.fillText(versionText, vw - versionWidth - 10, vh - 10);
  }

  async load() {
    await super.load([
      'sprite:CONQUER.MIX/options',
      'sprite:UPDATE.MIX/htitle'
    ]);

    try {
      // FIXME: Move to sprite
      const asset = await this.engine.zip.getDataFile('UPDATE.MIX/htitle.png');
      const url = URL.createObjectURL(asset);
      this.titleImage = await loadImage(url);
      URL.revokeObjectURL(url);
    } catch ( e ) {
      console.warn(e);
    }

    this.engine.sounds.playSong('TRANSIT.MIX/map1', {loop: true});

    this.guiContainers = [
      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 0, y: 0, w: 300, h: 270},
        {type: 'button', label: 'Start new game', x: 25, y: 50, w: 250, h: 18, cb: () => this.destroy()},
        {type: 'button', label: 'About', x: 25, y: 90, w: 250, h: 18, cb: () => (this.currentGUI = 1)}
      ], {center: {dir: 'x', width: 300, height: 270}}),

      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 0, y: 0, w: 300, h: 270},
        {type: 'text', text: ABOUT_TEXT, x: 25, y: 30, w: 250, h: 200, size: 16, center: true},
        {type: 'button', label: 'Back', x: 25, y: 240, w: 250, h: 18, cb: () => (this.currentGUI = 0)}
      ], {center: {dir: 'x', width: 300, height: 270}})
    ];
  }
}
