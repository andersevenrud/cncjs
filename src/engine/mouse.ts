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
  private locked: boolean = false;

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
    const onMouseMove = this.onMouseMove.bind(this);
    const onMouseWheel = this.onMouseWheel.bind(this);

    const onTouchStart = this.onTouchStart.bind(this);
    const onTouchEnd = this.onTouchEnd.bind(this);
    const onTouchMove = this.onTouchMove.bind(this);

    const onPointerLockChange = this.onPointerLockChange.bind(this);

    document.addEventListener('touchstart', onTouchStart);
    document.addEventListener('touchend', onTouchEnd);
    document.addEventListener('touchmove', onTouchMove);

    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('wheel', onMouseWheel);

    document.addEventListener('pointerlockchange', onPointerLockChange);

    this.reset();
    this.lockCursor();
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

  /**
   * Rests all states
   */
  public reset(): void {
    this.clear();

    const dim = this.engine.getScaledDimension();
    this.position.x = Math.round(dim.x / 2);
    this.position.y = Math.round(dim.y / 2);
  }

  /**
   * Clears button states
   */
  public clear(): void {
    this.activeButtons.clear();
    this.activePresses.clear();
  }

  /**
   * Try to lock the cursor
   */
  private lockCursor(): void {
    if (this.locked) {
      return;
    }

    if (this.engine.configuration.cursorLock) {
      this.engine.getCanvas().requestPointerLock();
    }
  }

  /**
   * Pointer lock changes
   */
  private onPointerLockChange(ev: Event): void {
    this.locked = document.pointerLockElement === this.engine.getCanvas();
  }

  /**
   * Touch start
   */
  private onTouchStart(ev: TouchEvent): void {
    const scale = this.engine.getScale();
    this.pressStart = new Vector(
      Math.trunc(ev.touches[0].clientX / scale),
      Math.trunc(ev.touches[0].clientY / scale)
    );
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
    const scale = this.engine.getScale();
    this.position.x = Math.trunc(ev.touches[0].clientX / scale);
    this.position.y = Math.trunc(ev.touches[0].clientY / scale);
  }

  /**
   * Mouse down
   */
  private onMouseDown(ev: MouseEvent): void {
    ev.preventDefault();

    this.lockCursor();

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

    if (this.locked) {
      this.position.x += Math.trunc(ev.movementX / scale);
      this.position.y += Math.trunc(ev.movementY / scale);
    } else {
      this.position.x = Math.trunc(ev.clientX / scale);
      this.position.y = Math.trunc(ev.clientY / scale);
    }
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
