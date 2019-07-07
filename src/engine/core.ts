/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { SoundOutput } from './sound';
import { KeyboardInput } from './keyboard';
import { MouseInput } from './mouse';
import { Vector } from 'vector2d';

export interface Core {
  readonly keyboard: KeyboardInput;
  readonly mouse: MouseInput;
  readonly sound: SoundOutput;
  readonly configuration: CoreConfiguration;
  time: number;
  ticks: number;
  frames: number;
  onUpdate(deltaTime: number): void;
  onRender(deltaTime: number): void;
  getDimension(): Vector;
  getContext(): CanvasRenderingContext2D;
  setScale(scale: number): void;
  setDebug(debug: boolean): void;
  setCanvasFilter(enable: boolean): void;
  getCanvasFilter(): boolean;
  getDebug(): boolean;
  getScale(): number;
  getScaledDimension(): Vector;
  getPause(): boolean;
  getRoot(): HTMLElement;
  getCanvas(): HTMLCanvasElement;
}

export interface CoreSoundConfiguration {
  muted: boolean;
  mainVolume: number;
  musicVolume: number;
  sfxVolume: number;
  guiVolume: number;
}

export interface CoreConfiguration {
  debugMode: boolean;
  maxScale: number;
  minScale: number;
  scale: number;
  updateRate: number;
  sound: CoreSoundConfiguration;
  cursorLock: boolean;
}
