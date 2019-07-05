/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Sprite, Entity, Animation } from '../engine';
import { spriteFromName } from './sprites';
import { GameEngine } from './game';
import { cursorMap, MIXCursor } from './mix';
import { Vector } from 'vector2d';

const animations: any = Object.keys(cursorMap)
  .map((name): any => {
    const cursor = cursorMap[name];
    return [
      name,
      new Animation(name, new Vector(0, cursor.index), cursor.count, 0.25)
    ];
  });

export class Cursor extends Entity {
  protected readonly engine: GameEngine;
  protected animations: Map<string, Animation> = new Map(animations);
  protected animation: string = 'default';
  protected cursor: MIXCursor = cursorMap[this.animation];
  public readonly cursorSprite: Sprite = spriteFromName('CCLOCAL.MIX/mouse.png') as Sprite;

  public constructor(engine: GameEngine) {
    super();
    this.engine = engine;
  }

  public async init(): Promise<void> {
    try {
      await this.engine.loadArchiveSprite(this.cursorSprite);
      this.engine.setCursor(false);
    } catch (e) {
      console.error('Cursor::init()', e);
    }
  }

  public onUpdate(deltaTime: number): void {
    this.position = this.engine.mouse.getVector();

    const animation = this.animations.get(this.animation) as Animation;
    animation.onUpdate();
  }

  public onRender(deltaTime: number, context: CanvasRenderingContext2D): void {
    const animation = this.animations.get(this.animation) as Animation;
    const offset = new Vector(
      this.cursorSprite.size.x * this.cursor.x,
      this.cursorSprite.size.y * this.cursor.y
    );

    const position = this.position.clone().subtract(offset) as Vector;
    this.cursorSprite.render(animation.getFrameIndex(), position, context);
  }

  public setCursor(name: string = 'default'): void {
    if (name === this.animation) {
      return;
    }

    if (this.animations.has(name)) {
      const animation = this.animations.get(this.animation) as Animation;
      animation.reset();

      this.animation = name;
      this.cursor = cursorMap[this.animation];
    }
  }
}

