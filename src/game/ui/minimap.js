/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import UIElement from '../../engine/ui/element';

import {MINIMAP_SIZE} from '../globals';

/**
 * Game MiniMap Class
 */
export default class MiniMap extends UIElement {

  /**
   * @param {Engine} engine Game Engine reference
   * @param {Map} map Map reference
   * @param {UIContainer} container UI Container
   */
  constructor(engine, map, container) {
    super(engine, {
      x: 2,
      y: 2,
      w: MINIMAP_SIZE[0],
      h: MINIMAP_SIZE[1]
    });

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.map = map;
    this.engine = engine;
    this.scale = [0, 0];
  }

  /**
   * Loads the minimap
   */
  async load() {
    this.canvas.width = MINIMAP_SIZE[0];
    this.canvas.height = MINIMAP_SIZE[1];
    this.context.fillStyle = 'rgba(0, 0, 0, 1)';
    this.context.fillRect(0, 0, MINIMAP_SIZE[0], MINIMAP_SIZE[1]);
    this.scale = [
      this.map.width / MINIMAP_SIZE[0],
      this.map.height / MINIMAP_SIZE[1]
    ];
  }

  /**
   * Updates the minimap
   */
  update() {
  }

  /**
   * Draws the Minimap onto target
   *
   * @param {CanvasRenderingContext2D} target Render context
   */
  render(target) {
    if ( !this.rect || !this.visible ) {
      return;
    }

    const [mx, my] = this.scale;
    const {vw, vh} = this.engine.getViewport();
    const {width, height, objects} = this.map;
    const {gameX, gameY} = this.engine.scene;

    this.context.fillStyle = 'rgba(0, 0, 0, 1)';
    this.context.fillRect(0, 0, MINIMAP_SIZE[0], MINIMAP_SIZE[1]);
    this.context.drawImage(this.map.canvas, 0, 0, width, height, 0, 0, MINIMAP_SIZE[0], MINIMAP_SIZE[1]);

    for ( let i = 0; i < objects.length; i++ ) {
      const obj = objects[i];
      const rect = obj.getRect();

      if ( obj.isMapOverlay() && obj.sprite.render ) {
        obj.sprite.renderScaled(
          this.context,
          Math.round(rect.x1 / mx),
          Math.round(rect.y1 / my),
          Math.round((rect.x2 - rect.x1) / mx),
          Math.round((rect.y2 - rect.y1) / my),
          obj.spriteFrame
        );
      } else {
        this.context.fillStyle = obj.spriteColor || '#ffffff';
        this.context.fillRect(
          Math.floor(rect.x1 / mx),
          Math.floor(rect.y1 / my),
          Math.floor((rect.x2 - rect.x1) / mx),
          Math.floor((rect.y2 - rect.y1) / my)
        );
      }
    }

    if ( this.map.fog.visible ) {
      this.context.drawImage(this.map.fog.canvas, 0, 0, width, height, 0, 0, MINIMAP_SIZE[0], MINIMAP_SIZE[1]);
    }

    this.context.strokeStyle = '#ffffff';
    this.context.strokeRect(
      Math.round(gameX / mx),
      Math.round(gameY / my),
      Math.round(vw / mx),
      Math.round(vh / my)
    );

    target.drawImage(this.canvas, this.rect.x, this.rect.y);
  }

  click(click) {
    if ( click && this.rect && super.click(click, false) ) {
      const {vw, vh} = this.engine.getViewport();
      const {width, height} = this.map;
      const relX = click.x - this.rect.x;
      const relY = click.y - this.rect.y;
      const absX = relX / MINIMAP_SIZE[0];
      const absY = relY / MINIMAP_SIZE[1];
      const ox = Math.round(width * absX) - (vw / 2);
      const oy = Math.round(height * absY) - (vh / 2);

      this.engine.setOffset(ox, oy);

      return true;
    }

    return false;
  }

}
