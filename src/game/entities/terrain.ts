/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { GameMapEntity } from './mapentity';
import { MIXGrid, MIXTerrain } from '../mix';
import { Vector } from 'vector2d';

/**
 * Terrain Entity
 */
export class TerrainEntity extends GameMapEntity {
  public readonly properties: MIXTerrain = this.engine.mix.terrain.get(this.data.name) as MIXTerrain;
  protected zIndex: number = this.isTiberiumTree() ? 5 : 2;
  protected dimension: Vector = new Vector(16, 16);
  protected occupy?: MIXGrid = {
    name: '',
    grid: [['x']]
  };

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'terrain'
    }
  }

  public async init(): Promise<void> {
    await super.init();

    if (this.sprite) {
      this.setDimension(this.sprite.size);
    }
  }

  public onRender(deltaTime: number): void {
    const context = this.map.objects.getContext();
    this.renderSprite(deltaTime, context);
    super.onRender(deltaTime);
  }

  public getColor(): string {
    return '#002200';
  }

  private isTiberiumTree(): boolean {
    return this.data.name.substr(0, 5) === 'SPLIT';
  }
}

