/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { UIScene } from '../../engine';
import { MenuScene } from '../scenes/menu';
import { UIBox, UIButton } from './elements';
import { Vector } from 'vector2d';

export class MainMenuUI extends UIScene {
  public readonly scene: MenuScene;

  public constructor(scene: MenuScene) {
    super(scene.engine);
    this.scene = scene;
  }

  public async init(): Promise<void> {
    const onNull = () => {};
    const onNewGame = () => this.scene.onNewGame();

    const menu = new UIBox('menu', new Vector(300, 270), new Vector(170, 0), onNull, this.scene.engine, this);
    const buttonNew = new UIButton('new-game', 'New Game', new Vector(250, 18), new Vector(25, 80), onNewGame, this.scene.engine, this);

    menu.setDecorations(true);
    menu.addChild(buttonNew);
    this.elements.push(menu);

    await super.init();
  }

  public onResize(): void {
    super.onResize();
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    super.onRender(deltaTime, ctx);
  }
}
