/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import UnitObject from './unit';
import {getDirection, getNewDirection} from 'game/physics';

export default class VehicleObject extends UnitObject {

  constructor(engine, args) {
    super(engine, args, engine.data.units[args.id]);

    this.directions = 32;
    this.animations = { // FIXME
      Ready: {frames: 1}
    };

    this.targetTurretDirection = null;
    this.turretDirection = this.direction;
  }

  render(target) {
    super.render(...arguments);

    if ( this.options.HasTurret ) {
      const rect = this.getRect(true);
      const {x, y} = rect;

      this.sprite.render(target, x, y, this.directions + Math.round(this.turretDirection), this.spriteSheet);
    }
  }

  processRotation() {

    if ( this.targetDirection !== null ) {
      this.direction = getNewDirection(this.direction,
                                       this.targetDirection,
                                       this.options.TurnSpeed,
                                       this.directions);

      if ( this.direction === this.targetDirection ) {
        this.targetDirection = null;
      }

      return true;
    }

    if ( this.targetTurretDirection !== null ) {
      this.turretDirection = getNewDirection(this.turretDirection,
                                             this.targetTurretDirection,
                                             this.options.TurnSpeed,
                                             this.directions);

      if ( Math.round(this.turretDirection) === this.targetTurretDirection ) {
        this.targetTurretDirection = null;
      }

      return true;
    }

    if ( this.options.HasTurret ) {
      if ( this.options.NoTurretLock ) {
        this.turretDirection = this.direction;
      } else {
        if ( this.targetObject ) {
          const direction = getDirection(this.targetObject, this, this.directions);
          if ( direction !== Math.round(this.turretDirection) ) {
            this.targetTurretDirection = direction;

            return true;
          }
        }
      }
    }

    return false;
  }

  expand() {
    if ( this.id === 'mcv' ) {
      this.destroy();

      // FIXME: Check if can deploy here
      this.map.addObject({
        team: this.player.team,
        type: 'structure',
        id: 'fact',
        tileX: this.tileX,
        tileY: this.tileY
      });

      this.engine.scene.toggleSidebar(true);
    }
  }

  die() {
    if ( this.options.DeathAnimation ) {
      this.map.addEffect({
        id: this.options.DeathAnimation,
        x: this.x + (this.width / 2),
        y: this.y + (this.height / 2)
      });
    }

    this.engine.sounds.playSound('SOUNDS.MIX/xplos', {source: this});
    this.destroyed = true;
  }

  setPath() {
    if ( super.setPath(...arguments) ) {
      this.targetTurretDirection = null;

      return true;
    }

    return false;
  }

}
