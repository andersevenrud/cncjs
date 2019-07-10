/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { MIXObject } from './mix';
import { GameEngine } from './game';
import { Player } from './player';
import { EventEmitter } from 'eventemitter3';

export type ConstructionType = 'structure' | 'unit' | 'aircraft';
export type ConstructionState = 'constructing' | 'hold' | 'ready' | undefined;
export type ConstructionResponse = 'construct' | 'hold' | 'cancel' | 'busy' | 'place' | 'finished' | 'tick';

export interface ConstructionObject {
  name: string;
  type: ConstructionType;
  state: ConstructionState;
  progress: number;
  properties: MIXObject;
  available: boolean;
}

export class ConstructionQueue extends EventEmitter {
  protected readonly engine: GameEngine;
  protected readonly player: Player;
  protected objects: ConstructionObject[] = [];

  public constructor(names: string[], player: Player, engine: GameEngine) {
    super();
    this.player = player;
    this.engine = engine;

    this.objects = names.map(name => name.toUpperCase()).map(name => ({
      name,
      type: engine.mix.getType(name) as ConstructionType,
      properties: engine.mix.getProperties(name) as MIXObject,
      available: true,
      progress: 0,
      state: undefined
    }));
  }

  public onUpdate(deltaTime: number) {
    for (let i = 0; i < this.objects.length; i++) {
      const item = this.objects[i];
      const done = item.progress >= item.properties.Cost;

      if (!item.available) {
        continue;
      }

      if (item.state === 'constructing') {
        if (done) {
          item.state = 'ready';
          this.emit('ready', item);
          if (['unit', 'infantry'].indexOf(item.type) !== -1) {
            this.engine.playArchiveSfx('SPEECH.MIX/unitredy.wav', 'gui', {}, 'eva');
          } else {
            this.engine.playArchiveSfx('SPEECH.MIX/constru1.wav', 'gui', {}, 'eva');
          }
        } else {
          // FIXME: Rule
          item.progress = Math.min(item.properties.Cost, item.progress + 1.0);
          this.emit('tick', item);;
          this.engine.playArchiveSfx('SOUNDS.MIX/clock1.wav', 'gui', { volume: 0.2, block: true });
          this.player.subScredits(1.0); // FIXME
        }
      }
    }
  }

  public updateAvailable(): void {
    // TODO
  }

  public reset(index: number) {
    const item = this.objects[index];
    if (item && item.available) {
      item.state = undefined;
      item.progress = 0;
    }
  }

  public build(index: number) {
    const item = this.objects[index];
    if (item && item.available) {
      if (item.state !== 'constructing') {
        this.emit('construct', item);
        this.engine.playArchiveSfx('SPEECH.MIX/bldging1.wav', 'gui', {}, 'eva');

        item.state = 'constructing';
      } else {
        this.engine.playArchiveSfx('SPEECH.MIX/bldg1.wav', 'gui', {}, 'eva');
      }
    }
  }

  public cancel(index: number) {
    const item = this.objects[index];
    if (item && item.available) {
      if (item.state !== undefined) {
        this.emit('cancel', item);
        this.engine.playArchiveSfx('SPEECH.MIX/cancel1.wav', 'gui', {}, 'eva');
        this.player.addCredits(item.progress);

        item.state = undefined;
        item.progress = 0;
      }
    }
  }

  public hold(index: number) {
    const item = this.objects[index];
    if (item && item.available) {
      if (item.state === 'constructing') {
        this.emit('hold', item);
        this.engine.playArchiveSfx('SPEECH.MIX/onhold1.wav', 'gui', {}, 'eva');

        item.state = 'hold';
      }
    }
  }

  public getItem(index: number): ConstructionObject | undefined {
    return this.objects[index];
  }

  public getAvailable(): ConstructionObject[] {
    return this.objects.filter(o => o.available);
  }

  public getAvailableCount(): number {
    return this.getAvailable().length;
  }

  public getNames(): string[] {
    return this.objects.map(o => o.name);
  }
}
