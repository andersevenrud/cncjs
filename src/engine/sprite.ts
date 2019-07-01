/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Vector } from 'vector2d';

/**
 * Sprite Image
 */
export class SpriteImage {
  public readonly source: string;
  public readonly canvas: HTMLCanvasElement = document.createElement('canvas');
  public readonly context: CanvasRenderingContext2D = this.canvas.getContext('2d') as CanvasRenderingContext2D;
  private loaded: boolean = false;

  public constructor(source: string) {
    this.source = source;
  }

  public load(image: HTMLImageElement): void {
    if (this.loaded) {
      return;
    }

    this.loaded = true;
    this.canvas.width = image.width;
    this.canvas.height = image.height;
    this.context.drawImage(image, 0, 0);
  }
}

/**
 * Sprite
 */
export class Sprite {
  public readonly source: string;
  public readonly clip: number[];
  public readonly size: Vector;
  public readonly frames: number;
  public readonly image: SpriteImage;
  private lastFrame?: Vector;
  private lastFrameBuffer: HTMLCanvasElement = document.createElement('canvas');
  private lastFrameBufferContext: CanvasRenderingContext2D = this.lastFrameBuffer.getContext('2d') as CanvasRenderingContext2D;
  private static images: Map<string, SpriteImage> = new Map();
  private static patterns: Map<string, CanvasPattern> = new Map();

  public constructor(source: string, size: Vector, frames: number, clip: number[] = []) {
    if (!Sprite.images.has(source)) {
      Sprite.images.set(source, new SpriteImage(source));
    }

    this.source = source;
    this.size = size;
    this.frames = frames;
    this.clip = clip;
    this.image = Sprite.images.get(source) as SpriteImage;
    this.lastFrameBuffer.width = size.x;
    this.lastFrameBuffer.height = size.y;
  }

  /**
   * Clears cache
   */
  public static clearCache(): void {
    this.images.clear();
    this.patterns.clear();
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

    // We store the last cropped frame into a buffer to save (a lot) of computation
    // time when we advance to the next frame. Imagine that you have a 10x1000 sprite
    // image, and only need 10x10 of that. Instead of getting 10x1000 every time, we only
    // take the 10x10 from last frame.
    if (!this.lastFrame || !this.lastFrame.equals(frame)) {
      this.lastFrameBufferContext.clearRect(0, 0, dw, dh);
      this.lastFrameBufferContext.drawImage(this.image.canvas, sx, sy, sw, sh, 0, 0, dw, dh);
      this.lastFrame = frame.clone() as Vector;
    }

    //context.clearRect(dx, dy, dw, dh);
    context.drawImage(this.lastFrameBuffer, dx, dy);

    return this.lastFrameBuffer;
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
    context.drawImage(this.image.canvas, xoff, yoff, sw, sh, 0, 0, sw, sh);

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
    this.image.load(image);
  }

  /**
   * Resets last frame reference
   */
  public resetLastFrame(): void {
    this.lastFrame = undefined;
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

  /**
   * Gets the last frame buffer
   */
  public getLastFrameBuffer(): HTMLCanvasElement {
    return this.lastFrameBuffer;
  }
}
