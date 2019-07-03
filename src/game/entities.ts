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
import { Vector } from 'vector2d';

const DAMAGE_SUFFIX = ['', '-Damaged', '-Destroyed'];

interface ConstructClassMap {
  [Key: string]: any;
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

  protected clearMovement(clearTarget: boolean = true): void {
    this.targetDirection = -1;
    this.targetPosition = undefined;
    this.currentPath = [];
    this.attacking = false;

    if (clearTarget) {
      this.targetEntity = undefined;
    }
  }

  public moveTo(position: Vector, report: boolean = false, force: boolean = false): boolean {
    const src = this.cell;
    const dst = position;
    const path = this.map.createPath(src, dst, force);

    this.clearMovement();
    this.currentPath = path;

    if (report && this.reportMove) {
      this.playSfx(this.reportMove);
    }

    console.log('DynamicEntity::moveTo()', { path, src, dst });

    return path.length > 0;
  }

  public attack(target: GameMapEntity, report: boolean = false) {
    const sight = this.getWeaponSight();
    const distance = target.getCell()
      .distance(this.getCell());

    const canReach = distance <= sight;
    if (canReach || this.moveTo(target.getCell(), false, true)) {
      this.attacking = false;
      this.targetEntity = target;
    }

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
    // FIXME: Streamline this shit
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

    if (this.targetDirection !== -1) {
      const speed = this.getRotationSpeed() / 6;
      this.direction = getNewDirection(this.direction, this.targetDirection, speed, this.directions);

      if (Math.round(this.direction) === this.targetDirection) {
        this.targetDirection = -1;
      }
      return;
    }

    if (this.targetEntity) {
      if (this.targetEntity.isDestroyed()) {
        this.targetEntity = undefined;
        return;
      }

      const targetCell = this.targetEntity.getCell();
      const distance = targetCell.distance(this.getCell());

      if (this.canRotate()) {
        const direction = getDirection(targetCell, this.cell, this.directions);
        if (Math.round(this.direction) !== direction) {
          this.targetDirection = direction;
          return;
        }
      }

      if (distance <= this.getWeaponSight()) {
        this.primaryWeapon!.fire(this.targetEntity);

        this.clearMovement(false);
        this.attacking = true;
        return;
      }
    }

    this.attacking = false;

    if (this.targetPosition) {
      const speed = this.getMovementSpeed() / 18;
      const direction = getDirection(this.targetPosition, this.position, this.directions);
      const angleRadians = (direction / this.directions) * 2 * Math.PI;
      const vel = new Vector(speed * Math.sin(angleRadians), speed * Math.cos(angleRadians));
      const distance = this.targetPosition.distance(this.position);

      if (distance < speed) {
        this.targetPosition = undefined;
        this.targetDirection = -1;
      } else {
        this.position.subtract(vel);
        this.cell = cellFromPoint(this.position);
        return;
      }
    } else {
      this.targetDirection = -1;
    }

    if (this.currentPath.length > 0) {
      const destination = this.currentPath.shift() as Vector;
      this.targetPosition = destination.clone().mulS(CELL_SIZE) as Vector;

      const direction = getDirection(this.targetPosition, this.position, this.directions);
      if (this.canRotate()) {
        this.targetDirection = direction;
      } else {
        this.direction = direction;
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
}

/**
 * Structure Entity
 */
export class StructureEntity extends GameMapEntity {
  protected directions: number = 8;
  public dimension: Vector = new Vector(24, 24);
  protected properties: MIXStructure = this.engine.mix.structures.get(this.data.name) as MIXStructure;
  protected animation: string = 'Idle';
  protected bibOffset: number = 0;
  protected bib?: HTMLCanvasElement;
  protected constructing: boolean = true;
  protected overlaySprite?: Sprite;
  protected overlayAnimation?: Animation;
  protected constructionSprite?: Sprite;
  protected constructionAnimation?: Animation;
  protected reportDestroy?: string = 'CRUMBLE';
  protected occupy?: MIXGrid = {
    name: '',
    grid: [['x']]
  };

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

    await this.initMake();

    if (this.map.isCreated()) {
      this.playSfx('constru2');
    } else {
      this.constructing = false;
    }

    if (this.properties!.HasBib) {
      await this.initBib();
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

  protected async initBib(): Promise<void> {
    const size = parseDimensions(this.properties!.Dimensions);
    const id = size.x > 3 ? 1 : (size.x > 2 ? 2 : 3);
    const name = `${this.data.theatre.toUpperCase()}.MIX/bib${id}.png`;

    try {
      const bib = spriteFromName(name);
      await this.engine.loadArchiveSprite(bib);

      const sizeX = bib.frames / 2;
      const sizeY = 2;

      this.bib = document.createElement('canvas');
      this.bib.width = sizeX * CELL_SIZE;
      this.bib.height = sizeY * CELL_SIZE;
      this.bibOffset = (size.y - 1) * CELL_SIZE;

      let i = 0;
      const ctx = this.bib.getContext('2d') as CanvasRenderingContext2D;
      for ( let y = 0; y < sizeY; y++ ) {
        for ( let x = 0; x < sizeX; x++ ) {
          bib.render(new Vector(0, i), new Vector(x * CELL_SIZE, y * CELL_SIZE), ctx);
          i++;
        }
      }

    } catch (e) {
      console.error('StructureEntity::initBib()', e);
    }
  }

  public sell(): void {
    this.reportDestroy = undefined;

    this.map.scene.player.addCredits(
      this.properties.Cost / 2
    );

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

    this.updateWall();

    if (instance) {
      instance.onUpdate();
      this.frame = instance.getFrameIndex(this.frameOffset);
    } else {
      // FIXME
      this.frame = this.frameOffset;
    }

    this.animation = 'Idle' + DAMAGE_SUFFIX[this.getDamageState()];
  }

  public onRender(deltaTime: number): void {
    const sprite = this.constructing ? this.constructionSprite : this.sprite;
    const context = this.map.structures.getContext();

    this.renderSprite(deltaTime, context, sprite);

    if (this.bib) {
      this.map.terrain.getContext().drawImage(this.bib, this.position.x, this.position.y + this.bibOffset);
    }

    super.onRender(deltaTime);

    if (this.overlaySprite && !this.constructing) {
      this.renderSprite(deltaTime, this.map.overlay.getContext(), this.overlaySprite, new Vector(0, 0));// FIXME
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
    return this.isPlayer(); // FIXME Check health
  }

  public isSelectable(): boolean {
    return this.properties!.Selectable;
  }
}

/**
 * Unit Entity
 */
export class UnitEntity extends DynamicEntity {
  public dimension: Vector = new Vector(16, 16);
  protected wakeSprite?: Sprite;
  protected wakeAnimation?: Animation;
  protected properties: MIXUnit = this.engine.mix.units.get(this.data.name) as MIXUnit;

  public async init(): Promise<void> {
    await super.init();

    if (this.sprite) {
      this.dimension = this.sprite.size.clone() as Vector;
    }

    if (this.data.name === 'BOAT') { // FIXME
      this.wakeSprite = spriteFromName('CONQUER.MIX/wake.png');

      const half = this.wakeSprite.frames / 2;
      this.wakeAnimation = new Animation('Idle', new Vector(0, 0), half, 0.2);

      await this.engine.loadArchiveSprite(this.wakeSprite);
    }
  }

  public deploy(): void {
    if (this.isDeployable()) {
      this.destroy();

      const building = new StructureEntity({
        name: 'FACT',
        player: this.data.player,
        cell: this.cell,
        theatre: this.data.theatre
      },  this.engine, this.map);

      this.map.addEntity(building);
    }
  }

  public die(): boolean {
    // TODO: Crowded unit should spawn a low-health infantry
    if (super.die()) {
      const name = this.properties!.DeathAnimation;
      const effect = new EffectEntity({
        name,
        cell: this.cell.clone() as Vector,
        theatre: this.data.theatre
      }, this.engine, this.map);

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
    const context = this.map.units.getContext();
    super.onRender(deltaTime);

    if (!this.sprite) {
      return;
    }

    const position = this.getTruncatedPosition();

    if (this.wakeSprite) {
      const o = new Vector(0, this.direction === 8 ? this.wakeSprite.frames / 2 : 0);
      const f = this.wakeAnimation!.getFrameIndex(o);
      const p = position.clone().add(new Vector(
        -this.dimension.x / 2,
        this.dimension.y / 2
      )) as Vector;

      this.wakeSprite.render(f, p, context);
    }

    const frame = new Vector(this.frameOffset.x, Math.round(this.direction));
    this.sprite.render(frame, position, context);
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
}

/**
 * Infantry Entity
 */
export class InfantryEntity extends DynamicEntity {
  public dimension: Vector = new Vector(16, 16);
  protected directions: number = 8;
  protected properties: MIXInfantry = this.engine.mix.infantry.get(this.data.name) as MIXInfantry;
  protected animation: string = 'Ready';
  protected idleTimer: number = 100;
  protected idleAnimation: string = 'Ready';
  protected reportDestroy?: string = 'nuyell1'; // FIXME: Should be handled by projectile

  public async init(): Promise<void> {
    const dx = (CELL_SIZE - this.dimension.x) / 2;
    const dy = (CELL_SIZE - this.dimension.y) / 2;

    const subcells = [
      new Vector(-dx, -dy),
      new Vector(dx, -dy),
      new Vector(-dx, dy),
      new Vector(dx, dy)
    ];

    if (this.data!.subcell! > 0) {
      this.position.add(subcells[this.data!.subcell! - 1]);
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
      this.clearMovement();

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
    const context = this.map.infantry.getContext();
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
 * Terrain Entity
 */
export class TerrainEntity extends GameMapEntity {
  public dimension: Vector = new Vector(16, 16);
  protected properties: MIXTerrain = this.engine.mix.terrain.get(this.data.name) as MIXTerrain;
  protected occupy?: MIXGrid = {
    name: '',
    grid: [['x']]
  };

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

  public getColor(): string {
    return '#002200';
  }
}

/**
 * Overlay Entity
 */
export class OverlayEntity extends GameMapEntity {
  protected occupy: MIXGrid = this.data.name.substr(0, 2) !== 'TI'
    ? { name: '', grid: [['x']] }
    : { name: '', grid: [] };

  public onRender(deltaTime: number): void {
    const context = this.map.overlay.getContext();
    this.renderSprite(deltaTime, context);
  }

  public getColor(): string {
    return this.data.name.substr(0, 2) === 'TI' ? '#004400' : '#ffffff';
  }
}

export class EffectEntity extends GameMapEntity {
  protected centerEntity?: Entity;

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
      this.offset = new Vector(this.sprite.size.x / 2, this.sprite.size.y / 2);

      if (this.centerEntity) {
        const dimension = this.centerEntity.dimension;
        this.offset.subtract(new Vector(dimension.x / 2, dimension.y / 2));
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
