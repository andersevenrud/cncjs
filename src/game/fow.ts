/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Entity } from '../engine';
import { GameMap } from './map';
import { CELL_SIZE } from './physics';
import { Vector } from 'vector2d';

export class FOW extends Entity {
  private map: GameMap;
  private grid: any[] = [];
  private updated: boolean = false;

  public constructor(map: GameMap)  {
    super();
    this.map = map;
  }

  public async init(): Promise<void> {
    const dimension = this.map.getMapDimension();
    this.grid = Array(...Array(dimension.x)).map(() => Array(dimension.y));

    this.context.fillStyle = 'rgba(0, 0, 0, 1)';
    this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);
  }

  public onUpdate(deltaTime: number): void {
    const dimension = this.map.getMapDimension();
    const entities = this.map.getEntities()
      .filter(entity => entity.canReveal());

    entities.forEach(entity => {
      const box = entity.getCellBox();
      const sight = entity.getSight();

      for (let y: number = box.y1 - sight; y <= box.y2 + sight; y++) {
        for (let x: number = box.x1 - sight; x <= box.x2 + sight; x++) {
          if (x < 0 || y < 0 || x >= dimension.x || y >= dimension.y) {
            continue;
          }

          if (this.grid[y] && !this.grid[y][x]) {
            this.updated = true;
            this.grid[y][x] = 1;
          }
        }
      }
    });
  }

  public onRender(deltaTime: number): void {
    if (!this.updated) {
      return;
    }

    if (this.map.engine.frames % 10 !== 0) {
      return;
    }

    this.updated = false;

    this.context.globalCompositeOperation = 'destination-out';

    const dimension = this.map.getMapDimension();
    for (let y = 0; y < dimension.y; y++) {
      for (let x = 0; x < dimension.x; x++) {
        if (this.grid[y] && this.grid[y][x] === 1) {
          const px = x * CELL_SIZE;
          const py = y * CELL_SIZE;

          this.context.fillStyle = 'rgba(0, 255, 0, 0.5)';
          this.context.beginPath();
          this.context.arc(px + (CELL_SIZE / 2), py + (CELL_SIZE / 2), CELL_SIZE + 10, 0, 2 * Math.PI, false);
          this.context.fill();

          this.context.fillStyle = 'rgba(0, 255, 0, 1)';
          this.context.beginPath();
          this.context.arc(px + (CELL_SIZE / 2), py + (CELL_SIZE / 2), CELL_SIZE + 2, 0, 2 * Math.PI, false);
          this.context.fill();

          this.grid[y][x] = 2;
        }
      }
    }

    this.context.globalCompositeOperation = 'source-over';
  }

  public isRevealedAt(cell: Vector) {
    return this.grid[cell.y] && this.grid[cell.y][cell.x] > 0;
  }
}
