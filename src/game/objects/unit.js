/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import MapObject from 'game/theater/mapobject';
import Animation from 'engine/animation';
import {getDirection} from 'game/physics';
import {TILE_SIZE} from 'game/globals';

/*abstract*/ export default class UnitObject extends MapObject {

  constructor(engine, args, data) {
    super(engine, args, data);

    this.orders = [];
    this.rofCooldown = 0;
    this.targetObject = null;
    this.targetX = null;
    this.targetY = null;
    this.directions = 0;
    this.direction = 0;
    this.attacking = false;
    this.targetDirection = null;
    this.hasFired = false;
    this.aiTick = 0;
    this.spriteColor = this.isFriendly() ? '#00ff00' : '#ff0000';
    this.animation = new Animation({});
    this.currentPath = [];
  }

  render(target) {
    super.render(...arguments);

    if ( this.engine.options.debug && this.currentPath.length ) {
      const {offsetX, offsetY} = this.engine.getOffset();

      target.fillStyle = 'rgba(0, 255, 0, .1)';

      this.currentPath.forEach((o) => {
        target.fillRect(
          -offsetX + o.x,
          -offsetY + o.y,
          TILE_SIZE, TILE_SIZE);
      });
    }
  }

  /**
   * Update entity
   */
  update() {
    if ( !this.destroying ) {
      this.process();

      this.aiTick = (this.aiTick + 1) % 10;

      if ( this.rofCooldown > 0 ) {
        this.rofCooldown--;
      }

      if ( this.health <= 0 ) {
        this.die();
      }
    }

    super.update();
  }

  /**
   * Shoot at given Object
   * @param {MapObject} target Target
   * @return {Boolean|Object}
   */
  shoot(target) {
    const weapon = this.options.PrimaryWeapon || this.options.SecondaryWeapon;
    if ( !weapon ) {
      return false;
    }

    if ( this.rofCooldown > 0 ) {
      return true;
    }

    if ( this.isWithinRange(target) ) {
      if ( this.options.FiresTwice && !this.hasFired ) {
        this.rofCooldown = weapon.ROF / 2; // FIXME
        this.hasFired = true;
      } else {
        this.rofCooldown = weapon.ROF;
        this.hasFired = !this.options.FiresTwice;
      }

      const sound = weapon ? weapon.Report : null;
      if ( sound ) {
        this.engine.sounds.playSound(sound, {source: this});
      }

      this.map.addProjectile({
        x: this.x,
        y: this.y
      }, target, weapon);

      return weapon;
    }

    return false;
  }

  /**
   * When object dies
   */
  die() {
    this.destroy();
  }

  /**
   * Set object selection state
   * @param {Boolean} t Toggle
   * @param {Boolean} [report] Emit report sound
   * @return {Boolean}
   */
  select(t, report = false) {
    if ( super.select(t) ) {
      if ( report && this.isFriendly() ) {
        this.engine.sounds.playSound('await1', {source: this});
      }
      return true;
    }
    return false;
  }

  attack(target, report = false) {
    let path = [];

    const reachable = this.isWithinRange(target);
    if ( !reachable ) {
      if ( this.options.MovementType !== 6 ) { // FIXME
        path = this.map.createPathGrid(this.tileX, this.tileY, target.tileX, target.tileY, (res) => {
          res[target.tileY][target.tileX] = 0;

          return res;
        });

        path.pop();
      }
    }

    this.setPath(path, report);
    this.targetObject = target;
  }

  move(tileX, tileY, report = false) {
    const path = this.map.createPathGrid(this.tileX, this.tileY, tileX, tileY);

    this.setPath(path, report);
    this.targetObject = null;
  }

  /**
   * Process actions
   */
  process() {
    this.processAnimation();

    if ( this.processRotation() ) {
      return;
    }

    if ( this.processMovement() ) {
      return;
    }

    if ( this.processTarget() ) {
      return;
    }

    if ( this.aiTick === 0 ) {
      this.processAI();
    }

    this.processOrder();
  }

  /**
   * Process animation stuff
   */
  processAnimation() {
    this.setAnimation('Ready');
  }

  /**
   * Process AI
   */
  processAI() {
    if ( this.targetObject && !this.isWithinRange(this.targetObject) ) {
      if ( this.isFriendly() ) {
        this.targetObject = null;
      } else {
        // FIXME: Will chase forever
        this.attack(this.targetObject);
        return;
      }
    }

    const map = this.map;
    const oppositeObjects = map.getObjectsFromFilter((o) => {
      return o !== this && o.isUnit() && o.isEnemy(this.player);
    });

    if ( oppositeObjects.length ) {
      const rangedObjects = oppositeObjects.filter(o => this.isWithinRange(o));
      if ( rangedObjects.length ) {
        this.attack(rangedObjects[0]);
      }
    }
  }

  /**
   * Process the target
   * @return {Boolean} If event occured
   */
  processTarget() {
    const to = this.targetObject;

    this.attacking = false;

    if ( to ) {
      const reachable = this.isWithinRange(to);

      if ( to.health <= 0 ) {
        this.targetObject = null;
      } else {
        this.attacking = reachable;

        if ( this.shoot(to) ) {
          this.orders = [];
          this.targetX = null;
          this.targetY = null;
          this.targetDirection = null;
          this.currentPath = [];

          return true;
        }
      }
    }

    return false;
  }

  /**
   * Process the rotation
   * @return {Boolean} If event occured
   */
  processRotation() {
    return false;
  }

  /**
   * Process the movement
   * @return {Boolean} If event occured
   */
  processMovement() {
    if ( this.targetX === null || this.targetY === null ) {
      return false;
    }

    const movement = (this.options.Speed / TILE_SIZE); // FIXME
    const direction = getDirection({x: this.targetX, y: this.targetY}, this, this.directions);
    const angleRadians = (direction / this.directions) * 2 * Math.PI;
    const velX = (movement * Math.sin(angleRadians));
    const velY = (movement * Math.cos(angleRadians));

    const distance = Math.sqrt(Math.pow(this.targetX - this.x, 2) + Math.pow(this.targetY - this.y, 2));
    if ( distance < movement ) {
      this.targetX = null;
      this.targetY = null;
    } else {
      this.x -= velX;
      this.y -= velY;
      this.tileX = Math.round(this.x / TILE_SIZE);
      this.tileY = Math.round(this.y / TILE_SIZE);

      return true;
    }

    return false;
  }

  /**
   * Process the next order
   */
  processOrder() {
    if ( this.currentPath.length ) {
      const path = this.currentPath.shift();
      if ( !path.length ) {
        const [ox, oy] = this.getTargetOffset();

        this.targetX = path.x + ox;
        this.targetY = path.y + oy;
      } else {
        this.targetX = path.x;
        this.targetY = path.y;
      }

      const direction = getDirection(path, this, this.directions);
      if ( this.options.TurnSpeed ) {
        if ( direction !== this.direction ) {
          this.targetDirection = direction;
        }
      } else {
        this.direction = direction;
      }
    } else {
      if ( this.orders.length ) {
        const order = this.orders.shift();
        if ( order.action === 'move' ) {
          this.currentPath = order.path;
        }
      }
    }
  }

  setPath(path, report) {
    if ( report ) {
      this.engine.sounds.playSound('ackno', {source: this});
    }

    if ( this.options.Speed ) {
      this.currentPath = [];
      this.orders = [{
        action: 'move',
        path
      }];
      this.targetX = null;
      this.targetY = null;
      this.targetDirection = null;
      this.targetObject = null;

      return true;
    }

    return false;
  }

  setAnimation(name, options = {}) {
    super.setAnimation(name, Object.assign({
      loop: true,
      step: 0.15, // FIXME
      getOffset: (anim) => {
        let offset = anim.options.multi !== 0
          ? Math.round(this.direction) * anim.frames
          : anim.frames;

        return anim.offset + offset;
      }
    }, options));
  }

  getRenderOffset() {
    if ( !this.sprite || !this.sprite.clip ) {
      return super.getRenderOffset();
    }

    const [cx, cy, cw, ch] = this.sprite.clip;
    return [
      cx - (cw / 2),
      cy - (ch / 2)
    ];
  }

  getTargetOffset() {
    return [0, 0];
  }

}
