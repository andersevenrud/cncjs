/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Core } from './core';

/**
 * Cached Loader
 */
export abstract class CachedLoader<T> {
  protected readonly cache: Map<string, Promise<T>> = new Map();

  /**
   * Clears cache
   */
  public clearCache(): void {
    this.cache.clear();
  }

  /**
   * Gets cached promise or false
   */
  protected cached(source: string): any {
    if (this.cache.has(source)) {
      return this.cache.get(source);
    }

    return false;
  }

  /**
   * Fetch a resource (wrapper)
   */
  protected async fetchResource(source: string, callback: Function): Promise<T> {
    const cached = this.cached(source);
    if (cached) {
      return cached;
    }

    const item = await callback();
    this.cache.set(source, item);
    return item;
  }
}

/**
 * IO Device Base Class
 */
export abstract class IODevice {
  protected readonly engine: Core;

  public constructor(engine: Core) {
    this.engine = engine;
  }

  /**
   * Destroys instance
   */
  public destroy(): void {
  }

  /**
   * Initializes IO
   */
  public async init(): Promise<void> {
  }

  /**
   * Restores IO from a paused state
   */
  public restore(): void {
  }

  /**
   * Flushes out stuff between scenes etc.
   */
  public clear(): void {
  }

  /**
   * On every game tick
   */
  public onUpdate(): void {
  }
}
