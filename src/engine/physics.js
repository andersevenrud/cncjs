/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

/**
 * Axis-Aligned Bounding Box collision test
 * @param {Object} rect Rectangle
 * @param {Object} obj Object (rectangle)
 * @return {Boolean}
 */
export function collideAABB(rect, obj) {
  return (rect.x1 < obj.x2) &&
    (rect.x2 > obj.x1) &&
    (rect.y1 < obj.y2) &&
    (rect.y2 > obj.y1);
}

/**
 * Point collision test
 * @param {Object} point Point
 * @param {Object} obj Object (rectangle)
 * @return {Boolean}
 */
export function collidePoint(point, obj) {
  return (point.x >= obj.x1) &&
    (point.x <= obj.x2) &&
    (point.y >= obj.y1) &&
    (point.y <= obj.y2);
}
