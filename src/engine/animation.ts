/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import EventEmitter from 'eventemitter3';
import { Vector } from 'vector2d';

/**
 * Animation
 */
export class Animation extends EventEmitter {
  protected readonly name: string;
  protected readonly offset: Vector = new Vector(0, 0);
  protected readonly count: number = 0;
  protected readonly speed: number = 0.1;
  protected readonly loop: boolean = true;
  protected current: number = 0.0;
  protected stopped: boolean = false;

  public constructor(name: string, offset: Vector, count: number, speed: number, loop: boolean = true) {
    super();

    this.name = name;
    this.offset = offset;
    this.count = count;
    this.speed = speed;
    this.loop = loop;
  }

  /**
   * Fixed update
   */
  public onUpdate(): void {
    const value = this.current + this.speed;
    if (value >= this.count) {
      this.emit('done');
      this.stopped = !this.loop;
    }

    if (!this.stopped) {
      this.current = value % this.count; //Math.min(value, this.count);
    }
  }

  /**
   * Reset animation frame
   */
  public reset(): void {
    this.current = 0;
  }

  /**
   * Get current frame
   */
  public getFrameIndex(offset: Vector = new Vector(0, 0)): Vector {
    const frame = Math.floor(this.current);

    return this.offset
      .clone()
      .add(offset)
      .add(new Vector(0, frame)) as Vector;
  }
}
