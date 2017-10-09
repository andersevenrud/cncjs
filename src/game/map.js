/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import PF from 'pathfinding';
import MapObject from './mapobject';
import TileObject from './objects/tile';
import UnitObject from './objects/unit';
import OverlayObject from './objects/overlay';
import TerrainObject from './objects/terrain';
import StructureObject from './objects/structure';
import EffectObject from './objects/effect';
import ProjectileObject from './objects/projectile';
import Sprite from '../engine/sprite';
import {TILE_SIZE} from '../engine/globals';
import {copy} from '../engine/util';
import {collideAABB, collidePoint, pointFromTile, tileFromPoint} from '../engine/physics';
import {MINIMAP_SIZE} from './globals';

/**
 * Game Map Implementation Class
 */
export default class Map {

  /**
   * @param {Engine} engine Game Engine reference
   */
  constructor(engine, level) {
    this.engine = engine;

    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.fowCanvas = document.createElement('canvas');
    this.fowContext = this.fowCanvas.getContext('2d');
    this.mmCanvas = document.createElement('canvas');
    this.mmContext = this.mmCanvas.getContext('2d');

    this.renderFOW = engine.options.debug === 0; // FIXME: For debugging
    this.theatre = 'TEMPERAT.MIX';
    this.id = '';
    this.tilesX = 0;
    this.tilesY = 0;
    this.width = 0;
    this.height = 0;
    this.visibleObjects = 0;
    this.fowGrid = [];
    this.baseGrid = [];
    this.grid = [];
    this.objects = [];
    this.selectedObjects = [];
    this.loaded = false;
    this.minimapScale = [0, 0];

    console.log('Map::constructor()');
  }

  /**
   * Loads the Map
   * @param {Object} data Game Level Data from JSON
   * @return {Boolean}
   */
  async load(data) {
    console.group('Map::load()');
    console.info(data);

    const tmap = {desert: 'DESERT.MIX', winter: 'WINTER.MIX'};
    if ( tmap[data.theater] ) {
      this.theatre = tmap[data.theater];
    }

    this.id = data.id;
    this.tilesX = data.width;
    this.tilesY = data.height;
    this.width = (this.tilesX * TILE_SIZE);
    this.height = (this.tilesY * TILE_SIZE);
    this.grid = Array(...Array(this.tilesY)).map(() => Array(this.tilesX));
    this.fowGrid = Array(...Array(this.tilesY)).map(() => Array(this.tilesX));

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    this.fowCanvas.width = this.width;
    this.fowCanvas.height = this.height;
    this.fowContext.fillStyle = 'rgba(0, 0, 0, 1)';
    this.fowContext.fillRect(0, 0, this.width, this.height);

    this.mmCanvas.width = MINIMAP_SIZE[0];
    this.mmCanvas.height = MINIMAP_SIZE[1];
    this.mmContext.fillStyle = 'rgba(0, 0, 0, 1)';
    this.mmContext.fillRect(0, 0, MINIMAP_SIZE[0], MINIMAP_SIZE[1]);
    this.minimapScale = [
      this.width / MINIMAP_SIZE[0],
      this.height / MINIMAP_SIZE[1]
    ];

    await Sprite.loadFile(this.engine, 'bib1');
    await Sprite.loadFile(this.engine, 'bib2');
    await Sprite.loadFile(this.engine, 'bib3');

    // Terrain tiles
    for ( let x = 0; x < this.tilesX; x++ ) {
      for ( let y = 0; y < this.tilesY; y++ ) {
        let i = data.tiles[y][x];
        try {
          await Sprite.loadFile(this.engine, i[0], this.theatre);
        } catch ( e ) {}

        let obj = new TileObject(this.engine, x, y, i);
        obj.render(this.context);

        if ( !i[3] ) {
          this.addToGrid({
            tileX: x,
            tileY: y,
            id: i[0]
          });
        }
      }
    }

    // Terrain objects
    for ( let i = 0; i < data.terrain.length; i++ ) {
      await this.addTerrain(data.terrain[i]);
    }

    // Overlays
    for ( let i = 0; i < data.overlays.length; i++ ) {
      await this.addOverlay(data.overlays[i]);
    }

    // Objects
    for ( let i = 0; i < data.entities.length; i++ ) {
      await this.addObject(data.entities[i]);
    }

    this.loaded = true;
    this.baseGrid = copy(this.grid);
    this._sortObjects();

    console.groupEnd();

    return true;
  }

  /**
   * Draws the Map onto target
   *
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    const {vx, vy, vw, vh} = this.engine.getViewport();
    const {offsetX, offsetY} = this.engine.getOffset();

    const rect = {
      x1: offsetX,
      y1: offsetY,
      x2: offsetX + vw,
      y2: offsetY + vh
    };

    const objects = this.getObjectsFromRect(rect);

    const mm = this.mmContext;
    mm.fillStyle = 'rgba(0, 0, 0, 1)';
    mm.fillRect(0, 0, MINIMAP_SIZE[0], MINIMAP_SIZE[1]);

    target.drawImage(this.canvas, offsetX, offsetY, vw, vh, vx, vy, vw, vh);
    mm.drawImage(this.canvas, 0, 0, this.width, this.height, 0, 0, MINIMAP_SIZE[0], MINIMAP_SIZE[1]);

    if ( this.engine.options.debug > 1 ) {
      target.strokeStyle = 'rgba(0, 0, 0, .1)';
      target.fillStyle = 'rgba(255, 0, 0, .1)';

      for ( let x = 0; x < this.tilesX; x++ ) {
        target.fillRect(-offsetX + (x * TILE_SIZE), -offsetY, 1, this.height);

        for ( let y = 0; y < this.tilesY; y++ ) {
          target.fillRect(-offsetX, -offsetY + (y * TILE_SIZE), this.width, .1);

          if ( this.queryGrid(x, y, 'value') !== 0 ) {
            const cr = pointFromTile(x, y);
            target.fillRect(-offsetX + cr.x, -offsetY + cr.y, TILE_SIZE, TILE_SIZE);
          }
        }
      }
    }

    for ( let i = 0; i < objects.length; i++ ) {
      objects[i].renderOverlay(target, delta);
    }

    const [mx, my] = this.minimapScale;
    for ( let i = 0; i < objects.length; i++ ) {
      objects[i].render(target, delta);
    }

    for ( let i = 0; i < this.selectedObjects.length; i++ ) {
      let o = this.selectedObjects[i];
      o.renderSelection(target);
      o.renderHealthBar(target);
    }

    const fow = this.fowContext;
    fow.fillStyle = 'rgb(0, 0, 0)';
    fow.fillRect(0, 0, this.width, this.height);

    fow.globalCompositeOperation = 'destination-out';
    for ( let y = 0; y < this.tilesY; y++ ) {
      for ( let x = 0; x < this.tilesX; x++ ) {
        if ( this.fowGrid[y][x] ) {
          const px = x * TILE_SIZE;
          const py = y * TILE_SIZE;

          fow.fillStyle = 'rgba(0, 255, 0, .5)';
          fow.beginPath();
          fow.arc(px, py, TILE_SIZE + 2, 0, 2 * Math.PI, false);
          fow.fill();

          fow.fillStyle = 'rgba(0, 255, 0, 1)';
          fow.beginPath();
          fow.arc(px, py, TILE_SIZE - 2, 0, 2 * Math.PI, false);
          fow.fill();
        }
      }
    }
    fow.globalCompositeOperation = 'source-over';

    for ( let i = 0; i < this.objects.length; i++ ) {
      const obj = this.objects[i];
      const rect = obj.getRect();

      if ( obj.isMapOverlay() ) {
        obj.sprite.renderScaled(
          mm,
          Math.round(rect.x1 / mx),
          Math.round(rect.y1 / my),
          Math.round((rect.x2 - rect.x1) / mx),
          Math.round((rect.y2 - rect.y1) / my),
          obj.spriteFrame
        );
      } else {
        mm.fillStyle = obj.spriteColor || '#ffffff';
        mm.fillRect(
          Math.floor(rect.x1 / mx),
          Math.floor(rect.y1 / my),
          Math.floor((rect.x2 - rect.x1) / mx),
          Math.floor((rect.y2 - rect.y1) / my)
        );
      }
    }

    if ( this.renderFOW ) {
      target.drawImage(this.fowCanvas, offsetX, offsetY, vw, vh, vx, vy, vw, vh);
      mm.drawImage(this.fowCanvas, 0, 0, this.width, this.height, 0, 0, MINIMAP_SIZE[0], MINIMAP_SIZE[1]);
    }

    mm.strokeStyle = '#ffffff';
    mm.strokeRect(
      Math.round(this.engine.scene.gameX / mx),
      Math.round(this.engine.scene.gameY / my),
      Math.round(vw / mx),
      Math.round(vh / my)
    );

    this.visibleObjects = objects.length;
  }

  /**
   * Updates the Map
   */
  update() {
    this.grid = copy(this.baseGrid);

    for ( let i = 0; i < this.objects.length; i++ ) {
      let o = this.objects[i];
      o.update();

      if ( o.isFriendly() ) { // TODO: Reveal when shooting
        const s = (o.options.Sight || 1);
        for ( let y = -s; y <= s; y++ ) {
          for ( let x = -s; x <= s; x++ ) {
            const dy = Math.min(this.tilesY - 1, Math.max(0, o.tileY + y));
            const dx = Math.min(this.tilesX - 1, Math.max(0, o.tileX + x));

            this.fowGrid[dy][dx] = 1;
          }
        }
      }

      if ( !o.destroying && !o.options.Tiberium ) {
        this.addToGrid(o);
      }
    }
  }

  /**
   * Unselects all active objects
   */
  unselect() {
    this.selectedObjects
      .forEach((obj) => obj.select(false));

    this.selectedObjects = [];
  }

  /**
   * Selects a list of objects
   * @param {MapObject[]} list Object list
   */
  select(list) {
    this.unselect();

    this.selectedObjects = list.map((obj, idx) => {
      obj.select(true, true);
      return obj;
    });
  }

  /**
   * Adds an object to the map
   * @param {MapObject} obj Object
   */
  _addObject(obj) {
    this.objects.push(obj);
    this._sortObjects();
  }

  /**
   * Sorts objects to rendering order
   */
  _sortObjects() {
    if ( this.loaded ) {
      this.objects.sort((a, b) => a.zIndex - b.zIndex);
    }
  }

  /**
   * Adds a effect (overlay) object to the map
   * @param {Object} args Arguments
   * @param {MapObject} [targetObject] Apply effect on an object
   */
  async addEffect(args, targetObject) {
    await Sprite.loadFile(this.engine, args.id);

    args = targetObject ? Object.assign({}, args, {
      tileX: targetObject.tileX,
      tileY: targetObject.tileY,
      xOffset: -targetObject.xOffset,
      yOffset: -targetObject.yOffset
    }) : args;

    this._addObject(new EffectObject(this.engine, args));
  }

  /**
   * Adds a projectile (overlay) object to the map
   * @param {MapObject} from From object
   * @param {MapObject} to To object
   * @param {Object} weapon Weapon
   * @return {MapObject}
   */
  async addProjectile(from, to, weapon) {
    if ( !weapon.Projectile ) {
      return false;
    }

    try {
      await Sprite.loadFile(this.engine, weapon.Projectile.Image);
    } catch ( e ) {}

    return this._addObject(new ProjectileObject(this.engine, from, to, weapon));
  }

  /**
   * Adds a terrain object to the map
   * @param {Object} args Arguments
   */
  async addTerrain(args) {
    try {
      await Sprite.loadFile(this.engine, args.id, this.theatre);
    } catch ( e ) {}

    this._addObject(new TerrainObject(this.engine, args));
  }

  /**
   * Adds an overlay to the map
   * @param {Object} args Arguments
   */
  async addOverlay(args) {
    try {
      await Sprite.loadFile(this.engine, args.id);
    } catch ( e ) {}

    this._addObject(new OverlayObject(this.engine, args));
  }

  /**
   * Adds an object to the map
   * @param {Object} args Arguments
   */
  async addObject(args) {
    try {
      await Sprite.loadFile(this.engine, args.id);
    } catch ( e ) {}

    const obj = args.type === 'structure'
      ? new StructureObject(this.engine, args)
      : new UnitObject(this.engine, args);

    this._addObject(obj);
  }

  /**
   * Removes an object from map
   * @param {MapObject} obj Object instance
   */
  removeObject(obj) {
    if ( obj instanceof MapObject ) {
      const foundSelected = this.selectedObjects.indexOf(obj);
      const found = this.objects.indexOf(obj);
      if ( found !== -1 ) {
        this.objects.splice(found, 1);
      }
      if ( foundSelected !== -1 ) {
        this.selectedObjects.splice(foundSelected, 1);
      }
    }
  }

  /**
   * Peforms an action on given Point
   * @param {String} action Action name
   * @param {*} args Args
   */
  action(action, args) {
    // FIXME
    console.log('Map::action()', action, args);

    let d = tileFromPoint(args.x, args.y);
    const objs = this.selectedObjects.filter((obj) => obj.isFriendly());
    const finder = new PF.AStarFinder({
      heuristic: PF.Heuristic.chebyshev,
      allowDiagonal: true
    });

    const grid = this.grid.map((row) => row.map((col) => {
      const obj = col.object || {};
      return (typeof obj.isUnit === 'function' && obj.isUnit()) ? 0 : col.value;
    }));

    if ( action === 'attack' ) {
      grid[d.tileY][d.tileX] = 0;
    }

    objs.forEach((obj) => {
      const s = tileFromPoint(obj.x, obj.y);
      const finderGrid = new PF.Grid(grid);
      const path = finder.findPath(s.tileX, s.tileY, d.tileX, d.tileY, finderGrid)
        .map((p) => pointFromTile(p[0], p[1]));

      obj.setTarget(null);

      if ( obj.setPath(path, true) ) {
        if ( args instanceof MapObject ) {
          obj.setTarget(args);
        }
      }
    });
  }

  /**
   * Gets all objects from a rectangle
   * @param {Object} rect Rectangle
   * @return {MapObject[]}
   */
  getObjectsFromRect(rect) {
    return this.objects.filter((obj) => collideAABB(rect, obj.getRect()));
  }

  /**
   * Gets all objects from a point
   * @param {Number} x X
   * @param {Number} y Y
   * @param {Boolean} [first=false] Return first only
   * @return {MapObject[]}
   */
  getObjectsFromPosition(x, y, first = false) {
    const method = first ? 'find' : 'filter';
    const result = this.objects[method]((obj) => collidePoint({x, y}, obj.getRect()));
    return first ? (result ? [result] : []) : result;
  }

  /**
   * Gets all objects from a tile
   * @param {Number} x Tile x
   * @param {Number} y Tile y
   * @param {Boolean} [first=false] Return first only
   * @return {MapObject[]}
   */
  getObjectsFromTile(x, y, first = false) {
    const method = first ? 'find' : 'filter';
    const result = this.objects[method]((obj) => obj.tileX === x && obj.tileY === y);
    return first ? (result ? [result] : []) : result;
  }

  /**
   * Adds an object to the grid
   * @param {Object} object The object
   * @param {Number} [value=100] The weight of the tile
   */
  addToGrid(object, value = 100) {
    const {tileX, tileY, sizeX, sizeY} = object;
    const isgo = object instanceof MapObject;
    const pattern = isgo ? object.options.OccupyList : null;
    const entry = {
      id: object.id,
      value,
      object: isgo ? object : null
    };

    if ( pattern ) {
      for ( let y = 0; y < pattern.length; y++ ) {
        for ( let x = 0; x < pattern[y].length; x++ ) {
          if (  pattern[y][x] ) {
            this.grid[tileY + y][tileX + x] = entry;
          }
        }
      }
    } else if ( sizeX && sizeY ) {
      for ( let y = 0; y < sizeY; y++ ) {
        for ( let x = 0; x < sizeX; x++ ) {
          this.grid[tileY + y][tileX + x] = entry;
        }
      }
    } else {
      this.grid[tileY][tileX] = entry;
    }
  }

  /**
   * Queries a grid entry
   * @param {Number} x X
   * @param {Number} y Y
   * @param {String} k Key
   * @param {*} [v] Value
   * @return {*}
   */
  queryGrid(x, y, k, v) {
    const f = this.getGrid(x, y);
    return k ? (typeof v === 'undefined' ? f[k] : f[k] === v) : f;
  }

  /**
   * Gets a grid entry
   * @param {Number} x X
   * @param {Number} y Y
   * @return {Object}
   */
  getGrid(x, y) {
    const d = {value: 0, id: null, object: null};
    return (this.grid[y] ? this.grid[y][x] : null) || d;
  }
}
