/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { MIXObject } from './mix';
import { GameEngine } from './game';
import { Player } from './player';
import { EventEmitter } from 'eventemitter3';

export type ConstructionType = 'structure' | 'unit' | 'aircraft' | 'infantry'; // FIXME: Should be in MIX
export type ConstructionState = 'constructing' | 'hold' | 'ready' | undefined;
export type ConstructionResponse = 'construct' | 'hold' | 'cancel' | 'busy' | 'place' | 'finished' | 'tick';

export interface ConstructionObject {
  index: number;
  name: string;
  type: ConstructionType;
  state: ConstructionState;
  progress: number;
  cost: number;
  properties?: MIXObject;
  available: boolean;
}

export class ConstructionQueue extends EventEmitter {
  protected readonly engine: GameEngine;
  protected readonly player: Player;
  protected objects: ConstructionObject[] = [];
  protected techLevel: number = -1;
  protected buildLevel: number = -1;

  public constructor(names: string[], player: Player, engine: GameEngine) {
    super();
    this.player = player;
    this.engine = engine;

    this.objects = names.map(name => name.toUpperCase())
      .map((name, index) => {
        const properties = engine.mix.getProperties(name);
        return {
          index,
          name,
          type: engine.mix.getType(name) as ConstructionType,
          cost: properties ? properties.Cost : 1, // FIXME
          properties,
          available: !properties, // FIXME
          progress: 0,
          state: undefined
        };
      });

    this.player.on('entities-updated', () => this.updateAvailable());
  }

  public onUpdate(deltaTime: number) {
    for (let i = 0; i < this.objects.length; i++) {
      const item = this.objects[i];
      const done = item.progress >= item.cost;

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
          item.progress = Math.min(item.cost, item.progress + 1.0);
          this.emit('tick', item);;
          this.engine.playArchiveSfx('SOUNDS.MIX/clock1.wav', 'gui', { volume: 0.2, block: true });
          this.player.subScredits(1.0); // FIXME
        }
      }
    }
  }

  public updateAvailable(): void {
    for (let i = 0; i < this.objects.length; i++) {
      let o = this.objects[i];
      if (o.properties) {
        if (!this.player.canConstruct()) {
          // FIXME
          o.available = false;
        }

        if (this.techLevel !== -1) {
          o.available = (o.properties.TechLevel || 0) <= this.techLevel;
        }

        if (this.buildLevel !== -1) {
          o.available = (o.properties.BuildLevel || 0) <= this.buildLevel;
        }

        if (o.available && o.properties.Prerequisites.length > 0) {
          o.available = this.player.hasPrequisite(o.properties.Prerequisites);
        }

        if (o.available && o.type === 'unit') {
          o.available = this.player.canConstructUnit();
        } else if (o.available && o.type === 'infantry') {
          o.available = this.player.canConstructInfantry();
        }
      }
    }
  }

  public reset(item: ConstructionObject) {
    if (item.available) {
      item.state = undefined;
      item.progress = 0;
    }
  }

  public build(item: ConstructionObject) {
    if (item.available) {
      if (item.state !== 'constructing') {
        this.emit('construct', item);
        this.engine.playArchiveSfx('SPEECH.MIX/bldging1.wav', 'gui', {}, 'eva');
        item.state = 'constructing';
      } else {
        this.engine.playArchiveSfx('SPEECH.MIX/bldg1.wav', 'gui', {}, 'eva');
      }
    }
  }

  public cancel(item: ConstructionObject) {
    if (item.available) {
      if (item.state !== undefined) {
        this.emit('cancel', item);
        this.engine.playArchiveSfx('SPEECH.MIX/cancel1.wav', 'gui', {}, 'eva');
        this.player.addCredits(item.progress);

        item.state = undefined;
        item.progress = 0;
      }
    }
  }

  public hold(item: ConstructionObject) {
    if (item.available) {
      if (item.state === 'constructing') {
        this.emit('hold', item);
        this.engine.playArchiveSfx('SPEECH.MIX/onhold1.wav', 'gui', {}, 'eva');

        item.state = 'hold';
      }
    }
  }

  public getAvailable(): ConstructionObject[] {
    return this.objects.filter(o => o.available);
  }

  public setTechLevel(l: number): void {
    this.techLevel = l;
  }

  public setBuildLevel(l: number): void {
    this.buildLevel = l;
  }

  public getAvailableCount(): number {
    return this.getAvailable().length;
  }

  public getNames(): string[] {
    return this.objects.map(o => o.name);
  }
}
