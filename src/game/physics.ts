/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Vector } from 'vector2d';
import { Box } from '../engine';

export const CELL_SIZE = 24;

/**
 * Gets vector from map cell
 */
export const pointFromCell = (cell: Vector) => new Vector(
  cell.x * CELL_SIZE,
  cell.y * CELL_SIZE
);

/**
 * Gets map cell from vector
 */
export const cellFromPoint = (point: Vector): Vector => new Vector(
  Math.floor(point.x / CELL_SIZE),
  Math.floor(point.y / CELL_SIZE)
);

/**
 * Gets direction from target and source vector based on slices
 */
export const getDirection = (target: Vector, source: Vector, base = 32): number => {
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
};

export const getNewDirection = (current: number, target: number, speed: number, dirs: number): number => {
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
};

export const getScaledDimensions = (source: Vector, target: Vector): any => { // FIXME
  const sx = 0;
  const sy = 0;
  const sw = source.x;
  const sh = source.y;

  const wR = target.x / sw;
  const hR = target.y / sh;
  const bR = Math.min(wR, hR);

  const dw = Math.trunc(sw * bR);
  const dh = Math.trunc(sh * bR);
  const dx = Math.trunc((target.x - dw) / 2);
  const dy = Math.trunc((target.y - dh) / 2);

  return { sx, sy, sw, sh, dx, dy, dw, dh, bR };
};

export const isRectangleVisible = (box: Box): boolean =>
  (box.x2 - box.x1) > 12 && (box.y2 - box.y1) > 12;

export const getSubCellOffset = (subcell: number, dimension: Vector): Vector => {
  const offset = new Vector(0, 0);

  if (subcell >= 0) {
    const center = dimension.clone() as Vector;
    center.subtract(new Vector(CELL_SIZE / 2, CELL_SIZE / 2));
    offset.add(center);

    if (subcell !== 0) {
      const row = Math.floor((subcell - 1) / 2);
      const col = (subcell - 1) % 2;

      const dx = dimension.x / 2;
      const dy = dimension.y / 2;

      const v = new Vector(
        ((col + 1) %  2) === 1 ? -dx : dx,
        (row + 1) < 2 ? -dy : dy
      );

      offset.add(v);
    }
  }

  return offset;
};

export const findClosestPosition = (source: Vector, positions: Vector[]) => {
  let closest = -1;

  for (let i = 0; i < positions.length; i++) {
    let distance = source.distance(positions[i]);
    if (closest === -1 || distance < closest) {
      closest = i;
    }
  }

  return closest;
};
