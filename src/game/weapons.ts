/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Sprite, randomBetweenInteger }  from '../engine';
import { GameMap } from './map';
import { GameMapBaseEntity, GameMapEntity } from './entity';
import { MIXWeapon, MIXBullet, MIXWarhead } from './mix';
import { cellFromPoint, getDirection } from './physics';
import { spriteFromName } from './sprites';
import { EffectEntity } from './entities';
import { Vector } from 'vector2d';

export class ProjectileEntity extends GameMapBaseEntity {
  protected readonly bulletName: string;
  protected readonly bullet: MIXBullet;
  protected readonly warhead: MIXWarhead;
  protected readonly target: GameMapEntity;
  protected readonly weapon: Weapon;
  protected direction: number = 0;
  protected trailTick: number = 0;

  public constructor(name: string, target: GameMapEntity, weapon: Weapon) {
    super(weapon.map.engine, weapon.map);

    this.target = target;
    this.weapon = weapon;
    this.bulletName = name;
    this.bullet = weapon.map.engine.mix.bullets.get(name) as MIXBullet;
    this.warhead = weapon.map.engine.mix.warheads.get(this.bullet.Warhead) as MIXWarhead;
    this.dimension = weapon.sprite.size.clone() as Vector;
    this.position = weapon.entity.getPosition();
    this.cell = cellFromPoint(this.position);
  }

  public destroy() {
    if (this.destroyed) {
      return;
    }

    super.destroy();

    const map = this.weapon.map;
    if (this.bullet.Explosion) {
      const e = new EffectEntity({
        name: this.bullet.Explosion,
        cell: this.target.getCell(),
        theatre: this.weapon.map.theatre
      }, map.engine, map);

      e.setCenterEntity(this.target);
      map.addEntity(e);
    }

    this.weapon.map.removeEntity(this);
  }

  private createTrail(): void {
    if (this.weapon.trailSprite && !this.destroyed) {
      const e = new EffectEntity({
        name: 'SMOKEY',
        player: -1,
        cell: this.cell,
        theatre: this.weapon.map.theatre
      }, this.weapon.map.engine, this.weapon.map);

      e.setCenterEntity(this);

      this.weapon.map.addEntity(e);
    }
  }

  public onUpdate(deltaTime: number) {
    if (this.bullet.BulletSpeed === -1) {
      this.onHit();
    } else {
      const speed = this.bullet.BulletSpeed / 18;
      const directions = 32;
      const position = this.position.clone() as Vector;
      const targetPosition = this.target.position.clone() as Vector;

      const direction = getDirection(targetPosition, position, directions);
      const angleRadians = (direction / directions) * 2 * Math.PI;
      const vel = new Vector(speed * Math.sin(angleRadians), speed * Math.cos(angleRadians));
      const distance = targetPosition.distance(position);

      if (distance < speed) {
        this.onHit();
      } else {
        if (this.trailTick <= 0) {
          this.createTrail();
          this.trailTick = randomBetweenInteger(2, 10);
        }

        this.position.subtract(vel);
        this.direction = direction;
        this.cell = cellFromPoint(this.position);
      }
    }

    this.trailTick--;
  }

  public onRender(deltaTime: number) {
    const frame = new Vector(0, this.direction);
    const context = this.weapon.map.overlay.getContext();
    this.weapon.sprite.render(frame, this.position, context);
  }

  protected onHit() {
    const damage = this.weapon.weapon.Damage;
    const armor = this.target.getArmor();
    const take = 256 / this.warhead.verses[armor];
    const finalDamage = damage * take;

    // TODO: Apparently if there's multiple units in same cell, you divide by three
    this.target.takeDamage(finalDamage);
    this.destroy();
  }
}

export class Weapon {
  public readonly weapon: MIXWeapon;
  public readonly map: GameMap;
  public readonly entity: GameMapEntity;
  public readonly sprite: Sprite;
  public readonly trailSprite?: Sprite;
  private tick: number = 0;

  public constructor(name: string, map: GameMap, entity: GameMapEntity) {
    this.map = map;
    this.weapon = map.engine.mix.weapons.get(name) as MIXWeapon;
    this.entity = entity;

    const bullet = map.engine.mix.bullets.get(this.weapon.Projectile) as MIXBullet;
    const spriteName = bullet.Image.toLowerCase();
    this.sprite = spriteFromName(`CONQUER.MIX/${spriteName}.png`);

    if (bullet.SmokeTrail) {
      this.trailSprite = spriteFromName(`CONQUER.MIX/smokey.png`);
    }
  }

  public async init(): Promise<void> {
    await this.map.engine.loadArchiveSprite(this.sprite);

    if (this.trailSprite) {
      await this.map.engine.loadArchiveSprite(this.trailSprite);
    }
  }

  public fire(target: GameMapEntity): void {
    if (this.tick !== 0) {
      return;
    }

    const p = new ProjectileEntity(this.weapon.Projectile, target, this);
    this.map.addEntity(p);
    if (this.weapon.Report) {
      this.entity.playSfx(this.weapon.Report.toLowerCase());
    }
  }

  public onUpdate(deltaTime: number) {
    this.tick = (this.tick + 1) % this.weapon.ROF;
  }

  public onRender(deltaTime: number) {
  }
}
