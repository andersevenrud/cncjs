/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { GameMapEntity } from './mapentity';
import { MIXGrid } from '../mix';

/**
 * Overlay Entity
 */
export class OverlayEntity extends GameMapEntity {
  protected tiberiumLeft = 11;
  protected zIndex: number = 4;
  protected occupy: MIXGrid = this.isTiberium()
    ? { name: '', grid: [] }
    : { name: '', grid: [['x']] };

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'overlay'
    };
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    if (this.isTiberium()) {
      this.frameOffset.setY(this.tiberiumLeft);
    }
  }

  public onRender(deltaTime: number): void {
    const context = this.map.overlay.getContext();
    this.renderSprite(deltaTime, context);
    super.onRender(deltaTime);
  }

  public getColor(): string {
    return this.isTiberium() ? '#004400' : '#ffffff';
  }
}
