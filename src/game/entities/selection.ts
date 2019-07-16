/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { Entity, Sprite } from '../../engine';
import { GameMap } from '../map';
import { GameEntity } from '../entity';
import { spriteFromName } from '../sprites';
import { Vector } from 'vector2d';

/**
 * Mep Entity Selection
 */
export class GameMapEntitySelection extends Entity {
  public readonly map: GameMap;
  private readonly sprite: Sprite = spriteFromName('CONQUER.MIX/select.png');

  public constructor(map: GameMap) {
    super();
    this.map = map;
  }

  public async init(): Promise<void> {
    await this.map.engine.loadArchiveSprite(this.sprite);
  }

  public render(target: GameEntity, ctx: CanvasRenderingContext2D): void {
    // TODO: This can be cached based on dimensions
    const { canvas } = this.sprite;
    const position = target.getPosition();
    const dimension = target.getDimension();
    const isInfantry = target.isInfantry();
    const f = isInfantry ? 0 : 1;
    const l = isInfantry ? 3 : 5;
    const o = isInfantry ? new Vector(10, 3) : new Vector(7, 2);
    const size = isInfantry ? new Vector(11, 12) : new Vector(16, 16);

    // top-left
    ctx.drawImage(
      canvas,
      o.x,
      o.y + (f * this.sprite.size.y),
      l,
      l,
      position.x,
      position.y,
      l,
      l
    );

    ctx.drawImage( // top-right
      canvas,
      o.x + size.x - l,
      o.y + (f * this.sprite.size.y),
      l,
      l,
      position.x + dimension.x - l,
      position.y,
      l,
      l
    );

    ctx.drawImage( // bottom-left
      canvas,
      o.x,
      o.y + (f * this.sprite.size.y) + (size.y - l),
      l,
      l,
      position.x,
      position.y + dimension.y - l,
      l,
      l
    );

    ctx.drawImage( // bottom-right
      canvas,
      o.x + size.x - l,
      o.y + (f * this.sprite.size.y) + (size.y - l),
      l,
      l,
      position.x + dimension.x - l,
      position.y + dimension.y - l,
      l,
      l
    );
  }
}
