/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import EventEmitter from 'eventemitter3';
import { Core } from './core';

/**
 * Base Scene
 */
export abstract class Scene extends EventEmitter {
  public engine: Core;
  protected destroyed: boolean = false;

  public constructor(engine: Core) {
    super();

    this.engine = engine;
    this.onCreate();
  }

  /**
   * Initialize scene
   */
  public async init(): Promise<void> {
  }

  /**
   * Destroys instance
   */
  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    super.removeAllListeners();
    this.onDestroy();
  }

  /**
   * Convert to string (for debugging)
   */
  public toString(): string {
    return '<null>';
  }

  /**
   * Destruction action
   */
  public onDestroy(): void {
  }

  /**
   * Creation action
   */
  public onCreate(): void {
  }

  /**
   * Resize action
   */
  public onResize(): void {
  }

  /**
   * Pause action
   */
  public onPause(state: boolean): void {
  }

  /**
   * Update action
   */
  public onUpdate(deltaTime: number): void {
  }

  /**
   * Render action
   */
  public onRender(deltaTime: number): void {
  }
}
