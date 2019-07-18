/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import {
  Engine,
  Sprite,
  SoundEffect,
  DataArchive,
  DataArchiveImageLoader,
  DataArchiveSoundLoader,
  EngineSceneFn
} from '../engine';
import { MenuScene } from './scenes/menu';
import { MapSelectionScene } from './scenes/map';
import { TeamScene } from './scenes/team';
import { MovieScene } from './scenes/movie';
import { TheatreScene } from './scenes/theatre';
import { ScoreScene } from './scenes/score';
import { LoadingScene } from './scenes/loading';
import { Cursor } from './ui/cursor';
import { Player } from './player';
import { MIX, MIXPlayerName, MIXTeamName, gdiMaps, nodMaps } from './mix';

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
    this.setLoading(0, 2);
    this.data.on('progress', progress);
    await this.data.fetch();
    this.data.off('progress', progress);
    this.setLoading(1, 2);
    await this.mix.parse();
    this.setLoading(1.5, 2);
    await super.init();
    this.setLoading(1.9, 2);
    await this.cursor.init();

    if (this.configuration.debugMode) {
      const debugMuted: string | null = q.get('muted');
      const debugZoom: string | null = q.get('zoom');
      const debugState: boolean = q.get('debug') === 'true';
      this.debug = debugState;


      if (debugZoom) {
        this.setScale(parseFloat(debugZoom));
      }

      if (debugMuted) {
        this.sound.setMuted(debugMuted === 'true');
      }

      if (debugScene) {
        const debugMap: string | null = q.get('map');
        const debugMovie: string = q.get('movie') as string;
        const debugPlayer: string = q.get('player') || 'GoodGuy';

        if (debugScene === 'theatre') {
          await this.pushTheatreScene(debugMap || 'scg01ea', debugPlayer as MIXPlayerName, true);
        } else if (debugScene === 'team') {
          await this.pushTeamScene();
        } else if (debugScene === 'movie') {
          await this.pushMovieScene(debugMovie);
        } else if (debugScene === 'score') {
          await this.pushScoreScene();
        } else if (debugScene === 'map') {
          await this.pushMapSelectionScene();
        } else {
          await this.pushMenuScene();
        }
      } else {
        await this.pushMenuScene();
      }
    } else {
      await this.pushMenuScene();
    }

    this.setLoading(2, 2);
    this.loaded = true;
  }

  public async pushScene(scene: EngineSceneFn): Promise<void> {
    this.cursor.setCursor();
    return super.pushScene(scene);
  }

  public async pushMenuScene(): Promise<void> {
    this.clearScenes()
    this.pushScene(() => new MenuScene(this));
    return this.nextScene();
  }

  public async pushTeamScene(): Promise<void> {
    this.clearScenes()
    this.pushScene(() => new TeamScene(this));
    return this.nextScene();
  }

  public async pushMovieScene(name: string): Promise<void> {
    this.clearScenes()
    this.pushScene(() => new MovieScene(name, this));
    return this.nextScene();
  }

  public async pushTheatreScene(name: string, player: MIXPlayerName, skipMovie: boolean = false): Promise<void> {
    const data = await this.mix.loadMap(name);
    const movieName = data.basic.Brief;

    this.clearScenes()
    if (!skipMovie) {
      this.pushScene(() => new MovieScene(movieName, this));
    }
    this.pushScene(() => new TheatreScene(name, data, player, this));
    return this.nextScene();
  }

  public async pushScoreScene(): Promise<void> {
    this.clearScenes()
    this.pushScene(() => new ScoreScene(this));
    return this.nextScene();
  }

  public async pushMapSelectionScene(): Promise<void> {
    const player = this.scene instanceof TheatreScene ? this.scene.map.player : new Player(0, 'GoodGuy', 'gdi');

    this.clearScenes();
    this.pushScene(() => new MapSelectionScene(player, this));
    return this.nextScene();
  }

  public setScrollSpeed(speed: number): void {
    this.gameConfig.scrollSpeed = speed;
  }

  public getScrollSpeed(): number {
    return this.gameConfig.scrollSpeed;
  }

  public onTeamSelected(selected: MIXTeamName): void {
    const player = selected === 'nod' ? 'BadGuy' : 'GoodGuy';
    const maps = selected === 'nod' ? nodMaps : gdiMaps;
    this.pushTheatreScene(maps[0], player);
  }

  public onTheatreWon(): void {
    const map = (this.scene as TheatreScene).map;
    const movieName = map.data.basic.Win;
    const player = map.player;

    this.clearScenes()
    this.pushScene(() => new MovieScene(movieName, this));
    this.pushScene(() => new ScoreScene(this));
    this.pushScene(() => new MapSelectionScene(player, this));
    this.nextScene();
  }

  public onTheatreLost(): void {
    const map = (this.scene as TheatreScene).map;
    const movieName = map.data.basic.Lose;

    this.clearScenes()
    this.pushScene(() => new MovieScene(movieName, this));
    this.pushScene(() => new MenuScene(this));
    this.nextScene();
  }

  public onMapSelect(name: string, player: Player): void {
    this.pushTheatreScene(name, player.getName());
  }

  public onTheatreAborted(): void {
    this.pushMenuScene();
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

    if (this.configuration.debugMode) {
      if (this.keyboard.wasClicked('F1')) {
        this.pushMenuScene();
      } else if (this.keyboard.wasClicked('F2')) {
        this.pushTeamScene();
      } else if (this.keyboard.wasClicked('F3')) {
        this.pushTheatreScene('scg03ea', 'GoodGuy');
      } else if (this.keyboard.wasClicked('F4')) {
        this.pushMovieScene('banner');
      } else if (this.keyboard.wasClicked('F5')) {
        this.pushScoreScene();
      } else if (this.keyboard.wasClicked('F6')) {
        this.pushMapSelectionScene();
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
