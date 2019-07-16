/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Animation, Sprite } from '../../engine';
import { Player } from '../player';
import { GameMap } from '../map';
import { cellFromPoint, getDirection, getNewDirection, CELL_SIZE } from '../physics';
import { MIXGrid, MIXMapEntityData, MIXObject, wallNames, healthBarColors } from '../mix';
import { spriteFromName } from '../sprites';
import { Weapon } from '../weapons';
import { GameEntity } from '../entity';
import { Vector } from 'vector2d';

const HEALT_BAR_HEIGHT = 6;
const SPEED_DIVIDER = 20;
const TURNSPEED_DIVIDER = 8;

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

/**
 * Map Entity
 */
export abstract class GameMapEntity extends GameEntity {
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
  protected reportLoss?: boolean;
  protected reportSelect?: string;
  protected reportMove?: string;
  protected reportAttack?: string;
  protected reportConstruct?: string;
  protected reportDestroy?: string;
  protected targetDirection: number = -1;
  protected targetPosition?: Vector;
  protected targetEntity?: GameMapEntity;
  protected currentPath: Vector[] = [];
  protected primaryWeapon?: Weapon;
  protected secondaryWeapon?: Weapon;
  protected attacking: boolean = false;

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
    return `${this.data.player}:${this.data.name} ${this.health}/${this.hitPoints}H@${s} ${this.getTruncatedPosition().toString()}@${this.cell.toString()}x${this.direction.toFixed(1)} (t:${this.turretDirection.toFixed(1)}) | ${this.animation || '<null>'}@${this.frame.toString()} ${this.zIndex}z`;
  }

  public toJson(): any {
    return {
      ...this.data,
      ...super.toJson(),
      health: this.health,
      direction: this.direction
    };
  }

  public async init(): Promise<void> {
    if (this.properties) {
      this.hitPoints = this.properties.HitPoints;
      if (this.data.health) {
        this.health = Math.min(this.hitPoints, this.health);
      } else {
        this.health = this.hitPoints;
      }

      if (this.properties.PrimaryWeapon) {
        this.primaryWeapon = new Weapon(this.properties.PrimaryWeapon, this.map, this);
        try {
          await this.primaryWeapon.init();
        } catch (e) {
          console.warn('PrimaryWeapon exception', e);
        }
      }

      if (this.properties.SecondaryWeapon) {
        this.secondaryWeapon = new Weapon(this.properties.SecondaryWeapon, this.map, this);
        try {
          await this.secondaryWeapon.init();
        } catch (e) {
          console.warn('SecondaryWeapon exception', e);
        }
      }
    }

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

    if (!this.dying) {
      this.tick(deltaTime);
    }
  }

  protected tick(deltaTime: number): void {
    if (this.primaryWeapon) {
      this.primaryWeapon.onUpdate(deltaTime);
    }

    if (this.secondaryWeapon) {
      this.secondaryWeapon.onUpdate(deltaTime);
    }

    if (this.targetEntity) {
      if (this.targetEntity.isDestroyed()) {
        this.targetEntity = undefined;
      }
    }

    const rotationSpeed = this.getRotationSpeed() / TURNSPEED_DIVIDER;

    this.attacking = false;

    if (this.targetEntity) {
      const targetCell = this.targetEntity.getCell();
      const direction = getDirection(targetCell, this.cell, this.directions);
      const turretDirection = getDirection(targetCell, this.cell, this.turretDirections);
      const distance = Math.floor(targetCell.distance(this.cell)); // FIXME: Rounding off makes this less accurate

      const turretReached = Math.round(this.turretDirection) === turretDirection;
      const rotateTurret = this.properties!.HasTurret && !this.properties!.NoTurretLock;
      if (rotateTurret && !turretReached) {
        this.turretDirection = getNewDirection(this.turretDirection, turretDirection, rotationSpeed * 4, this.turretDirections);
      } else if (distance <= this.getWeaponSight()) {
        if (!this.canRotate()) {
          this.direction = direction;
        }

        if (!rotateTurret) {
          this.turretDirection = turretDirection;
        }

        this.targetPosition = undefined;
        this.attacking = true;
        this.currentPath = [];
      } else if (this.currentPath.length === 0) {
        this.moveTo(targetCell, false, true);
      }
    }

    if (this.attacking) {
      this.primaryWeapon!.fire(this.targetEntity!);
    } else if (this.targetDirection !== -1) {
      this.direction = getNewDirection(this.direction, this.targetDirection, rotationSpeed, this.directions);

      if (Math.round(this.direction) === this.targetDirection) {
        this.targetDirection = -1;
      }
    } else if (this.targetPosition) {
      const vel = this.getMovementVelocity();
      if (vel) {
        this.position.subtract(vel);
        this.cell = cellFromPoint(this.position);
      } else {
        this.targetPosition = undefined;
        this.targetDirection = -1;
      }
    } else {
      if (this.currentPath.length > 0) {
        const destination = this.currentPath.shift() as Vector;
        this.targetPosition = destination.clone().mulS(CELL_SIZE) as Vector;

        const direction = getDirection(this.targetPosition, this.position, this.directions);
        if (this.canRotate()) {
          this.targetDirection = direction;
        } else {
          this.direction = direction;
          this.targetDirection = -1;
        }
      } else {
        this.targetDirection = -1;
      }
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

    if (this.reportLoss) {
      if (this.isPlayer()) {
        this.engine.playArchiveSfx('SPEECH.MIX/unitlost.wav', 'gui', { block: true });
      }
    }

    if (this.reportDestroy) {
      this.playSfx(this.reportDestroy);
    }

    if (destroy) {
      this.destroy();
    }

    return true;
  }

  public attack(target: GameMapEntity, report: boolean = false) {
    this.targetEntity = target;

    if (report && this.reportAttack) {
      this.playSfx(this.reportAttack);
    }
  }

  public move(position: Vector, report: boolean = false): void {
    this.targetEntity = undefined;
    this.moveTo(position, report);
  }

  protected moveTo(position: Vector, report: boolean = false, force: boolean = false): boolean {
    const src = this.cell;
    const dst = position;
    const path = this.map.createPath(src, dst, force);

    this.targetDirection = -1;
    this.targetPosition = undefined;
    this.currentPath = path;
    this.attacking = false;

    if (report && this.reportMove) {
      this.playSfx(this.reportMove);
    }

    console.log('GameMapEntity::moveTo()', { path, src, dst }, this);

    return path.length > 0;
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

  public isMoving(): boolean {
    return !!this.targetPosition || this.targetDirection !== -1;
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
    const finder = (e: GameMapEntity): boolean => e.getName() === this.data.name;
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

  public getMovementSpeed(): number {
    return this.properties!.Speed as number;
  }

  public getWeaponSight(): number {
    if (this.primaryWeapon || this.secondaryWeapon) {
      return ((this.primaryWeapon || this.secondaryWeapon) as Weapon).weapon.Range;
    }

    return this.getSight();
  }

  public getSight(): number {
    return this.properties!.Sight as number;
  }

  public getMovementVelocity(): Vector | undefined {
    const speed = this.getMovementSpeed() / SPEED_DIVIDER;
    const direction = getDirection(this.targetPosition!, this.position, this.directions);
    const angleRadians = (direction / this.directions) * 2 * Math.PI;
    const vel = new Vector(speed * Math.sin(angleRadians), speed * Math.cos(angleRadians));
    const distance = this.targetPosition!.distance(this.position);

    return distance > speed ? vel : undefined;
  }

  public canReveal(): boolean {
    // FIXME: Neutral ?
    return this.isPlayer();
  }

  public canAttack(): boolean {
    return !!this.primaryWeapon || !!this.secondaryWeapon;
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



