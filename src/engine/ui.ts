/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Entity } from './entity';
import { Box, collidePoint } from './physics';
import { Core } from './core';
import { MouseButton } from './mouse';
import { isFloat, isNegative } from './utils';
import { Vector } from 'vector2d';
import EventEmitter, { ListenerFn } from 'eventemitter3';

/**
 * UI Entity Hit
 */
export interface UIEntityHit {
  element: UIEntity;
  position: Vector;
}

/**
 * UI Scene Scale interface
 */
export interface UISceneScale {
  offset: Vector;
  scale: number;
}

/**
 * UI Scene
 */
export class UIScene extends Entity {
  public readonly engine: Core;
  protected elements: UIEntity[] = [];
  protected updated: boolean = true;
  protected scaled?: UISceneScale;
  protected lastDownElement?: UIEntity;
  protected inited: boolean = false;

  public constructor(engine: Core) {
    super();
    this.engine = engine;
  }

  /**
   * Initializes UI scene
   */
  public async init(): Promise<void> {
    for (let i = 0; i < this.elements.length; i++) {
      await this.elements[i].init();
    }

    this.inited = true;
  }

  /**
   * Click action
   */
  public onClick(hit: UIEntityHit): void {
  }

  /**
   * Update action
   */
  public onUpdate(deltaTime: number): void {
    if (!this.inited) {
      return;
    }

    const { mouse } = this.engine;
    const position = this.getRealMousePosition();

    const button = mouse.wasClicked('left')
      ? 'left'
      : mouse.wasClicked('right') ? 'right' : undefined;

    if (button) {
      const hit = this.getCollidingEntity(position);

      if (hit) {
        hit.element.onClick(hit.position, button);
        this.onClick(hit);
        this.updated = true;
      }
    } else if (mouse.isPressed('left')) {
      const hit = this.getCollidingEntity(position);

      if (hit) {
        if (this.lastDownElement && this.lastDownElement !== hit.element) {
          this.lastDownElement.onMouseUp(hit.position);
        }

        if (this.lastDownElement !== hit.element) {
          hit.element.onMouseDown(hit.position);
          this.updated = true;
        }

        this.lastDownElement = hit.element;
      }
    } else {
      if (this.lastDownElement) {
        this.lastDownElement.onMouseUp(position);
        this.lastDownElement = undefined;
        this.updated = true;
      }
    }

    this.elements.forEach((el): void => {
      el.onUpdate(deltaTime);
      if (el.isUpdated()) {
        this.updated = true;
      }
    });
  }

  /**
   * Render action
   */
  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (!this.inited) {
      return;
    }

    if (this.updated) {
      this.elements.forEach((el): void => el.onRender(deltaTime, this.context));
    }

    ctx.drawImage(this.canvas, 0, 0);
  }

  /**
   * Resize action
   */
  public onResize(): void {
    const dimension = this.engine.getDimension();
    this.dimension = dimension;
    this.canvas.width = dimension.x;
    this.canvas.height = dimension.y;

    this.updated = true;
    this.elements.forEach((el): void => el.onResize());
  }

  /**
   * Gets "real" mouse position (based on scale)
   */
  protected getRealMousePosition(): Vector {
    const position = this.engine.mouse.getVector();
    if (this.scaled) {
      position.subtract(this.scaled.offset);
      position.divS(this.scaled.scale);
    }

    return position;
  }

  /**
   * Gets all UI entities colliding with given position
   */
  protected getCollidingEntity(position: Vector): UIEntityHit | undefined {
    return this.elements
      .filter((el): boolean => el.isClickable())
      .map((el): UIEntityHit | undefined => el.collides(position, this.scaled))
      .filter((res): boolean => !!res)
      [0];
  }

  /**
   * Gets the UI Scaling information
   */
  public setScale(scaled?: UISceneScale): void {
    this.scaled = scaled;
  }

  /**
   * Gets element by a name
   */
  public getElementByName(name: string): UIEntity | undefined {
    const tree: UIEntity[] = [
      ...this.elements,
      ...(([] as UIEntity[]).concat(...this.elements.map(el => el.getElements())))
    ];

    return tree.find((el): boolean => el.name === name);
  }
}

/**
 * UI Entity
 */
export class UIEntity extends Entity {
  protected readonly originalPosition: Vector;
  protected parent?: UIEntity;
  public readonly ui: UIScene;
  protected readonly elements: UIEntity[] = [];
  public readonly name: string;
  protected disabled: boolean = false;
  protected visible: boolean = true;
  protected clickable: boolean = true;
  protected updated: boolean = true;
  protected readonly ee: EventEmitter = new EventEmitter();

  public constructor(name: string, position: Vector, ui: UIScene) {
    super();
    this.name = name;
    this.ui = ui;
    this.originalPosition = position;
  }

  /**
   * Initializes UI Entity
   */
  public async init(): Promise<void> {
    for (let i = 0; i < this.elements.length; i++) {
      await this.elements[i].init();
    }
  }

  /**
   * Register event
   */
  public on(name: string, cb: ListenerFn): void {
    this.ee.on(name, cb);
  }

  /**
   * Unregister event
   */
  public off(name: string, cb: ListenerFn): void {
    this.ee.off(name, cb);
  }

  /**
   * Emit event
   */
  protected emit(name: string, ...args: any[]): void {
    this.ee.emit(name, ...args);
  }

  /**
   * Resize action
   */
  public onResize(): void {
    this.calculatePosition();

    this.elements.forEach((el): void => el.onResize());
  }

  /**
   * Update action
   */
  public onUpdate(deltaTime: number): void {
    this.elements.forEach((el): void => {
      el.onUpdate(deltaTime);
      if (el.isUpdated()) {
        this.updated =  true;
      }
    });
  }

  /**
   * Render action
   */
  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible()) {
      return;
    }

    this.elements.forEach((el): void => el.onRender(deltaTime, this.context));
  }

  /**
   * Mouse up action
   */
  public onMouseUp(position: Vector): void {
  }

  /**
   * Mouse down action
   */
  public onMouseDown(position: Vector): void {
  }

  /**
   * Mouse click action
   */
  public onClick(position: Vector, button: MouseButton): void {
    if (!this.isDisabled()) {
      this.emit('click', position, button);
    }
  }

  /**
   * Calculates the entity posittion based on parents
   */
  public calculatePosition(): void {
    let [x, y] = this.originalPosition.toArray();

    const parent = this.parent || this.ui;
    if (isFloat(x)) {
      x = Math.round((parent.dimension.x / 2) - (this.dimension.x / 2));
    } else if (isNegative(x)) {
      x += parent.dimension.x - this.dimension.x;
    }

    if (isFloat(y)) {
      y = Math.round((parent.dimension.y / 2) - (this.dimension.y / 2));
    } else if (isNegative(y)) {
      y += parent.dimension.y - this.dimension.y;
    }

    this.position = new Vector(x, y);
  }

  /**
   * Check collision of position
   */
  public collides(position: Vector, scaled?: UISceneScale): UIEntityHit | undefined {
    if (!this.isVisible() || this.isDisabled()) {
      return undefined;
    }

    const box = this.getBox(scaled);
    const collides = collidePoint(position, box);
    const els = this.elements.filter((el): boolean => el.isClickable());

    if (collides && els.length > 0) {
      const rel = (position.clone() as Vector).subtract(this.position);

      const found = els
        .map((el): UIEntityHit | undefined => el.collides(rel, scaled))
        .filter((el): boolean => !!el);

      if (found[0]) {
        const element = found[0]!.element;
        const p = found[0]!.position.clone() as Vector;
        p.subtract(element.position);
        return { element, position: p };
      }

      return undefined;
    }

    return collides ? { element: this, position } : undefined;
  }

  /**
   * Add UI Entity as child
   */
  public addChild(child: UIEntity): UIEntity {
    child.setParent(this);
    this.elements.push(child);
    return child;
  }

  /**
   * Triggers an update call
   */
  public triggerUpdate(): void {
    this.updated = true;
    this.elements.forEach((el: UIEntity) => el.triggerUpdate());
  }

  /**
   * Sets parent UI Entity
   */
  public setParent(parent: UIEntity): void {
    this.parent = parent;
  }

  /**
   * Sets visibility
   */
  public setVisible(v: boolean): void {
    this.visible = v;
    this.triggerUpdate();
  }

  /**
   * Sets if clickable
   */
  public setClickable(c: boolean): void {
    this.clickable = c;
  }

  /**
   * Sets if disabled
   */
  public setDisabled(d: boolean): void {
    this.disabled = d;
  }

  /**
   * Gets if visible
   */
  public isVisible(): boolean {
    return this.visible;
  }

  /**
   * Gets if clickable
   */
  public isClickable(): boolean {
    return this.clickable && this.visible;
  }

  /**
   * Gets if updated
   */
  public isUpdated(): boolean {
    return this.updated;
  }

  /**
   * Gets if disabled
   */
  public isDisabled(): boolean {
    return this.disabled;
  }

  /**
   * Gets children UI Entities
   */
  public getElements(): UIEntity[] {
    return this.elements;
  }

  /**
   * Gets UI Entity by name
   */
  public getElementByName(name: string): UIEntity | undefined {
    const tree: UIEntity[] = [
      ...this.elements,
      ...(([] as UIEntity[]).concat(...this.elements.map(el => el.getElements())))
    ];

    return tree.find((el): boolean => el.name === name);
  }

  /**
   * Gets the collision box
   */
  public getBox(scaled?: UISceneScale): Box {
    const box = {
      x1: this.position.x,
      y1: this.position.y,
      x2: this.position.x + this.dimension.x,
      y2: this.position.y + this.dimension.y
    };

    if (scaled) {
      box.x1 -= scaled.offset.x;
      box.y1 -= scaled.offset.y;
    }

    return box;
  }
}
