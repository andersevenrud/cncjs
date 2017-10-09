/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { IODevice } from './io';
import { Vector } from 'vector2d';

export const CLICK_MOVEMENT_GRACE = 8;

export const mouseButtonMap: MouseButton[] = ['left', 'middle', 'right'];

export type MouseButton = 'left' | 'middle' | 'right';

export interface MousePosition {
  x: number;
  y: number;
  z: number;
}

/**
 * Mouse Device
 */
export class MouseInput extends IODevice {
  private activeButtons: Set<MouseButton> = new Set();
  private activePresses: Set<MouseButton> = new Set();
  private position: MousePosition = { x: 0, y: 0, z: 0 };
  private wheelTimeout?: any;
  private pressStart?: Vector;

  public onUpdate(): void {
    this.activePresses.clear();
  }

  /**
   * Initializes mouse input
   */
  public async init(): Promise<void> {
    console.debug('MouseInput::init()', this);

    const onMouseDown = this.onMouseDown.bind(this);
    const onMouseUp = this.onMouseUp.bind(this);
    const onMouseClick = this.onMouseClick.bind(this);
    const onMouseMove = this.onMouseMove.bind(this);
    const onMouseWheel = this.onMouseWheel.bind(this);

    const onTouchStart = this.onTouchStart.bind(this);
    const onTouchEnd = this.onTouchEnd.bind(this);
    const onTouchMove = this.onTouchMove.bind(this);

    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchmove', onTouchMove);

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('click', onMouseClick);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('wheel', onMouseWheel);
  }

  /**
   * Convert to string (for debugging)
   */
  public toString(): string {
    return [
      `[${Array.from(this.activeButtons).join(',')}]`,
      [this.position.x, this.position.y, this.position.z].join(',')
    ].join(' ');
  }

  /**
   * Restores IO from a paused state
   */
  public restore(): void {
    this.clear();
  }

  public clear(): void {
    this.activeButtons.clear();
    this.activePresses.clear();
  }

  /**
   * Touch start
   */
  private onTouchStart(ev: TouchEvent): void {
    this.pressStart = new Vector(ev.touches[0].clientX, ev.touches[0].clientY);
    this.activeButtons.add('left');
  }

  /**
   * Touch end
   */
  private onTouchEnd(ev: TouchEvent): void {
    this.activeButtons.delete('left');
    this.pressStart = undefined;
  }

  /**
   * Touch move
   */
  private onTouchMove(ev: TouchEvent): void {
    this.position.x = ev.touches[0].clientX;
    this.position.y = ev.touches[0].clientY;
  }

  /**
   * Mouse down
   */
  private onMouseDown(ev: MouseEvent): void {
    ev.preventDefault();
    this.pressStart = new Vector(ev.clientX, ev.clientY);

    const btn: MouseButton = mouseButtonMap[ev.button];
    this.activeButtons.add(btn);
  }

  /**
   * Mouse up
   */
  private onMouseUp(ev: MouseEvent): void {
    ev.preventDefault();

    const btn: MouseButton = mouseButtonMap[ev.button];
    if (this.activeButtons.has(btn)) {
      if (this.pressStart) {
        const current = new Vector(ev.clientX, ev.clientY);
        const distance = this.pressStart.distance(current);
        if (distance < CLICK_MOVEMENT_GRACE) {
          this.activePresses.add(btn);
        }
      } else {
        this.activePresses.add(btn);
      }
    }

    this.activeButtons.delete(btn);
    this.pressStart = undefined;
  }

  /**
   * Mouse click
   */
  private onMouseClick(ev: MouseEvent): void {
    ev.preventDefault();
  }

  /**
   * Mouse wheel
   */
  private onMouseWheel(ev: MouseWheelEvent): void {
    if (this.wheelTimeout) {
      clearTimeout(this.wheelTimeout);
    }

    this.position.z = Math.sign(ev.deltaY);
    this.wheelTimeout = setTimeout((): void => {
      this.position.z = 0;
    }, 100);
  }

  /**
   * Mouse move
   */
  private onMouseMove(ev: MouseEvent): void {
    const scale = this.engine.getScale();
    this.position.x = (ev.clientX / scale) << 0;
    this.position.y = (ev.clientY / scale) << 0;
  }

  /**
   * Get current position
   */
  public getPosition(): MousePosition {
    return {
      x: this.position.x,
      y: this.position.y,
      z: this.position.z
    };
  }

  /**
   * Gets position as vector (without scroll/z)
   */
  public getVector(): Vector {
    return new Vector(this.position.x, this.position.y);
  }

  /**
   * Check if button is pressed
   */
  public isPressed(button?: MouseButton | MouseButton[]): boolean {
    if (button instanceof Array) {
      return button.some((b): boolean => this.activeButtons.has(b));
    }

    return typeof button === 'undefined'
      ? this.activeButtons.size > 0
      : this.activeButtons.has(button);
  }

  /**
   * Check is button was clicked
   */
  public wasClicked(button?: MouseButton | MouseButton[]): boolean {
    if (button instanceof Array) {
      return button.some((b): boolean => this.activePresses.has(b));
    }

    return typeof button === 'undefined'
      ? this.activePresses.size > 0
      : this.activePresses.has(button);
  }
}
