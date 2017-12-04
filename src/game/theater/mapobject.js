/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from 'engine/sprite';
import EngineObject from 'engine/object';
import {pointFromTile} from 'game/physics';
import {TILE_SIZE, ZINDEX, PLAYER_COLORS} from 'game/globals';

export default class MapObject extends EngineObject {

  constructor(engine, args, options) {
    options = options || {};

    super(engine, [args.path, args.id].filter(s => !!s).join('/'));

    this._index = -1;
    this.id = args.id;
    this.map = engine.scene.level.map;
    this.type = args.type;
    this.player = null;
    this.options = options;
    this.tileX = args.tileX;
    this.tileY = args.tileY;
    this.sizeX = 1;
    this.sizeY = 1;
    this.selected = false;
    this.zIndex = ZINDEX[this.type] || 1;
    this.animations = options.SequenceInfo || {};
    this.animation = null;
    this.health = options.HitPoints || 255;
    this.destroying = false;
    this.destroyed = false;
    this.repairing = false; // TODO

    const startPos = pointFromTile(args.tileX, args.tileY);
    this.x = typeof args.x === 'number' ? args.x : startPos.x;
    this.y = typeof args.y === 'number' ? args.y : startPos.y;

    if ( typeof args.team !== 'undefined' ) {
      const team = args.team === -1 ? 2 : args.team;
      this.player = engine.scene.level.players.find(player => player.team ===  team);
      this.spriteSheet = this.player.team > 1 ? 0 : this.player.team;
      this.spriteColor = PLAYER_COLORS[this.player.team];
    }

    console.debug('MapObject::constructor()', this.type, this.id, this);
  }

  async load() {
    await Sprite.preload(this.engine, this.spriteId);

    super.load();

    this.sprite = this.sprite || {
      width: TILE_SIZE,
      height: TILE_SIZE,
      count: 0
    };

    if ( this.type !== 'infantry' ) {
      this.sizeX = Math.floor(this.sprite.width / TILE_SIZE);
      this.sizeY = Math.floor(this.sprite.height / TILE_SIZE);
    }
  }

  destroy() {
    this.map.removeObject(this); // FIXME
  }

  expand() {

  }

  move(tileX, tileY) {
    // void
  }

  attack(target) {
    // void
  }

  takeDamage(dmg, weapon) {
    if ( isNaN(dmg) ) {
      console.warn('Took invalid damage', dmg, weapon);
      dmg = 0;
    }

    const rules = this.engine.data.rules.General;
    dmg = Math.min(dmg, rules.MaxDamage);
    dmg = Math.max(dmg, rules.MinDamage);

    this.health -= dmg;
  }

  /**
   * Sets the selected state
   * @param {Boolean} [toggle=true] State
   * @return {Boolean} selected state
   */
  select(toggle = true) {
    console.log('Select', toggle, this);

    if ( !this.isSelectable() ) {
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
    this.destroying = this.health <= 0;

    if ( this.destroying ) {
      if ( this.animation && !this.animation.loop ) {
        this.destroyed = this.animation.isFinished();
      } else {
        this.destroyed = true;
      }
    }

    if ( this.destroyed ) {
      this.destroy();
      return;
    }

    super.update();
  }

  /**
   * Draws the Game Object onto target
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    super.render(...arguments);
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
    const colors = ['#00ff00', '#ffff00', '#ff0000'];

    const margin = 2;
    const barHeight = 5;
    const barWidth = Math.round((x2 - x1) + (margin * 2));
    const barPercentage = Math.round((barWidth - 2) * value);

    target.fillStyle = '#000000';
    target.fillRect(x1 - margin, y1 - margin - (margin + barHeight), barWidth, barHeight);

    target.fillStyle = colors[this.getDamageState()];
    target.fillRect(x1 - margin + 1, y1 - margin - (margin + barHeight) + 1, barPercentage, barHeight - 2);
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

  isWithinRange(o) {
    let sight = 0;

    const weapon = this.options.PrimaryWeapon; // FIXME
    if ( !weapon ) {
      return false;
    }

    sight = weapon.Range;
    if ( this.isUnit() ) {
      sight += 1;
    }

    const distance = Math.sqrt(
      Math.pow(o.x - this.x, 2) +
      Math.pow(o.y - this.y, 2)
    );

    return distance <= (sight * TILE_SIZE);
  }

  /**
   * Queries the map for the surrounding grid objects and checks
   * if they are surrounded by an object of this type.
   * @return {Object}
   */
  checkSurrounding() {
    const top = this.map.queryGrid(this.tileX, this.tileY - 1, 'id', this.id, true);
    const bottom = this.map.queryGrid(this.tileX, this.tileY + 1, 'id', this.id, true);
    const left = this.map.queryGrid(this.tileX - 1, this.tileY, 'id', this.id, true);
    const right = this.map.queryGrid(this.tileX + 1, this.tileY, 'id', this.id, true);

    return {top, left, bottom, right};
  }

  /**
   * Check if object can attack
   * @return {Boolean}
   */
  canAttack() {
    return this.options && (this.options.PrimaryWeapon || this.options.SecondaryWeapon);
  }

  /**
   * Checks if this is an overlay type instance
   * @return {Boolean}
   */
  isMapOverlay() {
    return ['overlay', 'terrain', 'tile', 'explosion', 'projectile', 'smudge'].indexOf(this.type) !== -1;
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
   * Checks if this is a player object
   * @return {Boolean}
   */
  isPlayerObject() {
    return this.isStructure() || this.isUnit();
  }

  /**
   * Checks if this is an firendly type instance
   * @param {Player} [player] Check against this player
   * @return {Boolean}
   */
  isFriendly(player = null) {
    if ( !this.player || this.player.neutral ) {
      return true;
    }

    if ( player ) {
      return player.team === this.player.team;
    }

    return this.player.current;
  }

  /**
   * Checks if this is an enemy type instance
   * @param {Player} [player] Check against this player
   * @return {Boolean}
   */
  isEnemy(player = null) {
    return !this.isFriendly(player);
  }

  isSellable() {
    return this.isStructure() && this.isFriendly();
  }

  isRepairable() {
    return this.isSellable(); // FIXME
  }

  isBlocking() {
    return this.isUnit() || this.isStructure() || this.type === 'terrain' || this.isWall;
  }

  isSelectable() {
    return this.isUnit() || this.options.Selectable === true;
  }

  isAttackable() {
    return this.isSelectable() && !this.isFriendly();
  }

  isMovable() {
    return this.options && this.options.Speed && this.isFriendly();
  }

  isExpandable() {
    return this.id === 'mcv'; // FIXM
  }

  isHarvester() {
    return this.options.Harvester;
  }

  getSpawnLocation() {
    return [this.tileX, this.tileY];
  }

  getDamageState() {
    const value = Math.max(this.health / this.options.HitPoints, 0.0);
    const rules = this.engine.data.rules.General;
    if ( value > rules.ConditionYellow ) {
      return 0;
    } else if ( value > rules.ConditionRed ) {
      return 1;
    }
    return 2;
  }

}
