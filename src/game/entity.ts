/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Animation, Entity, Box, Sprite, randomBetweenInteger } from '../engine';
import { Player } from './player';
import { GameEngine } from './game';
import { GameMap } from './map';
import { pointFromCell, cellFromPoint, CELL_SIZE } from './physics';
import { MIXMapEntityData, MIXObject } from './mix';
import { spriteFromName } from './sprites';
import { MIXGrid, wallNames, soundMap, healthBarColors } from './mix';
import { Vector } from 'vector2d';

const HEALT_BAR_HEIGHT = 6;

export type GameMapEntityTargetAction = 'attack' | 'patrol';

export interface GameMapEntityTarget {
  entity: GameMapEntity;
  action: GameMapEntityTargetAction;
}

/**
 * Map Entity Animation
 */
export class GameMapEntityAnimation extends Animation {
  public multiplier: number = 1;

  public constructor(name: string, offset: Vector, count: number, speed: number, multiplier: number = 1) {
    super(name, offset, count, speed);
    this.multiplier = multiplier;
  }
}

export abstract class GameMapBaseEntity extends Entity {
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
    console.debug('GameMapBaseEntity::playSfx()', { source, name, count });

    return this.engine.playArchiveSfx(source, 'sfx', { position: this.position });
  }

  public die(): boolean {
    return false;
  }

  public attack(target: GameMapBaseEntity, report: boolean = false): void {
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

  public isAttackable(source: GameMapBaseEntity): boolean {
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

  public isTiberium(): boolean {
    return false;
  }
}

/**
 * Map Entity
 */
export abstract class GameMapEntity extends GameMapBaseEntity {
  public readonly player?: Player;
  public readonly properties?: MIXObject;
  protected dimension: Vector = new Vector(24, 24);
  protected readonly data: MIXMapEntityData;
  protected occupy?: MIXGrid;
  protected overlap?: MIXGrid;
  protected sprite?: Sprite;
  protected frame: Vector = new Vector(0, 0);
  protected frameOffset: Vector = new Vector(0, 0);
  protected animations: Map<string, GameMapEntityAnimation> = new Map();
  protected reportSelect?: string;
  protected reportMove?: string;
  protected reportAttack?: string;
  protected reportConstruct?: string;
  protected reportDestroy?: string;

  public constructor(data: MIXMapEntityData, map: GameMap) {
    super(map);
    this.data = data;
    this.direction = this.data.direction || 0;
    this.health = parseInt(String(data.health!), 10) || 1; // FIXME
    this.player = typeof data.player === 'number'
      ? map.getPlayerById(data.player)
      : undefined;

    this.setCell(data.cell, true);
  }

  public destroy(): void {
    this.toggleWalkableTiles(true);
    super.destroy();
  }

  public toString(): string {
    const s = this.getDamageState();
    return `${this.data.player}:${this.data.name} ${this.health}/${this.hitPoints}H@${s} ${this.getTruncatedPosition().toString()}@${this.cell.toString()}x${this.direction.toFixed(1)} | ${this.animation || '<null>'}@${this.frame.toString()} ${this.zIndex}z`;
  }

  public toJson(): any {
    return {
      ...this.data,
      ...super.toJson(),
      health: this.health,
      direction: this.direction
    }
  }

  public async init(): Promise<void> {
    try {
      this.sprite = spriteFromName(this.getSpriteName());
      await this.engine.loadArchiveSprite(this.sprite);
    } catch (e) {
      console.error('GameMapEntity::init()', 'Failed to load sprite', this.getSpriteName(), e);
    }

    if (this.properties) {
      if (this.properties.OccupyList) {
        this.occupy = this.engine.mix.grids.get(this.properties.OccupyList);
      }
      if (this.properties.OverlapList) {
        this.overlap = this.engine.mix.grids.get(this.properties.OverlapList);
      }
    }

    if (typeof this.data.player === 'number') {
      const xoff = this.getSpritePlayerIndex();
      this.frameOffset.setX(xoff);
    }

    this.toggleWalkableTiles(false);
  }

  public onUpdate(deltaTime: number): void {
    const animation = this.animations.get(this.animation);

    if (animation) {
      animation.onUpdate();
      this.frame = animation.getFrameIndex(this.frameOffset);
    } else {
      this.frame = this.frameOffset;
    }
  }

  public updateWall(): void {
    if (this.sprite && this.isWall()) {
      const lastFrameIndex = this.frameOffset.y;

      const y = (true ? 0 : 16) + // FIXME
         this.getSimilarEntity(new Vector(0, -1), 1) + // top
         this.getSimilarEntity(new Vector(0, 1), 4) + // bottom
         this.getSimilarEntity(new Vector(-1, 0), 8) + // left
         this.getSimilarEntity(new Vector(1, 0), 2); // right

      if (y != lastFrameIndex) {
        this.direction = y;
        this.frameOffset.setY(y);
      }
    }
  }

  protected renderDebug(deltaTime: number, context: CanvasRenderingContext2D): void {
    const x = Math.trunc(this.position.x);
    const y = Math.trunc(this.position.y);
    const length = Math.max(this.dimension.x, this.dimension.y);
    const angle = (270 - (360 * this.direction / this.directions)) % 360;
    const x1 = x + (this.dimension.x / 2);
    const y1 = y + (this.dimension.y / 2);
    const x2 = x1 + Math.cos(Math.PI * angle / 180) * length;
    const y2 = y1 + Math.sin(Math.PI * angle / 180) * length;

    context.strokeStyle = this.isPlayer() ? 'rgba(0, 255, 0, 0.3)' : `rgba(255, 255, 0, 0.3)`;
    context.strokeRect(this.position.x + 0.5, this.position.y + 0.5, this.dimension.x, this.dimension.y);

    context.beginPath();
    context.moveTo(x1 + 0.5, y1 + 0.5);
    context.lineTo(x2 + 0.5, y2 + 0.5);
    context.stroke();
  }

  protected renderHealthBar(deltaTime: number, context: CanvasRenderingContext2D): void {
    const c = healthBarColors[this.getDamageState()];
    const x = Math.trunc(this.position.x);
    const y = Math.trunc(this.position.y);

    context.fillStyle = '#000000';
    context.fillRect(
      x,
      y - HEALT_BAR_HEIGHT - 2,
      this.dimension.x,
      HEALT_BAR_HEIGHT
    );

    context.fillStyle = c;

    context.fillRect(
      x + 1,
      y - HEALT_BAR_HEIGHT - 1,
      Math.round(this.dimension.x * (this.health / this.hitPoints)) - 2,
      HEALT_BAR_HEIGHT - 2
    );
  }

  protected renderSelectionRectangle(deltaTime: number, context: CanvasRenderingContext2D): void {
    this.map.selection.render(this, context);
  }

  protected renderSprite(deltaTime: number, context: CanvasRenderingContext2D, sprite?: Sprite, frame?: Vector): void {
    const s = sprite || this.sprite;
    const f = frame || this.frame;
    if (s) {
      const position = this.getTruncatedPosition(this.offset);
      const canvas = s.render(f, position, context);

      // FIXME: optimize
      if (this.overlap) {
        const h = this.overlap.grid.length;
        const w = h > 0 ? this.overlap.grid[0].length : 0;

        const ocontext = this.map.overlay.getContext();

        // FIXME: Maybe instead only re-render complete rows ? (like top half)
        for (let y = 0; y < h; y++) {
          for (let x = 0; x < w; x++) {
            let v = this.overlap.grid[y][x];
            if (v === 'x') {
              ocontext.drawImage(
                canvas,
                x * CELL_SIZE,
                y * CELL_SIZE,
                CELL_SIZE,
                CELL_SIZE,
                this.position.x + (x * CELL_SIZE),
                this.position.y + (y * CELL_SIZE),
                CELL_SIZE,
                CELL_SIZE,
              );
            }
          }
        }
      }
    }
  }

  public onRender(deltaTime: number): void {
    const context = this.map.overlay.getContext();
    if (this.engine.getDebug()) {
      this.renderDebug(deltaTime, context);
    }

    if (this.isSelected()) {
      this.renderHealthBar(deltaTime, context);
      this.renderSelectionRectangle(deltaTime, context);
    }
  }

  public die(destroy: boolean = true): boolean {
    if (this.dying) {
      return false;
    }

    this.dying = true;

    if (this.reportDestroy) {
      this.playSfx(this.reportDestroy);
    }

    if (destroy) {
      this.destroy();
    }

    return true;
  }

  protected toggleWalkableTiles(t: boolean): void {
    if (!this.occupy) {
      return;
    }

    const h = this.occupy.grid.length;
    const w = h > 0 ? this.occupy.grid[0].length : 0;

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        let v = this.occupy.grid[y][x];
        if (v === 'x') {
          this.map.grid.setWalkableAt(this.cell.x + x, this.cell.y + y, t);
        }
      }
    }
  }

  public takeDamage(value: number): void {
    if (this.health > 0) {
      this.health = Math.max(0, this.health - value);

      console.debug('GameMapEntity::takeDamage()', value, this.health);
      if (this.health <= 0) {
        this.die();
      }
    }
  }

  public isDestroyed(): boolean {
    return this.destroyed || this.dying;
  }

  public setSelected(selected: boolean, report: boolean = true): void {
    if (!this.isSelectable()) {
      return;
    }

    this.selected = selected;

    if (this.selected) {
      if (report && this.reportSelect) {
        this.playSfx(this.reportSelect);
      }
    }
  }

  protected getSimilarEntity(offset: Vector, value: number): number {
    const cell = this.cell.clone().add(offset) as Vector;
    const finder = (e: GameMapEntity): boolean => e.data
      ? e.data.name === this.data.name
      : false; // FIXME: Projectiles

    const found = this.map.getEntitiesFromCell(cell, finder);

    return found.length > 0 ? value : 0;
  }

  public getSpritePlayerIndex(): number {
    if (this.data.player! < 2) {
      return Math.max(0, this.data.player!);
    }

    return 0;
  }

  public getSpriteName(): string {
    const prefix = this.data.name.replace(/\d+/, '');
    const matchers = ['T' ,'V', 'TI', 'TC', 'SPLIT'];

    if (matchers.indexOf(prefix) !== -1) { // FIXME
      return `${this.map.theatre.toUpperCase()}.MIX/${this.data.name.toLowerCase()}.png`;
    }

    return `CONQUER.MIX/${this.data.name.toLowerCase()}.png`;
  }

  public getDamageState(): number {
    // TODO: Rules
    const value = Math.max(this.health / this.hitPoints, 0);
    if (value <= 0.25) {
      return 2;
    } else if (value <= 0.50) {
      return 1;
    }
    return 0;
  }

  public getArmor(): number {
    return this.properties!.Armor || 0;
  }

  public getColor(): string {
    // FIXME
    return this.isPlayer()
      ? '#00ff00'
      : '#ff0000';
  }

  public getPlayerId(): number {
    return typeof this.data.player === 'number'
      ? this.data.player
      : super.getPlayerId();
  }

  public getName(): string {
    return this.data.name;
  }

  public canReveal(): boolean {
    // FIXME: Neutral ?
    return this.isPlayer();
  }

  public isAttackable(source: GameMapEntity): boolean {
    if (!this.isSelectable()) {
      return false;
    }

    return this.isPlayer() ? false : source.data.player != this.data.player;
  }

  public isPlayer(): boolean {
    return this.player ? this.player.isSessionPlayer() : false;
  }

  public isCivilian(): boolean {
    return !this.player || this.player.getName() === 'Neutral';
  }

  public isWall(): boolean {
    return wallNames.indexOf(this.data.name) !== -1;
  }

  public isTiberium(): boolean {
    return this.data.name.substr(0, 2) === 'TI';
  }
}
