/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { UIScene } from '../../engine';
import { MenuScene } from '../scenes/menu';
import { GameEngine } from '../game';
import { UIBox, UIButton, UIText, UISlider } from './elements';
import { Vector } from 'vector2d';
import packageJson from '../../../package.json';

export const createGameControlsMenu = (engine: GameEngine, ui: UIScene) => {
  const onNull = () => {};
  const settings = new UIBox('game-controls', new Vector(464, 282), new Vector(90, 20), onNull, engine, ui);

  const onClose = () => settings.setVisible(false);

  const buttonVisuals = new UIButton('game-controls_visuals', 'Visual Controls', new Vector(250, 18), new Vector(0.5, 180), onNull, engine, ui);
  const buttonSound = new UIButton('game-controls_sound', 'Sound Controls', new Vector(250, 18), new Vector(0.5, 210), onNull, engine, ui);
  const buttonBack = new UIButton('game-controls_back', 'Options Menu', new Vector(200, 18), new Vector(0.5, 250), onClose, engine, ui);


  settings.addChild(new UIText('title', 'Game Controls', '6point', new Vector(0.5, 6), engine, ui));
  settings.addChild(buttonVisuals);
  settings.addChild(buttonSound);
  settings.addChild(buttonBack);

  settings.addChild(new UIText('label_game-speed', 'Game Speed'.toUpperCase(), '6point', new Vector(18, 60), engine, ui));
  settings.addChild(new UISlider('game-controls_slider_speed', new Vector(400, 18), new Vector(0.5, 80), onNull, engine, ui));

  settings.addChild(new UIText('label_scroll-speed', 'Scroll Speed'.toUpperCase(), '6point', new Vector(18, 110), engine, ui));
  settings.addChild(new UISlider('game-controls_scroll_speed', new Vector(400, 18), new Vector(0.5, 130), onNull, engine, ui));

  settings.setDecorations(1);
  return settings;
}

export class MainMenuUI extends UIScene {
  public readonly scene: MenuScene;

  public constructor(scene: MenuScene) {
    super(scene.engine);
    this.scene = scene;
  }

  public async init(): Promise<void> {
    const onNull = () => {};

    const menu = new UIBox('menu', new Vector(300, 270), new Vector(170, 0), onNull, this.scene.engine, this);
    const settings = createGameControlsMenu(this.scene.engine, this);

    const onNewGame = () => this.scene.onNewGame();
    const onGameControls = () => {
      settings.setVisible(true);
      menu.setVisible(false);
    };

    const buttonNew = new UIButton('new-game', 'Start New Game', new Vector(250, 18), new Vector(25, 80), onNewGame, this.scene.engine, this);
    const buttonOptions = new UIButton('game-settings', 'Game Controls', new Vector(250, 18), new Vector(25, 112), onGameControls, this.scene.engine, this);

    settings.setVisible(false);
    menu.setDecorations(0);
    menu.addChild(new UIText('title', 'JavaScript Remake', '6point', new Vector(0.5, 200), this.scene.engine, this));
    menu.addChild(new UIText('title', 'andersevenrud@gmail.com', '6point', new Vector(0.5, 220), this.scene.engine, this));
    menu.addChild(new UIText('title', `v${packageJson.version}`, '6point', new Vector(0.5, 240), this.scene.engine, this));
    menu.addChild(buttonNew);
    menu.addChild(buttonOptions);

    this.elements.push(menu);
    this.elements.push(settings);

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
