/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Box, Animation, Sprite, Entity, randomBetweenInteger }  from '../engine';
import { GameMapEntity, GameMapEntityAnimation } from './entity';
import {
  MIXGrid,
  MIXAnimation,
  MIXTerrain,
  MIXUnit,
  MIXInfantry,
  MIXStructure,
  MIXInfantryAnimation,
  MIXStructureAnimation,
  infantryIdleAnimations
} from './mix';
import { cellFromPoint, getDirection, CELL_SIZE, getNewDirection } from './physics';
import { spriteFromName } from './sprites';
import { parseDimensions } from './mix';
import { Weapon } from './weapons';
import { GameEngine } from './game';
import { Vector } from 'vector2d';

const DAMAGE_SUFFIX = ['', '-Damaged', '-Destroyed'];
const SPEED_DIVIDER = 20;
const TURNSPEED_DIVIDER = 8;

/**
 * Bib underlay entity
 */
export class BibEntity extends Entity {
  protected static cache: Map<string, BibEntity> = new Map();
  private size: Vector;
  private offset: number;
  private sprite: Sprite;
  private engine: GameEngine;

  public constructor(size: Vector, theatre: string, engine: GameEngine) {
    super();

    const id = size.x > 3 ? 1 : (size.x > 2 ? 2 : 3);
    const name = `${theatre.toUpperCase()}.MIX/bib${id}.png`;
    const sprite = spriteFromName(name);
    const sizeX = sprite.frames / 2;
    const sizeY = 2;

    this.engine = engine;
    this.sprite = sprite;
    this.offset = (size.y - 1) * CELL_SIZE;
    this.size = new Vector(sizeX, sizeY);
    this.setDimension(new Vector(
      sizeX * CELL_SIZE,
      sizeY * CELL_SIZE
    ));
  }

  public async init(): Promise<void> {
    try {
      await this.engine.loadArchiveSprite(this.sprite);

      let i = 0;
      for ( let y = 0; y < this.size.y; y++ ) {
        for ( let x = 0; x < this.size.x; x++ ) {
          this.sprite.render(new Vector(0, i), new Vector(x * CELL_SIZE, y * CELL_SIZE), this.context);
          i++;
        }
      }

    } catch (e) {
      console.error('BibEntity::init()', e);
    }
  }

  public static async createOrCache(engine: GameEngine, size: Vector, theatre: string): Promise<BibEntity> {
    const key = size.toString() + theatre;
    if (!this.cache.has(key)) {
      const bib = new BibEntity(size, theatre, engine);
      await bib.init();

      this.cache.set(key, bib);
    }

    return this.cache.get(key) as BibEntity;
  }

  public getOffset(): number {
    return this.offset;
  }
}

/**
 * Dynamic entity
 */
export class DynamicEntity extends GameMapEntity {
  protected targetDirection: number = -1;
  protected targetPosition?: Vector;
  protected targetEntity?: GameMapEntity;
  protected currentPath: Vector[] = [];
  protected primaryWeapon?: Weapon;
  protected secondaryWeapon?: Weapon;
  protected attacking: boolean = false;
  protected reportSelect?: string = 'AWAIT1';
  protected reportMove?: string = 'ACKNO';
  protected reportAttack?: string = 'ACKNO';

  public die(destroy: boolean = true): boolean {
    if (super.die(destroy)) {
      if (this.isPlayer()) {
        this.engine.playArchiveSfx('SPEECH.MIX/unitlost.wav', 'gui', { block: true });
      }

      return true;
    }

    return false;
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

    console.log('DynamicEntity::moveTo()', { path, src, dst }, this);

    return path.length > 0;
  }

  public move(position: Vector, report: boolean = false): void {
    this.targetEntity = undefined;
    this.moveTo(position, report);
  }

  public attack(target: GameMapEntity, report: boolean = false) {
    this.targetEntity = target;

    if (report && this.reportAttack) {
      this.playSfx(this.reportAttack);
    }
  }

  public async init(): Promise<void> {
    await super.init();

    this.hitPoints = this.properties!.HitPoints;
    if (this.data.health) {
      this.health = Math.min(this.hitPoints, this.health);
    } else {
      this.health = this.hitPoints;
    }

    if (this.properties!.PrimaryWeapon) {
      this.primaryWeapon = new Weapon(this.properties!.PrimaryWeapon, this.map, this);
      try {
        await this.primaryWeapon.init();
      } catch (e) {
        console.warn('PrimaryWeapon exception', e);
      }
    }

    if (this.properties!.SecondaryWeapon) {
      this.secondaryWeapon = new Weapon(this.properties!.SecondaryWeapon, this.map, this);
      try {
        await this.secondaryWeapon.init();
      } catch (e) {
        console.warn('SecondaryWeapon exception', e);
      }
    }
  }

  public onRender(deltaTime: number) {
    super.onRender(deltaTime);
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    if (this.dying) {
      return;
    }

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
    const rotateTurret = this.properties!.HasTurret && !this.properties!.NoTurretLock;

    this.attacking = false;

    if (this.targetEntity) {
      const targetCell = this.targetEntity.getCell();
      const direction = getDirection(targetCell, this.cell, this.directions);
      const turretDirection = getDirection(targetCell, this.cell, this.turretDirections);
      const distance = Math.floor(targetCell.distance(this.cell)); // FIXME: Rounding off makes this less accurate

      const turretReached = Math.round(this.turretDirection) === turretDirection;
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
        this.moveTo(targetCell);
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

  public isMovable(): boolean {
    return true;
  }

  public isMoving(): boolean {
    return !!this.targetPosition || this.targetDirection !== -1;
  }

  public canAttack(): boolean {
    return !!this.primaryWeapon || !!this.secondaryWeapon;
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
}

/**
 * Structure Entity
 */
export class StructureEntity extends GameMapEntity {
  public readonly properties: MIXStructure = this.engine.mix.structures.get(this.data.name) as MIXStructure;
  protected zIndex: number = 1;
  protected directions: number = 8;
  protected dimension: Vector = new Vector(24, 24);
  protected animation: string = 'Idle';
  protected bibOffset: number = 0;
  protected bib?: BibEntity;
  protected constructing: boolean = true;
  protected repairSprite?: Sprite;
  protected repairAnimation?: Animation;
  protected overlaySprite?: Sprite;
  protected overlayAnimation?: Animation;
  protected constructionSprite?: Sprite;
  protected constructionAnimation?: Animation;
  protected reportDestroy?: string = 'CRUMBLE';
  protected occupy?: MIXGrid = {
    name: '',
    grid: [['x']]
  };

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'structure'
    }
  }

  public async init(): Promise<void> {
    await super.init();

    const size = parseDimensions(this.properties!.Dimensions);
    this.dimension = size.mulS(CELL_SIZE);

    const name = `${this.data.name}_Idle`;
    const anim = this.engine.mix.structureAnimations.get(name) as MIXStructureAnimation;
    if (anim) {
      // FIXME
      const damageOffset = anim.StartFrame + anim.Frames;
      this.animations.set('Idle', new GameMapEntityAnimation(name, new Vector(0, anim.StartFrame), anim.Frames, 0.1, 0));
      this.animations.set('Idle-Damaged', new GameMapEntityAnimation(name, new Vector(0, anim.StartFrame + damageOffset), anim.Frames, 0.1, 0));
      this.animations.set('Idle-Destroyed', new GameMapEntityAnimation(name, new Vector(0, anim.StartFrame + (damageOffset * 2)), 1, 0.1, 0));
    }

    if (this.data.name === 'WEAP') {
      this.overlaySprite = spriteFromName(`CONQUER.MIX/weap2.png`);
      this.overlayAnimation = new Animation('Idle', new Vector(0, 0), this.overlaySprite.frames, 0.1, false);
      this.overlap = undefined;
      await this.engine.loadArchiveSprite(this.overlaySprite);
    }

    this.repairSprite = spriteFromName('CONQUER.MIX/select.png');
    await this.engine.loadArchiveSprite(this.repairSprite);
    this.repairAnimation = new Animation('repair-animation', new Vector(0, 2), 2, 0.05);

    if (!this.isCivilian()) {
      await this.initMake();
    }

    if (this.map.isCreated()) {
      this.playSfx('constru2');
    } else {
      this.constructing = false;
    }

    if (this.properties!.HasBib) {
      const size = parseDimensions(this.properties!.Dimensions);
      this.bib = await BibEntity.createOrCache(this.engine, size, this.map.theatre);
    }

    this.hitPoints = this.properties!.HitPoints;
    if (!this.data.health) {
      this.health = this.hitPoints;
    }
  }

  protected async initMake(): Promise<void> {
    const spriteName = `CONQUER.MIX/${this.data.name.toLowerCase()}make.png`;
    const sprite = spriteFromName(spriteName);

    if (sprite.frames > 0) {
      try {
        await this.engine.loadArchiveSprite(sprite);

        this.constructionSprite = sprite;
        this.constructionAnimation = new Animation(this.data.name + 'MAKE', new Vector(0, 0), sprite.frames, 0.5);
        this.constructionAnimation.once('done', () => {
          this.constructing = false;
        });
      } catch (e) {
        console.error('StructureEntity::initConstruct()', e);
      }
    }
  }

  public repair(): void {
    if (this.isRepairable()) {
      this.repairing = !this.repairing;
    }
  }

  public sell(): void {
    this.reportDestroy = undefined;

    if (this.isPlayer()) {
      this.player!.addCredits(
        this.properties.Cost / 2
      );
    }

    if (this.constructionAnimation) {
      this.constructing = true;
      this.constructionAnimation.reset();
      this.constructionAnimation.setReversed(true);
      this.constructionAnimation.once('done', () => {
        this.constructing = false;
        this.destroy();
      });
    } else {
      this.destroy();
    }

    this.engine.playArchiveSfx('SOUNDS.MIX/cashturn.wav', 'gui');
  }

  public onUpdate(deltaTime: number): void {
    const animation = this.animations.get(this.animation);
    const instance = this.constructing ? this.constructionAnimation : animation;

    if (instance) {
      instance.onUpdate();
      this.frame = instance.getFrameIndex(this.frameOffset);
    } else {
      // FIXME
      this.frame = this.frameOffset;
    }

    if (this.repairing) {
      this.repairAnimation!.onUpdate();

      // TODO: Sound
      // TODO: Check credits
      // TODO: Report credit drain
      this.health += 1;
      if (this.health >= this.hitPoints) {
        this.repairing = false;
      }
    }

    this.animation = 'Idle' + DAMAGE_SUFFIX[this.getDamageState()];
  }

  public onRender(deltaTime: number): void {
    const sprite = this.constructing ? this.constructionSprite : this.sprite;
    const context = this.map.objects.getContext();

    this.renderSprite(deltaTime, context, sprite);

    if (this.bib) {
      this.map.terrain.getContext().drawImage(this.bib.getCanvas(), this.position.x, this.position.y + this.bib.getOffset());
    }

    super.onRender(deltaTime);

    if (this.overlaySprite && !this.constructing) {
      this.renderSprite(deltaTime, this.map.overlay.getContext(), this.overlaySprite, new Vector(0, 0));// FIXME
    }

    if (this.repairing) {
      const f = this.repairAnimation!.getFrameIndex();
      const s = this.repairSprite!;
      const x = this.position.x + ((this.dimension.x / 2) - (s.size.x / 2));
      const y = this.position.y + ((this.dimension.y / 2) - (s.size.y / 2));
      s.render(f, new Vector(x, y), this.map.overlay.getContext());
    }
  }

  public getPowerProduction(): number {
    return this.properties.PowerProduction;
  }

  public getPowerDrain(): number {
    return this.properties.PowerDrain;
  }

  public getRenderBox(): Box {
    const box = this.getBox();
    if (this.bib) {
      box.y2 += CELL_SIZE;
    }

    return box;
  }

  public isSellable(): boolean {
    return this.isPlayer();
  }

  public isRepairable(): boolean {
    return this.isPlayer() && (this.health < this.hitPoints);
  }

  public isSelectable(): boolean {
    return this.properties!.Selectable;
  }
}

/**
 * Unit Entity
 */
export class UnitEntity extends DynamicEntity {
  public readonly properties: MIXUnit = this.engine.mix.units.get(this.data.name) as MIXUnit;
  protected dimension: Vector = new Vector(24, 24);
  protected wakeSprite?: Sprite;
  protected wakeAnimation?: Animation;
  protected zIndex: number = 3;

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'unit'
    }
  }

  public async init(): Promise<void> {
    await super.init();

    if (!this.sprite) {
      return;
    }

    if (this.data.name === 'BOAT') { // FIXME
      // FIXME
      this.dimension = this.sprite.size.clone() as Vector;
      this.directions = 2;
      this.direction = this.direction > 16 ? 1 : 0;

      this.wakeSprite = spriteFromName('CONQUER.MIX/wake.png');

      const half = this.wakeSprite.frames / 2;
      this.wakeAnimation = new Animation('Idle', new Vector(0, 0), half, 0.2);

      await this.engine.loadArchiveSprite(this.wakeSprite);
    } else {
      if (this.sprite.size.x > CELL_SIZE) {
        this.offset.setX((this.sprite.size.x / 2) - (CELL_SIZE / 2));
      }
      if (this.sprite.size.y > CELL_SIZE) {
        this.offset.setY((this.sprite.size.y / 2) - (CELL_SIZE / 2));
      }
    }
  }

  public deploy(): void {
    if (this.isDeployable()) {
      this.destroy();

      const building = new StructureEntity({
        name: 'FACT',
        player: this.data.player,
        cell: this.cell
      },  this.map);

      this.map.addEntity(building);
    }
  }

  public die(): boolean {
    // TODO: Crowded unit should spawn a low-health infantry
    if (super.die()) {
      const name = this.properties!.DeathAnimation;
      const effect = new EffectEntity({
        name,
        cell: this.cell.clone() as Vector
      }, this.map);

      effect.setCenterEntity(this);
      this.map.addEntity(effect);

      this.destroy();

      return true;
    }

    return false;
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    if (this.wakeAnimation) {
      this.wakeAnimation.onUpdate();
    }
  }

  public onRender(deltaTime: number): void {
    super.onRender(deltaTime);

    if (!this.sprite) {
      return;
    }

    const context = this.map.objects.getContext();
    const position = this.getTruncatedPosition(this.offset);

    if (this.wakeSprite) {
      const o = new Vector(0, this.direction === 0 ? this.wakeSprite.frames / 2 : 0);
      const f = this.wakeAnimation!.getFrameIndex(o);
      const p = position.clone().add(new Vector(
        -this.dimension.x / 2,
        this.dimension.y / 2
      )) as Vector;

      this.wakeSprite.render(f, p, context);
    }

    if (this.data.name === 'BOAT') {
      const spriteOffset = (this.sprite.frames / 2) * this.direction;
      const turretOffset = Math.round(this.turretDirection);
      const frame = new Vector(this.frameOffset.x, spriteOffset + turretOffset);
      this.sprite.render(frame, position, context);
    } else {
      const frame = new Vector(this.frameOffset.x, Math.round(this.direction));
      this.sprite.render(frame, position, context);

      if (this.properties.HasTurret) {
        const turretFrame = new Vector(
          this.frameOffset.x,
          Math.round(this.turretDirection) + this.sprite.frames / 2
        );
        this.sprite.render(turretFrame, position, context);
      }
    }
  }

  public getRotationSpeed(): number {
    return this.properties!.TurnSpeed;
  }

  public canRotate(): boolean {
    return !this.properties!.CantTurn;
  }

  public isDeployable(): boolean {
    return this.isPlayer() && this.data.name === 'MCV';
  }

  public isSelectable(): boolean {
    return true;
  }

  public isMovable(): boolean {
    return this.data.name !== 'BOAT'; // FIXME
  }
}

/**
 * Infantry Entity
 */
export class InfantryEntity extends DynamicEntity {
  public readonly properties: MIXInfantry = this.engine.mix.infantry.get(this.data.name) as MIXInfantry;
  protected dimension: Vector = new Vector(16, 16);
  protected directions: number = 8;
  protected animation: string = 'Ready';
  protected idleTimer: number = 100;
  protected idleAnimation: string = 'Ready';
  protected reportDestroy?: string = 'nuyell1'; // FIXME: Should be handled by projectile
  protected zIndex: number = 2;

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'infantry'
    }
  }

  public async init(): Promise<void> {
    const dx = (CELL_SIZE - this.dimension.x) / 2;
    const dy = (CELL_SIZE - this.dimension.y) / 2;

    const subcells = [
      new Vector(-dx, -dy),
      new Vector(dx, -dy),
      new Vector(-dx, dy),
      new Vector(dx, dy)
    ];

    // TODO: Guy
    if (this.data.name === 'C10') {
      // FIXME: More sounds
      this.reportSelect = 'MCOMND1';
      this.reportMove = 'MCOURSE1';
      this.reportAttack = this.reportMove;
    } else if (this.properties.IsCivilian) {
      this.reportSelect = 'GUYYEAH1';
      this.reportMove = 'GUYOKAY1';
      this.reportAttack = this.reportMove;
    } if (this.properties.FemaleCiv) {
      this.reportSelect = 'GIRLYEAH';
      this.reportMove = 'GIRLOKAY';
      this.reportAttack = this.reportMove;
    }

    const subcell = this.data!.subcell!;
    if (subcell >= 0) {
      const center = this.getDimension();
      center.subtract(new Vector(CELL_SIZE / 2, CELL_SIZE / 2));
      this.position.add(center);

      if (subcell !== 0) {
        const row = Math.floor((subcell - 1) / 2);
        const col = (subcell - 1) % 2;

        const dx = this.dimension.x / 2;
        const dy = this.dimension.y / 2;

        const v = new Vector(
          ((col + 1) %  2) === 1 ? -dx : dx,
          (row + 1) < 2 ? -dy : dy
        );

        this.position.add(v);
      }
    }

    const animations = this.engine.mix.infantryAnimations.get(`Sequence_${this.data.name}`) as MIXInfantryAnimation;
    Object.keys(animations)
      .forEach((name: string): void => {
        const [start, number, multiplier] = (animations as any)[name];
        const anim = new GameMapEntityAnimation(name, new Vector(0, start), number, 0.1, multiplier);
        this.animations.set(name, anim);
      });

    await super.init();
  }

  public die(): boolean {
    if (super.die(false)) {
      this.targetDirection = -1;
      this.targetPosition = undefined;
      this.currentPath = [];
      this.attacking = false;
      this.targetEntity = undefined;

      // FIXME
      const animation = this.animations.get('Die1') as Animation;
      animation.once('done', () => this.destroy());

      return true;
    }

    return false;
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    let animation = this.attacking
      ? 'FireUp'
      : this.dying ? 'Die1' :
        this.targetPosition ? 'Walk' : this.idleAnimation;

    if (this.animation !== animation) {
      const a = this.animations.get(animation) as Animation;
      a.reset();

      if (animation === this.idleAnimation) {
        a.once('done', () => (this.idleAnimation = 'Ready'));
      }
    }

    if (animation === this.idleAnimation) {
      this.idleTimer--;

      if (this.idleTimer < 0) {
        this.idleAnimation = infantryIdleAnimations[randomBetweenInteger(0, infantryIdleAnimations.length - 1)];
        this.idleTimer = randomBetweenInteger(200, 1000);
      }
    }

    this.animation = animation;
  }

  public onRender(deltaTime: number): void {
    const context = this.map.objects.getContext();
    super.onRender(deltaTime);

    if (!this.sprite) {
      return;
    }

    const position = this.getTruncatedPosition();
    const animation = this.animations.get(this.animation) as GameMapEntityAnimation;
    const frame = animation.getFrameIndex(this.frameOffset);
    const off = Math.round(this.direction) * animation.multiplier;

    frame.add(new Vector(0, off));
    this.sprite!.render(frame, position, context);
  }

  public isSelectable(): boolean {
    return true;
  }
}

/**
 * Smudge Entity
 */
export class SmudgeEntity extends GameMapEntity {
  protected zIndex: number = -1;

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'smudge'
    }
  }

  public async init(): Promise<void> {
    await super.init();

    if (this.sprite) {
      this.setDimension(this.sprite.size);
    }
  }

  public onRender(deltaTime: number): void {
    const context = this.map.terrain.getContext();
    this.renderSprite(deltaTime, context);
  }

  public getSpriteName(): string {
    return `${this.map.theatre.toUpperCase()}.MIX/${this.data.name.toLowerCase()}.png`;
  }

  public getColor(): string {
    return '#002200';
  }
}

/**
 * Terrain Entity
 */
export class TerrainEntity extends GameMapEntity {
  public readonly properties: MIXTerrain = this.engine.mix.terrain.get(this.data.name) as MIXTerrain;
  protected zIndex: number = this.isTiberiumTree() ? 5 : 2;
  protected dimension: Vector = new Vector(16, 16);
  protected occupy?: MIXGrid = {
    name: '',
    grid: [['x']]
  };

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'terrain'
    }
  }

  public async init(): Promise<void> {
    await super.init();

    if (this.sprite) {
      this.setDimension(this.sprite.size);
    }
  }

  public onRender(deltaTime: number): void {
    const context = this.map.objects.getContext();
    this.renderSprite(deltaTime, context);
    super.onRender(deltaTime);
  }

  public getColor(): string {
    return '#002200';
  }

  private isTiberiumTree(): boolean {
    return this.data.name.substr(0, 5) === 'SPLIT';
  }
}

/**
 * Overlay Entity
 */
export class OverlayEntity extends GameMapEntity {
  protected tiberiumLeft = 11;
  protected zIndex: number = 4;
  protected occupy: MIXGrid = this.isTiberium()
    ? { name: '', grid: [] }
    : { name: '', grid: [['x']] };

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'overlay'
    }
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);

    if (this.isTiberium()) {
      this.frameOffset.setY(this.tiberiumLeft);
    }
  }

  public onRender(deltaTime: number): void {
    const context = this.map.overlay.getContext();
    this.renderSprite(deltaTime, context);
    super.onRender(deltaTime);
  }

  public getColor(): string {
    return this.isTiberium() ? '#004400' : '#ffffff';
  }
}

export class EffectEntity extends GameMapEntity {
  protected zIndex: number = 10;
  protected centerEntity?: Entity;

  public toJson(): any {
    return {
      ...super.toJson(),
      type: 'effect'
    }
  }

  public async init(): Promise<void> {
    await super.init();

    const name = this.data.name;
    const manim = this.engine.mix.animations.get(name) as MIXAnimation;
    if (manim.Report) {
      this.playSfx(manim.Report.toLowerCase());
    }

    if (this.sprite) {
      const start = manim.FirstFrame;
      const length = manim.Frames === -1 ? this.sprite.frames : manim.Frames;
      const anim = new GameMapEntityAnimation(name, new Vector(0, start), length, 0.1);
      anim.on('done', () => this.destroy());
      this.animation = name;

      this.dimension = this.sprite.size.clone() as Vector;
      if (['IONSFX'].indexOf(this.data.name) !== -1) {
        this.offset = new Vector(this.sprite.size.x / 2, this.sprite.size.y);
      } else {
        this.offset = new Vector(this.sprite.size.x / 2, this.sprite.size.y / 2);
      }

      if (['IONSFX', 'ATOMSFX'].indexOf(this.data.name) !== -1) {
        this.offset.subtract(new Vector(
          CELL_SIZE / 2,
          CELL_SIZE / 2
        ));
      }

      if (this.centerEntity) {
        const dimension = this.centerEntity.getDimension().divS(2);
        this.offset.subtract(dimension);
      }

      this.animations.set(name, anim);
    }
  }

  public onUpdate(deltaTime: number): void {
    const anim = this.animations.get(this.animation);
    if (anim) {
      anim.onUpdate();
      this.frame = anim.getFrameIndex();
    }
    super.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number): void {
    const context = this.map.overlay.getContext();
    this.renderSprite(deltaTime, context);
    super.onRender(deltaTime);
  }

  public setCenterEntity(entity?: Entity) {
    this.centerEntity = entity;
  }

  public getSpriteName(): string {
    const manim = this.engine.mix.animations.get(this.data.name) as MIXAnimation;
    const name = manim.Graphic || this.data.name;
    return `CONQUER.MIX/${name.toLowerCase()}.png`;
  }
}
