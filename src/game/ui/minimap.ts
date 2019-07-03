/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Entity } from '../../engine';
import { GameEngine } from '../game';
import { GameMap } from '../map';
import { TheatreUI } from '../ui/theatre';
import { getScaledDimensions } from '../physics';
import { TAB_HEIGHT } from './elements'
import { Vector } from 'vector2d';

export const MINIMAP_WIDTH = 156;
export const MINIMAP_HEIGHT = 138;
export const MINIMAP_OFFSET = 2;

export class Minimap extends Entity {
  private readonly engine: GameEngine;
  private readonly map: GameMap;
  private readonly ui: TheatreUI;

  public constructor(ui: TheatreUI, map: GameMap, engine: GameEngine) {
    super();
    this.ui = ui;
    this.engine = engine;
    this.map = map;

    this.setDimension(new Vector(MINIMAP_WIDTH - MINIMAP_OFFSET, MINIMAP_HEIGHT - MINIMAP_OFFSET));
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 1;
  }

  public onUpdate(deltaTime: number) {
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D) {
    if (this.engine.frames % 6 === 0) {
      const { sx, sy, sw, sh, dx, dy, dw, dh, bR } = getScaledDimensions(this.map.dimension, this.dimension);

      this.context.fillStyle = '#000000';
      this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);
      this.context.drawImage(this.map.getCanvas(), sx, sy, sw, sh, dx, dy, dw, dh);

      this.map.getEntities()
        .forEach(e => {
          const x = Math.trunc(e.position.x * bR) + dx;
          const y = Math.trunc(e.position.y * bR) + dy;
          const w = Math.trunc(e.dimension.x * bR);
          const h = Math.trunc(e.dimension.y * bR);
          this.context.fillStyle = e.getColor();
          this.context.fillRect(x, y, w, h);
        });

      if (this.map.isFowVisible()) {
        this.context.drawImage(this.map.fow.getCanvas(), 0, 0, this.map.dimension.x, this.map.dimension.y, 0, 0, this.dimension.x, this.dimension.y);
      }

      const v = this.ui.getViewport();
      const w = (v.x2 - v.x1) * bR;
      const h = (v.y2 - v.y1) * bR;
      const x = this.map.position.x * bR;
      const y = this.map.position.y * bR;
      this.context.strokeRect(x, y, w, h);
    }

    const s = this.engine.getScaledDimension();
    const x = s.x - MINIMAP_WIDTH - (MINIMAP_OFFSET  / 2);
    const y = TAB_HEIGHT + MINIMAP_OFFSET + (MINIMAP_OFFSET / 2);
    ctx.drawImage(this.canvas, x, y);
  }
}

