/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { IODevice } from './io';

/**
 * Keyboard key type
 */
export type KeyboardKey = string;

/**
 * Normalizes keyboard input names
 */
const keyName = (key: string): string => {
  key = key.toLowerCase();
  return key === ' ' ? 'space' : key;
};

/**
 * Keyboard Device
 */
export class KeyboardInput extends IODevice {
  private activeKeys: Set<KeyboardKey> = new Set();
  private activePresses: Set<KeyboardKey> = new Set();

  /**
   * Initializes keyboard input
   */
  public async init(): Promise<void> {
    console.debug('KeyboardInput::init()');

    const onKeyDown = this.onKeyDown.bind(this);
    const onKeyUp = this.onKeyUp.bind(this);
    const onKeyPress = this.onKeyPress.bind(this);

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('keypress', onKeyPress);
  }

  /**
   * On every update
   */
  public onUpdate(): void {
    this.activePresses.clear();
  }

  /**
   * Convert to string (for debugging)
   */
  public toString(): string {
    return `[${Array.from(this.activeKeys.values()).join(',')}]`;
  }

  /**
   * Restores IO from a paused state
   */
  public restore(): void {
    this.activeKeys.clear();
  }

  /**
   * Key down
   */
  private onKeyDown(ev: KeyboardEvent): void {
    if (!ev.ctrlKey) {
      ev.preventDefault();
    }

    this.activeKeys.add(keyName(ev.key));
  }

  /**
   * Key up
   */
  private onKeyUp(ev: KeyboardEvent): void {
    ev.preventDefault();

    const key = keyName(ev.key);
    this.activeKeys.delete(key);
    this.activePresses.add(key);
  }

  /**
   * Key press
   */
  private onKeyPress(ev: KeyboardEvent): void {
    ev.preventDefault();
  }

  /**
   * Check if key is pressed
   */
  public isPressed(key?: KeyboardKey | KeyboardKey[]): boolean {
    if (key instanceof Array) {
      return key.some((b: KeyboardKey): boolean => this.activeKeys.has(keyName(b)));
    }

    return typeof key === 'undefined'
      ? this.activeKeys.size > 0
      : this.activeKeys.has(keyName(key));
  }

  /**
   * Check is key was clicked
   */
  public wasClicked(key?: KeyboardKey | KeyboardKey[]): boolean {
    if (key instanceof Array) {
      return key.some((b: KeyboardKey): boolean => this.activePresses.has(keyName(b)));
    }

    return typeof key === 'undefined'
      ? this.activePresses.size > 0
      : this.activePresses.has(keyName(key));
  }
}
