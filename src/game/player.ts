/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { defaultTeamMap, MIXPlayerName, MIXTeamName } from './mix';

export class Player {
  protected id: number = 0;
  protected credits: number = 0;
  protected power: [number, number] = [0, 0]; // Avail / Used
  protected name: MIXPlayerName = 'GoodGuy';
  protected team: MIXTeamName = 'gdi';
  protected minimap: boolean = true; // TODO: Add a debug mode for this
  protected techLevel: number = 0;
  protected sessionPlayer: boolean = false;

  public constructor(id: number, name: MIXPlayerName, team?: MIXTeamName) {
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

  public setTechLevel(tl: number) {
    this.techLevel = tl;
  }

  public setMinimap(mm: boolean) {
    this.minimap = mm;
  }

  public setSessionPlayer(sess: boolean) {
    this.sessionPlayer = sess;
  }

  public getId(): number {
    return this.id;
  }

  public getName(): string {
    return this.name;
  }

  public getTeam(): string {
    return this.team;
  }

  public getCredits(): number {
    return this.credits;
  }

  public getTechLevel(): number {
    return this.techLevel;
  }

  public isSessionPlayer(): boolean {
    return this.sessionPlayer;
  }

  public hasMinimap(): boolean {
    return this.minimap;
  }
}
