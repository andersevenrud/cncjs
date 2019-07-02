/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { UIScene } from '../../engine';
import { MenuScene } from '../scenes/menu';
import { GameEngine } from '../game';
import { UIBox, UIButton, UIText, UISlider, UIListView } from './elements';
import { Vector } from 'vector2d';
import packageJson from '../../../package.json';

export const createSoundControlsMenu = (engine: GameEngine, ui: UIScene, position: Vector, onClose: Function) => {
  const onNull = () => {};
  const settings = new UIBox('sound-controls', new Vector(464, 282), position, onNull, engine, ui);

  settings.addChild(new UIText('title', 'Sound controls', '6point', new Vector(0.5, 6), engine, ui));

  settings.addChild(new UIText('label_music-volume', 'Music volume', '8point', new Vector(18, 60), engine, ui));
  settings.addChild(new UISlider('game-controls_music-volume', new Vector(272, 10), new Vector(140, 60), onNull, engine, ui));

  settings.addChild(new UIText('label_sound-volume', 'Sound volume', '8point', new Vector(18, 80), engine, ui));
  settings.addChild(new UISlider('game-controls_sound-volume', new Vector(272, 10), new Vector(140, 80), onNull, engine, ui));

  settings.addChild(new UIListView('game-controls_themes', new Vector(428, 120), new Vector(18, 100), onNull, engine, ui))

  settings.addChild(new UIButton('game-controls_sound-stop', 'ST', new Vector(32, 18), new Vector(18, 250), onNull, engine, ui));
  settings.addChild(new UIButton('game-controls_sound-play', 'PL', new Vector(32, 18), new Vector(56, 250), onNull, engine, ui));
  settings.addChild(new UIText('label_shuffle', 'Shuffle', '8point', new Vector(104, 254), engine, ui));
  settings.addChild(new UIButton('game-controls_sound-shuffle', '1', new Vector(32, 18), new Vector(160, 250), onNull, engine, ui));
  settings.addChild(new UIText('label_repeat', 'Repeat', '8point', new Vector(200, 254), engine, ui));
  settings.addChild(new UIButton('game-controls_sound-repeat', '1', new Vector(32, 18), new Vector(254, 250), onNull, engine, ui));

  settings.addChild(new UIButton('sound-controls_back', 'Options Menu', new Vector(140, 18), new Vector(306, 250), onClose, engine, ui));

  settings.setDecorations(1);
  return settings;
};

export const createVisualControlsMenu = (engine: GameEngine, ui: UIScene, position: Vector, onClose: Function) => {
  const onNull = () => {};
  const settings = new UIBox('visual-controls', new Vector(464, 282), position, onNull, engine, ui);

  settings.addChild(new UIText('title', 'Visual controls', '6point', new Vector(0.5, 6), engine, ui));
  settings.addChild(new UIButton('visual-controls_back', 'Options Menu', new Vector(200, 18), new Vector(0.5, 250), onClose, engine, ui));
  settings.addChild(new UIText('todo', 'Nothing here yet...', '6point', new Vector(0.5, 0.5), engine, ui));

  settings.setDecorations(1);
  return settings;
};

export const createGameControlsMenu = (engine: GameEngine, ui: UIScene, position: Vector, callback: Function) => {
  const onNull = () => {};
  const onClose = () => callback('close');
  const onVisuals = () => callback('visuals');
  const onSounds = () => callback('sounds');

  const settings = new UIBox('game-controls', new Vector(464, 282), position, onNull, engine, ui);

  settings.addChild(new UIText('title', 'Game Controls', '6point', new Vector(0.5, 6), engine, ui));
  settings.addChild(new UIButton('game-controls_visuals', 'Visual Controls', new Vector(250, 18), new Vector(0.5, 180), onVisuals, engine, ui));
  settings.addChild(new UIButton('game-controls_sound', 'Sound Controls', new Vector(250, 18), new Vector(0.5, 210), onSounds, engine, ui));
  settings.addChild(new UIButton('game-controls_back', 'Options Menu', new Vector(200, 18), new Vector(0.5, 250), onClose, engine, ui));

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
    let menu: UIBox, settings: UIBox, visuals: UIBox, sounds: UIBox;

    const onNewGame = () => this.scene.onNewGame();
    const onGameControls = () => {
      settings.setVisible(true);
      menu.setVisible(false);
    };

    menu = new UIBox('menu', new Vector(300, 270), new Vector(170, 0), onNull, this.scene.engine, this);

    settings = createGameControlsMenu(this.scene.engine, this, new Vector(90, 20), (action: string) => {
      settings.setVisible(false);
      if (action === 'close') {
        menu.setVisible(true);
      } else if (action === 'visuals') {
        visuals.setVisible(true);
      } else if (action === 'sounds') {
        sounds.setVisible(true);
      }
    });

    visuals = createVisualControlsMenu(this.scene.engine, this, new Vector(90, 20), () => {
      visuals.setVisible(false);
      settings.setVisible(true);
    });

    sounds = createSoundControlsMenu(this.scene.engine, this, new Vector(90, 20), () => {
      sounds.setVisible(false);
      settings.setVisible(true);
    });

    settings.setVisible(false);
    visuals.setVisible(false);
    sounds.setVisible(false);
    menu.setDecorations(0);

    menu.addChild(new UIText('title', 'JavaScript Remake', '6point', new Vector(0.5, 200), this.scene.engine, this));
    menu.addChild(new UIText('title', 'andersevenrud@gmail.com', '6point', new Vector(0.5, 220), this.scene.engine, this));
    menu.addChild(new UIText('title', `v${packageJson.version}`, '6point', new Vector(0.5, 240), this.scene.engine, this));
    menu.addChild(new UIButton('new-game', 'Start New Game', new Vector(250, 18), new Vector(25, 80), onNewGame, this.scene.engine, this));
    menu.addChild(new UIButton('game-settings', 'Game Controls', new Vector(250, 18), new Vector(25, 112), onGameControls, this.scene.engine, this));

    this.elements.push(menu);
    this.elements.push(settings);
    this.elements.push(visuals);
    this.elements.push(sounds);

    await super.init();
  }

  public onResize(): void {
    super.onResize();
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);
    super.onRender(deltaTime, ctx);
  }
}
