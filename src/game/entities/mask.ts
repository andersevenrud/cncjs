/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Entity, Sprite } from '../../engine';
import { cellFromPoint, pointFromCell, CELL_SIZE } from '../physics';
import { GameMap } from '../map';
import { spriteFromName } from '../sprites';
import { Vector } from 'vector2d';

// FIXME: Don't remove this when building stops ? Hide ?
export class StructureMaskEntity extends Entity {
  public readonly name: string;
  public readonly map: GameMap;
  public readonly dimension: Vector = new Vector(CELL_SIZE, CELL_SIZE);
  private readonly sprite: Sprite = spriteFromName('CONQUER.MIX/trans.png');
  private cell: Vector = new Vector(0, 0);
  private white?: CanvasPattern;
  private yellow?: CanvasPattern;
  private red?: CanvasPattern;

  public constructor(name: string, map: GameMap) {
    super();
    this.name = name;
    this.map = map;

    const properties = this.map.engine.mix.structures.get(name);
    if (properties) {
      const size = properties.Dimensions.clone() as Vector;
      if (properties.HasBib) {
        size.add(new Vector(0, 1));
      }

      size.mulS(CELL_SIZE);
      this.setDimension(size);
    }
  }

  public async init(): Promise<void> {
    await this.map.engine.loadArchiveSprite(this.sprite);

    this.white = this.sprite.createPattern(new Vector(0, 0)) as CanvasPattern;
    this.yellow = this.sprite.createPattern(new Vector(0, 1)) as CanvasPattern;
    this.red = this.sprite.createPattern(new Vector(0, 2)) as CanvasPattern;
  }

  public onUpdate(deltaTime: number) {
    const mouse = this.map.engine.mouse;
    const point = mouse.getVector();
    const pos = this.map.getRealMousePosition(point);
    const cell = cellFromPoint(pos);
    const position = pointFromCell(cell);

    this.cell = cell;
    this.setPosition(position);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D) {
    const w = this.dimension.x / CELL_SIZE;
    const h = this.dimension.y / CELL_SIZE;

    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cx = this.cell.x + x;
        const cy = this.cell.y + y;
        let dx = x * CELL_SIZE;
        let dy = y * CELL_SIZE;

        // FIXME: Units and infantry
        const occupied = !this.map.grid.isWalkableAt(cx, cy);
        if (occupied) {
          this.context.fillStyle = this.red || '#ff0000';
        } else if (h > 1 && y > h - 2) {
          this.context.fillStyle = this.yellow || '#ffff00';
        } else {
          this.context.fillStyle = this.white || '#ffffff';
        }

        this.context.fillRect(dx, dy, CELL_SIZE, CELL_SIZE);
      }
    }

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }
}
