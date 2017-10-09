/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { SoundOutput } from './sound';
import { KeyboardInput } from './keyboard';
import { MouseInput } from './mouse';
import { Scene } from './scene';
import { Sprite } from './sprite';
import { Core, CoreConfiguration } from './core';
import { Vector } from 'vector2d';
import { merge } from 'lodash';

type DeepPartial<T> = T extends object ? { [K in keyof T]?: DeepPartial<T[K]> } : T;

/**
 * Null Scene
 */
export class NullScene extends Scene {
  private index: number = 0;

  public onRender(deltaTime: number): void {
    const context = this.engine.getContext();
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    context.fillStyle = '#ffffff';
    context.strokeStyle = '#ffffff';
    context.lineWidth = 2;
    context.font = '28px monospace';
    const dimension = this.engine.getDimension();
    const text = Array(3).fill('').map((s, i) => Math.round(this.index) === i ? '|' : '.');
    context.fillText(text.join(''), dimension.x / 2, dimension.y / 2);
    this.index = (this.index + 0.1) % 3;
  }
}

/**
 * Main Engine class
 */
export abstract class Engine implements Core {
  private running: boolean = false;
  private paused: boolean = false;
  private wasPaused: boolean = false;
  private nextTick: number = 0;
  private fpsAverage: number = 0;
  private fps: number = 0;
  private delta: number = 0;
  private dimension: Vector = new Vector(800, 600);
  private sceneQueue: Scene[] = [];
  private canvasFilter: boolean = true;
  protected readonly canvas: HTMLCanvasElement;
  protected readonly context: CanvasRenderingContext2D;
  protected readonly root: HTMLElement;
  protected readonly bufferCanvas: HTMLCanvasElement = document.createElement('canvas');
  protected readonly bufferContext: CanvasRenderingContext2D = this.bufferCanvas.getContext('2d') as CanvasRenderingContext2D;
  protected scene: Scene;
  protected debug: boolean = true;
  public time: number = 0;
  public readonly keyboard: KeyboardInput;
  public readonly mouse: MouseInput;
  public readonly sound: SoundOutput;
  public readonly configuration: CoreConfiguration = {
    minScale: 1.0,
    maxScale: 4.0,
    scale: 2.0,
    updateRate: 1000 / 30, // 33hz
    sound: {
      muted: false,
      mainVolume: 1.0,
      sfxVolume: 0.9,
      musicVolume: 1.0,
      guiVolume: 1.0
    }
  }

  public constructor(canvas: HTMLCanvasElement, configuration?: DeepPartial<CoreConfiguration>) {
    this.configuration = merge({}, this.configuration, configuration || {});

    this.scene = new NullScene(this);
    this.keyboard = new KeyboardInput(this);
    this.mouse = new MouseInput(this);
    this.sound = new SoundOutput(this);

    this.canvas = canvas;
    this.context = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.root = canvas.parentNode as HTMLElement;

    this.canvas.addEventListener('contextmenu', (ev: Event): void => {
      ev.preventDefault();
    });

    this.setCanvasFilter(this.canvasFilter);
    this.resize();
  }

  /**
   * Convert to string (for debugging)
   */
  public toString(): string {
    const fps = String(this.fpsAverage << 0);
    const fpsNow = this.fps.toFixed(3);
    const delta = this.delta.toFixed(3);
    const rate = this.configuration.updateRate.toFixed(3);
    const time = this.time.toFixed(1);

    return `${fps}/${fpsNow}FPS ${delta}ms ${time}s (${rate}hz)`;
  }

  /**
   * Initializes engine
   */
  public async init(): Promise<void> {
    console.group('Engine::init()', this);

    await this.keyboard.init();
    await this.mouse.init();
    await this.sound.init();

    //this.canvas!.requestPointerLock();

    console.groupEnd();
  }

  /**
   * Destroys the engine
   */
  public destroy(): void {
    this.scene.destroy();
    this.keyboard.destroy();
    this.mouse.destroy();
    this.sound.destroy();

    Sprite.clearCache();

    this.scene = new NullScene(this);
    this.running = false;
    this.paused = true;
  }

  /**
   * Resizes the canvas
   */
  public resize(): void {
    const scaled = this.getScaledDimension();

    this.dimension = scaled;
    this.bufferCanvas.width = this.dimension.x;
    this.bufferCanvas.height = this.dimension.y;
    this.canvas.width = this.dimension.x;
    this.canvas.height = this.dimension.y;

    this.scene.onResize();

    console.debug('Engine::resize()', this.dimension);
  }

  /**
   * Starts the rendering loop
   */
  public run(): void {
    if ( this.running ) {
      return;
    }

    const now = performance.now();

    let lastFrame: any;
    let lastTick: number = now;

    const step = (t: number): void => {
      if ( !this.running ) {
        window.cancelAnimationFrame(lastFrame);
        return;
      }

      this.delta = (t - lastTick) / 1000;
      this.fps = 1 / this.delta;

      /**
       * NOTE: This is for our variable update rate. This makes sure that
       * it runs at a steady frequency (always "catches up").
       */
      let skipTicks = 1000 / this.configuration.updateRate;
      while ( t > this.nextTick ) {
        this.fpsAverage += (this.fps - this.fpsAverage) / 10;
        this.nextTick += skipTicks;
        this.onUpdate(performance.now() - t);
      }

      lastTick = t;

      const d = t - lastTick;
      this.onRender(d);
      this.time += this.delta;
      lastFrame = window.requestAnimationFrame(step);
    };

    this.running = true;
    this.nextTick = now;

    step(performance.now());
  }

  /**
   * Pauses the engine
   */
  public pause(state: boolean = true): void {
    if (state) {
    } else {
      this.nextTick = performance.now();
    }

    this.paused = state;

    if (this.sound.playlist.paused !== state) {
      this.sound.playlist.pause(state);
    }

    this.mouse.clear();
    this.scene.onPause(state);

    console.debug('Engine:pause()', this.paused);
  }

  /**
   * Unpauses the engine
   */
  public resume(): void {
    if (this.sound.context.state === 'suspended') {
      // https://developers.google.com/web/updates/2017/09/autoplay-policy-changes#webaudio
      this.sound.context.resume()
        .catch((e): void => console.warn(e));
    }

    this.pause(false);
  }

  /**
   * Queues a new scene to render
   */
  public async pushScene(scene: Scene, skip: boolean = true): Promise<void> {
    console.debug('Engine::pushScene()', scene, skip);

    if (skip) {
      this.scene.off('done');
      this.sceneQueue = [scene];
    } else {
      this.sceneQueue.push(scene);
    }

    if (skip) {
      await this.nextScene();
    }

    this.scene.once('done', (): void => {
      this.nextScene();
    });
  }

  /**
   * Go to next scene
   */
  private async nextScene(): Promise<void> {
    let scene: Scene = this.sceneQueue.shift() as Scene;
    if (!scene) {
      scene = new NullScene(this);
    }

    this.scene.destroy();
    this.keyboard.clear();
    this.mouse.clear();
    this.sound.clear();

    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);
    this.scene = new NullScene(this);

    console.group('Engine::nextScene()', scene);

    try {
      await scene.init();
    } catch (error) {
      console.error(error);
    }

    this.scene = scene;

    this.resize();

    console.groupEnd();
  }

  /**
   * Fixed update
   */
  public onUpdate(deltaTime: number): void {
    if (this.paused) {
      this.wasPaused = true;
      return;
    }

    if (this.wasPaused) {
      this.wasPaused = false;

      this.keyboard.restore();
      this.mouse.restore();
      this.sound.restore();
    }

    this.scene.onUpdate(deltaTime);
    this.keyboard.onUpdate();
    this.mouse.onUpdate();
    this.sound.onUpdate();
  }

  /**
   * Renders to canvas
   */
  public onRender(deltaTime: number): void {
    if (this.paused) {
      return;
    }

    this.bufferContext.clearRect(0, 0, this.dimension.x, this.dimension.y);
    this.scene.onRender(deltaTime);

    const fontSize = 12;
    this.context.font = `${fontSize}px monospace`;
    this.context.textBaseline = 'alphabetic';
    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);
    this.context.drawImage(this.bufferCanvas, 0, 0);

    if (this.debug) {
      this.context.fillStyle = 'rgba(255, 255, 255, 0.8)';
      const screen = [this.dimension.x, this.dimension.y, this.configuration.scale.toFixed(1)].join('x');
      const debugLines = [
        `Screen: ${screen} ${this.canvasFilter ? 'filtered' : 'unfiltered'}`,
        'Render: ' + this.toString(),
        'Keyboard: ' + this.keyboard.toString(),
        'Mouse: ' + this.mouse.toString(),
        'Sound: ' + this.sound.toString(),
        'Scene: ' + this.scene.toString()
      ].map((s: any): string[] => s.split('\n'));

      const space = fontSize + 4;
      ([] as string[]).concat(...debugLines).forEach((line, index): void => {
        this.context.fillText(line, 10, 20 + (index * space));
      });

      this.context.beginPath();
      this.context.moveTo(this.dimension.x / 2, 0);
      this.context.lineTo(this.dimension.x / 2, this.dimension.y);
      this.context.stroke();

      this.context.beginPath();
      this.context.moveTo(0, this.dimension.y / 2);
      this.context.lineTo(this.dimension.x, this.dimension.y / 2);
      this.context.stroke();
    } else {
      this.context.fillStyle = '#ffffff';
      this.context.fillText(String(this.fpsAverage << 0), 10, 20);
    }
  }

  /**
   * Sets cursor
   */
  public setCursor(enabled: boolean): void {
    this.canvas.style.cursor = enabled ? '' : 'none';
  }

  /**
   * Sets debug overlays
   */
  public setDebug(debug: boolean): void {
    this.debug = debug;
  }

  /**
   * Sets rendering scale
   */
  public setScale(scale: number): void {
    this.configuration.scale = Math.max(
      this.configuration.minScale,
      Math.min(scale, this.configuration.maxScale)
    );
    this.resize();
  }

  /**
   * Toggles canvas filtering
   */
  public setCanvasFilter(enable: boolean): void {
    this.canvasFilter = enable;

    if (enable) {
      this.canvas.classList.add('sharpen');
    } else {
      this.canvas.classList.remove('sharpen');
    }
  }

  /**
   * Gets canvas filter state
   */
  public getCanvasFilter(): boolean {
    return this.canvasFilter;
  }

  /**
   * Gets debug mode toggle
   */
  public getDebug(): boolean {
    return this.debug;
  }

  /**
   * Gets rendering dimensions based on scale
   */
  public getScaledDimension(): Vector {
    return new Vector(
      Math.round(this.root.clientWidth / this.configuration.scale),
      Math.round(this.root.clientHeight / this.configuration.scale)
    );
  }

  /**
   * Gets rendering dimension
   */
  public getDimension(): Vector {
    return this.dimension;
  }

  /**
   * Gets rendering context
   */
  public getContext(): CanvasRenderingContext2D {
    return this.bufferContext;
  }

  /**
   * Gets rendering scale
   */
  public getScale(): number {
    return this.configuration.scale;
  }

  /**
   * Gets paused state
   */
  public getPause(): boolean {
    return this.paused;
  }

  /**
   * Gets renderer root element
   */
  public getRoot(): HTMLElement {
    return this.root;
  }
}
