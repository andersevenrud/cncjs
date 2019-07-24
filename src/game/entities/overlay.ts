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
  protected zIndex: number = 4;
  protected occupy: MIXGrid = { name: '', grid: [['x']] };

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'overlay'
    };
  }

  public onRender(deltaTime: number): void {
    const context = this.map.objects.getContext();
    this.renderSprite(deltaTime, context);
    super.onRender(deltaTime);
  }

  public getColor(): string {
    return '#ffffff';
  }
}
