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

/**
 * UI Entity Hit
 */
export interface UIEntityHit {
  element: UIEntity;
  position: Vector;
}

export interface UISceneScale {
  offset: Vector;
  scale: number;
}

/**
 * UI Scene
 */
export class UIScene extends Entity {
  protected readonly engine: Core;
  protected elements: UIEntity[] = [];
  protected updated: boolean = true;
  protected scaled?: UISceneScale;
  protected lastDownElement?: UIEntity;

  public constructor(engine: Core) {
    super();
    this.engine = engine;
  }

  public async init(): Promise<void> {
    for (let i = 0; i < this.elements.length; i++) {
      await this.elements[i].init();
    }
  }

  public onClick(hit: UIEntityHit): void {
  }

  public onUpdate(deltaTime: number): void {
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

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (this.updated) {
      this.elements.forEach((el): void => el.onRender(deltaTime, this.context));
    }

    ctx.drawImage(this.canvas, 0, 0);
  }

  public onResize(): void {
    const dimension = this.engine.getDimension();
    this.dimension = dimension;
    this.canvas.width = dimension.x;
    this.canvas.height = dimension.y;

    this.updated = true;
    this.elements.forEach((el): void => el.onResize());
  }

  protected getRealMousePosition(): Vector {
    const position = this.engine.mouse.getVector();
    if (this.scaled) {
      position.subtract(this.scaled.offset);
      position.divS(this.scaled.scale)
    }

    return position;
  }

  protected getCollidingEntity(position: Vector): UIEntityHit | undefined {
    return this.elements
      .filter((el): boolean => el.isClickable())
      .map((el): UIEntityHit | undefined => el.collides(position, this.scaled))
      .filter((res): boolean => !!res)
      [0];
  }

  public setScale(scaled?: UISceneScale): void {
    this.scaled = scaled;
  }

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
  protected readonly callback: Function;
  protected readonly elements: UIEntity[] = [];
  public readonly name: string;
  protected visible: boolean = true;
  protected clickable: boolean = true;
  protected updated: boolean = false;

  public constructor(name: string, position: Vector, callback: Function, ui: UIScene) {
    super();
    this.name = name;
    this.ui = ui;
    this.originalPosition = position;
    this.callback = callback;
  }

  public async init(): Promise<void> {
    for (let i = 0; i < this.elements.length; i++) {
      await this.elements[i].init();
    }
  }

  public onResize(): void {
    this.calculatePosition();

    this.elements.forEach((el): void => el.onResize());
  }

  public onUpdate(deltaTime: number): void {
    this.updated = false;

    this.elements.forEach((el): void => {
      el.onUpdate(deltaTime);
      if (el.isUpdated()) {
        this.updated =  true;
      }
    });
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible()) {
      return;
    }

    this.elements.forEach((el): void => el.onRender(deltaTime, this.context));
  }

  public onMouseUp(position: Vector): void {
  }

  public onMouseDown(position: Vector): void {
  }

  public onClick(position: Vector, button: MouseButton): void {
    this.callback();
  }

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

  public collides(position: Vector, scaled?: UISceneScale): UIEntityHit | undefined {
    if (!this.isVisible()) {
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

  public addChild(child: UIEntity): void {
    child.setParent(this);
    this.elements.push(child);
  }

  public setParent(parent: UIEntity): void {
    this.parent = parent;
  }

  public setVisible(v: boolean): void {
    this.visible = v;
  }

  public isVisible(): boolean {
    return this.visible;
  }

  public isClickable(): boolean {
    return this.clickable && this.visible;
  }

  public isUpdated(): boolean {
    return this.updated;
  }

  public getElements(): UIEntity[] {
    return this.elements;
  }

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
