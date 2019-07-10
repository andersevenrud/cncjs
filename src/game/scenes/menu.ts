/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Scene, Sprite, Entity } from '../../engine';
import { spriteFromName } from  '../sprites';
import { GameEngine } from '../game';
import { MainMenuUI } from '../ui/mainmenu';
import { getScaledDimensions } from '../physics';
import { Vector } from 'vector2d';

class MenuScreen extends Entity {
  public readonly engine: GameEngine;

  protected readonly sprites: Map<string, Sprite> = new Map([
    ['background', spriteFromName('UPDATE.MIX/htitle.png')]
  ]);

  public constructor(engine: GameEngine) {
    super();
    this.engine = engine;
  }

  public async init(): Promise<void> {
    for (const sprite of this.sprites.values()) {
      await this.engine.loadArchiveSprite(sprite);
    }

    const bkg = this.sprites.get('background') as Sprite;
    this.setDimension(bkg.size);
  }

  public onUpdate(deltaTime: number): void {
  }

  public onRender(deltaTime: number): void {
    const background = this.sprites.get('background') as Sprite;
    background.render(new Vector(0, 0), new Vector(0, 0), this.context);
  }
}

/**
 * Menu Scene
 */
export class MenuScene extends Scene {
  public engine: GameEngine;
  protected readonly screen: MenuScreen;
  protected readonly ui: MainMenuUI = new MainMenuUI(this);

  public constructor(engine: GameEngine) {
    super(engine);
    this.engine = engine;
    this.screen = new MenuScreen(engine);
  }

  public toString(): string {
    return `Menu`;
  }

  public async init(): Promise<void> {
    await this.screen.init();

    const playlist = this.engine.sound.getPlaylist();
    playlist.setList([{
      source: 'TRANSIT.MIX/map1.wav',
      title: 'title'
    }]);

    playlist.play();

    this.ui.setDimension(this.screen.getDimension());
    await this.ui.init();
  }

  public onNewGame(): void {
    this.engine.pushTeamScene();
  }

  public onDestroy(): void {
  }

  public onResize(): void {
    super.onResize();
    this.ui.onResize();
  }

  public onUpdate(deltaTime: number): void {
    const dimension = this.engine.getScaledDimension();
    const { dx, dy, bR } = getScaledDimensions(
      this.screen.getDimension(),
      dimension
    );

    this.ui.setScale({
      offset: new Vector(dx, dy),
      scale: bR
    });

    this.ui.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number): void {
    const { sx, sy, sw, sh, dx, dy, dw, dh } = getScaledDimensions(
      this.screen.getDimension(),
      this.engine.getScaledDimension()
    );

    this.screen.onRender(deltaTime);
    this.ui.onRender(deltaTime, this.screen.getContext());

    const context = this.engine.getContext();
    context.drawImage(this.screen.getCanvas(), sx, sy, sw, sh, dx, dy, dw, dh);
  }
}
