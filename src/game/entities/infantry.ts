/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Animation, randomBetweenInteger }  from '../../engine';
import { GameEntity } from '../entity';
import { GameMapEntity, GameMapEntityAnimation } from './mapentity';
import { MIXInfantry, MIXInfantryAnimation, infantryIdleAnimations } from '../mix';
import { getSubCellOffset } from '../physics';
import { Vector } from 'vector2d';

/**
 * Infantry Entity
 */
export class InfantryEntity extends GameMapEntity {
  public readonly properties: MIXInfantry = this.engine.mix.infantry.get(this.data.name) as MIXInfantry;
  protected dimension: Vector = new Vector(16, 16);
  protected directions: number = 8;
  protected animation: string = 'Ready';
  protected idleTimer: number = 100;
  protected idleAnimation: string = 'Ready';
  protected reportDestroy?: string = 'nuyell1'; // FIXME: Should be handled by projectile
  protected reportSelect?: string = 'AWAIT1';
  protected reportMove?: string = 'ACKNO';
  protected reportAttack?: string = 'ACKNO';
  protected zIndex: number = 2;
  protected capturing?: GameEntity;

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'infantry'
    };
  }

  public async init(): Promise<void> {
    // TODO: Guy
    if (this.data.name === 'C10') {
      // FIXME: More sounds
      this.reportSelect = 'MCOMND1';
      this.reportMove = 'MCOURSE1';
      this.reportAttack = this.reportMove;
    } else if (this.properties.IsCivilian) {
      this.reportSelect = 'GUYYEAH1';
      this.reportMove = 'GUYOKAY1';
      this.reportAttack = this.reportMove;
    } if (this.properties.FemaleCiv) {
      this.reportSelect = 'GIRLYEAH';
      this.reportMove = 'GIRLOKAY';
      this.reportAttack = this.reportMove;
    }

    const subcell = this.data!.subcell!;
    if (subcell >= 0) {
      const offset = getSubCellOffset(subcell, this.getDimension());
      this.position.add(offset);
      this.subCell = subcell;
    }

    const animations = this.engine.mix.infantryAnimations.get(`Sequence_${this.data.name}`) as MIXInfantryAnimation;
    Object.keys(animations)
      .forEach((name: string): void => {
        const [start, number, multiplier] = (animations as any)[name];
        const anim = new GameMapEntityAnimation(name, new Vector(0, start), number, 0.1, multiplier);
        this.animations.set(name, anim);
      });

    await super.init();
  }

  public capture(target: GameEntity): void {
    if (this.canCapture()) {
      const targetCell = target.getCell();
      this.moveTo(targetCell, true, true);
      this.capturing = target;
    }
  }

  public die(): boolean {
    if (super.die(false)) {
      // FIXME
      const animation = this.animations.get('Die1') as Animation;
      animation.once('done', () => this.destroy());

      return true;
    }

    return false;
  }

  public move(position: Vector, report: boolean = false): boolean {
    if (super.move(position, report)) {
      this.targetSubCell = 0; // FIXME
      return true;
    }

    return false;
  }

  protected moveTo(position: Vector, report: boolean = false, force: boolean = false): boolean {
    this.capturing = undefined;
    return super.moveTo(position, report, force);
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    let animation = this.attacking
      ? 'FireUp'
      : this.dying ? 'Die1' :
        this.targetPosition ? 'Walk' : this.idleAnimation;

    if (this.animation !== animation) {
      const a = this.animations.get(animation) as Animation;
      a.reset();

      if (animation === this.idleAnimation) {
        a.once('done', () => (this.idleAnimation = 'Ready'));
      }
    }

    if (animation === this.idleAnimation) {
      this.idleTimer--;

      if (this.idleTimer < 0) {
        this.idleAnimation = infantryIdleAnimations[randomBetweenInteger(0, infantryIdleAnimations.length - 1)];
        this.idleTimer = randomBetweenInteger(200, 1000);
      }
    }

    if (this.capturing) {
      const distance =  this.capturing.getCell()
        .distance(this.getCell());

      if (distance <= 1) {
        if (this.player) {
          this.capturing.setPlayer(this.player);
          // FIXME: Need to call player update to get credits etc.
        }
        this.destroy();
      }
    }

    this.animation = animation;
  }

  public onRender(deltaTime: number): void {
    const context = this.map.objects.getContext();
    super.onRender(deltaTime);

    if (!this.sprite) {
      return;
    }

    const position = this.getTruncatedPosition();
    const animation = this.animations.get(this.animation) as GameMapEntityAnimation;
    const frame = animation.getFrameIndex(this.frameOffset);
    const off = Math.round(this.direction) * animation.multiplier;

    frame.add(new Vector(0, off));
    this.sprite!.render(frame, position, context);
  }

  public isSelectable(): boolean {
    return true;
  }

  public isMovable(): boolean {
    return true;
  }

  public isInfantry(): boolean {
    return true;
  }
}
