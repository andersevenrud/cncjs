/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Animation, Scene, Sprite } from '../../engine';
import { spriteFromName } from  '../sprites';
import { GameEngine } from '../game';
import { getScaledDimensions } from '../physics';
import { Vector } from 'vector2d';
import { gdiMaps, nodMaps } from '../mix';

/**
 * Team Scene
 */
export class TeamScene extends Scene {
  public engine: GameEngine;
  private background: Sprite = spriteFromName('TRANSIT.MIX/choose.png');
  private animation: Animation = new Animation('choose', new Vector(0, 0), this.background.frames, 0.5);
  private sounds: Map<string, AudioBuffer> = new Map();
  private chosen: boolean = false;

  public constructor(engine: GameEngine) {
    super(engine);
    this.engine = engine;
  }

  public toString(): string {
    return `TEAM`;
  }

  public async init(): Promise<void> {
    const playlist = this.engine.sound.getPlaylist();
    playlist.setList([{
      source: 'TRANSIT.MIX/struggle.wav',
      title: 'struggle'
    }]);

    playlist.play();

    await this.engine.loadArchiveSprite(this.background);

    this.sounds.set('nod', await this.engine.sfxLoader.fetch('TRANSIT.MIX/nod_slct.wav'));
    this.sounds.set('gdi', await this.engine.sfxLoader.fetch('TRANSIT.MIX/gdi_slct.wav'));
  }

  private async clicked(position: Vector) {
    if (this.chosen) {
      return;
    }
    this.chosen = true;

    const playlist = this.engine.sound.getPlaylist();
    const viewport =  this.engine.getScaledDimension();
    const clickedRight = (position.x) > (viewport.x / 2);
    const selected = clickedRight ? 'nod' : 'gdi';
    const player = selected === 'nod' ? 'BadGuy' : 'GoodGuy';
    const maps = selected === 'nod' ? nodMaps : gdiMaps;

    const done = () => {
      this.engine.pushMovieScene(`${selected}1`);
      this.engine.pushTheatreScene(maps[0], player, false);
    };

    const context = this.sounds.get(selected) as AudioBuffer;

    playlist.pause();
    this.engine.sound.playSfx({ context, done }, 'gui');
  }

  public onUpdate(deltaTime: number): void {
    const mouse = this.engine.mouse;
    if (mouse.wasClicked('left')) {
      const position = mouse.getVector();
      this.clicked(position);
    }

    this.animation.onUpdate();
  }

  public onRender(deltaTime: number): void {
    const context = this.engine.getContext();
    const frame = this.animation.getFrameIndex();
    const dimension = this.engine.getScaledDimension();
    const { sw, sh, dx, dy, dw, dh } = getScaledDimensions(
      this.background.size,
      dimension
    );

    context.drawImage(this.background.image.canvas, frame.x * sw, frame.y * sh, sw, sh, dx, dy, dw, dh);
  }
}
