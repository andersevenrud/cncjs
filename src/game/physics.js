/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

import {TILE_SIZE} from 'game/globals';

/**
 * Gets new direction based on target
 * @param {Number} current Current Direction
 * @param {Number} target Target Direction
 * @param {Number} speed Turning speed
 * @param {Number} dirs Directions base
 * @return {Number}
 */
export function getNewDirection(current, target, speed, dirs) {

  if ( target > current && target - current < dirs / 2 || target < current && current - target > dirs / 2 ) {
    current = current + speed / 10;
  } else {
    current = current - speed / 10;
  }

  if ( current > dirs - 1 ) {
    current -= dirs - 1;
  } else if ( current < 0 ) {
    current += dirs - 1;
  }

  return current;
}

/**
 * Gets a direction based on angle of direction
 * @param {Object} target Target object
 * @param {Object} source Source object
 * @param {Number} [base=32] Number of directions
 * @return {Number}
 */
export function getDirection(target, source, base = 32) {
  let dx = target.x - source.x;
  let dy = target.y - source.y;
  let angle = base / 2 + Math.round(Math.atan2(dx, dy) * base / (2 * Math.PI));

  if ( angle < 0 ) {
    angle += base;
  }

  if ( angle >= base ) {
    angle -= base;
  }

  return angle;
}

/**
 * Gets tile from a Point
 * @param {Number} x X
 * @param {Number} y Y
 * @return {Object}
 */
export function tileFromPoint(x, y) {
  const tileX = Math.floor(x / TILE_SIZE);
  const tileY = Math.floor(y / TILE_SIZE);
  return {tileX, tileY};
}

/**
 * Gets point from Tile
 * @param {Number} tileX X Tile
 * @param {Number} tileY Y Tile
 * @param {Boolean} [center] Get center ?
 * @return {Object}
 */
export function pointFromTile(tileX, tileY, center) {
  const c = center ? TILE_SIZE / 2 : 0;
  const x = (tileX * TILE_SIZE) + c;
  const y = (tileY * TILE_SIZE) + c;
  return {x, y};
}

/**
 * Gets a tile from index
 * @param {Number} index The index
 * @param {Number} tilesX Tiles in horizontal direction
 * @return {Object}
 */
export function tileFromIndex(index, tilesX) {
  const tileX = index % tilesX;
  const tileY = parseInt(index / tilesX, 10);
  return {tileX, tileY};
}

/**
 * Gets a index from tile
 * @param {Number} tileX X tile
 * @param {Number} tileY Y tile
 * @param {Number} tilesX Tiles in horizontal direction
 * @return {Number}
 */
export function indexFromTile(tileX, tileY, tilesX) {
  return tileY * tilesX + tileX;
}

