/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Entity } from '../../engine';
import { Vector } from 'vector2d';
import { healthBarColors } from '../mix';
import { GameMapEntity } from './mapentity';

const HEALT_BAR_HEIGHT = 6;

export class HealthBarEntity extends Entity {
  private parent: GameMapEntity;

  public constructor(parent: GameMapEntity) {
    super();
    this.parent = parent;
  }

  public render(deltaTime: number, context: CanvasRenderingContext2D) {
    this.setDimension(new Vector(
      this.parent.getDimension().x,
      HEALT_BAR_HEIGHT
    ));

    const percentage = this.parent.getHealth() / this.parent.getHitPoints();
    const color = healthBarColors[this.parent.getDamageState()];
    const position = this.parent.getPosition();
    const x = Math.trunc(position.x);
    const y = Math.trunc(position.y);
    const w = Math.round(this.dimension.x * percentage) - 2;

    this.context.fillStyle = '#000000';
    this.context.fillRect(0, 0, this.dimension.x,  HEALT_BAR_HEIGHT);
    this.context.fillStyle = color;
    this.context.fillRect(1, 1, w - 2, HEALT_BAR_HEIGHT - 2);

    context.drawImage(this.canvas, x, y - HEALT_BAR_HEIGHT - 2);
  }
}
