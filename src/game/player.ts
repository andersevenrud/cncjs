/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { defaultTeamMap, MIXMapPlayer, MIXPlayerName, MIXTeamName } from './mix';
import { GameEntity } from './entity';
import EventEmitter from 'eventemitter3';

export class Player extends EventEmitter {
  protected id: number = 0;
  protected credits: number = 0;
  protected power: [number, number] = [0, 0]; // Avail / Used
  protected name: MIXPlayerName = 'GoodGuy';
  protected team: MIXTeamName = 'gdi';
  protected structures: Set<string> = new Set();
  protected sessionPlayer: boolean = false;

  public constructor(id: number, name: MIXPlayerName, team?: MIXTeamName) {
    super();

    this.id = id;
    this.name = name;

    if (team) {
      this.team = team;
    } else if (defaultTeamMap[id]) {
      this.team = defaultTeamMap[id];
    }
  }

  public toString(): string {
    return `${this.id} ${this.name}/${this.team} C:${this.credits} P:${this.power.join('/')}`;
  }

  public update(entities: GameEntity[]): void {
    this.structures.clear();

    for (let i = 0; i < entities.length; i++) {
      if (entities[i].isStructure()) {
        let name = entities[i].getName();
        this.structures.add(name);
      }
    }

    this.emit('entities-updated');
  }

  public load(data: MIXMapPlayer): void {
    this.credits = data.Credits * 100;
  }

  public addCredits(credits: number): void {
    this.credits += credits;
  }

  public subScredits(credits: number): void {
    this.credits -= credits;
  }

  public enoughCredits(what: number): boolean {
    return this.credits >= what;
  }

  public setCredits(credits: number): void {
    this.credits = credits;
  }

  public setPower(power: [number, number]) {
    this.power = power;
  }

  public setSessionPlayer(sess: boolean) {
    this.sessionPlayer = sess;
  }

  public getId(): number {
    return this.id;
  }

  public getName(): MIXPlayerName {
    return this.name;
  }

  public getTeam(): MIXTeamName {
    return this.team;
  }

  public getCredits(): number {
    return this.credits;
  }

  public getStructures(): string[] {
    return Array.from(this.structures.values());
  }

  public isSessionPlayer(): boolean {
    return this.sessionPlayer;
  }

  public hasPrequisite(names: string[]): boolean {
    if (!this.structures.size) {
      return false;
    }

    const snames = this.getStructures();
    return names
      .every((n: string) => snames.indexOf(n) !== -1);
  }

  public hasMinimap(): boolean {
    return ['HQ', 'EYE'].some(n => this.getStructures().indexOf(n) !== -1);
  }

  public canConstruct(): boolean {
    return this.canConstructStructure() ||
      this.canConstructUnit() ||
      this.canConstructInfantry();
  }

  public canConstructStructure(): boolean {
    return this.getStructures().indexOf('FACT') !== -1;
  }

  public canConstructUnit(): boolean {
    return ['HAND', 'WEAP'].some(n => this.getStructures().indexOf(n) !== -1);
  }

  public canConstructInfantry(): boolean {
    return ['HAND', 'PYLE'].some(n => this.getStructures().indexOf(n) !== -1);
  }
}
