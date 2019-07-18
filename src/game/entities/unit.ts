/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { Animation, Sprite }  from '../../engine';
import { MIXUnit } from '../mix';
import { CELL_SIZE } from '../physics';
import { spriteFromName } from '../sprites';
import { GameMapEntity } from './mapentity';
import { Vector } from 'vector2d';

/**
 * Unit Entity
 */
export class UnitEntity extends GameMapEntity {
  public readonly properties: MIXUnit = this.engine.mix.units.get(this.data.name) as MIXUnit;
  protected dimension: Vector = new Vector(24, 24);
  protected wakeSprite?: Sprite;
  protected wakeAnimation?: Animation;
  protected reportSelect?: string = 'AWAIT1';
  protected reportMove?: string = 'ACKNO';
  protected reportAttack?: string = 'ACKNO';
  protected zIndex: number = 3;

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'unit'
    };
  }

  public async init(): Promise<void> {
    if (this.properties.HasTurret) {
      this.turretDirection = this.direction;
    }

    await super.init();

    if (!this.sprite) {
      return;
    }

    if (this.data.name === 'BOAT') { // FIXME
      // FIXME
      this.dimension = this.sprite.size.clone() as Vector;
      this.directions = 2;
      this.direction = this.direction > 16 ? 1 : 0;

      this.wakeSprite = spriteFromName('CONQUER.MIX/wake.png');

      const half = this.wakeSprite.frames / 2;
      this.wakeAnimation = new Animation('Idle', new Vector(0, 0), half, 0.2);

      await this.engine.loadArchiveSprite(this.wakeSprite);
    } else {
      if (this.sprite.size.x > CELL_SIZE) {
        this.offset.setX((this.sprite.size.x / 2) - (CELL_SIZE / 2));
      }
      if (this.sprite.size.y > CELL_SIZE) {
        this.offset.setY((this.sprite.size.y / 2) - (CELL_SIZE / 2));
      }
    }
  }

  public deploy(): void {
    if (this.isDeployable()) {
      this.destroy();

      this.map.factory.load('structure', {
        name: 'FACT',
        player: this.data.player,
        cell: this.cell
      });
    }
  }

  public die(): boolean {
    // TODO: Crowded unit should spawn a low-health infantry
    if (super.die()) {
      const name = this.properties!.DeathAnimation;

      this.map.factory.load('effect', {
        name,
        cell: this.cell.clone() as Vector
      }, (effect: any) => effect.setCenterEntity(this));

      this.destroy();

      return true;
    }

    return false;
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    if (this.wakeAnimation) {
      this.wakeAnimation.onUpdate();
    }
  }

  public onRender(deltaTime: number): void {
    super.onRender(deltaTime);

    if (!this.sprite) {
      return;
    }

    const context = this.map.objects.getContext();
    const position = this.getTruncatedPosition(this.offset);

    if (this.wakeSprite) {
      const o = new Vector(0, this.direction === 0 ? this.wakeSprite.frames / 2 : 0);
      const f = this.wakeAnimation!.getFrameIndex(o);
      const p = position.clone().add(new Vector(
        -this.dimension.x / 2,
        this.dimension.y / 2
      )) as Vector;

      this.wakeSprite.render(f, p, context);
    }

    if (this.data.name === 'BOAT') {
      const spriteOffset = (this.sprite.frames / 2) * this.direction;
      const turretOffset = Math.round(this.turretDirection);
      const frame = new Vector(this.frameOffset.x, spriteOffset + turretOffset);
      this.sprite.render(frame, position, context);
    } else {
      const frame = new Vector(this.frameOffset.x, Math.round(this.direction));
      this.sprite.render(frame, position, context);

      if (this.properties.HasTurret) {
        const turretFrame = new Vector(
          this.frameOffset.x,
          Math.round(this.turretDirection) + this.sprite.frames / 2
        );
        this.sprite.render(turretFrame, position, context);
      }
    }
  }

  public getRotationSpeed(): number {
    return this.properties!.TurnSpeed;
  }

  public canRotate(): boolean {
    return !this.properties!.CantTurn;
  }

  public canFireTwice(): boolean {
    return !!this.properties!.FiresTwice;
  }

  public isDeployable(): boolean {
    return this.isPlayer() && this.data.name === 'MCV';
  }

  public isSelectable(): boolean {
    return true;
  }

  public isMovable(): boolean {
    return this.data.name !== 'BOAT'; // FIXME
  }

  public isUnit(): boolean {
    return true;
  }
}
