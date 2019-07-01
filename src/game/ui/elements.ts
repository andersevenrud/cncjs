/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { Entity, Sprite, UIScene, UIEntity, UIEntityHit, collidePoint } from '../../engine';
import { GameEngine } from '../game';
import { TheatreUI } from './theatre';
import { spriteFromName } from '../sprites';
import { MIXFont, fontMap } from '../mix';
import { Vector } from 'vector2d';

export type UIActionsName = 'sell' | 'repair'

export const SIDEBAR_WIDTH = 160;
export const RADAR_WIDTH = 160;
export const RADAR_HEIGHT = 142;
export const ACTION_WIDTH = 49;
export const ACTION_HEIGHT = 16;
export const TAB_WIDTH = 160;
export const TAB_HEIGHT = 14;
export const BUTTON_WIDTH = 32;
export const BUTTON_HEIGHT = 24;
export const THUMB_WIDTH = 64;
export const THUMB_HEIGHT = 48;
export const THUMB_COUNT = 4;

export class GameUIEntity extends UIEntity {
  protected readonly sprites: Map<string, Sprite> = new Map();
  protected readonly engine: GameEngine;
  public readonly ui: UIScene;

  public constructor(name: string, position: Vector, callback: Function, engine: GameEngine, ui: UIScene) {
    super(name, position, callback, ui);
    this.engine = engine;
    this.ui = ui;
  }

  public async init(): Promise<void> {
    for (const sprite of this.sprites.values()) {
      await this.engine.loadArchiveSprite(sprite);
    }

    await super.init();
  }
}

export class UIText extends GameUIEntity {
  private label: string;
  private font: string;
  private typeface: MIXFont;

  public sprites: Map<string, Sprite> = new Map([
    ['8point', spriteFromName('CCLOCAL.MIX/8point.png')],
    ['6point', spriteFromName('CCLOCAL.MIX/6point.png')]
  ]);

  public constructor(name: string, label: string, font: string, position: Vector, engine: GameEngine, ui: UIScene) {
    super(name, position, () => {}, engine, ui);
    this.position = position;
    this.label = label;
    this.font = font;
    this.typeface = fontMap[font];
    this.clickable = false;
  }

  public async init(): Promise<void> {
    await super.init();

    const sprite = this.sprites.get(this.font) as Sprite;
    const { width, height, calculated } = this.calculateString();
    const color = 0; // FIXME

    this.setDimension(new Vector(width, height));

    for ( let i = 0; i < calculated.length; i++ ) {
      const { left, index } = calculated[i];

      if (index >= 0) {
        sprite.render(new Vector(color, index), new Vector(left, 0), this.context);
      }
    }
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    super.onRender(deltaTime, ctx);

    ctx.fillStyle = '#ffffff';
    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }

  private calculateString(): any { // FIXME
    const calculated = [];
    const letters = this.label.split('');
    let { width, height, glyphs } = this.typeface;

    for ( let i = 0; i < letters.length; i++ ) {
      const cc =  letters[i].charCodeAt(0);
      const index = cc - 33;

      if ( index >= 0 ) {
        const [w, h] = glyphs[index];
        calculated.push({ index, w, h, left: width });
        width += w;
      } else {
        calculated.push({ index, w: width, h: height, left: width });
        width += 8;
      }
    }

    return {width, height, calculated};
  }
}

export class UIButton extends GameUIEntity {
  private backgroundPattern: CanvasPattern | null = null;
  private label: string;

  public sprites: Map<string, Sprite> = new Map([
    ['background', spriteFromName('UPDATEC.MIX/btexture.png')]
  ]);

  public constructor(name: string, label: string, dimension: Vector, position: Vector, callback: Function, engine: GameEngine, ui: UIScene) {
    super(name, position, callback, engine, ui);
    this.position = position;
    this.label = label;

    this.setDimension(dimension);

    const child = new UIText(name + '-label', label, '6point', new Vector(0.5, 0.5), engine, ui);
    this.addChild(child);
  }

  public async init(): Promise<void> {
    await super.init();

    const bs = this.sprites.get('background') as Sprite;
    this.backgroundPattern = bs.createPattern(new Vector(0, 1));
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    this.context.textAlign = 'center';
    this.context.textBaseline = 'middle';
    this.context.strokeStyle = '#80858b';
    this.context.fillStyle = this.backgroundPattern as CanvasPattern;
    this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);
    this.context.strokeRect(0, 0, this.dimension.x, this.dimension.y);
    super.onRender(deltaTime, ctx);
    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }
}

export class UIBox extends GameUIEntity {
  private customPosition?: string;
  private decorations: boolean = false;

  public sprites: Map<string, Sprite> = new Map([
    ['decorations', spriteFromName('CONQUER.MIX/options.png')]
  ]);

  public constructor(name: string, dimension: Vector, position: Vector, callback: Function, engine: GameEngine, ui: UIScene) {
    super(name, position, callback, engine, ui);

    if (typeof position === 'string') {
      this.customPosition = position;
    }

    this.setDimension(dimension);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    this.context.lineWidth = 1;
    this.context.strokeStyle = '#80858b';
    this.context.fillStyle = '#000000';
    this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);
    this.context.strokeRect(0, 0, this.dimension.x, this.dimension.y);

    const sprite = this.sprites.get('decorations') as Sprite;
    sprite.render(new Vector(0, 0), new Vector(-sprite.size.x / 2 + 12, -sprite.size.y / 2 + 12), this.context);
    sprite.render(new Vector(0, 1), new Vector(this.dimension.x - sprite.size.x / 2 - 12, -sprite.size.y / 2 + 12), this.context);

    super.onRender(deltaTime, ctx);

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }

  public setDecorations(enabled: boolean) {
    this.decorations =  true;
  }
}

export class UITab extends GameUIEntity {
  public dimension: Vector = new Vector(TAB_WIDTH, TAB_HEIGHT);
  private frame: Vector = new Vector(0, 0);

  public sprites: Map<string, Sprite> = new Map([
    ['tabs', spriteFromName('UPDATEC.MIX/htabs.png')]
  ]);

  public constructor(name: string, label: string, position: Vector, callback: Function, engine: GameEngine, ui: TheatreUI) {
    super(name, position, callback, engine, ui);
    this.position = position;

    const child = new UIText(name + '-label', label, '8point', new Vector(0.5, 0.5), engine, ui);
    this.addChild(child);
  }

  public onMouseDown(position: Vector): void {
    this.frame.setY(1);
  }

  public onMouseUp(position: Vector): void {
    this.frame.setY(0);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

    const sprite = this.sprites.get('tabs') as Sprite;
    sprite.render(this.frame, new Vector(0, 0), this.context);

    super.onRender(deltaTime, this.context);
    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }
}

export class UIActions extends GameUIEntity {
  public dimension: Vector = new Vector(RADAR_WIDTH, ACTION_HEIGHT);
  public sprites: Map<string, Sprite> = new Map([
    ['buttonMap', spriteFromName('UPDATEC.MIX/hmap.png')],
    ['buttonSell', spriteFromName('UPDATEC.MIX/hsell.png')],
    ['buttonRepair', spriteFromName('UPDATEC.MIX/hrepair.png')]
  ]);

  private names: string[] = ['sell', 'repair'];

  private indexes: Vector[] = [
    new Vector(0, 0),
    new Vector(ACTION_WIDTH + 4, 0),
    new Vector((ACTION_WIDTH + 4) * 2, 0)
  ];

  private frames: Vector[] = [
    new Vector(0, 0),
    new Vector(0, 0),
    new Vector(0, 2)
  ];

  public constructor(position: Vector, callback: Function, engine: GameEngine, ui: TheatreUI) {
    super('actions', position, callback, engine, ui);
  }

  public onMouseDown(position: Vector): void {
    const hitButton = this.getButtonHit(position);
    if (hitButton !== -1 && this.frames[hitButton].y !== 2) {
      this.frames[hitButton].setY(1);
    }
  }

  public onMouseUp(position: Vector): void {
    this.frames[0].setY(0);
    this.frames[1].setY(0);

    if (this.frames[2].y !== 2) {
      this.frames[2].setY(0);
    }
  }

  public onClick(position: Vector): void {
    const hitButton = this.getButtonHit(position);
    const hitName = this.names[hitButton];
    this.callback(hitName as UIActionsName);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    const sell = this.sprites.get('buttonSell') as Sprite;
    const repair = this.sprites.get('buttonRepair') as Sprite;
    const map = this.sprites.get('buttonMap') as Sprite;

    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

    sell.render(this.frames[0], this.indexes[0], this.context);
    repair.render(this.frames[1], this.indexes[1], this.context);
    map.render(this.frames[2], this.indexes[2], this.context);

    super.onRender(deltaTime, ctx);

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }

  protected getButtonHit(position: Vector): number {
    const boxes = this.indexes.map(v => ({
      x1: v.x,
      y1: v.y,
      x2: v.x + ACTION_WIDTH,
      y2: ACTION_HEIGHT
    }))

    return boxes.findIndex(box => collidePoint(position, box));
  }
}

export class UIRadar extends GameUIEntity {
  public dimension: Vector = new Vector(RADAR_WIDTH, RADAR_HEIGHT);
  private frame: Vector = new Vector(0, 0);
  public sprites: Map<string, Sprite> = new Map([
    ['radarGdi', spriteFromName('UPDATEC.MIX/hradar_gdi.png')],
    ['radarNod', spriteFromName('UPDATEC.MIX/hradar_nod.png')]
  ]);

  public constructor(position: Vector, callback: Function, engine: GameEngine, ui: TheatreUI) {
    super('radar', position, callback, engine, ui);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    super.onRender(deltaTime, ctx);

    const sprite = this.sprites.get('radarGdi') as Sprite; // FIXME
    sprite.render(this.frame, new Vector(0, 0), this.context);
    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }
}

export class UISidebar extends GameUIEntity {
  private backgroundPattern: CanvasPattern | null = null;
  public dimension: Vector = new Vector(SIDEBAR_WIDTH, SIDEBAR_WIDTH);

  public sprites: Map<string, Sprite> = new Map([
    ['sidebarTop', spriteFromName('UPDATEC.MIX/hside1.png')],
    ['sidebarBottom', spriteFromName('UPDATEC.MIX/hside2.png')],
    ['background', spriteFromName('UPDATEC.MIX/btexture.png')],
  ]);

  public constructor(position: Vector, callback: Function, engine: GameEngine, ui: TheatreUI) {
    super('sidebar', position, callback, engine, ui);
  }

  public async init(): Promise<void> {
    await super.init();

    const bs = this.sprites.get('background') as Sprite;
    this.backgroundPattern = bs.createPattern(new Vector(0, 1));
  }

  public onResize(): void {
    this.setDimension(new Vector(
      this.dimension.x,
      this.ui.dimension.y
    ));

    super.onResize();
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (!this.isVisible()) {
      return;
    }

    const top = this.sprites.get('sidebarTop') as Sprite;
    const bottom = this.sprites.get('sidebarBottom') as Sprite;

    this.context.fillStyle = this.backgroundPattern as CanvasPattern;
    this.context.fillRect(0, 0, this.dimension.x, this.dimension.y);

    top.render(new Vector(0, 1), new Vector(0, RADAR_HEIGHT), this.context);
    bottom.render(new Vector(0, 1), new Vector(0, RADAR_HEIGHT + top.size.y), this.context);

    super.onRender(deltaTime, ctx);

    ctx.drawImage(this.canvas, 0, 0, this.dimension.x, this.dimension.y, this.position.x, this.position.y, this.dimension.x, this.dimension.y);
  }
}

export class UIConstruction extends GameUIEntity {
  protected offset: number = 0;
  private strip: Entity = new Entity();
  private names: string[] = [];

  public async init(): Promise<void> {
    this.setDimension(new Vector(THUMB_WIDTH, THUMB_HEIGHT * THUMB_COUNT + BUTTON_HEIGHT + 1));
    this.strip.setDimension(new Vector(THUMB_WIDTH, THUMB_HEIGHT * THUMB_COUNT));

    let index = 0;
    for (const name of this.sprites.keys()) {
      this.names[index] = name;
      index++;
    }

    this.sprites.set('buttonDown', spriteFromName('UPDATEC.MIX/hstripup.png'));
    this.sprites.set('buttonUp', spriteFromName('UPDATEC.MIX/hstripdn.png'));
    await super.init();
  }

  public onClick(position: Vector): void {
    const thumbnail = Math.floor(position.y / THUMB_HEIGHT);
    const button = position.x / THUMB_WIDTH;

    if (thumbnail > THUMB_COUNT - 1) {
      if (button > 0.5) {
        this.moveDown();
      } else {
        this.moveUp();
      }
    } else {
      this.callback(this.names[thumbnail + this.offset].toUpperCase());
    }
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    const frame = new Vector(0, 0);
    const up = this.sprites.get('buttonUp') as Sprite;
    const down = this.sprites.get('buttonDown') as Sprite;

    this.context.fillStyle = '#000000';
    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

    this.strip.getContext().clearRect(0, 0, this.strip.dimension.x, this.strip.dimension.y);

    let index = -this.offset;
    for (let i = 0; i < this.names.length; i++) {
      const sprite = this.sprites.get(this.names[i]) as Sprite;
      const position = new Vector(0, index * THUMB_HEIGHT);
      this.context.fillRect(position.x, position.y, sprite.size.x, sprite.size.y);
      sprite.render(frame, position, this.strip.getContext());
      index++;
    }

    down.render(new Vector(0, 0), new Vector(0, this.strip.dimension.y + 1), this.context);
    up.render(new Vector(0, 0), new Vector(BUTTON_WIDTH, this.strip.dimension.y + 1), this.context);

    this.context.drawImage(this.strip.getCanvas(), 0, 0, this.strip.dimension.x, this.strip.dimension.y);
    ctx.drawImage(this.canvas, 0, 0, this.dimension.x, this.dimension.y, this.position.x, this.position.y, this.dimension.x, this.dimension.y);
  }

  public moveUp(): void {
    this.offset = Math.max(0, this.offset - 1);
    console.debug('UIConstruction::moveUp()', this.offset);
  }

  public moveDown(): void {
    this.offset = Math.min(this.sprites.size - THUMB_COUNT - 2, this.offset + 1);
    console.debug('UIConstruction::moveDown()', this.offset);
  }
}

export class UIFactoryConstruction extends UIConstruction {
  protected readonly sprites: Map<string, Sprite> = new Map([
    ['e1', spriteFromName('TEMPICNH.MIX/e1icnh.png')],
    ['e2', spriteFromName('TEMPICNH.MIX/e2icnh.png')],
    ['e3', spriteFromName('TEMPICNH.MIX/e3icnh.png')],
    ['e4', spriteFromName('TEMPICNH.MIX/e4icnh.png')],
    ['e6', spriteFromName('TEMPICNH.MIX/e6icnh.png')],
    ['apc', spriteFromName('TEMPICNH.MIX/apcicnh.png')],
    ['arty', spriteFromName('TEMPICNH.MIX/artyicnh.png')],
    ['bggy', spriteFromName('TEMPICNH.MIX/bggyicnh.png')],
    ['bike', spriteFromName('TEMPICNH.MIX/bikeicnh.png')],
    ['ftnk', spriteFromName('TEMPICNH.MIX/ftnkicnh.png')],
    ['harv', spriteFromName('TEMPICNH.MIX/harvicnh.png')],
    ['heli', spriteFromName('TEMPICNH.MIX/heliicnh.png')],
    ['htnk', spriteFromName('TEMPICNH.MIX/htnkicnh.png')],
    ['jeep', spriteFromName('TEMPICNH.MIX/jeepicnh.png')],
    ['ltnk', spriteFromName('TEMPICNH.MIX/ltnkicnh.png')],
    ['mcv', spriteFromName('TEMPICNH.MIX/mcvicnh.png')],
    ['msam', spriteFromName('TEMPICNH.MIX/msamicnh.png')],
    ['mtnk', spriteFromName('TEMPICNH.MIX/mtnkicnh.png')],
    ['orca', spriteFromName('TEMPICNH.MIX/orcaicnh.png')],
    ['stnk', spriteFromName('TEMPICNH.MIX/stnkicnh.png')],
  ]);
}

export class UIStructureConstruction extends UIConstruction {
  protected readonly sprites: Map<string, Sprite> = new Map([
    ['nuke', spriteFromName('TEMPICNH.MIX/nukeicnh.png')],
    ['nuk2', spriteFromName('TEMPICNH.MIX/nuk2icnh.png')],
    ['pyle', spriteFromName('TEMPICNH.MIX/pyleicnh.png')],
    ['hand', spriteFromName('TEMPICNH.MIX/handicnh.png')],
    ['afld', spriteFromName('TEMPICNH.MIX/afldicnh.png')],
    ['atwr', spriteFromName('TEMPICNH.MIX/atwricnh.png')],
    ['brik', spriteFromName('TEMPICNH.MIX/brikicnh.png')],
    ['cycl', spriteFromName('TEMPICNH.MIX/cyclicnh.png')],
    ['eye',  spriteFromName('TEMPICNH.MIX/eyeicnh.png')],
    ['fix',  spriteFromName('TEMPICNH.MIX/fixicnh.png')],
    ['gtwr', spriteFromName('TEMPICNH.MIX/gtwricnh.png')],
    ['gun',  spriteFromName('TEMPICNH.MIX/gunicnh.png')],
    ['hpad', spriteFromName('TEMPICNH.MIX/hpadicnh.png')],
    ['hq',  spriteFromName('TEMPICNH.MIX/hqicnh.png')],
    ['obli', spriteFromName('TEMPICNH.MIX/obliicnh.png')],
    ['proc', spriteFromName('TEMPICNH.MIX/procicnh.png')],
    ['sam',  spriteFromName('TEMPICNH.MIX/samicnh.png')],
    ['sbag', spriteFromName('TEMPICNH.MIX/sbagicnh.png')],
    ['silo', spriteFromName('TEMPICNH.MIX/siloicnh.png')],
    ['tmpl', spriteFromName('TEMPICNH.MIX/tmplicnh.png')],
    ['weap', spriteFromName('TEMPICNH.MIX/weapicnh.png')],
  ]);
}
