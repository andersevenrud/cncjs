/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import GameScene from '../scene';
import UIContainer from '../../engine/ui/container';
import {loadImage} from '../../engine/util';

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

  destroy() {
    this.engine.pushScene('choose');

    super.destroy();
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
      'options'
    ]);

    let img;
    try {
      const src = require('!file-loader!../../data/UPDATE.MIX/htitle.png');
      img = await loadImage(src);
    } catch ( e ) {
      console.warn(e);
    }

    this.engine.sounds.playSong('map1', 'music', true);

    this.titleImage = img;

    this.guiContainers = [
      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 171, y: 0, w: 301, h: 271},
        {type: 'button', label: 'Start new game', x: 195, y: 50, w: 250, h: 18, cb: () => this.destroy()},
        {type: 'button', label: 'About', x: 195, y: 90, w: 250, h: 18, cb: () => (this.currentGUI = 1)}
      ], {scaleTo: this.titleImage}),

      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 171, y: 0, w: 301, h: 271},
        {type: 'text', text: ABOUT_TEXT, x: 195, y: 50, w: 250, h: 200},
        {type: 'button', label: 'Back', x: 195, y: 200, w: 250, h: 18, cb: () => (this.currentGUI = 0)}
      ], {scaleTo: this.titleImage})
    ];
  }
}
