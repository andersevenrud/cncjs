/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import EngineObject from '../engine/object';
import {pointFromTile} from '../engine/physics';
import {TILE_SIZE} from '../engine/globals';
import {ZINDEX} from './globals';

export default class MapObject extends EngineObject {

  constructor(engine, args, options) {
    options = options || {};

    super(engine, args.id);

    this.id = args.id;
    this.type = args.type;
    this.team = args.team;
    this.options = options;
    this.tileX = args.tileX;
    this.tileY = args.tileY;
    this.tileS = args.tileS || 0;
    this.selected = false;
    this.directions = 0;
    this.direction = 0;
    this.zIndex = ZINDEX[this.type] || 1;
    this.animations = options.SequenceInfo || {};
    this.health = options.HitPoints || 255;
    this.destroying = false;
    this.destroyed = false;
    this.currentAnimationTime = 0;
    this.currentAnimation = null;
    this.currentAnimationOffset = 0;
    this.currentAnimationIndex = 0;

    const startPos = pointFromTile(args.tileX, args.tileY);
    this.x = startPos.x;
    this.y = startPos.y;
    this.xOffset = args.yOffset || 0;
    this.yOffset = args.yOffset || 0;
    this.spriteSheet = this.team;

    console.debug('MapObject::constructor()', this.type, this.id, this);
  }

  destroy() {
    this.engine.scene.map.removeObject(this); // FIXME
  }

  /**
   * Sets the selected state
   * @param {Boolean} [toggle=true] State
   * @return {Boolean} selected state
   */
  select(toggle = true) {
    console.log('Select', toggle, this);

    if ( !this.canSelect() ) {
      return false;
    }

    if ( this.selected === !!toggle ) {
      return false;
    }

    this.selected = toggle === true;

    return this.selected;
  }

  /**
   * Updates the internal states
   */
  update() {
    if ( this.health <= 0 ) {
      this.destroying = true;
    }

    if ( this.destroyed ) {
      this.destroy();
      return;
    }

    let found = false;
    if ( this.animations ) {
      const animationName = this.currentAnimation;
      const animation = this.animations[animationName];

      if ( animation ) {
        this.currentAnimationOffset = animation.offset || 0;
        this.currentAnimationOffset += animation.multi !== 0 ? (Math.round(this.direction || 0) * animation.frames) : animation.frames;

        if ( this.currentAnimationTime / 2 >= 4 ) { // FIXME
          const next = this.currentAnimationIndex + 1;

          if ( this.destroying && next >= animation.frames - 1 ) {
            this.destroyed = true;
          }

          this.currentAnimationIndex = next % animation.frames;
          this.currentAnimationTime = 0;
        }

        this.spriteFrame = this.currentAnimationOffset + this.currentAnimationIndex;
        found = true;
      }
      this.currentAnimationTime++;
    }

    if ( !found ) {
      this.destroyed = this.destroying;
    }
  }

  /**
   * Draws the Game Object onto target
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    const rect = this.getRect(true);
    const {x, y, w, h} = rect;
    const {offsetX, offsetY} = this.engine.getOffset();

    if ( this.engine.options.debug && this.orders ) {
      target.fillStyle = 'rgba(0, 255, 0, .1)';

      this.orders.forEach((o) => {
        target.fillRect(
          -offsetX + o.x,
          -offsetY + o.y,
          TILE_SIZE, TILE_SIZE);
      });
    }

    super.render(...arguments);

    if ( this.selected ) {
      if ( this.engine.options.debug ) {
        const debugLine = `${this.tileX}x${this.tileY}x${this.tileS} (${this.x.toFixed(2)}x${this.y.toFixed(2)}) - ${this.currentAnimation} - ${this.spriteFrame} (${this.currentAnimationOffset} / ${this.currentAnimationIndex}) | ${this.direction}`;
        target.font = '8px monospace';
        target.fillStyle = '#ff0000';
        target.fillText(debugLine, x + w, y + h);
      }
    }
  }

  /**
   * Draws the Game Object overlay(s) onto target
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  renderOverlay(target, delta) {

  }

  /**
   * Draws the Game Object overlap(s) onto target
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  renderOverlap(target, delta) {

  }

  /**
   * Draws the selection UI
   * @param {CanvasRenderingContext2D} target Render context
   */
  renderSelection(target) {
    const {x1, x2, y1, y2} = this.getRect(true);

    target.strokeStyle = '#ffffff';
    target.lineWidth = 1;

    target.beginPath();
    target.moveTo(x1, y1);
    target.lineTo(x1 + 3, y1);
    target.stroke();
    target.moveTo(x1, y1);
    target.lineTo(x1, y1 + 3);
    target.stroke();

    target.beginPath();
    target.moveTo(x2, y1);
    target.lineTo(x2 - 3, y1);
    target.stroke();
    target.moveTo(x2, y1);
    target.lineTo(x2, y1 + 3);
    target.stroke();

    target.beginPath();
    target.moveTo(x2, y2);
    target.lineTo(x2 - 3, y2);
    target.stroke();
    target.moveTo(x2, y2);
    target.lineTo(x2, y2 - 3);
    target.stroke();

    target.beginPath();
    target.moveTo(x1, y2);
    target.lineTo(x1 + 3, y2);
    target.stroke();
    target.moveTo(x1, y2);
    target.lineTo(x1, y2 - 3);
    target.stroke();
  }

  /**
   * Draws the health UI
   * @param {CanvasRenderingContext2D} target Render context
   */
  renderHealthBar(target) {
    const {x1, x2, y1} = this.getRect(true);
    const value = Math.max(this.health / this.options.HitPoints, 0.0);

    const margin = 2;
    const barHeight = 5;
    const barWidth = Math.round((x2 - x1) + (margin * 2));
    const barPercentage = Math.round((barWidth - 2) * value);

    target.fillStyle = '#000000';
    target.fillRect(x1 - margin, y1 - margin - (margin + barHeight), barWidth, barHeight);

    if ( value > 0.7  ) {
      target.fillStyle = '#00ff00';
    } else if ( value > 0.4 ) {
      target.fillStyle = '#ffff00';
    } else {
      target.fillStyle = '#ff0000';
    }

    target.fillRect(x1 - margin + 1, y1 - margin - (margin + barHeight) + 1, barPercentage, barHeight - 2);
  }

  /**
   * Sets the current target
   * @param {MapObject} obj Game Object
   */
  setTarget(obj) {
    // void
  }

  /**
   * Sets current path
   * @param {Array[]} path Given path
   * @return {Boolean}
   */
  setPath(path) {
    // void
    return false;
  }

  /**
   * Get selection state
   * @return {Boolean}
   */
  getSelected() {
    return this.selected;
  }

  /**
   * Checks if this is an overlay type instance
   * @return {Boolean}
   */
  isMapOverlay() {
    return ['overlay', 'terrain', 'tile', 'explosion', 'projectile'].indexOf(this.type) !== -1;
  }

  /**
   * Checks if this is an unit type instance
   * @return {Boolean}
   */
  isUnit() {
    return ['unit', 'infantry', 'aircraft'].indexOf(this.type) !== -1;
  }

  /**
   * Checks if this is an structure type instance
   * @return {Boolean}
   */
  isStructure() {
    return this.type === 'structure';
  }

  /**
   * Checks if this is an firendly type instance
   * @return {Boolean}
   */
  isFriendly() {
    const mainPlayer = this.engine.scene.getMainPlayer();
    return mainPlayer.team === this.team; // FIXME: Allies
  }

  /**
   * Checks if this is an enemy type instance
   * @return {Boolean}
   */
  isEnemy() {
    return !this.isFriendly();
  }

  /**
   * Check if object can be selected
   * @return {Boolean}
   */
  canSelect() {
    return false; // TODO
  }

  /**
   * Check if object can be moved
   * @return {Boolean}
   */
  canMove() {
    return this.options && this.options.Speed;
  }

  /**
   * Check if object can attack
   * @return {Boolean}
   */
  canAttack() {
    return this.options && (this.options.PrimaryWeapon || this.options.SecondaryWeapon);
  }

}
