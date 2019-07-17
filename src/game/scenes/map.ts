/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Animation, Scene, Entity, Sprite } from '../../engine';
import { GameEngine } from '../game';
import { Player } from '../player';
import { spriteFromName } from '../sprites';
import { getScaledDimensions } from '../physics';
import { MapSelectionUI } from '../ui/map';
import { Vector } from 'vector2d';

class MapScene extends Entity {
  public readonly engine: GameEngine;
  private readonly animation: Animation;

  protected readonly sprites: Map<string, Sprite> = new Map([
    ['background', spriteFromName('GENERAL.MIX/greyerth.png')]
  ]);

  public constructor(engine: GameEngine) {
    super();
    this.engine = engine;

    const bkg = this.sprites.get('background') as Sprite;
    this.animation = new Animation('spinning', new Vector(0, 0), bkg.frames, 0.1);
  }

  public async init(): Promise<void> {
    for (const sprite of this.sprites.values()) {
      await this.engine.loadArchiveSprite(sprite);
    }

    const bkg = this.sprites.get('background') as Sprite;
    this.setDimension(bkg.size);
  }

  public onUpdate(deltaTime: number): void {
    this.animation.onUpdate();
  }

  public onRender(deltaTime: number): void {
    const background = this.sprites.get('background') as Sprite;
    const frame = this.animation.getFrameIndex();
    background.render(frame, new Vector(0, 0), this.context);
  }
}

/**
 * Map Selection Scene
 */
export class MapSelectionScene extends Scene {
  public engine: GameEngine;
  private player: Player;
  protected readonly ui: MapSelectionUI;
  protected readonly screen: MapScene;

  public constructor(player: Player, engine: GameEngine) {
    super(engine);
    this.engine = engine;
    this.player = player;
    this.screen = new MapScene(engine);
    this.ui = new MapSelectionUI(player.getTeam(), this);
  }

  public toString(): string {
    return `Map Select`;
  }

  public async init(): Promise<void> {
    this.ui.setDimension(new Vector(540,  400));

    await this.screen.init();
    await this.ui.init();

    const playlist = this.engine.sound.getPlaylist();
    playlist.setList([{
      source: 'TRANSIT.MIX/loopie6m.wav',
      title: 'loopie'
    }]);

    playlist.play();
  }

  public handleMapSelection(name: string): void {
    this.engine.onMapSelect(name, this.player);
  }

  public onResize(): void {
    super.onResize();
    this.ui.onResize();
  }

  public onUpdate(deltaTime: number): void {
    const dimension = this.engine.getScaledDimension();
    const { dx, dy, bR } = getScaledDimensions(
      this.ui.getDimension(),
      dimension
    );

    this.ui.setScale({
      offset: new Vector(dx, dy),
      scale: bR
    });

    this.screen.onUpdate(deltaTime);
    this.ui.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number): void {
    const context = this.engine.getContext();

    let { sx, sy, sw, sh, dx, dy, dw, dh } = getScaledDimensions(
      this.screen.getDimension(),
      this.engine.getScaledDimension()
    );

    this.screen.onRender(deltaTime);
    context.drawImage(this.screen.getCanvas(), sx, sy, sw, sh, dx, dy, dw, dh);

    this.ui.onRender(deltaTime, context);
  }
}
