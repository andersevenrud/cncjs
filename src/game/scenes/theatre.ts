/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Box, MusicTrack, Scene } from '../../engine';
import { GameEngine } from '../game';
import { GameMap } from '../map';
import { TheatreUI } from '../ui/theatre';
import { MIXMapData, MIXPlayerName, MIXTheme } from '../mix';
import { cellFromPoint } from '../physics';
import { Vector } from 'vector2d';

/**
 * Theatre Scene
 */
export class TheatreScene extends Scene {
  public readonly engine: GameEngine;
  public readonly map: GameMap;
  public readonly ui: TheatreUI;
  public readonly viewport: Box = { x1: 0, x2: 800, y1: 0, y2: 600 };
  public readonly name: string;
  private loaded: boolean = false;

  public constructor(name: string, data:MIXMapData, player: MIXPlayerName, engine: GameEngine) {
    super(engine);

    this.engine = engine;
    this.name = name;
    this.map = new GameMap(this.name, data, player, this.engine as GameEngine);
    this.ui = new TheatreUI(this);
  }

  public toString(): string {
    const map = this.map.toString();
    return `Theatre\nMap: ${map}`;
  }

  public async init(): Promise<void> {
    const playlist = this.engine.sound.getPlaylist();

    const themes = this.engine.mix.getPlaylistThemes();
    const keys = Array.from(themes.keys()) as string[];
    const list: MusicTrack[] = keys
      .map((key: string): MusicTrack => {
        const iter = themes.get(key) as MIXTheme;
        return {
          source: `SCORES.MIX/${key.toLowerCase()}.wav`,
          title: iter.Title,
          name: key.toLowerCase(),
          length: iter.Length
        };
      });

    playlist.setList(list);

    await this.map.init();
    await this.ui.init();

    this.loaded = true;

    playlist.play('aoi');
    console.debug(this);
  }

  public onUIToggle(): void {
    this.onResize();
  }

  public onResize(): void {
    this.ui.onResize();

    const v = this.ui.getViewport();
    const s = this.engine.getScale();
    this.viewport.x1 = v.x1 / s;
    this.viewport.x2 = v.x2 * s;
    this.viewport.y1 = v.y1 / s;
    this.viewport.y2 = v.y2 * s;

    this.map.onResize(this.viewport);
  }

  public onUpdate(deltaTime: number): void {
    if (!this.loaded) {
      return;
    }

    const { keyboard, mouse } = this.engine;
    const skip = this.ui.isMenuOpen();

    if (!skip) {
      if (keyboard.isPressed(['w', 'arrowup'])) {
        this.map.moveRelative(new Vector(0, 10));
      } else if (keyboard.isPressed(['s', 'arrowdown'])) {
        this.map.moveRelative(new Vector(0, -10));
      }

      if (keyboard.isPressed(['a', 'arrowleft'])) {
        this.map.moveRelative(new Vector(10, 0));
      } else if (keyboard.isPressed(['d', 'arrowright'])) {
        this.map.moveRelative(new Vector(-10, 0));
      }

      if (this.engine.configuration.debugMode) {
        if (keyboard.wasClicked('F10')) {
          this.map.toggleFow();
        }

        if (keyboard.wasClicked('Delete')) {
          this.map.getSelectedEntities().forEach(e => e.takeDamage(Number.MAX_VALUE));
        } else if (keyboard.wasClicked('End')) {
          const cell = cellFromPoint(this.map.getRealMousePosition(mouse.getVector()));
          this.map.getSelectedEntities().forEach(e => e.setCell(cell, true));
        } else if (keyboard.wasClicked('PageDown')) {
          this.map.getSelectedEntities().forEach(e => e.setHealth(e.getHealth() - 4));
        } else if (keyboard.wasClicked('PageUp')) {
          this.map.getSelectedEntities().forEach(e => e.setHealth(e.getHealth() + 4));
        }
      }
    }

    this.ui.onUpdate(deltaTime);

    if (!skip) {
      this.map.onUpdate(deltaTime);
      this.updateSoundContext();
    }
  }

  public onRender(deltaTime: number): void {
    if (this.loaded) {
      const context = this.engine.getContext();
      this.map.onRender(deltaTime, context);
      this.ui.onRender(deltaTime, context);
    }
  }

  private updateSoundContext(): void {
    const viewport = this.getScaledViewport();
    const position = this.map.getPosition();
    const center = new Vector(
      ((viewport.x2 - viewport.x1) / 2) + position.x,
      ((viewport.y2 - viewport.y1) / 2) + position.y
    );

    this.engine.sound.setContextPosition(center);
  }

  public getScaledViewport(): Box {
    const { x1, x2, y1, y2 } = this.viewport;
    const scale = this.engine.getScale();

    return {
      x1: x1 * scale,
      x2: x2 / scale,
      y1: y1 * scale,
      y2: y2 / scale
    };
  }
}
