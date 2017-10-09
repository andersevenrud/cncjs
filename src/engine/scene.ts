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

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.destroyed = true;
    super.removeAllListeners();
    this.onDestroy();
  }

  public toString(): string {
    return '<null>';
  }

  public onDestroy(): void {
  }

  public onCreate(): void {
  }

  public onResize(): void {
  }

  public onPause(state: boolean): void {
  }

  public onUpdate(deltaTime: number): void {
  }

  public onRender(deltaTime: number): void {
  }

  public async init(): Promise<void> {
  }
}
