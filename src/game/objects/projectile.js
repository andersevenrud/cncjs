/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';
import {TILE_SIZE} from '../../engine/globals';

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
    this.effect = weapon.Projectile.Explosion;
    this.damage = weapon.Damage;
    this.from = from;
    this.to = to;
  }

  render(target, delta) {
    if ( this.bulletSpeed <= 0 ) {
      return;
    }

    super.render(...arguments);
  }

  update() {
    this.spriteFrame = 0; // FIXME

    if ( this.destroying ) {
      return;
    }

    const reached = () => {
      this.engine.scene.map.addEffect({
        id: this.effect
      }, this.to);

      this.to.health -= this.damage;

      this.destroy();
    };

    if ( this.bulletSpeed > 0 ) {
      const tx = this.to.x - this.x;
      const ty = this.to.y - this.y;
      const dist = Math.sqrt(tx * tx + ty * ty);

      if ( dist < TILE_SIZE / 2 ) {
        reached();
      } else if ( dist > 400 ) { // FIXME
        this.destroy();
      } else {
        const velX = (tx / dist) * this.bulletSpeed / TILE_SIZE;
        const velY = (ty / dist) * this.bulletSpeed / TILE_SIZE;

        this.x += velX;
        this.y += velY;
      }
    } else {
      reached();
    }
  }
}
