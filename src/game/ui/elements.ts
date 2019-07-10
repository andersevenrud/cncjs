/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { Sprite, UIScene, UIEntity, MouseButton } from '../../engine';
import { GameMap } from '../map';
import { GameEngine } from '../game';
import { TheatreUI } from './theatre';
import { spriteFromName } from '../sprites';
import { MIXFont, fontMap } from '../mix';
import { ConstructionQueue } from '../construction';
import { getScaledDimensions } from '../physics';
import { Vector } from 'vector2d';

export type UIBorderType = 'inset' | 'outset';
export type UISliderOrientation = 'horizontal' | 'vertical';

export interface UITextCalculationOffset {
  left: number;
  index: number;
  width: number;
  height: number;
}

export interface UITextCalculation {
  width: number;
  height: number;
  calculated: UITextCalculationOffset[];
}

export const SIDEBAR_WIDTH = 160;
export const SIDEBAR_HEIGHT = 484;
export const RADAR_WIDTH = 160;
export const RADAR_HEIGHT = 142;
export const ACTION_WIDTH = 49;
export const ACTION_HEIGHT = 16;
export const TAB_WIDTH = 160;
export const TAB_HEIGHT = 14;
export const BUTTON_WIDTH = 32;
export const BUTTON_HEIGHT = 27;
export const THUMB_WIDTH = 64;
export const THUMB_HEIGHT = 48;
export const THUMB_COUNT = 4;
export const POWER_WIDTH = 20;
export const POWER_HEIGHT = 224;
export const INDICATOR_WIDTH = 19;
export const INDICATOR_HEIGHT = 7;
export const LISTVIEW_ITEM_HEIGHT = 12;
export const LISTVIEW_PADDING = 4;
export const MINIMAP_WIDTH = 156;
export const MINIMAP_HEIGHT = 138;
export const MINIMAP_OFFSET = 4;
export const CONSTRUCTION_HEIGHT = THUMB_HEIGHT * THUMB_COUNT;

/**
 * Game UI Entity abstraction
 */
export class GameUIEntity extends UIEntity {
  protected readonly sprites: Map<string, Sprite> = new Map();
  public readonly ui: UIScene;

  public constructor(name: string, position: Vector, ui: UIScene) {
    super(name, position, ui);
    this.ui = ui;
  }

  public async init(): Promise<void> {
    for (const sprite of this.sprites.values()) {
      await (this.ui.engine as GameEngine).loadArchiveSprite(sprite);
    }

    await super.init();
  }

  public drawBorder(type: UIBorderType) {
    const dimension = this.dimension;
    const context = this.context;
    const topBorder = type === 'outset' ? '#ffffff' : '#80858b';
    const bottomBorder = type === 'inset' ? '#ffffff' : '#80858b';

    context.lineWidth = 1;

    context.strokeStyle = topBorder;
    context.beginPath();
    context.moveTo(dimension.x, 0);
    context.lineTo(0, 0);
    context.moveTo(0, 0);
    context.lineTo(0, dimension.y);
    context.closePath();
    context.stroke();

    context.strokeStyle = bottomBorder;
    context.beginPath();
    context.moveTo(0, this.dimension.y);
    context.lineTo(dimension.x, dimension.y);
    context.moveTo(dimension.x, this.dimension.y);
    context.lineTo(dimension.x, 0);
    context.closePath();
    context.stroke();
  }
}

/**
 * Text
 */
export class UIText extends GameUIEntity {
  private label: string | Function;
  private font: string;
  private typeface: MIXFont;
  private currentLabel: string = '';
  private currentCalc?: UITextCalculation;

  public sprites: Map<string, Sprite> = new Map([
    ['8point', spriteFromName('CCLOCAL.MIX/8point.png')],
    ['6point', spriteFromName('CCLOCAL.MIX/6point.png')],
    ['vcr', spriteFromName('CCLOCAL.MIX/vcr.png')]
  ]);

  public constructor(name: string, label: string | Function, font: string, position: Vector, ui: UIScene) {
    super(name, position, ui);
    this.position = position;
    this.label = label;
    this.font = font;
    this.typeface = fontMap[font];
    this.clickable = false;
  }

  public async init(): Promise<void> {
    await super.init();
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    const label = this.getRealLabel();
    if (label !== this.currentLabel) {
      this.currentLabel = label;
      this.currentCalc = this.calculateString(this.currentLabel);
      this.updated = true;
    }
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (this.updated && this.visible && this.currentCalc) {
      const sprite = this.sprites.get(this.font) as Sprite;
      const { width, height, calculated } = this.currentCalc!;
      const color = 0; // FIXME

      this.setDimension(new Vector(width, height));
      this.calculatePosition();
      this.context.clearRect(0, 0, width, height);
      this.updated = false;

      for (let i = 0; i < calculated.length; i++) {
        const { left, index } = calculated[i];
        sprite.render(new Vector(color, index), new Vector(left, 0), this.context);
      }
    }

    super.onRender(deltaTime, ctx);
    if (this.dimension.x > 0 && this.dimension.y > 0) {
      ctx.drawImage(this.canvas, this.position.x, this.position.y);
    }
  }

  private calculateString(label: string): UITextCalculation {
    const calculated = [];
    const letters = label.split('');
    let { width, height, glyphs } = this.typeface;

    let currentWidth = 0;
    for (let i = 0; i < letters.length; i++) {
      const cc =  letters[i].charCodeAt(0);
      const index = cc - 33;

      if (index >= 0) {
        const [w, h] = glyphs[index] || [this.typeface.width, this.typeface.height];
        calculated.push({ index, width: w, height: h, left: currentWidth });
        currentWidth += w;
      } else {
        calculated.push({ index, width, height, left: currentWidth });
        currentWidth += 8;
      }
    }

    return { width: currentWidth, height, calculated };
  }

  public setLabel(label: string | Function): void {
    this.label = label;
    this.updated = true;
  }

  public getRealLabel(): string {
    return typeof this.label === 'function'
      ? this.label()
      : this.label;
  }

  public getTypeface(): MIXFont {
    return this.typeface;
  }
}

/**
 * Button base
 */
abstract class UIButtonBase extends GameUIEntity {
  protected backgroundPattern: CanvasPattern | null = null;
  protected active: boolean = false;

  public sprites: Map<string, Sprite> = new Map([
    ['background', spriteFromName('UPDATEC.MIX/btexture.png')]
  ]);

  public async init(): Promise<void> {
    await super.init();

    const bs = this.sprites.get('background') as Sprite;
    this.backgroundPattern = bs.createPattern(new Vector(0, 1));
  }

  public onMouseDown(position: Vector): void {
    if (!this.disabled) {
      this.active = true;
      this.emit('mousedown');
      this.updated = true;
    }
  }

  public onMouseUp(position: Vector): void {
    if (!this.disabled) {
      this.active = false;
      this.emit('mouseup');
      this.updated = true;
    }
  }

  public isActive(): boolean {
    return this.active;
  }
}

/**
 * Icon Button
 */
export class UIIconButton extends UIButtonBase {
  public constructor(name: string, source: string, dimension: Vector, position: Vector, ui: UIScene) {
    super(name, position, ui);
    this.sprites.set('icon', spriteFromName(source));
    this.position = position;
    this.setDimension(dimension);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (this.updated) {
      const sprite = this.sprites.get('icon');
      if (sprite) {
        const f = this.active ? 1 : this.disabled ? 2 : 0;
        sprite.render(new Vector(0, f), new Vector(0, 0), this.context);
      }
      //this.drawBorder(this.active ? 'inset' : 'outset');
      super.onRender(deltaTime, ctx);
    }

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
    this.updated = false;
  }
}

/**
 * Button
 */
export class UIButton extends UIButtonBase {
  public constructor(name: string, label: string, dimension: Vector, position: Vector, ui: UIScene) {
    super(name, position, ui);
    this.position = position;

    this.setDimension(dimension);

    const child = new UIText(name + '-label', label, '6point', new Vector(0.5, 0.5), ui);
    this.addChild(child);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (this.updated) {
      this.context.textAlign = 'center';
      this.context.textBaseline = 'middle';
      this.context.fillStyle = this.backgroundPattern as CanvasPattern;
      this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);
      this.drawBorder(this.active ? 'inset' : 'outset');
      super.onRender(deltaTime, ctx);
    }

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
    this.updated = false;
  }
}

/**
 * Box
 */
export class UIBox extends GameUIEntity {
  private customPosition?: string;
  private decorations: number = -1;

  public sprites: Map<string, Sprite> = new Map([
    ['decorations', spriteFromName('CONQUER.MIX/options.png')]
  ]);

  public constructor(name: string, dimension: Vector, position: Vector, ui: UIScene) {
    super(name, position, ui);

    if (typeof position === 'string') {
      this.customPosition = position;
    }

    this.setDimension(dimension);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

    if (this.isVisible()) {
      this.context.lineWidth = 1;
      this.context.strokeStyle = '#80858b';
      this.context.fillStyle = '#000000';
      this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);
      this.context.strokeRect(0, 0, this.dimension.x, this.dimension.y);

      if (this.decorations >= 0) {
        const offset = this.decorations * 2;
        const sprite = this.sprites.get('decorations') as Sprite;
        sprite.render(new Vector(0, offset), new Vector(-sprite.size.x / 2 + 12, -sprite.size.y / 2 + 12), this.context);
        sprite.render(new Vector(0, offset + 1), new Vector(this.dimension.x - sprite.size.x / 2 - 12, -sprite.size.y / 2 + 12), this.context);
      }

      super.onRender(deltaTime, ctx);
    }

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }

  public setDecorations(decoration: number) {
    this.decorations =  decoration;
  }
}

/**
 * List VIew
 */
class UIListViewList extends GameUIEntity {
  public current: number = -1;
  protected clickable: boolean = true;
  protected offset: number = 0;

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

    const p = LISTVIEW_PADDING;
    const h = LISTVIEW_ITEM_HEIGHT + p;

    if (this.isVisible()) {
      if (this.current !== -1) {
        const px = 0;
        const py = (this.current * h);
        const w = this.dimension.x - (p * 2);
        this.context.fillStyle = '#80858b';
        this.context.fillRect(px, py, w, h - p);
      }

      super.onRender(deltaTime, ctx);
    }

    const off = this.offset * h;
    ctx.drawImage(this.canvas, this.position.x, this.position.y - off);
  }

  public onClick(position: Vector): void {
    const p = LISTVIEW_PADDING;
    const h = LISTVIEW_ITEM_HEIGHT;
    const index = Math.floor(position.y / (h + p));
    this.current = index + this.offset;
    this.emit('change', index);
  }

  public setList(items: string[]): void {
    this.removeChildren();

    const p = LISTVIEW_PADDING;
    const h = LISTVIEW_ITEM_HEIGHT;

    this.setDimension(new Vector(
      this.parent!.getDimension().x - 22,
      (h + p) * items.length
    ));

    for (let i = 0; i < items.length; i++) {
      const label = items[i];
      const name = `${this.name}_${i}`;
      const position = new Vector(0, (h + p) * i);
      const child = new UIText(name, label, '8point', position, this.ui);
      this.addChild(child);
    }
  }

  public setCurrent(current: number): void {
    this.current = current;
  }

  public setOffset(offset: number): void {
    this.offset = offset;
  }
}

export class UIListView extends GameUIEntity {
  private items: string[] = [];
  private scrollTop: number = 0;
  private list: UIListViewList;
  private slider: UISlider;

  public constructor(name: string, dimension: Vector, position: Vector, ui: UIScene) {
    super(name, position, ui);
    this.setDimension(dimension);

    const p = LISTVIEW_PADDING;
    this.list = new UIListViewList(name + '-list', new Vector(p, p), ui);
    this.slider = new UISlider(name + 'slider', 0, new Vector(18, this.dimension.y - 2), new Vector(dimension.x - 19, 1), ui);
    this.slider.setOrientation('vertical');
    this.addChild(this.list);
    this.addChild(this.slider);

    this.slider.on('change', value => {
      const off = Math.floor(Math.max(this.items.length - 7, 1) * value);
      this.list.setOffset(off);
    });
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

    if (this.isVisible()) {
      super.onRender(deltaTime, ctx);
      this.drawBorder('inset');
    }

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }

  public setList(items: string[]): void {
    this.items = items;
    this.list.setList(items);
  }

  public setCurrent(current: number): void {
    this.list.setCurrent(current);
  }

  public getCurrent(): number {
    return this.list.current;
  }
}

/**
 * Slider
 */
export class UISlider extends GameUIEntity {
  private value: number = 0.0;
  private backgroundPattern: CanvasPattern | null = null;
  private button: UIButton;
  private dragStart?: Vector;
  private buttonStart?: Vector;
  private orientation: UISliderOrientation = 'horizontal';

  public sprites: Map<string, Sprite> = new Map([
    ['background', spriteFromName('UPDATEC.MIX/btexture.png')],
  ]);

  public constructor(name: string, value: number, dimension: Vector, position: Vector, ui: UIScene) {
    super(name, position, ui);
    this.setDimension(dimension);

    this.value = value;
    this.position = position;

    const newPos = this.calculateButtonPosition();
    this.button = new UIButton(name + '_button', '', dimension, newPos, ui);
  }

  public async init(): Promise<void> {
    this.handleButtonPosition();
    this.addChild(this.button);

    await super.init();

    const bs = this.sprites.get('background') as Sprite;
    this.backgroundPattern = bs.createPattern(new Vector(0, 1));

    this.button.on('mousedown', () => {
      this.dragStart = this.ui.engine.mouse.getVector();
      this.buttonStart = this.button.getPosition();
    });

    this.button.on('mouseup', () => {
      this.dragStart = undefined;
    });
  }

  public onUpdate(deltaTime: number): void {
    if (this.dragStart) {
      let value = 0;

      const buttonDimension = this.button.getDimension();
      if (this.orientation === 'horizontal') {
        const diff = this.ui.engine.mouse.getVector().x - this.dragStart.x;
        const maxX = this.dimension.x - buttonDimension.x;
        const newX = Math.min(maxX, Math.max(0, this.buttonStart!.x + diff));
        value = newX / maxX;

        this.button.setPosition(new Vector(newX, 0));
      } else if (this.orientation === 'vertical') {
        const diff = this.ui.engine.mouse.getVector().y - this.dragStart.y;
        const mayY = this.dimension.y - buttonDimension.y;
        const newY = Math.min(mayY, Math.max(0, this.buttonStart!.y + diff));
        value = newY / mayY;

        this.button.setPosition(new Vector(0, newY));
      }

      if (value != this.value) {
        this.emit('change', value);
      }
      this.value = value;
    }

    super.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

    if (this.isVisible()) {
      this.context.fillStyle = this.backgroundPattern || '#000000';
      this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);
      this.drawBorder('inset');
      super.onRender(deltaTime, ctx);
    }

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }

  public calculateButtonPosition(): Vector {
    const maxX = this.dimension.x - 32;
    const maxY = this.dimension.y - 32;
    const newX = this.orientation === 'vertical' ? 0 : maxX * this.value;
    const newY = this.orientation === 'vertical' ? maxY * this.value : 0;

    return new Vector(newX, newY);
  }

  public handleButtonPosition(): void {
    const newPos = this.calculateButtonPosition();
    const width = this.orientation === 'vertical' ? this.dimension.x : 32;
    const height = this.orientation === 'vertical' ? 32 : this.dimension.y;

    this.button.setDimension(new Vector(width, height));
    this.button.setPosition(new Vector(newPos.x, newPos.y));
  }

  public setOrientation(orientation: UISliderOrientation): void {
    this.orientation = orientation;
  }
}

/**
 * Tabs
 */
export class UITab extends GameUIEntity {
  protected dimension: Vector = new Vector(TAB_WIDTH, TAB_HEIGHT);
  private frame: Vector = new Vector(0, 0);

  public sprites: Map<string, Sprite> = new Map([
    ['tabs', spriteFromName('UPDATEC.MIX/htabs.png')]
  ]);

  public constructor(name: string, label: string | Function, position: Vector, ui: TheatreUI) {
    super(name, position, ui);
    this.position = position;

    const child = new UIText(name + '-label', label, '8point', new Vector(0.5, 0.5), ui);
    this.addChild(child);
  }

  public onMouseDown(position: Vector): void {
    this.frame.setY(1);
    this.updated = true;
  }

  public onMouseUp(position: Vector): void {
    this.frame.setY(0);
    this.updated = true;
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (this.updated) {
      this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);
      const sprite = this.sprites.get('tabs') as Sprite;
      sprite.render(this.frame, new Vector(0, 0), this.context);

      super.onRender(deltaTime, this.context);
    }

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
    this.updated = false;
  }
}

/**
 * Radar
 */
export class UIRadar extends GameUIEntity {
  protected dimension: Vector = new Vector(RADAR_WIDTH, RADAR_HEIGHT);
  private frame: Vector = new Vector(0, 0);
  public sprites: Map<string, Sprite> = new Map([
    ['radarGdi', spriteFromName('UPDATEC.MIX/hradar_gdi.png')],
    ['radarNod', spriteFromName('UPDATEC.MIX/hradar_nod.png')]
  ]);

  public constructor(position: Vector, ui: TheatreUI) {
    super('radar', position, ui);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    // FIXME: optimize
    super.onRender(deltaTime, ctx);

    const sprite = this.sprites.get('radarGdi') as Sprite; // FIXME
    sprite.render(this.frame, new Vector(0, 0), this.context);
    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }
}

/**
 * Power bar
 */
export class UIPowerBar extends GameUIEntity {
  private indicatorPosition: number = 0.5;

  public sprites: Map<string, Sprite> = new Map([
    ['bar', spriteFromName('UPDATEC.MIX/hpwrbar.png')],
    ['indicator', spriteFromName('UPDATEC.MIX/hpower.png')]
  ]);

  public constructor(position: Vector, ui: TheatreUI) {
    super('powerbar', position, ui);
  }

  public async init(): Promise<void> {
    this.setDimension(new Vector(POWER_WIDTH, POWER_HEIGHT));
    await super.init();
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible()) {
      return;
    }

    if (this.updated) {
      this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);
      this.context.fillStyle = '#ffffff';
      this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);

      const bar = this.sprites.get('bar') as Sprite;
      const indicator = this.sprites.get('indicator') as Sprite;
      const indicatorPosition = new Vector(
        0,
        POWER_HEIGHT * this.indicatorPosition - (INDICATOR_HEIGHT / 2)
      );

      bar.render(new Vector(0, 2), new Vector(0, 0), this.context);
      bar.render(new Vector(0, 3), new Vector(0, 80), this.context);
      indicator.render(new Vector(0, 0), indicatorPosition, this.context);
    }

    super.onRender(deltaTime, ctx);
    ctx.drawImage(this.canvas, this.position.x, this.position.y);

    this.updated = false;
  }
}

/**
 * Tooltip
 */
export class UITooltip extends GameUIEntity {
  private text: UIText;

  public constructor(name: string, position: Vector, ui: UIScene) {
    super(name, position, ui);
    this.position = position;

    this.setDimension(new Vector(30, 30));

    this.text = new UIText(name + '-label', '', '6point', new Vector(4, 0.5), ui);
    this.addChild(this.text);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (this.isVisible()) {
      if (this.updated) {
        this.context.textAlign = 'center';
        this.context.textBaseline = 'middle';
        this.context.fillStyle = '#000000';
        this.context.strokeStyle = '#00ff00';
        this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);
        this.context.strokeRect(0, 0, this.dimension.x, this.dimension.y);
        super.onRender(deltaTime, ctx);
      }

      ctx.drawImage(this.canvas, this.position.x, this.position.y);
    }
  }

  public setText(text: string): void {
    const tf = this.text.getTypeface();
    this.text.setLabel(text);
    this.setDimension(new Vector(text.length * tf.width, tf.height + 4));
    this.updated = true;
  }
}

/**
 * Sidebar
 */
export class UISidebar extends GameUIEntity {
  private backgroundPattern: CanvasPattern | null = null;
  protected dimension: Vector = new Vector(SIDEBAR_WIDTH, SIDEBAR_HEIGHT);

  public sprites: Map<string, Sprite> = new Map([
    ['sidebarTop', spriteFromName('UPDATEC.MIX/hside1.png')],
    ['sidebarBottom', spriteFromName('UPDATEC.MIX/hside2.png')],
    ['background', spriteFromName('UPDATEC.MIX/btexture.png')],
  ]);

  public constructor(position: Vector, ui: TheatreUI) {
    super('sidebar', position, ui);
  }

  public async init(): Promise<void> {
    await super.init();

    const bs = this.sprites.get('background') as Sprite;
    this.backgroundPattern = bs.createPattern(new Vector(0, 1));
  }

  public onResize(): void {
    this.setDimension(new Vector(
      this.dimension.x,
      this.ui.getDimension().y
    ));

    super.onResize();
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible()) {
      return;
    }

    if (this.updated) {
      const top = this.sprites.get('sidebarTop') as Sprite;
      const bottom = this.sprites.get('sidebarBottom') as Sprite;

      this.context.fillStyle = this.backgroundPattern as CanvasPattern;
      this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);

      top.render(new Vector(0, 1), new Vector(0, RADAR_HEIGHT), this.context);
      bottom.render(new Vector(0, 1), new Vector(0, RADAR_HEIGHT + top.size.y), this.context);

      super.onRender(deltaTime, ctx);

      ctx.drawImage(this.canvas, this.position.x, this.position.y);
    }

    this.updated = false;
  }
}

/**
 * Construction strip
 */
export class UIConstruction extends GameUIEntity {
  protected offset: number = 0;
  private lastHoverIndex: number = -1;
  private queue: ConstructionQueue;
  private theatre: string;

  public constructor(name: string, theatre: string, queue: ConstructionQueue, position: Vector, ui: UIScene) {
    super(name, position, ui);
    this.queue = queue;
    this.theatre = theatre;

    queue.getNames().forEach(name => {
      this.sprites.set(name.toLowerCase(), spriteFromName(`${theatre.substring(0, 4).toUpperCase()}ICNH.MIX/${name.toLowerCase()}icnh.png`));
    });
  }

  public async init(): Promise<void> {
    this.setDimension(new Vector(THUMB_WIDTH, CONSTRUCTION_HEIGHT));
    this.sprites.set('pips', spriteFromName('UPDATEC.MIX/hpips.png'));
    this.sprites.set('clock', spriteFromName('UPDATEC.MIX/hclock.png'));
    await super.init();
  }

  protected emit(name: string, ...args: any[]): void {
    this.ee.emit(name, ...args);
    this.ee.emit('change', name, ...args);
  }

  public onMouseOut(): void {
    this.lastHoverIndex = -1;
    this.ee.emit('mouseout');
  }

  public onMouseOver(position: Vector): void {
    const index = Math.floor(position.y / THUMB_HEIGHT);
    if (this.lastHoverIndex !== index) {
      const item = this.queue.getItem(index);
      if (item) {
        const text = `\$${item.properties.Cost}`;

        this.ee.emit('mouseover', new Vector(
          0,
          (index * THUMB_HEIGHT) + (THUMB_HEIGHT / 2)
        ), text);
      }
    }

    this.lastHoverIndex = index;
  }

  public onClick(position: Vector, button: MouseButton): void {
    const thumbnail = Math.floor(position.y / THUMB_HEIGHT);
    const index = thumbnail + this.offset;
    const found = this.queue.getItem(index);
    if (found) {
      if (button === 'right') {
        if (found.state === 'hold' || found.state === 'ready') {
          this.queue.cancel(index);
        } else {
          this.queue.hold(index);
        }
      } else {
        if (found.state === 'ready') {
          // FIXME: Should happen when structure is placed
          this.queue.reset(index);
          this.emit('place', found);
        } else if (found.state === undefined) {
          this.queue.build(index);
        }
      }
    }

    this.updated = true;
  }

  public onUpdate(deltaTime: number): void {
    if (this.disabled) {
      return;
    }

    this.queue.onUpdate(deltaTime);
    super.onUpdate(deltaTime);

    // FIXME: Check length of items > 0
    if (this.ui.engine.frames % 2 === 0) {
      this.updated = true;
    }
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (this.updated) {
      const frame = new Vector(0, 0);
      const clock = this.sprites.get('clock') as Sprite;
      const pip = this.sprites.get('pips') as Sprite;

      this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

      let index = -this.offset;
      const available = this.queue.getAvailable();
      for (let i = 0; i < available.length; i++) {
        const item = available[i];
        const name = item.name.toLowerCase();
        const sprite = this.sprites.get(name) as Sprite;
        const position = new Vector(0, index * THUMB_HEIGHT);
        this.context.clearRect(position.x, position.y, sprite.size.x, sprite.size.y);
        sprite.render(frame, position, this.context);

        if (typeof item.state !== 'undefined') {
          let p = item.progress / item.properties.Cost;
          let f = new Vector(0, Math.round(clock.frames * p));

          this.context.globalCompositeOperation = 'destination-out';
          clock.render(f, new Vector(position.x, position.y), this.context);
          this.context.globalCompositeOperation = 'source-over';

          if (item.state === 'ready') {
            pip.render(new Vector(0, 3), new Vector(
              position.x + (sprite.size.x / 2) - (pip.size.x / 2),
              position.y + (sprite.size.y / 2) - (pip.size.y / 2)
            ), this.context);
          } else if (item.state === 'hold') {
            pip.render(new Vector(0, 4), new Vector(
              position.x + (sprite.size.x / 2) - (pip.size.x / 2),
              position.y + (sprite.size.y / 2) - (pip.size.y / 2)
            ), this.context);
          }
        }

        index++;
      }

      this.context.drawImage(this.canvas, 0, 0, this.dimension.x, this.dimension.y);
    }

    ctx.drawImage(this.canvas, 0, 0, this.dimension.x, this.dimension.y, this.position.x, this.position.y, this.dimension.x, this.dimension.y);

    this.updated = false;
  }

  public moveUp(): void {
    this.offset = Math.max(0, this.offset - 1);
    this.updated = true;
    console.debug('UIConstruction::moveUp()', this.offset);
  }

  public moveDown(): void {
    const count = this.queue.getAvailableCount();
    this.offset = Math.min(count - THUMB_COUNT, this.offset + 1);
    this.updated = true;
    console.debug('UIConstruction::moveDown()', this.offset);
  }
}

/**
 * Minimap
 */
export class UIMinimap extends GameUIEntity {
  private readonly map: GameMap;
  public readonly ui: TheatreUI;

  public constructor(map: GameMap, ui: TheatreUI) {
    super('minimap', new Vector(MINIMAP_OFFSET, MINIMAP_OFFSET), ui);

    this.setDimension(new Vector(MINIMAP_WIDTH - MINIMAP_OFFSET, MINIMAP_HEIGHT - MINIMAP_OFFSET));
    this.context.strokeStyle = '#ffffff';
    this.context.lineWidth = 1;
    this.ui = ui;
    this.map = map;
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D) {
    if (!this.isVisible()) {
      return;
    }

    if (this.ui.engine.frames % 6 === 0 && !this.ui.isMenuOpen()) {
      const { sx, sy, sw, sh, dx, dy, dw, dh, bR } = getScaledDimensions(this.map.getDimension(), this.dimension);

      this.context.fillStyle = '#000000';
      this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);
      this.context.drawImage(this.map.getCanvas(), sx, sy, sw, sh, dx, dy, dw, dh);

      this.map.getEntities()
        .forEach(e => {
          const p = e.getPosition();
          const d = e.getDimension();
          const x = Math.trunc(p.x * bR) + dx;
          const y = Math.trunc(p.y * bR) + dy;
          const w = Math.trunc(d.x * bR);
          const h = Math.trunc(d.y * bR);
          this.context.fillStyle = e.getColor();
          this.context.fillRect(x, y, w, h);
        });

      const p = this.map.getPosition();
      const d = this.map.getDimension();
      if (this.map.isFowVisible()) {
        this.context.drawImage(this.map.fow.getCanvas(), 0, 0, d.x, d.y, 0, 0, this.dimension.x, this.dimension.y);
      }

      const v = this.ui.getViewport();
      const w = (v.x2 - v.x1) * bR;
      const h = (v.y2 - v.y1) * bR;
      const x = p.x * bR;
      const y = p.y * bR;
      this.context.strokeRect(x, y, w, h);
    }

    ctx.drawImage(this.canvas, this.position.x ,this.position.y);
  }
}

