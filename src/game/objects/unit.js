/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from '../mapobject';
import Animation from '../../engine/animation';
import {getDirection} from '../physics';
import {TILE_SIZE} from '../globals';

export default class UnitObject extends MapObject {

  constructor(engine, args) {
    super(engine, args, args.type === 'infantry'
      ? engine.data.infantry[args.id]
      : engine.data.units[args.id]);

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
    this.targetTurretDirection = null;
    this.directions = this.type === 'infantry' ? 8 : 32;
    this.direction = (args.direction || 0) / this.directions;
    this.turretDirection = this.direction;

    this.spriteColor = this.isFriendly() ? '#00ff00' : '#ff0000';
    this.animation = new Animation({});

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

  render(target) {
    super.render(...arguments);

    if ( this.engine.options.debug && this.orders ) {
      const {offsetX, offsetY} = this.engine.getOffset();

      target.fillStyle = 'rgba(0, 255, 0, .1)';

      this.orders.forEach((o) => {
        target.fillRect(
          -offsetX + o.x,
          -offsetY + o.y,
          TILE_SIZE, TILE_SIZE);
      });
    }

    if ( this.options.HasTurret ) {
      const rect = this.getRect(true);
      const {x, y} = rect;

      // FIXME
      this.sprite.render(target, x, y, 32 + Math.round(this.turretDirection), this.spriteSheet);
    }
  }

  /**
   * Update entity
   */
  update() {
    if ( !this.destroying ) {
      this.handleOrder();
      this.handleMovement();
      this.handleAI();

      if ( this.moving ) {
        this.setAnimation('Walk');
      } else if ( this.attacking && this.type === 'infantry' ) { // FIXME
        this.setAnimation('FireUp');
      } else if ( !this.orders.length ) {
        this.setAnimation('Ready');
      }

      if ( this.health <= 0 ) {
        if ( this.type === 'infantry' ) {
          this.setAnimation('Die1', {
            loop: false
          });
          this.engine.sounds.playSound('nuyell', {source: this});
        } else {
          this.engine.sounds.playSound('xplos', {source: this});
          this.destroyed = true;
        }
      }
    }

    super.update();
  }

  /**
   * Handle movement
   */
  handleMovement() {

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

      if ( this.options.HasTurret ) {
        this.turretDirection = this.direction; // FIXME
      }

      if ( this.direction === this.targetDirection ) {
        this.targetDirection = null;
      } else {
        return;
      }
    }

    if ( this.targetX === null || this.targetY === null ) {
      return;
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
      if ( !this.orders.length ) {
        this.setDirection(getDirection(to, this, this.directions));
      }

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
            this.engine.sounds.playSound(sound, {source: this});
          }

          if ( weapon.Projectile.Unknown5 === 12 ) { // FIXME
            const dirs = ['s', 'se', 'e', 'ne', 'n', 'nw', 'w', 'sw'];
            const dir = getDirection({
              x: this.tileX,
              y: this.tileY
            }, {
              x: to.tileX,
              y: to.tileY
            }, 8);

            // FIXME
            const [x, y] = this.getPosition();
            this.engine.scene.map.addEffect({
              id: weapon.Projectile.Image + '-' + dirs[dir],
              x: x,
              y: y,
              xOffset: (79 / 2),
              yOffset: (79 / 2)
            });
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

    this.setDirection(direction);

    this.targetX = order.x;
    this.targetY = order.y;
    this.orders.splice(0, 1);
  }

  handleAI() {
    if ( this.orders.length ) {
      return;
    }

    // TODO
  }

  select(t, report) {
    if ( super.select(t) ) {
      if ( report && this.isFriendly() ) {
        this.engine.sounds.playSound('await1', {source: this});
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
      this.engine.sounds.playSound('ackno', {source: this});
    }

    return true;
  }

  setAnimation(name, options = {}) {
    super.setAnimation(name, Object.assign({
      loop: true,
      step: 0.25, // FIXME
      getOffset: (anim) => {
        let offset = anim.options.multi !== 0
          ? Math.round(this.direction) * anim.frames
          : anim.frames;

        return anim.offset + offset;
      }
    }, options));
  }

  setDirection(direction) {
    if ( this.options.TurnSpeed ) {
      if ( this.direction !== direction ) {
        this.targetDirection = direction;
      }
    } else {
      this.direction = direction;
    }
  }

  setTarget(obj) {
    this.targetObject = obj;
  }

}
