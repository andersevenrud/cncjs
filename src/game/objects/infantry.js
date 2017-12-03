/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import UnitObject from './unit';
import {getDirection} from 'game/physics';
import {TILE_SIZE, IDLE_ANIMS} from 'game/globals';
import {randomInteger, randomFromArray} from 'engine/util';

export default class InfantryObject extends UnitObject {

  constructor(engine, args) {
    super(engine, args, engine.data.infantry[args.id]);

    this.sizeX = 1;
    this.sizeY = 1;
    this.tileS = args.tileS || 0;
    this.directions = 8;
    this.direction = (args.direction || 0) / this.directions;
    this.idling = false;
    this.idleCounter = 0;
  }

  async load() {
    await super.load();

    const [ox, oy] = this.getTargetOffset();
    this.x += ox;
    this.y += oy;
  }

  shoot(target) {
    const weapon = super.shoot(...arguments);
    if ( weapon && weapon !== true ) {
      if ( weapon.Projectile.Unknown5 === 12 ) { // FIXME
        const dirs = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
        const dir = getDirection({
          x: this.tileX,
          y: this.tileY
        }, {
          x: target.tileX,
          y: target.tileY
        }, 8);

        // FIXME
        const [x, y] = this.getPosition();
        this.map.addEffect({
          id: weapon.Projectile.Image + '-' + dirs[dir],
          x: x + (this.width / 2),
          y: y + (this.height / 2)
        });
      }

      return weapon;
    }

    return false;
  }

  die() {
    this.setAnimation(this.deathAnimation || 'Die1', {
      loop: false
    });
    this.engine.sounds.playSound('nuyell', {source: this});
  }

  takeDamage(dmg, weapon) {
    super.takeDamage(...arguments);

    const anim = weapon.Projectile.Warhead.InfantryDeath;
    if ( anim ) {
      this.deathAnimation = 'Die' + String(anim);
    } else {
      this.deathAnimation = null;
    }
  }

  processAnimation() {
    const moving = this.targetX !== null || this.targetY !== null;

    if ( moving ) {
      this.setAnimation('Walk');
    } else if ( this.attacking ) {
      this.setAnimation('FireUp');
    } else if ( !this.currentPath.length ) {

      if ( this.idleCounter === 0 ) {
        const anim = randomFromArray(IDLE_ANIMS);
        this.setAnimation(anim);
      } else {
        this.idleCounter--;
      }

      if ( this.animation.name !== 'Ready' && this.animation.isFinished() ) {
        this.setAnimation('Ready');
      }
    }
  }

  processRotation() {
    if ( this.targetObject ) {
      this.direction = getDirection(this.targetObject, this, this.directions);
    }

    return false;
  }

  setAnimation(name, options) {
    if ( !this.animations[name] || this.animations[name].frames <= 0 ) {
      return;
    }

    this.idleCounter = randomInteger(100, 1000);

    super.setAnimation(name, options);
  }

  setPath() {
    if ( super.setPath(...arguments) ) {
      this.turretTurning = false;
      this.tileS = 0; // FIXME

      return true;
    }

    return false;
  }

  getTargetOffset() {
    // FIXME: This could be prettier
    const dx = (TILE_SIZE - this.width) / 2;
    const dy = (TILE_SIZE - this.height) / 2;

    let px = dx;
    let py = dy;

    if ( this.tileS === 1 ) {
      px -= dx;
      py -= dy;
    } else if  ( this.tileS === 2 ) {
      px += dx;
      py -= dy;
    } else if  ( this.tileS === 3 ) {
      px -= dx;
      py += dy;
    } else if ( this.tileS === 4 ) {
      px += dx;
      py += dy;
    }

    return [px, py];
  }

}
