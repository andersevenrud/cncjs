/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import JSZip from 'jszip';
import {requestArrayBuffer} from '../util';

///////////////////////////////////////////////////////////////////////////////
// CLASS
///////////////////////////////////////////////////////////////////////////////

/**
 * Zip Data Files Class
 */
export default class Zip {

  constructor(engine, filename) {

    /**
     * Game Engine reference
     * @type {Engine}
     */
    this.engine = engine;

    /**
     * Zip Archive
     * @type {ZipObject}
     */
    this.zip = null;

    /**
     * List of failed files
     * @type {String[]}
     */
    this.failed = [];

    /**
     * Archive filename
     * @type {String}
     */
    this.filename = filename;

    console.log('Zip::constructor()');
  }

  /**
   * Loads all required assets
   */
  async load() {
    console.group('Zip::load()');

    const content = await requestArrayBuffer(this.filename, (p) => {
      this.engine.toggleLoading(true, p, 'Downloading asset archive');
    });

    const blob = new Blob([content], {type: 'application/zip'});
    const zip = new JSZip();

    this.zip = await zip.loadAsync(blob);

    console.groupEnd();
  }

  /**
   * Gets a file from game data archive
   * @param {String} filename The filename
   * @return {String|Object}
   */
  async getDataFile(filename) {
    if ( this.failed.indexOf(filename) !== -1 ) {
      console.warn('Skipping loading of', filename, 'because a previous attempt failed...');
      return null;
    }

    let type = 'base64';
    let mime = 'application/octet-stream';
    let parse = false;

    if ( filename.match(/\.png$/) ) {
      mime = 'image/png';
      type = 'blob';
    } else if ( filename.match(/\.wav$/) ) {
      mime = 'audio/x-wav';
      type = 'uint8array';
    } else if ( filename.match(/\.json$/) ) {
      type = 'string';
      parse = (d) => JSON.parse(d);
    /*} else if ( filename.match(/\.ini$/) ) {
      type = 'string';
      parse = (d) => INI.decode(d);
      console.log('Parsing INI', filename);*/
    } else if ( filename.match(/\.(bin|pal)$/) ) {
      type = 'uint8array';
    }

    try {
      const raw = await this.zip.file(filename).async(type);
      if ( type === 'blob' ) {
        return raw;
      } else if ( type === 'base64' ) {
        return `data:${mime};base64,${raw}`;
      } else if ( parse ) {
        return parse(raw);
      }

      return raw;
    } catch ( e ) {
      this.failed.push(filename);
      console.warn(filename, e);
    }

    return null;
  }

}

