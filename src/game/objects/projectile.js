/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';
import Animation from '../../engine/animation';
import {getDirection} from '../physics';
import {TILE_SIZE} from '../globals';

export default class ProjectileObject extends MapObject {

  constructor(engine, from, to, weapon) {
    super(engine, {
      id: weapon.Projectile.Image,
      type: 'projectile',
      tileX: from.tileX,
      tileY: from.tileY
    }, {});

    this.spriteColor = '#ffff00';
    this.bulletSpeed = weapon.Projectile.BulletSpeed;
    this.hasTrail = weapon.Projectile.SmokeTrail === true;
    this.trailCounter = 0;
    this.explosion = weapon.Projectile.Explosion;
    this.damage = weapon.Damage;
    this.invisible = weapon.Projectile.Invisible;
    this.from = from;
    this.dest = {
      x: to.x,
      y: to.y,
      tileX: to.tileX,
      tileY: to.tileY
    };

    if ( !weapon.Projectile.NoRotation ) {
      this.animation = new Animation({
        loop: false,
        frames: 1,
        name: weapon.Projectile.Image,
        sprite: this.sprite,
        getOffset: (anim) => {
          const d = getDirection({
            x: this.tileX,
            y: this.tileY
          }, {
            x: this.dest.tileX,
            y: this.dest.tileY
          });

          return Math.round(d);
        }
      });
    }

    console.debug('Spawned projectile', this, weapon);
  }

  render(target, delta) {
    if ( this.bulletSpeed <= 0 || this.invisible ) {
      return;
    }

    super.render(...arguments);
  }

  reachedDestination() {
    // TODO: Splash damage
    if ( this.explosion !== 'none' ) {
      this.engine.scene.map.addEffect({
        id: this.explosion
      }, this.dest);
    }

    const objects = this.engine.scene.map.getObjectsFromTile(this.dest.tileX, this.dest.tileY);
    for ( let i = 0; i < objects.length; i++ ) {
      objects[i].health -= this.damage;
    }

    this.destroy();
  }

  addTrail() {

    if ( !(this.trailCounter % 5) ) {
      this.engine.scene.map.addEffect({
        id: 'smokey',
        x: this.x,
        y: this.y
      });
    }

    this.trailCounter++;
  }

  update() {
    if ( this.destroying ) {
      return;
    }

    if ( this.animation ) {
      this.animation.update();
    }

    if ( this.bulletSpeed > 0 ) {
      const tx = this.dest.x - this.x;
      const ty = this.dest.y - this.y;
      const dist = Math.sqrt(tx * tx + ty * ty);

      if ( dist < TILE_SIZE / 2 ) {
        this.reachedDestination();
      } else if ( dist > 400 ) { // FIXME
        this.destroy();
      } else {
        const velX = (tx / dist) * this.bulletSpeed / TILE_SIZE;
        const velY = (ty / dist) * this.bulletSpeed / TILE_SIZE;

        this.x += velX;
        this.y += velY;

        this.tileX = Math.round(this.x / TILE_SIZE);
        this.tileY = Math.round(this.y / TILE_SIZE);

        if ( this.hasTrail ) {
          this.addTrail();
        }
      }
    } else {
      this.reachedDestination();
    }
  }
}
