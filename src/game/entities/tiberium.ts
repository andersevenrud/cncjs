/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { OverlayEntity } from './overlay';
import { MIXGrid } from '../mix';

/**
 * Overlay Entity
 */
export class TiberiumEntity extends OverlayEntity {
  protected tiberiumLeft = 11;
  protected zIndex: number = 1;
  protected occupy: MIXGrid = { name: '', grid: [] };

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'tiberium'
    };
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);
    this.frameOffset.setY(this.tiberiumLeft);
  }

  public getColor(): string {
    return '#004400';
  }

  public subtractTiberium(): void {
    this.tiberiumLeft = Math.max(0, this.tiberiumLeft - 1);
  }

  public hasTiberium(): boolean {
    return this.tiberiumLeft > 0;
  }

  public isTiberium(): boolean {
    return true;
  }
}
