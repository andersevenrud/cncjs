/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { IODevice } from './io';
import { Vector } from 'vector2d';

/**
 * How many pixels the curor can move (maximum) before a click is rejected
 */
export const CLICK_MOVEMENT_GRACE = 8;

/**
 * Mouse button map
 */
export const mouseButtonMap: MouseButton[] = ['left', 'middle', 'right'];

/**
 * Mouse button type
 */
export type MouseButton = 'left' | 'middle' | 'right';

/**
 * Mouse position
 */
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

  /**
   * Initializes mouse input
   */
  public async init(): Promise<void> {
    console.debug('MouseInput::init()');

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
      [this.position.x, this.position.y, this.position.z].join(','),
      this.locked ? 'locked' : 'unlocked'
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
   * On every game tick
   */
  public onUpdate(): void {
    this.activePresses.clear();
  }

  /**
   * Touch start
   */
  private onTouchStart(ev: TouchEvent): void {
    ev.preventDefault();

    this.onPointerDown('left', new Vector(
      ev.touches[0].clientX,
      ev.touches[0].clientY
    ));
  }

  /**
   * Touch end
   */
  private onTouchEnd(ev: TouchEvent): void {
    ev.preventDefault();

    this.onPointerUp('left', new Vector(-1, -1));
  }

  /**
   * Touch move
   */
  private onTouchMove(ev: TouchEvent): void {
    this.onPointerMove(new Vector(
      ev.touches[0].clientX,
      ev.touches[0].clientY
    ));
  }

  /**
   * Mouse down
   */
  private onMouseDown(ev: MouseEvent): void {
    ev.preventDefault();

    this.lockCursor();
    this.engine.sound.restoreSound();

    const btn: MouseButton = mouseButtonMap[ev.button];
    this.onPointerDown(btn, new Vector(ev.clientX, ev.clientY));
  }

  /**
   * Mouse up
   */
  private onMouseUp(ev: MouseEvent): void {
    ev.preventDefault();

    const btn: MouseButton = mouseButtonMap[ev.button];
    this.onPointerUp(btn, new Vector(ev.clientX, ev.clientY));
  }

  /**
   * Mouse move
   */
  private onMouseMove(ev: MouseEvent): void {
    if (this.locked) {
      this.onPointerMove(new Vector(ev.movementX, ev.movementY), true);
    } else {
      this.onPointerMove(new Vector(ev.clientX, ev.clientY));
    }
  }

  /**
   * Pointer lock changes
   */
  private onPointerLockChange(ev: Event): void {
    this.locked = document.pointerLockElement === this.engine.getCanvas();
  }

  /**
   * Handle pointer move
   */
  private onPointerMove(current: Vector, relative: boolean = false): void {
    const scale = this.engine.getScale();

    if (relative) {
      this.position.x += Math.trunc(current.x / scale);
      this.position.y += Math.trunc(current.y / scale);
    } else {
      this.position.x = Math.trunc(current.x / scale);
      this.position.y = Math.trunc(current.y / scale);
    }
  }

  /**
   * Handle pointer down
   */
  private onPointerDown(btn: MouseButton, current: Vector): void {
    const scale = this.engine.getScale();
    const relCurrent = current.clone().divS(scale) as Vector;
    this.pressStart = relCurrent;
    this.activeButtons.add(btn);
  }

  /**
   * Handle pointer up
   */
  private onPointerUp(btn: MouseButton, current: Vector): void {
    if (this.activeButtons.has(btn)) {
      if (this.pressStart) {
        const scale = this.engine.getScale();
        const relCurrent = current.clone().divS(scale) as Vector;
        const distance = this.pressStart.distance(relCurrent);
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
