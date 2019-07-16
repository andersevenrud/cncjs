/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { GameMapEntity } from './mapentity';

/**
 * Smudge Entity
 */
export class SmudgeEntity extends GameMapEntity {
  protected zIndex: number = -1;

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'smudge'
    };
  }

  public async init(): Promise<void> {
    await super.init();

    if (this.sprite) {
      this.setDimension(this.sprite.size);
    }
  }

  public onRender(deltaTime: number): void {
    const context = this.map.terrain.getContext();
    this.renderSprite(deltaTime, context);
  }

  public getSpriteName(): string {
    return `${this.map.getTheatre().toUpperCase()}.MIX/${this.data.name.toLowerCase()}.png`;
  }

  public getColor(): string {
    return '#002200';
  }
}
