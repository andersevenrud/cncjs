/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import {
  Engine,
  Sprite,
  Scene,
  SoundEffect,
  DataArchive,
  DataArchiveImageLoader,
  DataArchiveSoundLoader,
  EngineSceneFn
} from '../engine';
import { MenuScene } from './scenes/menu';
import { TeamScene } from './scenes/team';
import { MovieScene } from './scenes/movie';
import { TheatreScene } from './scenes/theatre';
import { ScoreScene } from './scenes/score';
import { LoadingScene } from './scenes/loading';
import { Cursor } from './cursor';
import { MIX, MIXPlayerName } from './mix';

export interface GameEngineConfig {
  scrollSpeed: number;
}

/**
 * Game Engine
 */
export class GameEngine extends Engine {
  public readonly data: DataArchive = new DataArchive('data.zip');
  public readonly mix: MIX = new MIX(this.data);
  public readonly imageLoader: DataArchiveImageLoader = new DataArchiveImageLoader(this.data);
  public readonly sfxLoader: DataArchiveSoundLoader = new DataArchiveSoundLoader(this, this.data);
  public readonly cursor: Cursor = new Cursor(this);
  public readonly debugMode = process.env.NODE_ENV === 'development';
  protected debug: boolean = this.debugMode;
  protected loaded: boolean = false;
  public readonly gameConfig: GameEngineConfig = {
    scrollSpeed: 4
  };

  public destroy(): void {
    this.imageLoader.clearCache();
    this.sfxLoader.clearCache();
    this.data.clearCache();
    super.destroy();
  }

  protected setLoading(progress: number, total: number): void {
    this.scene.emit('progress', progress, total);
  }

  public async loadArchiveSprite(sprite: Sprite): Promise<void> {
    let image = await this.imageLoader.fetch(sprite.source);
    return await sprite.init(image);
  }

  public async playArchiveSfx(source: string, node: string, sound: Partial<SoundEffect> = {}, queue?: string) {
    try {
      this.sound.playSfx({
        context: await this.sfxLoader.fetch(source),
        ...sound
      }, node, queue);
    } catch (e) {
      console.warn('GameMapBaseEntity::playSfx()', e);
    }
  }

  public async init(): Promise<void> {
    const progress = (current: number, total: number): void => this.setLoading(1 / (total / current), 4);

    const q = new URLSearchParams(document.location.search.substring(1));
    const debugScene: string | null = q.get('scene');

    this.scene = new LoadingScene(this);
    await this.scene.init();
    this.setLoading(0, 4);
    this.data.on('progress', progress);
    await this.data.fetch();
    this.data.off('progress', progress);
    this.setLoading(1, 4);
    await this.mix.parse();
    this.setLoading(2, 4);
    await super.init();
    this.setLoading(3, 4);
    await this.cursor.init();

    if (this.debugMode) {
      const debugState: boolean = q.get('debug') !== 'false';
      this.debug = debugState;

      if (debugScene) {
        const debugMap: string | null = q.get('map');
        const debugMovie: string = q.get('movie') as string;
        const debugPlayer: string = q.get('player') || 'GoodGuy';
        const debugSound: string | null = q.get('sound');
        const debugZoom: string | null = q.get('zoom');

        if (debugZoom) {
          this.setScale(parseFloat(debugZoom));
        }

        if (debugScene === 'theatre') {
          await this.pushTheatreScene(debugMap || 'scg01ea', debugPlayer as MIXPlayerName);
        } else if (debugScene === 'team') {
          await this.pushTeamScene();
        } else if (debugScene === 'movie') {
          await this.pushMovieScene(debugMovie);
        } else if (debugScene === 'score') {
          await this.pushScoreScene();
        } else {
          await this.pushMenuScene();
        }

        if (debugSound) {
          this.sound.setMuted(debugSound !== 'true');
        }
      } else {
        await this.pushMenuScene();
      }
    } else {
      await this.pushMenuScene();
    }

    this.setLoading(4, 4);
    this.loaded = true;
  }

  public async pushScene(scene: EngineSceneFn, skip: boolean = true): Promise<void> {
    this.cursor.setCursor();

    return super.pushScene(scene, skip);
  }

  public async pushMenuScene(skip: boolean = true): Promise<void> {
    this.pushScene(() => new MenuScene(this), skip);
  }

  public async pushTeamScene(skip: boolean = true): Promise<void> {
    this.pushScene(() => new TeamScene(this), skip);
  }

  public async pushMovieScene(name: string,skip: boolean = true ): Promise<void> {
    this.pushScene(() => new MovieScene(this, name), skip);
  }

  public async pushTheatreScene(name: string, player: MIXPlayerName, skip: boolean = true): Promise<void> {
    this.pushScene(() => new TheatreScene(name, player, this), skip);
  }

  public async pushScoreScene(skip: boolean = true): Promise<void> {
    this.pushScene(() => new ScoreScene(this), skip);
  }

  public setScrollSpeed(speed: number): void {
    this.gameConfig.scrollSpeed = speed;
  }

  public getScrollSpeed(): number {
    return this.gameConfig.scrollSpeed;
  }

  public onRender(deltaTime: number): void {
    super.onRender(deltaTime);

    if (this.loaded) {
      this.cursor.onRender(deltaTime, this.context);
    }
  }

  public onUpdate(deltaTime: number): void {
    if (!this.loaded) {
      return;
    }

    if (this.debugMode) {
      if (this.keyboard.wasClicked('F1')) {
        this.pushMenuScene(true);
      } else if (this.keyboard.wasClicked('F2')) {
        this.pushTeamScene(true);
      } else if (this.keyboard.wasClicked('F3')) {
        this.pushTheatreScene('scg03ea', 'GoodGuy', true);
      } else if (this.keyboard.wasClicked('F4')) {
        this.pushMovieScene('banner', true);
      } else if (this.keyboard.wasClicked('F5')) {
        this.pushScoreScene(true);
      } else if (this.keyboard.wasClicked('F12')) {
        this.setDebug(!this.getDebug());
      }
    }

    if (this.keyboard.wasClicked('F11')) {
      this.setCanvasFilter(!this.getCanvasFilter());
    }

    if (this.keyboard.wasClicked(',')) {
      this.sound.playlist.prev();
    } else if (this.keyboard.wasClicked('.')) {
      this.sound.playlist.next();
    } else if (this.keyboard.wasClicked('-')) {
      this.sound.playlist.pause(!this.sound.playlist.paused);
    } else if (this.keyboard.wasClicked('m')) {
      this.sound.setMuted(!this.sound.isMuted());
    }

    if (this.keyboard.wasClicked('+')) {
      this.setScale(this.getScale() + 0.2);
    } else if (this.keyboard.wasClicked('?')) {
      this.setScale(this.getScale() - 0.2);
    }

    if (this.keyboard.isPressed('0')) {
      this.sound.setVolume(this.sound.getVolume() - 0.1);
    } else if (this.keyboard.isPressed('=')) {
      this.sound.setVolume(this.sound.getVolume() + 0.1);
    }

    super.onUpdate(deltaTime);
    this.cursor.onUpdate(deltaTime);
  }

}
