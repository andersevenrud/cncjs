/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Scene, Sprite, Entity, Animation } from '../../engine';
import { GameEngine } from '../game';
import { spriteFromName } from '../sprites';
import { Vector } from 'vector2d';
import { getScaledDimensions } from '../physics';

class ScoreScreen extends Entity {
  public readonly engine: GameEngine;
  protected backgroundAnimation: Animation;
  protected timeAnimation: Animation;

  protected readonly sprites: Map<string, Sprite> = new Map([
    ['background-gdi', spriteFromName('GENERAL.MIX/s-gdiin2.png')],
    ['background-nod', spriteFromName('GENERAL.MIX/scrscn1.png')],
    ['time', spriteFromName('CONQUER.MIX/time.png')],
    ['bar-red', spriteFromName('CONQUER.MIX/bar3red.png')],
    ['bar-yellow', spriteFromName('CONQUER.MIX/bar3ylw.png')],
    ['coins', spriteFromName('CONQUER.MIX/creds.png')],
    ['corner', spriteFromName('CONQUER.MIX/hiscore1.png')],
    ['top', spriteFromName('CONQUER.MIX/hiscore2.png')],
    ['logos', spriteFromName('CONQUER.MIX/logos.png')],
    //['multiplayer', spriteFromName('CONQUER.MIX/mltiplyr.png')],
  ]);

  public constructor(engine: GameEngine) {
    super();
    this.engine = engine;

    const bkg = this.sprites.get('background-gdi') as Sprite;
    this.backgroundAnimation = new Animation('background', new Vector(0, 0), bkg.frames, 1.0, false);

    const time = this.sprites.get('time') as Sprite;
    this.timeAnimation = new Animation('time', new Vector(0, 0), time.frames, 1.0);
    this.setDimension(bkg.size);
  }

  public async init(): Promise<void> {
    for (const sprite of this.sprites.values()) {
      await this.engine.loadArchiveSprite(sprite);
    }
  }

  public onUpdate(deltaTime: number): void {
    this.backgroundAnimation.onUpdate();
    this.timeAnimation.onUpdate();
  }

  public onRender(deltaTime: number): void {
    const ctx = this.context;
    const background = this.sprites.get('background-gdi') as Sprite;
    const time = this.sprites.get('time') as Sprite;
    const x = background.size.x - time.size.x;

    ctx.clearRect(0, 0, this.dimension.x, this.dimension.y);

    background.render(
      this.backgroundAnimation.getFrameIndex(),
      new Vector(0, 0),
      ctx
    );

    time.render(
      this.timeAnimation.getFrameIndex(),
      new Vector(x, 0),
      ctx
    );
  }
}

/**
 * Score Scene
 */
export class ScoreScene extends Scene {
  public readonly engine: GameEngine;
  protected readonly screen: ScoreScreen;

  public constructor(engine: GameEngine) {
    super(engine);
    this.engine = engine;
    this.screen = new ScoreScreen(engine);
  }

  public toString(): string {
    return `Score`;
  }

  public async init(): Promise<void> {
    await this.screen.init();

    const playlist = this.engine.sound.getPlaylist();
    playlist.setList([{
      source: 'TRANSIT.MIX/win1.wav',
      title: 'win'
    }]);

    playlist.play();
  }

  public onUpdate(deltaTime: number): void {
    this.screen.onUpdate(deltaTime);

    if (this.engine.keyboard.wasClicked('Enter')) {
      this.emit('done');
    }
  }

  public onRender(deltaTime: number): void {
    this.screen.onRender(deltaTime);

    const canvas = this.screen.getCanvas();
    const context = this.engine.getContext();
    const dimension = this.engine.getScaledDimension();
    const { sx, sy, sw, sh, dx, dy, dw, dh } = getScaledDimensions(
      this.screen.getDimension(),
      dimension
    );

    context.drawImage(canvas, sx, sy, sw, sh, dx, dy, dw, dh);
  }
}
