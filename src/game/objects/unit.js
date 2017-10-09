/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';
import {getDirection} from '../../engine/physics';
import {TILE_SIZE} from '../../engine/globals';

export default class UnitObject extends MapObject {

  constructor(engine, args) {
    super(engine, args, engine.mix.getObject(args.id));

    this.orders = [];
    this.rofCooldown = 0;
    this.targetObject = null;
    this.moving = false;
    this.attacking = false;
    this.targetX = null;
    this.targetY = null;
    this.sizeX = 1;
    this.sizeY = 1;
    this.targetDirection = null;
    this.directions = this.type === 'infantry' ? 8 : 32;
    this.direction = (args.direction || 0) / this.directions;
    this.spriteColor = this.isFriendly() ? '#00ff00' : '#ff0000';

    if ( !Object.keys(this.animations).length ) {
      this.animations = { // FIXME
        Ready: {frames: 1},
        Walk: {frames: 1}
      };
    }

    if ( this.type === 'infantry' ) {
      const [cx, cy, cw, ch] = this.sprite.clip;
      this.xOffset = cx - (TILE_SIZE / 2);
      this.yOffset = cy - (TILE_SIZE / 2);

      // FIXME!!!
      if ( this.tileS === 1 ) {
        this.x -= cw / 2;
        this.y -= ch / 2;
      } else if  ( this.tileS === 2 ) {
        this.x += cw / 2;
        this.y -= ch / 2;
      } else if  ( this.tileS === 3 ) {
        this.x -= cw / 2;
        this.y += ch / 2;
      } else if ( this.tileS === 4 ) {
        this.x += cw / 2;
        this.y += ch / 2;
      }
    } else {
      this.sizeX = Math.floor(this.sprite.width / TILE_SIZE);
      this.sizeY = Math.floor(this.sprite.height / TILE_SIZE);
    }
  }

  /**
   * Update entity
   */
  update() {
    if ( !this.destroying ) {
      this.handleOrder();
      this.handleMovement();

      if ( this.moving ) {
        this.currentAnimation = 'Walk';
      } else if ( this.attacking ) {
        this.currentAnimation = 'FireUp';
      } else {
        this.currentAnimation = 'Ready';
      }

      if ( this.health <= 0 ) {
        if ( this.type === 'infantry' ) {
          this.currentAnimationuIndex = 0;
          this.currentAnimation = 'Die1';
          this.engine.sounds.playSound('nuyell');
        } else {
          this.engine.sounds.playSound('xplos');
          this.destroyed = true;
        }
      }
    }

    super.update();
  }

  render(target, delta) {
    super.render(target, delta);
  }

  /**
   * Handle movement
   */
  handleMovement() {
    if ( this.targetX === null || this.targetY === null ) {
      return;
    }

    if ( this.targetDirection !== null ) {
      const dirs = this.directions;
      const td = this.targetDirection;
      let cd = this.direction;

      if ( td > cd && td - cd < dirs / 2 || td < cd && cd - td > dirs / 2 ) {
        cd = cd + this.options.TurnSpeed / 10;
      } else {
        cd = cd - this.options.TurnSpeed / 10;
      }

      if ( cd > dirs - 1 ) {
        cd -= dirs - 1;
      } else if ( cd < 0 ) {
        cd += dirs - 1;
      }

      this.direction = cd;
      if ( this.direction === this.targetDirection ) {
        this.targetDirection = null;
      } else {
        return;
      }
    }

    const movement = (this.options.Speed / TILE_SIZE); // FIXME
    const direction = getDirection({x: this.targetX, y: this.targetY}, this, this.directions);
    const angleRadians = (direction / this.directions) * 2 * Math.PI;
    const velX = (movement * Math.sin(angleRadians));
    const velY = (movement * Math.cos(angleRadians));

    const distance = Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2));
    if ( distance < movement ) {
      this.moving = false;
      this.targetX = null;
      this.targetY = null;
    } else {
      this.x -= (velX);
      this.y -= (velY);
      this.tileX = Math.round(this.x / TILE_SIZE);
      this.tileY = Math.round(this.y / TILE_SIZE);
      this.moving = true;
    }
  }

  /**
   * Handle orders
   */
  handleOrder() {

    // FIXME: Is outside sight while not targetting ?
    const to = this.targetObject;
    if ( to ) {
      if ( to.health <= 0 ) {
        this.targetObject = null;
        this.attacking = false;
        return;
      }

      const weapon = this.options.PrimaryWeapon || this.options.SecondaryWeapon;
      const sight = (weapon ? weapon.Range : 1) * TILE_SIZE;
      const distance = Math.sqrt(Math.pow(to.x - this.x, 2) + Math.pow(to.y - this.y, 2));
      const sound = weapon ? weapon.Report : null;

      if ( distance <= sight ) {
        this.orders = [];
        this.attacking = weapon ? true : false;
        this.moving = false;
        this.targetX = null;
        this.targetY = null;

        if ( weapon && this.rofCooldown === 0 ) {
          if ( sound ) {
            this.engine.sounds.playSound(sound);
          }

          this.engine.scene.map.addProjectile(this, to, weapon);
        }

        if ( weapon ) {
          this.rofCooldown = (this.rofCooldown + 1) % weapon.ROF;
        }
      }
    }

    if ( !this.orders.length  ) {
      this.moving = false;
      return;
    }

    if ( this.moving || this.targetDirection !== null ) {
      return;
    }

    const order = this.orders[0];
    const direction = getDirection(order, this, this.directions);

    if ( this.options.TurnSpeed ) {
      if ( this.direction !== direction ) {
        this.targetDirection = direction;
      }
    } else {
      this.direction = direction;
    }

    this.targetX = order.x;
    this.targetY = order.y;
    this.orders.splice(0, 1);
  }

  select(t, report) {
    if ( super.select(t) ) {
      if ( report && this.isFriendly() ) {
        this.engine.sounds.playSound('await1');
      }
      return true;
    }
    return false;
  }

  setPath(path, report) {
    if ( !this.options.Speed || !path.length ) {
      return false;
    }

    path.splice(0, 1);

    console.log('Entity::setPath()', path);

    this.currentAnimation = 'Idle';
    this.targetX = null;
    this.targetY = null;
    this.targetDirection = null;
    this.tileS = 0; // FIXME
    this.moving = false;
    this.attacking = false;
    this.orders = path;
    this.targetObject = null;
    this.rofCooldown = 0;

    if ( report ) {
      this.engine.sounds.playSound('ackno');
    }

    return true;
  }

  setTarget(obj) {
    this.targetObject = obj;
  }

  canSelect() {
    return true;
  }

}
