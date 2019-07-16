/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Sprite, randomBetweenInteger }  from '../engine';
import { GameMap } from './map';
import { GameEntity } from './entity';
import { MIXWeapon, MIXBullet, MIXWarhead, irrelevantBulletImages } from './mix';
import { cellFromPoint, getDirection, CELL_SIZE } from './physics';
import { spriteFromName } from './sprites';
import { Vector } from 'vector2d';

const directions = ['N', 'NW', 'W', 'SW', 'S', 'SE', 'E', 'NE'];

export class ProjectileEntity extends GameEntity {
  protected readonly bulletName: string;
  protected readonly bullet: MIXBullet;
  protected readonly warhead: MIXWarhead;
  protected readonly target: GameEntity;
  protected readonly weapon: Weapon;
  protected direction: number = 0;
  protected trailTick: number = 0;

  public constructor(name: string, target: GameEntity, weapon: Weapon) {
    super(weapon.map);

    this.target = target;
    this.weapon = weapon;
    this.bulletName = name;
    this.bullet = weapon.map.engine.mix.bullets.get(name) as MIXBullet;
    this.warhead = weapon.map.engine.mix.warheads.get(this.bullet.Warhead) as MIXWarhead;
    this.dimension = weapon.sprite ? weapon.sprite.size.clone() as Vector : new Vector(CELL_SIZE, CELL_SIZE); //FIXME
    this.position = weapon.entity.getPosition();
    this.cell = cellFromPoint(this.position);
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    super.destroy();

    if (this.bullet.Explosion) {
      this.map.factory.load('effect', {
        name: this.bullet.Explosion,
        cell: this.target.getCell()
      }, (effect: any): void => effect.setCenterEntity(this));
    }

    this.weapon.map.removeEntity(this);
  }

  private createTrail(): void {
    if (this.weapon.trailSprite && !this.destroyed) {
      this.map.factory.load('effect', {
        name: 'SMOKEY',
        player: -1,
        cell: this.cell
      }, (effect: any): void => {
        effect.setPosition(this.getPosition());
        effect.setCenterEntity(this);
      });
    }
  }

  public onUpdate(deltaTime: number): void {
    if (this.bullet.BulletSpeed === -1) {
      this.onHit();
    } else {
      const speed = this.bullet.BulletSpeed / 18;
      const directions = 32;
      const position = this.position.clone() as Vector;
      const targetPosition = this.target.getPosition();

      const direction = getDirection(targetPosition, position, directions);
      const angleRadians = (direction / directions) * 2 * Math.PI;
      const vel = new Vector(speed * Math.sin(angleRadians), speed * Math.cos(angleRadians));
      const distance = targetPosition.distance(position);

      if (distance < speed) {
        this.onHit();
      } else {
        if (this.trailTick <= 0) {
          this.createTrail();
          this.trailTick = randomBetweenInteger(4, 12);
        }

        this.position.subtract(vel);
        this.direction = direction;
        this.cell = cellFromPoint(this.position);
      }
    }

    this.trailTick--;
  }

  public onRender(deltaTime: number): void {
    if (this.weapon.sprite) {
      const frame = new Vector(0, this.direction);
      const context = this.weapon.map.overlay.getContext();
      this.weapon.sprite.render(frame, this.position, context);
    }
  }

  protected onHit(): void {
    const damage = this.weapon.weapon.Damage;
    const armor = this.target.getArmor();
    const verses = this.warhead.Verses[armor];
    const take = verses / 100;
    const finalDamage = damage * take;

    // TODO: Apparently if there's multiple units in same cell, you divide by three
    this.target.takeDamage(finalDamage);
    this.destroy();
  }
}

export class Weapon {
  public readonly weapon: MIXWeapon;
  public readonly map: GameMap;
  public readonly entity: GameEntity;
  public readonly sprite?: Sprite;
  public readonly trailSprite?: Sprite;
  private tick: number = 0;
  private rof: number = 0;

  public constructor(name: string, map: GameMap, entity: GameEntity) {
    this.map = map;
    this.weapon = map.engine.mix.weapons.get(name) as MIXWeapon;
    this.entity = entity;
    this.rof = this.weapon.ROF;

    const bullet = map.engine.mix.bullets.get(this.weapon.Projectile) as MIXBullet;

    if (irrelevantBulletImages.indexOf(bullet.Image) === -1) {
      const spriteName = bullet.Image.toLowerCase();
      this.sprite = spriteFromName(`CONQUER.MIX/${spriteName}.png`);

      if (bullet.SmokeTrail) {
        this.trailSprite = spriteFromName(`CONQUER.MIX/smokey.png`);
      }
    }
  }

  public async init(): Promise<void> {
    if (this.sprite) {
      await this.map.engine.loadArchiveSprite(this.sprite);
    }

    if (this.trailSprite) {
      await this.map.engine.loadArchiveSprite(this.trailSprite);
    }
  }

  protected fireProjectile(target: GameEntity): void {
    const p = new ProjectileEntity(this.weapon.Projectile, target, this);
    this.map.addEntity(p);
    if (this.weapon.Report) {
      this.entity.playSfx(this.weapon.Report.toLowerCase());
    }

    this.createMuzzleFlash();
  }

  public fire(target: GameEntity): void {
    const fire = this.tick === 0;
    const fireTwice = this.tick === Math.round(this.rof / 4) && this.entity.canFireTwice();
    if (fire || fireTwice) {
      this.fireProjectile(target);
    }
  }

  protected createMuzzleFlash(): void {
    if (this.weapon.MuzzleFlash) {
      const dir = directions[this.entity.getDirection()];
      const name = this.weapon.MuzzleFlash.replace('-N', `-${dir}`);

      this.map.factory.load('effect', {
        name,
        cell: this.entity.getCell()
      }, (effect: any): void => effect.setCenterEntity(this.entity));
    }
  }

  public onUpdate(deltaTime: number): void {
    this.tick = (this.tick + 1) % this.rof;
  }
}
