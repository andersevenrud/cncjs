/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Sprite, Entity }  from '../../engine';
import { CELL_SIZE } from '../physics';
import { spriteFromName } from '../sprites';
import { GameEngine } from '../game';
import { Vector } from 'vector2d';

/**
 * Bib underlay entity
 */
export class BibEntity extends Entity {
  protected static cache: Map<string, BibEntity> = new Map();
  private size: Vector;
  private offset: number;
  private sprite: Sprite;
  private engine: GameEngine;

  public constructor(size: Vector, theatre: string, engine: GameEngine) {
    super();

    const id = size.x > 3 ? 1 : (size.x > 2 ? 2 : 3);
    const name = `${theatre.toUpperCase()}.MIX/bib${id}.png`;
    const sprite = spriteFromName(name);
    const sizeX = sprite.frames / 2;
    const sizeY = 2;

    this.engine = engine;
    this.sprite = sprite;
    this.offset = (size.y - 1) * CELL_SIZE;
    this.size = new Vector(sizeX, sizeY);
    this.setDimension(new Vector(
      sizeX * CELL_SIZE,
      sizeY * CELL_SIZE
    ));
  }

  public async init(): Promise<void> {
    try {
      await this.engine.loadArchiveSprite(this.sprite);

      let i = 0;
      for ( let y = 0; y < this.size.y; y++ ) {
        for ( let x = 0; x < this.size.x; x++ ) {
          this.sprite.render(new Vector(0, i), new Vector(x * CELL_SIZE, y * CELL_SIZE), this.context);
          i++;
        }
      }

    } catch (e) {
      console.error('BibEntity::init()', e);
    }
  }

  public static async createOrCache(engine: GameEngine, size: Vector, theatre: string): Promise<BibEntity> {
    const key = size.toString() + theatre;
    if (!this.cache.has(key)) {
      const bib = new BibEntity(size, theatre, engine);
      await bib.init();

      this.cache.set(key, bib);
    }

    return this.cache.get(key) as BibEntity;
  }

  public getOffset(): number {
    return this.offset;
  }
}
