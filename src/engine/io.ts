/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import EventEmitter from 'eventemitter3';
import { Core } from './core';

/**
 * Fetch arraybuffer via XHR API
 */
export const fetchArrayBufferXHR = (url: string, bus?: EventEmitter): Promise<ArrayBuffer> =>
  new Promise((resolve, reject): void => {
    const xhr = new XMLHttpRequest();
    xhr.onload = (): void => resolve(xhr.response);
    xhr.onerror = reject;
    xhr.onabort = reject;

    if (bus) {
      xhr.onprogress = (ev: any): void => {
        bus.emit('progress', ev.loaded, ev.total);
      };
    }

    xhr.responseType = 'arraybuffer';
    xhr.open('GET', url, true);
    xhr.send();
  });

/**
 * Fetch arraybuffer via Fetch API
 */
export const fetchArrayBuffer = (url: string): Promise<ArrayBuffer> => fetch(url)
  .then((response: Response): Promise<ArrayBuffer> => response.arrayBuffer());

/**
 * Fetches an image via HTTP
 */
export const fetchImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject): void => {
    const image = new Image();
    image.onload = (): void => resolve(image);
    image.onerror = (error: any): void => reject(error);
    image.src = url;
  });

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
