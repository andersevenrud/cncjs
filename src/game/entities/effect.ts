/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Entity } from '../../engine';
import { GameMapEntity, GameMapEntityAnimation } from './mapentity';
import { MIXAnimation } from '../mix';
import { CELL_SIZE } from '../physics';
import { Vector } from 'vector2d';

export class EffectEntity extends GameMapEntity {
  protected zIndex: number = 10;
  protected centerEntity?: Entity;

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'effect'
    }
  }

  public async init(): Promise<void> {
    await super.init();

    const name = this.data.name;
    const manim = this.engine.mix.animations.get(name) as MIXAnimation;
    if (manim.Report) {
      this.playSfx(manim.Report.toLowerCase());
    }

    if (this.sprite) {
      const start = manim.FirstFrame;
      const length = manim.Frames === -1 ? this.sprite.frames : manim.Frames;
      const anim = new GameMapEntityAnimation(name, new Vector(0, start), length, 0.1);
      anim.on('done', () => this.destroy());
      this.animation = name;

      this.dimension = this.sprite.size.clone() as Vector;
      if (['IONSFX'].indexOf(this.data.name) !== -1) {
        this.offset = new Vector(this.sprite.size.x / 2, this.sprite.size.y);
      } else {
        this.offset = new Vector(this.sprite.size.x / 2, this.sprite.size.y / 2);
      }

      if (['IONSFX', 'ATOMSFX'].indexOf(this.data.name) !== -1) {
        this.offset.subtract(new Vector(
          CELL_SIZE / 2,
          CELL_SIZE / 2
        ));
      }

      if (this.centerEntity) {
        const dimension = this.centerEntity.getDimension().divS(2);
        this.offset.subtract(dimension);
      }

      this.animations.set(name, anim);
    }
  }

  public onUpdate(deltaTime: number): void {
    const anim = this.animations.get(this.animation);
    if (anim) {
      anim.onUpdate();
      this.frame = anim.getFrameIndex();
    }
    super.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number): void {
    const context = this.map.overlay.getContext();
    this.renderSprite(deltaTime, context);
    super.onRender(deltaTime);
  }

  public setCenterEntity(entity?: Entity) {
    this.centerEntity = entity;
  }

  public getSpriteName(): string {
    const manim = this.engine.mix.animations.get(this.data.name) as MIXAnimation;
    const name = manim.Graphic || this.data.name;
    return `CONQUER.MIX/${name.toLowerCase()}.png`;
  }
}
