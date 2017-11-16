/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import JSZip from 'jszip';
import INI from 'ini';
import {sort, requestArrayBuffer} from '../util';

///////////////////////////////////////////////////////////////////////////////
// CLASS
///////////////////////////////////////////////////////////////////////////////

/**
 * MIX Data Files Class
 */
export default class MIX {

  constructor(engine, filename) {
    this.engine = engine;
    this.zip = null;
    this.data = {};
    this.failed = [];
    this.filename = filename;
    console.log('Mix::constructor()');
  }

  /**
   * Loads all required assets
   */
  async load() {
    console.group('MIX::load()');

    const content = await requestArrayBuffer(this.filename, (p) => {
      this.engine.toggleLoading(true, p);
    });

    const blob = new Blob([content], {type: 'application/zip'});
    const zip = new JSZip();

    this.zip = await zip.loadAsync(blob);
    this.data = Object.freeze(await this.getDataFile('mix.json'));

    Object.keys(this.data).forEach((k) => console.log(k, this.data[k]));

    console.groupEnd();
  }

  getBuildables(buildLevel = -1, techLevel = -1) {
    const levelFilter = (iter) => iter.TechLevel >= techLevel;
    const buildFilter = (iter) => iter.BuildLevel >= buildLevel;

    const filter = (iter) => {
      return !!iter.Icon;
      /*
      return typeof iter.TechLevel === 'undefined'
        ? false
        : (iter.BuildLevel < 90 && iter.TechLevel < 90);
        */
    };

    const getData = (s) => {
      const iter = this.data.structures[s] || this.data.units[s] || this.data.infantry[s] || this.data.aircraft[s];
      return iter;
    };

    const structureKeys = Object.keys(this.data.structures).filter(s => filter(this.data.structures[s]));
    const unitKeys = Object.keys(this.data.infantry).filter(s => filter(this.data.infantry[s]))
      .concat(Object.keys(this.data.units).filter(s => filter(this.data.units[s])))
      .concat(Object.keys(this.data.aircraft).filter(s => filter(this.data.aircraft[s])));

    const result = {
      structures: structureKeys.map(getData),
      units: unitKeys.map(getData)
    };

    sort(result.structures, 'BuildLevel');
    sort(result.units, 'BuildLevel');

    if ( techLevel >= 0 ) {
      result.structures = result.structures.filter(levelFilter);
      result.units = result.units.filter(levelFilter);
    }

    if ( buildLevel >= 0 ) {
      result.structures = result.structures.filter(buildFilter);
      result.units = result.units.filter(buildFilter);
    }

    return result;
  }

  getLevel(name) {
    return this.data.levels[name];
  }

  getObject(id) {
    return this.data.units[id] || this.data.infantry[id] || this.data.structures[id];
  }

  getOverlay(id) {
    return this.data.overlays[id];
  }

  getTerrain(id) {
    return this.data.terrain[id];
  }

  getTile(id) {
    return this.data.tiles[id];
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
    } else if ( filename.match(/\.ini$/) ) {
      type = 'string';
      parse = (d) => INI.decode(d);
      console.log('Parsing INI', filename);
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
      console.error(filename, e);
    }

    return null;
  }

}

