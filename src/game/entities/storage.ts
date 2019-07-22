/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Entity, Sprite } from '../../engine';
import { spriteFromName } from '../sprites';
import { GameEntity } from '../entity';
import { GameEngine } from '../game';
import { Vector } from 'vector2d';

const SLOT_OFFSET_X = 13;
const SLOT_OFFSET_Y = 2;
const SLOT_WIDTH = 4;
const SLOT_HEIGHT = 4;

export class StorageBarEntity extends Entity {
  private parent: GameEntity;
  private sprite: Sprite = spriteFromName('UPDATEC.MIX/hpips.png');
  private lastSlots: number = -1;
  private readonly engine: GameEngine;
  protected readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d', { alpha: false }) as CanvasRenderingContext2D;
  protected background: Entity = new Entity();
  protected foreground: Entity = new Entity();

  public constructor(parent: GameEntity, engine: GameEngine) {
    super();
    this.parent = parent;
    this.engine = engine;
  }

  public async init(): Promise<void> {
    try {
      await this.engine.loadArchiveSprite(this.sprite);
    } catch (e) {
      console.error('StorageBarEntity::init()', e);
    }


    const maxSlots = this.parent.getStorageSlots();
    const dimension = new Vector(maxSlots * SLOT_WIDTH, this.sprite.size.y);

    this.foreground.setDimension(dimension);
    this.background.setDimension(dimension);
    this.setDimension(dimension);

    const emptyCanvas = this.sprite.render(new Vector(0, 0));
    const takenCanvas = this.sprite.render(new Vector(0, 1));
    const backgroundContext = this.background.getContext();
    const foregroundContext = this.foreground.getContext();

    for (let x = 0; x < maxSlots; x++) {
      const py = 0;
      const px = x * SLOT_WIDTH;
      backgroundContext.drawImage(emptyCanvas, SLOT_OFFSET_X, SLOT_OFFSET_Y, SLOT_WIDTH, SLOT_HEIGHT, px, py, SLOT_WIDTH, SLOT_HEIGHT);
      foregroundContext.drawImage(takenCanvas, SLOT_OFFSET_X, SLOT_OFFSET_Y, SLOT_WIDTH, SLOT_HEIGHT, px, py, SLOT_WIDTH, SLOT_HEIGHT);
    }
  }

  public render(deltaTime: number, context: CanvasRenderingContext2D) {
    const position = this.parent.getPosition();
    const dimension = this.parent.getDimension();
    const x = Math.trunc(position.x);
    const y = Math.trunc(position.y) + Math.trunc(dimension.y);
    const value = this.parent.getStorageValue();
    const xoff = (this.dimension.x / 2) - (dimension.x / 2);

    if (value !== this.lastSlots) {
      this.context.drawImage(this.background.getCanvas(), 0, 0);
      this.context.drawImage(this.foreground.getCanvas(), 0, 0, value * SLOT_WIDTH, SLOT_HEIGHT, 0, 0, value * SLOT_WIDTH, SLOT_HEIGHT);
    }

    context.drawImage(this.canvas, x - xoff, y);
    this.lastSlots = value;
  }
}
