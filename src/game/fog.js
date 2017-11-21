/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import {TILE_SIZE} from './globals';

/**
 * Game Map Fog Class
 */
export default class Fog {

  /**
   * @param {Engine} engine Game Engine reference
   * @param {Map} map Map reference
   */
  constructor(engine, map) {
    this.visible = engine.options.debug === 0; // FIXME: For debugging
    this.canvas = document.createElement('canvas');
    this.context = this.canvas.getContext('2d');
    this.engine = engine;
    this.map = map;
    this.grid = [];
  }

  /**
   * Loads the fog
   */
  async load() {
    const {width, height, tilesX, tilesY} = this.map;
    this.canvas.width = width;
    this.canvas.height = height;
    this.context.fillStyle = 'rgba(0, 0, 0, 1)';
    this.context.fillRect(0, 0, width, height);
    this.grid = Array(...Array(tilesY)).map(() => Array(tilesX));
  }

  /**
   * Updates the Fog
   */
  update() {
    const {tilesX, tilesY, objects} = this.map;

    for ( let i = 0; i < objects.length; i++ ) {
      let o = objects[i];
      if ( o.isFriendly() ) { // TODO: Reveal when shooting
        const s = (o.options.Sight || 1);
        for ( let y = -s; y <= s; y++ ) {
          for ( let x = -s; x <= s; x++ ) {
            const dy = Math.min(tilesY - 1, Math.max(0, o.tileY + y));
            const dx = Math.min(tilesX - 1, Math.max(0, o.tileX + x));

            this.grid[dy][dx] = 1;
          }
        }
      }
    }
  }

  /**
   * Draws the Fog onto target
   *
   * @param {CanvasRenderingContext2D} target Render context
   * @param {Number} delta Render delta time
   */
  render(target, delta) {
    const fow = this.context;
    const {width, height, tilesX, tilesY} = this.map;

    fow.fillStyle = 'rgb(0, 0, 0)';
    fow.fillRect(0, 0, width, height);

    fow.globalCompositeOperation = 'destination-out';
    for ( let y = 0; y < tilesY; y++ ) {
      for ( let x = 0; x < tilesX; x++ ) {
        if ( this.grid[y][x] ) {
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

    if ( !this.engine.options.debugMode || this.visible ) {
      const {vx, vy, vw, vh} = this.engine.getViewport();
      const {offsetX, offsetY} = this.engine.getOffset();
      target.drawImage(this.map.fog.canvas, offsetX, offsetY, vw, vh, vx, vy, vw, vh);
    }
  }

  /**
   * Checks if current tile is visible in the fog
   * @param {Number} x Tile X
   * @param {Number} y Tile Y
   * @return {Boolean}
   */
  getVisibility(x, y) {
    return this.grid[y] ? this.grid[y][x] === 1 : false;
  }

}
