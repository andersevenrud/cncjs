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

export const createSoundControlsMenu = (engine: GameEngine, ui: UIScene, position: Vector): UIBox => {
  const settings = new UIBox('sound-controls', new Vector(464, 282), position, engine, ui);
  const musicVolume = engine.sound.getVolume('music');
  const soundVolume = engine.sound.getVolume('sfx');

  settings.addChild(new UIText('title', 'Sound controls', '6point', new Vector(0.5, 6), engine, ui));

  settings.addChild(new UIText('label_music-volume', 'Music volume', '8point', new Vector(18, 60), engine, ui));
  const sliderMusicVolume = settings.addChild(new UISlider('game-controls_music-volume', musicVolume, new Vector(272, 10), new Vector(140, 60), engine, ui));

  settings.addChild(new UIText('label_sound-volume', 'Sound volume', '8point', new Vector(18, 80), engine, ui));
  const sliderSoundVolume = settings.addChild(new UISlider('game-controls_sound-volume', soundVolume, new Vector(272, 10), new Vector(140, 80), engine, ui));

  settings.addChild(new UIListView('game-controls_themes', new Vector(428, 120), new Vector(18, 100), engine, ui))

  settings.addChild(new UIButton('game-controls_sound-stop', 'ST', new Vector(32, 18), new Vector(18, 250), engine, ui));
  settings.addChild(new UIButton('game-controls_sound-play', 'PL', new Vector(32, 18), new Vector(56, 250), engine, ui));
  settings.addChild(new UIText('label_shuffle', 'Shuffle', '8point', new Vector(104, 254), engine, ui));
  settings.addChild(new UIButton('game-controls_sound-shuffle', '1', new Vector(32, 18), new Vector(160, 250), engine, ui));
  settings.addChild(new UIText('label_repeat', 'Repeat', '8point', new Vector(200, 254), engine, ui));
  settings.addChild(new UIButton('game-controls_sound-repeat', '1', new Vector(32, 18), new Vector(254, 250), engine, ui));

  settings.addChild(new UIButton('sound-controls_back', 'Options Menu', new Vector(140, 18), new Vector(306, 250), engine, ui));

  sliderMusicVolume.on('change', (value: number) => {
    engine.sound.setVolume(value, 'music');
  });

  sliderSoundVolume.on('change', (value: number) => {
    engine.sound.setVolume(value, 'sfx');
    engine.sound.setVolume(value, 'gui');
  });

  settings.setDecorations(1);
  return settings;
};

export const createVisualControlsMenu = (engine: GameEngine, ui: UIScene, position: Vector): UIBox => {
  const settings = new UIBox('visual-controls', new Vector(464, 282), position, engine, ui);

  settings.addChild(new UIText('title', 'Visual controls', '6point', new Vector(0.5, 6), engine, ui));
  settings.addChild(new UIButton('visual-controls_back', 'Options Menu', new Vector(200, 18), new Vector(0.5, 250), engine, ui));
  settings.addChild(new UIText('todo', 'Nothing here yet...', '6point', new Vector(0.5, 0.5), engine, ui));

  settings.setDecorations(1);
  return settings;
};

export const createGameControlsMenu = (engine: GameEngine, ui: UIScene, position: Vector): UIBox => {
  const settings = new UIBox('game-controls', new Vector(464, 282), position, engine, ui);
  const gameSpeed = 1.0;
  const scrollSpeed = 0.5;

  settings.addChild(new UIText('title', 'Game Controls', '6point', new Vector(0.5, 6), engine, ui));
  settings.addChild(new UIButton('game-controls_visuals', 'Visual Controls', new Vector(250, 18), new Vector(0.5, 180), engine, ui));
  settings.addChild(new UIButton('game-controls_sound', 'Sound Controls', new Vector(250, 18), new Vector(0.5, 210), engine, ui));
  settings.addChild(new UIButton('game-controls_back', 'Options Menu', new Vector(200, 18), new Vector(0.5, 250), engine, ui));

  settings.addChild(new UIText('label_game-speed', 'Game Speed'.toUpperCase(), '6point', new Vector(18, 60), engine, ui));
  settings.addChild(new UISlider('game-controls_slider_speed', gameSpeed, new Vector(400, 18), new Vector(0.5, 80), engine, ui));

  settings.addChild(new UIText('label_scroll-speed', 'Scroll Speed'.toUpperCase(), '6point', new Vector(18, 110), engine, ui));
  settings.addChild(new UISlider('game-controls_scroll_speed', scrollSpeed, new Vector(400, 18), new Vector(0.5, 130), engine, ui));

  settings.setDecorations(1);
  return settings;
}

export const createGameMenus = (engine: GameEngine, ui: UIScene, position: Vector, menu: UIBox): UIBox[] => {
  const settings = createGameControlsMenu(engine, ui, position)
  const visuals = createVisualControlsMenu(engine, ui, position);
  const sounds = createSoundControlsMenu(engine, ui, position);

  settings.getElementByName('game-controls_visuals')!.on('click', () => {
    settings.setVisible(false);
    visuals.setVisible(true);
  });

  settings.getElementByName('game-controls_sound')!.on('click', () => {
    settings.setVisible(false);
    sounds.setVisible(true);
  });

  settings.getElementByName('game-controls_back')!.on('click', () => {
    settings.setVisible(false);
    menu.setVisible(true);
  });

  visuals.getElementByName('visual-controls_back')!.on('click', () => {
    visuals.setVisible(false);
    settings.setVisible(true);
  });

  sounds.getElementByName('sound-controls_back')!.on('click', () => {
    sounds.setVisible(false);
    settings.setVisible(true);
  });

  return [settings, visuals, sounds];
};

export class MainMenuUI extends UIScene {
  public readonly scene: MenuScene;

  public constructor(scene: MenuScene) {
    super(scene.engine);
    this.scene = scene;
  }

  public async init(): Promise<void> {
    const menu = new UIBox('menu', new Vector(300, 270), new Vector(170, 0), this.scene.engine, this);
    const [settings, visuals, sounds] = createGameMenus(this.scene.engine, this, new Vector(90, 20), menu);
    menu.addChild(new UIText('title', 'JavaScript Remake', '6point', new Vector(0.5, 200), this.scene.engine, this));
    menu.addChild(new UIText('title', 'andersevenrud@gmail.com', '6point', new Vector(0.5, 220), this.scene.engine, this));
    menu.addChild(new UIText('title', `v${packageJson.version}`, '6point', new Vector(0.5, 240), this.scene.engine, this));

    const btnNew = menu.addChild(new UIButton('new-game', 'Start New Game', new Vector(250, 18), new Vector(25, 80), this.scene.engine, this));
    const btnControls = menu.addChild(new UIButton('game-settings', 'Game Controls', new Vector(250, 18), new Vector(25, 112), this.scene.engine, this));

    btnNew.on('click', () => {
      this.scene.onNewGame();
    });

    btnControls.on('click', () => {
      settings.setVisible(true);
      menu.setVisible(false);
    });

    settings.setVisible(false);
    visuals.setVisible(false);
    sounds.setVisible(false);
    menu.setDecorations(0);

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
