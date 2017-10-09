/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Vector } from 'vector2d';
import { Box } from './physics';

/**
 * Entity
 */
export class Entity {
  public position: Vector = new Vector(0, 0);
  public dimension: Vector = new Vector(0, 0);
  protected readonly canvas: HTMLCanvasElement = document.createElement('canvas');
  protected readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d') as CanvasRenderingContext2D;
  protected destroyed: boolean = false;

  /**
   * Converts to string
   */
  public toString(): string {
    return `${this.position.toString()} ${this.dimension.toString()}`;
  }

  /**
   * Destroy entity
   */
  public destroy(): void {
    this.destroyed = true;
  }

  /**
   * Sets position
   */
  public setPosition(position: Vector): void {
    this.position = position;
  }

  /**
   * Sets dimension
   */
  public setDimension(dimension: Vector): void {
    this.dimension = dimension;
    this.canvas.width = dimension.x;
    this.canvas.height = dimension.y;
  }

  /**
   * Gets current position
   */
  public getPosition(): Vector {
    return this.position.clone() as Vector;
  }

  /**
   * Gets the entity box
   */
  public getBox(): Box {
    return {
      x1: this.position.x,
      x2: this.position.x + this.dimension.x,
      y1: this.position.y,
      y2: this.position.y + this.dimension.y
    };
  }

  /**
   * Gets the entity canvas
   */
  public getCanvas(): HTMLCanvasElement {
    return this.canvas;
  }

  /**
   * Gets the entity canvas context
   */
  public getContext(): CanvasRenderingContext2D {
    return this.context;
  }

  /**
   * Gets destroyed state
   */
  public isDestroyed(): boolean {
    return this.destroyed;
  }
}
