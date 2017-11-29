/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

/**
 * Loads an image
 * @param {String} src Image URI
 * @return {Promise<Image, Error>}
 */
export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
    img.src = src;
  });
}

/**
 * Get a random whole number
 * @param {Number} [min=0] Minimum
 * @param {Number} [max=Number.MAX_VALUE] Maximum
 * @return {Number}
 */
export function randomInteger(min = 0, max = Number.MAX_VALUE) {
  return Math.round(Math.random() * (max - min) + min);
}

/**
 * Gets a random entry from array
 * @param {Array} arr Array
 * @return {*} Resulted item
 */
export function randomFromArray(arr) {
  const i = randomInteger(0, arr.length - 1);
  return arr[i];
}

/**
 * Get a parameter from query string
 * @param {String} [q] parameter to extract
 * @param {String} [search] string to use
 * @return {String}
 */
export function queryParameter(q, search) {
  search = search || window.location.search;

  let hashes = search.slice(search.indexOf('?') + 1).split('&');
  const result = hashes.reduce((params, hash) => {
    let [key, val] = hash.split('=');
    return Object.assign(params, {[key]: decodeURIComponent(val)});
  }, {});

  return q ? result[q] : result;
}

/**
 * Remove duplicates from array
 * @param {Array} inp Input array
 * @return {Array}
 */
export function unique(inp) {
  return inp.filter((elem, pos, arr) => {
    return arr.indexOf(elem) === pos;
  });
}

/**
 * Copies a 2D array
 * @param {Array} arr Array
 * @return {Array}
 */
export function copy(arr) {
  return arr.map((a) => a.slice(0));
}

/**
 * Sorts an array of objects
 * @param {Array} arr Array
 * @param {String} key Key
 * @return {Array}
 */
export function sort(arr, key) {
  arr.sort((a, b) => {
    return (a[key] > b[key]) ? 1 : ((b[key] > a[key]) ? -1 : 0);
  });

  return arr;
}

/**
 * Creates a HTTP request and downloads as ArrayBuffer
 * @param {String} uri Destination
 * @param {Function} [progress] Progress callback
 * @return {Promise<ArrayBuffer, Error>}
 */
export function requestArrayBuffer(uri, progress = null) {
  progress = progress || function() {};

  return new Promise((resolve, reject) => {
    const req = new XMLHttpRequest();
    req.open('GET', uri, true);
    req.responseType = 'arraybuffer';

    req.addEventListener('progress', (ev) => {
      if ( ev.lengthComputable ) {
        const p = (ev.loaded / ev.total) * 100;
        progress(p);
      }
    });

    req.addEventListener('load', () => {
      progress(100);
      resolve(req.response);
    });

    req.addEventListener('error', (ev) => reject(ev));

    req.send(null);
  });
}
