/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import { Entity, Box, randomBetweenInteger } from '../engine';
import { Player } from './player';
import { GameEngine } from './game';
import { GameMap } from './map';
import { cellFromPoint, pointFromCell, CELL_SIZE } from './physics';
import { soundMap } from './mix';
import { Vector } from 'vector2d';

export abstract class GameEntity extends Entity {
  public readonly map: GameMap;
  public readonly player?: Player;
  protected offset: Vector = new Vector(0, 0);
  protected cell: Vector = new Vector(0, 0);
  protected rendered: boolean = false;
  protected engine: GameEngine;
  protected selected: boolean = false;
  protected dying: boolean = false;
  protected repairing: boolean = false;
  protected direction: number = 0;
  protected directions: number = 32;
  protected turretDirections: number = 32;
  protected turretDirection: number = -1;
  protected animation: string = '';
  protected health: number = 100;
  protected hitPoints: number = 100;
  protected zIndex: number = 0;

  public constructor(map: GameMap) {
    super();

    this.map = map;
    this.engine = map.engine;
    this.turretDirection = this.direction;
  }

  public destroy(): void {
    if (!this.destroyed) {
      super.destroy();
      this.map.removeEntity(this);
    }
  }

  public toString(): string {
    return 'TODO'; // TODO
  }

  public toJson(): any {
    return {
      cell: this.cell.toObject(),
      health: this.health
    }
  }

  public async init(): Promise<void> {
  }

  public onUpdate(deltaTime: number): void {
  }

  public onRender(deltaTime: number): void {
  }

  public async playSfx(name: string): Promise<void> {
    const count = soundMap[name];
    const suffix = count > 1 ? `-${randomBetweenInteger(1, count)}` : '';
    const source = `SOUNDS.MIX/${name.toLowerCase()}${suffix}.wav`;
    console.debug('GameEntity::playSfx()', { source, name, count });

    return this.engine.playArchiveSfx(source, 'sfx', { position: this.position });
  }

  public die(): boolean {
    return false;
  }

  public attack(target: GameEntity, report: boolean = false): void {
  }

  public move(position: Vector, report: boolean = false): void {
    this.moveTo(position, report);
  }

  public sell(): void {
  }

  public repair(): void {
  }

  public deploy(): void {
  }

  protected moveTo(position: Vector, report: boolean = false): boolean {
    return false;
  }

  public takeDamage(value: number): void {
  }

  public updateWall(): void {
  }

  public setCell(cell: Vector, updatePosition: boolean = false): void {
    this.cell = cell;

    if (updatePosition) {
      this.setPosition(pointFromCell(cell));
    }
  }

  public setPosition(position: Vector, updateCell: boolean = false): void {
    super.setPosition(position);

    if (updateCell) {
      this.setCell(cellFromPoint(position));
    }
  }

  public setSelected(selected: boolean, report: boolean = false): void {
    this.selected = selected;
  }

  public setHealth(health: number): void {
    this.health = health;
  }

  public getMovementSpeed(): number {
    return 1;
  }

  public getRotationSpeed(): number {
    return 1;
  }

  public getSight(): number {
    return 1;
  }

  public getArmor(): number {
    return 0;
  }

  public getCell(): Vector {
    return this.cell.clone() as Vector;
  }

  public getDirection(): number {
    return this.direction;
  }

  public getCellBox(): Box {
    return {
      x1: this.cell.x,
      x2: this.cell.x + Math.ceil(this.dimension.x / CELL_SIZE), // FIXME
      y1: this.cell.y,
      y2: this.cell.y + Math.ceil(this.dimension.y / CELL_SIZE) // FIXME
    };
  }

  public getTruncatedPosition(offset?: Vector): Vector {
    const v = this.position.clone();
    if (offset) {
      v.subtract(offset);
    }

    return new Vector(Math.trunc(v.x), Math.trunc(v.y));
  }

  public getHealth(): number {
    return this.health;
  }

  public getPowerProduction(): number {
    return 0;
  }

  public getPowerDrain(): number {
    return 0;
  }

  public getPlayerId(): number {
    return -1;
  }

  public getRenderBox(): Box {
    return this.getBox();
  }

  public getSelectionBox(): Box {
    return this.getBox();
  }

  public getColor(): string {
    return '#ffffff';
  }

  public getZindex(): number {
    return this.zIndex;
  }

  public getName(): string {
    return '';
  }

  public canRotate(): boolean {
    return false;
  }

  public canReveal(): boolean {
    return true;
  }

  public canAttack(): boolean {
    return false;
  }

  public canFireTwice(): boolean {
    return false;
  }

  public isAttackable(source: GameEntity): boolean {
    return !this.isSelectable();
  }

  public isMoving(): boolean {
    return false;
  }

  public isMovable(): boolean {
    return false;
  }

  public isSelectable(): boolean {
    return false;
  }

  public isSelected(): boolean {
    return this.selected;
  }

  public isPlayer(): boolean {
    return false;
  }

  public isCivilian(): boolean {
    return false;
  }

  public isDeployable(): boolean {
    return false;
  }

  public isSellable(): boolean {
    return false;
  }

  public isRepairable(): boolean {
    return false;
  }

  public isRepairing(): boolean {
    return this.repairing;
  }

  public isDestroyed(): boolean {
    return this.destroyed;
  }

  public isWall(): boolean {
    return false;
  }

  public isStructure(): boolean {
    return false;
  }

  public isUnit(): boolean {
    return false;
  }

  public isInfantry(): boolean {
    return false;
  }

  public isTiberium(): boolean {
    return false;
  }
}
