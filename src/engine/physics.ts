/**
 * tesen - Simple TypeScript 2D Canvas Game Engine
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Vector } from 'vector2d';

export interface Box {
  x1: number;
  x2: number;
  y1: number;
  y2: number;
}

/**
 * Checks if boxes intersects
 */
export const collideAABB = (a: Box, b: Box): boolean =>
  (a.x1 < b.x2) &&
  (a.x2 > b.x1) &&
  (a.y1 < b.y2) &&
  (a.y2 > b.y1);

/**
 * Checks if vector intersects with box
 */
export const collidePoint = (point: Vector, box: Box): boolean =>
  (point.x >= box.x1) &&
  (point.x <= box.x2) &&
  (point.y >= box.y1) &&
  (point.y <= box.y2);

/**
 * Gets a random integer min/max-ed
 */
export const randomBetweenInteger = (min: number, max: number): number =>
  Math.floor(Math.random() * max) + min;

/**
 * Gets the number with the nearest N
 */
export const roundToNearest = (num: number, near: number = 1.0): number =>
  Math.round(num / near) * near;
