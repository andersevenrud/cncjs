/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Vector } from 'vector2d';

/**
 * Sprite
 * TODO: Should really have been an Entity
 */
export class Sprite {
  public readonly canvas: HTMLCanvasElement = document.createElement('canvas');
  public readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d') as CanvasRenderingContext2D;
  public readonly source: string;
  public readonly clip: number[];
  public readonly size: Vector;
  public readonly frames: number;
  private readonly frameCache: Map<string, CanvasRenderingContext2D> = new Map();
  private static patterns: Map<string, CanvasPattern> = new Map();
  protected static cacheCount: number = 0;
  protected static readonly cache: Map<string, Sprite> = new Map();
  protected loaded: boolean = false;

  public constructor(source: string, size: Vector, frames: number, clip: number[] = []) {
    this.source = source;
    this.size = size;
    this.frames = frames;
    this.clip = clip;
  }

  /**
   * Clears cache
   */
  public static clearCache(): void {
    console.info('Sprite::clearCache()');
    this.cache.clear();
    this.patterns.clear();
    this.cacheCount = 0;
  }

  /**
   * Factory sprite from cache
   */
  public static createOrCache(name: string, cb: Function) {
    if (Sprite.cache.has(name)) {
      return Sprite.cache.get(name);
    }

    const instance = cb(name);
    Sprite.cache.set(name, instance);

    return instance;
  }

  /**
   * Convert to string (for debugging)
   */
  public static toString(): string {
    return `${this.cache.size} (${this.patterns.size}p ${this.cacheCount}f)`;
  }

  /**
   * Renders sprite
   */
  public render(frame: Vector, position: Vector, context: CanvasRenderingContext2D): HTMLCanvasElement {
    const xoff = frame.x * this.size.x;
    const yoff = frame.y * this.size.y;
    let [sx, sy, sw, sh, dx, dy, dw, dh] = this.getRect(position);
    sx = xoff;
    sy = yoff;

    let cached = this.frameCache.get(frame.toString());
    let canvas = cached ? cached.canvas : document.createElement('canvas');

    if (!cached) {
      canvas.width = dw;
      canvas.height = dh;
      cached = canvas.getContext('2d') as CanvasRenderingContext2D;
      cached.drawImage(this.canvas, sx, sy, sw, sh, 0, 0, dw, dh);
      this.frameCache.set(frame.toString(), cached);
      Sprite.cacheCount++;
    }

    context.drawImage(canvas, dx, dy);

    return canvas;
  }

  /**
   * Creates a pattern from frame
   */
  public createPattern(frame: Vector, repetition: string = 'repeat'): CanvasPattern | null {
    const name = [this.source, frame.x, frame.y, repetition].join('.');
    if (Sprite.patterns.has(name)) {
      return Sprite.patterns.get(name) || null;
    }

    const xoff = frame.x * this.size.x;
    const yoff = frame.y * this.size.y;
    const sw = this.size.x;
    const sh = this.size.y;

    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = sw;
    tempCanvas.height = sh;

    const context = tempCanvas.getContext('2d') as CanvasRenderingContext2D;
    context.drawImage(this.canvas, xoff, yoff, sw, sh, 0, 0, sw, sh);

    const pattern = context.createPattern(tempCanvas, repetition);

    if (pattern) {
      Sprite.patterns.set(name, pattern);
    }

    return pattern;
  }

  /**
   * Initializes sprite image
   */
  public init(image: HTMLImageElement): void {
    if (!this.loaded) {
      this.loaded = true;
      this.canvas.width = image.width;
      this.canvas.height = image.height;
      this.context.drawImage(image, 0, 0);
    }
  }

  /**
   * Gets the rectangle required for rendering on a target
   */
  public getRect(position: Vector): number[] {
    const off = this.getClipOffset();
    const sx = 0;
    const sy = 0;
    const sw = this.size.x;
    const sh = this.size.y;
    const dx = position.x - off.x;
    const dy = position.y - off.y;
    const dw = sw;
    const dh = sh;

    return [sx, sy, sw, sh, dx, dy, dw, dh];
  }

  /**
   * Gets the rectangle clip offset according to sprite data
   */
  public getClipOffset(): Vector {
    if (!this.clip.length) {
      return new Vector(0, 0);
    }

    const [cx, cy, cw, ch] = this.clip;
    return new Vector(
      cx - (cw / 2),
      cy - (ch / 2)
    );
  }
}
