/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

//
// THIS IS A WORK IN PROGRESS AND QUITE UGLY
// YOU HAVE BEEN WARNED!
//

const fs = require('fs-extra');
const path = require('path');
const imageSize = require('image-size');
const INI = require('ini');

///////////////////////////////////////////////////////////////////////////////
// CONFIGURATION STUFF
///////////////////////////////////////////////////////////////////////////////

const ATTRIBUTE_TYPES = {
  Verses: 'array',
  Owner: 'array',
  TurningSpeed: 'integer',
  MovementType: 'integer',
  Speed: 'integer',
  TurnSpeed: 'integer',
  Armor: 'integer',
  Cost: 'integer',
  BuildLevel: 'integer',
  Sight: 'integer',
  Infiltrate: 'boolean',
  IsCivilian: 'boolean',
  IsWanderer: 'boolean',
  FemaleCiv: 'boolean',
  CycleGraphics: 'boolean',
  Clocked: 'boolean',
  TechLevel: 'integer',
  PrimaryWeapon: 'string',
  SecondaryWeapon: 'string',
  IsLarge: 'boolean',
  NoTurretLock: 'boolean',
  AttackAnimation: 'boolean',
  AutoRotatingTurret: 'boolean',
  IsCrewed: 'boolean',
  Buildable: 'boolean',
  FiresTwice: 'boolean',
  HasTurret: 'boolean',
  Invulnerable: 'boolean',
  Harvests: 'boolean',
  Crusher: 'boolean',
  Crushable: 'boolean',
  IsTransport: 'boolean',
  ShownName: 'boolean',
  IsDinosaur: 'boolean',
  Prerequisites: 'string',
  DeathAnimation: 'string',
  Selectable: 'boolean',
  ValidTarget: 'boolean',
  Airplane: 'boolean',
  Damage: 'integer',
  Range: 'float',
  CanTurn: 'boolean',
  CantTurn: 'boolean',
  Cloaked: 'boolean',
  CanBeCaptured: 'boolean',
  CanBePrimary: 'boolean',
  Ammo: 'integer',
  HitPoints: 'integer',
  NameID: 'integer',
  OverlapList: 'string',
  OccupyList: 'string',
  HideTrueName: 'boolean',
  HasBib: 'boolean',
  Repairable: 'boolean',
  PowerDrain: 'integer',
  PowerProduction: 'integer',
  Sensors: 'boolean',
  TheaterSensitive: 'boolean',
  WallSpecial: 'boolean',
  TiberiumStorage: 'boolean',
  MuzzleFlash: 'boolean',
  ROF: 'integer',
  AA: 'boolean',
  Arcing: 'boolean',
  BulletSpeed: 'integer',
  High: 'boolean',
  Inaccurate: 'boolean',
  Invisible: 'boolean',
  NoRotation: 'boolean',
  RotationSpeed: 'integer',
  SmokeTrail: 'boolean',
  InfantryDeath: 'integer',
  Spread: 'integer',
  TargetWalls: 'integer',
  TargetWood: 'integer',
  NameID: 'integer',
  NameId: 'integer',
  X: 'integer',
  Y: 'integer',
  SecondaryTypeCells: 'integer[]',
  PrimaryTypeCells: 'integer[]',
  CarryOverCap: 'boolean',
  CarryOverMoney: 'boolean',
  Intro: 'string',
  BuildLevel: 'integer',
  Percent: 'integer',
  Allies: 'array',
  FlagHome: 'integer',
  FlagLocation: 'integer',
  MaxBuilding: 'integer',
  MaxUnit: 'integer',
  Credits: 'integer',
  StartFacing: 'integer',
  Unknown5: 'integer'
};

const SMALL_UNITS = ['stnk', 'apc', 'arty', 'bggy', 'bike', 'ftnk', 'ltnk', 'jeep', 'mhq', 'mlrs', 'msam'];
const LARGE_UNITS = ['lst', 'mcv', 'htnk', 'c17', 'harv', 'a10', 'tran'];

const SPRITE_SIZES = {
  squish: [15, 9],
  wcrate: [10, 11],
  scrate: [10, 11],
  boat: [51, 19],
  heli: [46, 29],
  mtnk: [36, 36],
  orca: [36, 25]
};

///////////////////////////////////////////////////////////////////////////////
// GLOBALS
///////////////////////////////////////////////////////////////////////////////

const ROOT = process.cwd();
const SRC = path.resolve(ROOT, 'src/data');
const DEST = path.resolve(ROOT, '.tmp/');
//const DIST = path.resolve(ROOT, 'dist');

const INI_FILES = [
  'colors.ini', 'themes.ini', 'grids.ini',
  'aircraft.ini', 'units.ini', 'infantry.ini', 'structs.ini',
  'overlay.ini', 'terrain.ini', 'tilesets.ini',
  'infanims.ini', 'stranims.ini',
  'weapons.ini', 'bullets.ini', 'warheads.ini',
  'mission.ini'
];

const INIS = {};
const TREE = {
  themes: {},
  aircraft: {},
  units: {},
  infantry: {},
  structures: {},
  overlays: {},
  terrain: {},
  tiles: {},
  sprites: {},
  levels: {},
  tileIndex: []
};

INI_FILES.forEach((filename) => {
  console.log('Reading', filename);
  INIS[filename.replace('.ini', '')] = INI.decode(fs.readFileSync(path.join(SRC, filename), 'utf8'));
});

const parseInteger = (val) => {
  return String(val).match(/h$/) ? parseInt(val, 16) : parseInt(val, 10);
};

function tileFromIndex(index, tilesX) {
  const tileX = index % tilesX;
  const tileY = parseInt(index / tilesX, 10);
  return {tileX, tileY};
}

///////////////////////////////////////////////////////////////////////////////
// GENERAL
///////////////////////////////////////////////////////////////////////////////

const buildFilter = (iter) => {
  return typeof iter.TechLevel === 'undefined'
    ? false
    : (iter.BuildLevel < 90 && iter.TechLevel < 90);
};

const parseObjectAttributeValue = (name, value) => {
  const type = ATTRIBUTE_TYPES[name];
  const lcValues = ['DeathAnimation', 'MuzzleFlash', 'Explosion', 'Image', 'Report', 'Prerequisites', 'Action', 'Brief', 'Lose', 'Win'];

  if ( type === 'integer' ) {
    value = parseInteger(value);
  } else if ( type === 'float' ) {
    value = parseFloat(value);
  } else if ( type === 'boolean' ) {
    value = value === 'Yes' || value === '1';
  } else if ( type === 'string' ) {
    value = value === 'None' ? null : value;
  } else if ( type === 'array' ) {
    value = value === 'None' ? [] : value.split(',');
  } else if ( type === 'integer[]' ) {
    value = value === 'None' ? [] : value.split(',').map(parseInteger);
  }

  return (lcValues.indexOf(name) !== -1 && typeof value === 'string' ? value.toLowerCase() : value);
};

const parseObjectAttributes = (attributes, allow = []) => {
  const result = {};
  if ( attributes ) {
    Object.keys(attributes).forEach((name) => {
      if ( name.match(/^Unknown/) && allow.indexOf(name) === -1 ) {
        return;
      }

      const value = parseObjectAttributeValue(name, attributes[name]);
      result[name] = value;
    });
  }

  return result;
};

const parseObjectWeapon = (options, key) => {
  let result = null;

  const weaponName = options[key];
  if ( weaponName ) {
    const weapon = INIS.weapons[weaponName];
    if ( weapon ) {
      const projectileName = weapon.Projectile;
      const projectile = INIS.bullets[projectileName];
      const warheadName = projectile.Warhead;
      const warhead = INIS.warheads[warheadName];

      result = parseObjectAttributes(INIS.weapons[weaponName]);
      result.Projectile = parseObjectAttributes(projectile, ['Unknown5']);

      if ( result.Projectile ) {
        result.Projectile.Warhead = parseObjectAttributes(warhead);
      }
    }
  }

  return result;
};

const parseObjectOccupance = (list) => {
  const map = {'x': 1, '-': 2, '*': 3};

  if ( list ) {
    const result = Object.keys(list)
      .filter((s) => s.match(/^\d/))
      .map((s) => list[s])
      .map((str) => {
        return str.split('').map((s) => map[s] || 0);
      });

    return result;
  }

  return null;
};

const addObjectOccupance = (result) => {
  if ( result.OccupyList ) {
    result.OccupyList = parseObjectOccupance(INIS.grids[result.OccupyList]);
  }
  if ( result.OverlapList ) {
    result.OverlapList = parseObjectOccupance(INIS.grids[result.OverlapList]);
  }
  if ( result.ExitList ) {
    result.ExitList = parseObjectOccupance(INIS.grids[result.ExitList]);
  }
};

const parseObjectOptions = (rawOptions, anims, iterName) => {
  const result = parseObjectAttributes(rawOptions);
  if ( result.PrimaryWeapon ) {
    result.PrimaryWeapon = parseObjectWeapon(result, 'PrimaryWeapon');
  }
  if ( result.SecondaryWeapon ) {
    result.SecondaryWeapon = parseObjectWeapon(result, 'SecondaryWeapon');
  }

  if ( result.SequenceInfo ) {
    if ( anims ) {
      const sequences = parseObjectAttributes(INIS[anims][result.SequenceInfo]);
      Object.keys(sequences).forEach((k) => {
        const [offset, frames, multi] = sequences[k].split(',').map(i => parseInt(i, 10));
        sequences[k] = {frames, offset, multi};
      });

      result.SequenceInfo = sequences;
    } else {
      result.SequenceInfo = false;
    }
  } else if ( iterName ) {
    const strAnims = INIS[anims];
    if ( strAnims ) {
      const found = Object.values(strAnims.StructureAnimations).filter((n) => {
        return strAnims[n].Structure === iterName;
      });

      if ( found.length ) {
        result.SequenceInfo = {};

        found.forEach((f) => {
          result.SequenceInfo[f.split('_')[1]] = {
            offset: parseInt(strAnims[f].StartFrame, 10),
            frames: parseInt(strAnims[f].Frames, 10),
            delay: parseInt(strAnims[f].Delay, 10)
          };
        });
      }
    }
  }

  addObjectOccupance(result);

  return result;
};

///////////////////////////////////////////////////////////////////////////////
// LEVELS
///////////////////////////////////////////////////////////////////////////////

const parseOverlays = (metadata, diffX, diffY) => {
  const overlays = Object.keys(metadata.OVERLAY || {});

  return overlays.map((pos) => {
    const id = metadata.OVERLAY[pos];
    const {tileX, tileY} = tileFromIndex(parseInt(pos, 10), 64);

    return {
      type: 'overlay',
      tileX: tileX - diffX,
      tileY: tileY - diffY,
      id: id.toLowerCase()
    };
  });
};

const parseTerrain = (metadata, diffX, diffY) => {

  return Object.keys(metadata.TERRAIN || {}).map((pos) => {
    const [id] = metadata.TERRAIN[pos].split(',');
    const {tileX, tileY} = tileFromIndex(parseInt(pos, 10), 64);

    return {
      type: 'terrain',
      tileX: tileX - diffX,
      tileY: tileY - diffY,
      id: id.toLowerCase()
    };
  });
};

const parseSmudge = (metadata, diffX, diffY) => {

  return Object.keys(metadata.SMUDGE || {}).map((pos) => {
    const [id] = metadata.SMUDGE[pos].split(',');
    const {tileX, tileY} = tileFromIndex(parseInt(pos, 10), 64);

    return {
      type: 'smudge',
      tileX: tileX - diffX,
      tileY: tileY - diffY,
      id: id.toLowerCase()
    };
  });
};

const parseCellTriggers = (metadata, diffX, diffY) => {
  return metadata.CellTriggers || {};
};

const parseBase = (metadata, diffX, diffY) => {
  return Object.keys(metadata.Base || {}).filter(k => !isNaN(k)).map((pri) => {
    const [id, pos] = metadata.Base[pri].split(',');
    return {
      id: id.toLowerCase(),
      pos // TODO
    };
  });
};

const parseTriggers = (metadata, diffX, diffY) => {
  const triggers = {};
  Object.keys(metadata.Triggers || {}).forEach((name) => {
    const [action, result, counter, player, teamtype, activate] = metadata.Triggers[name].split(',');

    triggers[name] = {
      action,
      result,
      counter: parseInt(counter, 10),
      player,
      teamtype,
      activate: parseInt(activate, 10)
    };
  });
  return triggers;
};

const parseTeamTypes = (metadata, diffX, diffY) => {
  const result = {};
  Object.keys(metadata.TeamTypes || {}).forEach((name) => {
    const params = metadata.TeamTypes[name].split(',');
    const player = params.splice(0, 1)[0];
    const numbers = params.splice(0, 9).map(i => parseInt(i, 10));
    const unitCount = parseInt(params.splice(0, 1)[0], 10);
    const units = params.splice(0, unitCount).map((s) => {
      const [unit, count] = s.split(':', 2);
      return {
        unit: unit.toLowerCase(),
        count: parseInt(count, 10)
      };
    });
    const actionCount = parseInt(params.splice(0, 1)[0], 10);
    const actions = params.splice(0, actionCount).map((s) => {
      const [action, waypoint] = s.split(':', 2);
      return {
        action,
        waypoint: parseInt(waypoint, 10)
      };
    });
    const [replace, produce] = params.splice(0, 2).map(i => parseInt(i, 10));

    result[name] = {
      player,
      numbers,
      units,
      actions,
      replace,
      produce
    };
  });

  return result;
};

const parseReinforcements = (metadata, diffX, diffY) => {
  return Object.keys(metadata.REINFORCEMENTS || {}).map((num) => {
    const [player, id, location, loop] = metadata.REINFORCEMENTS[num].split(',');

    return {
      player,
      id: id.toLowerCase(),
      location,
      loop
    };
  });
};

const parseWaypoints = (metadata, diffX, diffY) => {
  const result = [];
  Object.keys(metadata.Waypoints || {}).forEach((index) => {
    const cell = parseInt(metadata.Waypoints[index], 10);
    if ( cell === -1 ) {
      result[parseInt(index, 10)] = null;
    } else {
      const {tileX, tileY} = tileFromIndex(parseInt(cell, 10), 64);
      result[parseInt(index, 10)] = [tileX - diffX, tileY - diffY];
    }
  });
  return result;
};

const parseEntities = (metadata, diffX, diffY) => {
  /*eslint no-unused-vars: "off"*/ // FIXME

  const teams = ['GoodGuy', 'BadGuy'];
  const result = [];

  result.push(Object.keys(metadata.UNITS).map((k) => {
    const [owner, type, health, cell, direction, action, trigger] = metadata.UNITS[k].split(',');
    const {tileX, tileY} = tileFromIndex(parseInt(cell, 10), 64);

    return {
      id: type.toLowerCase(),
      type: 'unit',
      direction: parseInt(direction, 10) || 0,
      team: teams.indexOf(owner),
      tileX: tileX - diffX,
      tileY: tileY - diffY
    };
  }));

  result.push(Object.keys(metadata.INFANTRY).map((k) => {
    const [owner, type, health, cell, subcell, action, direction, trigger] = metadata.INFANTRY[k].split(',');
    const {tileX, tileY} = tileFromIndex(parseInt(cell, 10), 64);

    return {
      id: type.toLowerCase(),
      type: 'infantry',
      direction: parseInt(direction, 10) || 0,
      team: teams.indexOf(owner),
      tileS: parseInt(subcell, 10),
      tileX: tileX - diffX,
      tileY: tileY - diffY
    };
  }));

  result.push(Object.keys(metadata.STRUCTURES).map((k) => {
    const [owner, type, health, cell, direction, action, trigger] = metadata.STRUCTURES[k].split(',');
    const {tileX, tileY} = tileFromIndex(parseInt(cell, 10), 64);

    return {
      id: type.toLowerCase(),
      type: 'structure',
      team: teams.indexOf(owner),
      tileX: tileX - diffX,
      tileY: tileY - diffY
    };
  }));

  return Array.prototype.concat(...result);
};

const parseTiles = (mapRaw, diffX, diffY) => {
  const tileTable = TREE.tiles;
  const result = [];
  let i = 0;

  for ( let y = 0; y < 64; y++ ) {
    let row = [];
    for ( let x = 0; x < 64; x++ ) {
      if ( x >= diffX ) {
        let v = mapRaw[i] % 255;
        let j = mapRaw[i + 1];
        let n = TREE.tileIndex[v];

        let p = typeof tileTable[n].Passable === 'boolean'
          ? tileTable[n].Passable
          : tileTable[n].Passable.length ? tileTable[n].Passable.indexOf(j) !== -1 : false;

        row.push([n, j, v, p ? 1 : 0]);
      }

      i += 2;
    }

    if ( y >= diffY && row.length ) {
      result.push(row);
    }
  }

  return result;
};

const parseLevel = (name) => {
  const metadata = INI.decode(fs.readFileSync(path.resolve(SRC, 'GENERAL.MIX', name + '.ini'), 'utf8'));
  const mapRaw = fs.readFileSync(path.resolve(SRC, 'GENERAL.MIX', name + '.bin'));

  const theater = metadata.MAP.Theater.toLowerCase();
  const tilesX = parseInt(metadata.MAP.Width, 10);
  const tilesY = parseInt(metadata.MAP.Height, 10);
  const diffX = parseInt(metadata.MAP.X, 10);
  const diffY = parseInt(metadata.MAP.Y, 10);

  const isInsideMap = (o) => {
    return (o.tileX >= 0 && o.tileY >= 0) && (o.tileX <= tilesX && o.tileY <= tilesY);
  };

  const {startX, startY} = tileFromIndex(parseInt(metadata.MAP.TacticalPos, 10), 64);
  const brief = INIS.mission[name.toUpperCase()];

  const result = {
    width: tilesX,
    height: tilesY,
    id: name,
    theater,
    diffX,
    diffY,
    info: parseObjectAttributes(metadata.BASIC || metadata.Basic),
    brief: brief ? Object.values(brief) : [],
    players: {
      GoodGuy: parseObjectAttributes(metadata.GoodGuy),
      BadGuy: parseObjectAttributes(metadata.BadGuy),
      Neutral: parseObjectAttributes(metadata.Neutral),
      Special: parseObjectAttributes(metadata.Special)
    },
    tacticalPos: {
      tileX: startX - diffX,
      tileY: startY - diffY
    },
    base: parseBase(metadata, diffX, diffY),
    teamTypes: parseTeamTypes(metadata, diffX, diffY),
    reinforcements: parseReinforcements(metadata, diffX, diffY),
    waypoints: parseWaypoints(metadata, diffX, diffY),
    cellTriggers: parseCellTriggers(metadata, diffX, diffY),
    triggers: parseTriggers(metadata, diffX, diffY),
    smudge: parseSmudge(metadata, diffX, diffY).filter(isInsideMap),
    overlays: parseOverlays(metadata, diffX, diffY).filter(isInsideMap),
    entities: parseEntities(metadata, diffX, diffY).filter(isInsideMap),
    tiles: parseTiles(mapRaw, diffX, diffY),
    terrain: parseTerrain(metadata, diffX, diffY).filter(isInsideMap)
  };

  return result;
};

const parseLevels = () => {
  fs.readdirSync(path.resolve(SRC, 'GENERAL.MIX')).filter((i) => {
    return i.match(/\.ini/);
  }).forEach((filename) => {
    const name = filename.replace('.ini', '');
    const level = parseLevel(name);
    TREE.levels[name] = level;
  });
};

///////////////////////////////////////////////////////////////////////////////
// OBJECTS
///////////////////////////////////////////////////////////////////////////////

const parseObjectList = (treeName, type, key, anims) => {
  const names = Object.values(INIS[type][key]);
  names.forEach((name) => {
    const realName = name.toLowerCase();
    const options = parseObjectOptions(INIS[type][name], anims, name);

    // NOTE: These properties are non-standard!
    options.Id = realName;
    options.Type = treeName.replace(/s$/, '');
    if ( buildFilter(options) ) {
      options.Icon = realName + 'icnh';
    }

    TREE[treeName][realName] = options;
  });
};

const parseTerrainList = () => {
  const terrainNames = Object.values(INIS.terrain.Terrain);
  terrainNames.forEach((name) => {
    const realName = name.toLowerCase();
    const options = parseObjectOptions(INIS.terrain[name]);
    TREE.terrain[realName] = options;
  });
};

const parseOverlayList = () => {
  const overlayNames = Object.values(INIS.overlay.Overlay);
  overlayNames.forEach((name) => {
    const realName = name.toLowerCase();
    const options = parseObjectOptions(INIS.overlay[name]);

    TREE.overlays[realName] = Object.assign({}, options, {
      Tiberium: parseInt(options.NameId, 10) === 66
    });
  });
};

const parseTileList = () => {
  const tileNames = Object.values(INIS.tilesets.TileSets);
  tileNames.forEach((name) => {
    const realName = name.toLowerCase();
    const options = parseObjectOptions(INIS.tilesets[name]);

    let passable = [];
    const stc = options.SecondaryTypeCells;
    const st = options.SecondaryType;
    const pt = options.PrimaryType;

    if ( ['Clear', 'Beach'].indexOf(st) !== -1 && stc.length ) {
      passable = stc.map(parseInteger);
    } else if ( pt === 'Clear' ) {
      passable = true;
    }

    options.Passable = passable;

    TREE.tiles[realName] = options;
  });

  TREE.tileIndex = tileNames.map(s => s.toLowerCase());
};

///////////////////////////////////////////////////////////////////////////////
// SPRITES
///////////////////////////////////////////////////////////////////////////////

const getSpriteInfo = (name, sx, sy, type, pixels) => {
  const image = path.resolve(DEST, `sprites/${name}.png`);
  const objWidth = pixels ? sx : sx * 24;
  const objHeight = pixels ? sy : sy * 24;

  if ( fs.existsSync(image) ) {
    const {height} = imageSize(image);
    return {
      type,
      size: [objWidth, objHeight],
      count: height / objHeight
    };
  }

  return null;
};

const generateSpriteList = () => {
  const base = JSON.parse(fs.readFileSync(path.join(SRC, 'sprites.json'), 'utf8'));
  base.forEach((iter) => {
    const info = getSpriteInfo(iter.name, iter.size[0], iter.size[1], iter.type, true);
    TREE.sprites[iter.name] = {
      type: iter.type,
      size: iter.size,
      count: iter.count || (info ? info.count : 0) || 1
    };
  });

  // FIXME: Load counds from image instead
  // Loads infantry entity thingies
  // We can sort of automate this since they all share some common
  // attributes
  const infantry = {
    e: [532, 660, 548, 660, 248],
    c: [375, 375, 375, 375, 375, 375, 375, 375, 375, 375],
    chan: 375,
    delphi: 375,
    moebius: 257,
    rmbo: 468
  };

  Object.keys(infantry).forEach((k) => {
    let counts = infantry[k];
    if ( typeof counts === 'number' ) {
      TREE.sprites[k] = {
        type: 'infantry',
        size: [50, 39],
        clip: [26, 16], //[16, 16, 6, 16],
        count: counts
      };
    } else {
      for ( let i = 0; i < counts.length; i++ ) {
        TREE.sprites[k + String(i + 1)] = {
          type: 'infantry',
          size: [50, 39],
          clip: [26, 16, 6, 16], //[16, 16, 6, 16],
          count: counts[i]
        };
      }
    }
  });

  // FIXME: Load count from sprite instead
  // Civilian buildings
  for ( let i = 0; i < 18; i++ ) {
    TREE.sprites['v' + String(i + 1).padStart(2, 0)] = {
      type: 'structure',
      size: i < 4 ? [48, 48] : (i < 7 ? [48, 24] : [24, 24]),
      count: 3
    };
  }

  // FIXME: Load count from sprite instead
  // Loads some effects
  const directions = ['e', 'n', 'ne', 'nw', 's', 'e', 'se', 'sw', 'w'];
  const effects = ['chem', 'flame'];

  effects.forEach((e) => {
    directions.forEach((d) => {
      TREE.sprites[`${e}-${d}`] = {
        type: 'overlay',
        size: [79, 79],
        count: 13
      };
    });
  });

  const makeCounts = {
    atwr: 14,
    afld: 14,
    bio: 16,
    fact: 32,
    pump: 32,
    sam: 30,
    tmpl: 36
  };

  Object.keys(TREE.structures).forEach((name) => {
    const [sx, sy] = TREE.structures[name].Dimensions.split('x');
    const buildable =  TREE.structures[name].Buildable;
    const info = getSpriteInfo(name, parseInt(sx, 10), parseInt(sy, 10));
    if ( info ) {
      TREE.sprites[name] = info;
      if ( buildable ) {
        TREE.sprites[name + 'make'] = {
          type: 'overlay',
          name: name + 'make',
          size: info.size,
          count: makeCounts[name] || 20
        };
      }
    }
  });

  Object.keys(TREE.overlays).forEach((name) => {
    if ( !TREE.sprites[name] ) {
      const size = SPRITE_SIZES[name] || [24, 24];
      const info = getSpriteInfo(name, size[0], size[1], 'overlay', true);
      if ( info ) {
        TREE.sprites[name] = info;
      }
    }
  });

  Object.keys(TREE.tiles).forEach((name) => {
    if ( !TREE.sprites[name] ) {
      const td = TREE.tiles[name];
      TREE.sprites[name] = {
        type: 'tile',
        size: [24, 24],
        count: name === 'clear1' ? (4 * 4) : parseInt(td.X, 10) * parseInt(td.Y, 10)
      };
    }
  });

  ['TEMPERAT.MIX', 'DESERT.MIX', 'WINTER.MIX'].forEach((mix) => {
    Object.keys(TREE.terrain).forEach((name) => {
      if ( !TREE.sprites[name] ) {
        let size = [24, 24];
        let num = parseInt(name.replace(/[A-z]/g, ''), 10);

        if ( name.match(/^t\d+/) ) {
          size = num === 8 ? [48, 24] :  [48, 48];
        } else if ( name.match(/^split/) ) {
          size = [48, 48];
        } else if ( name.match(/^tc/) ) {
          size = [72, 48];
          if ( num > 3 ) {
            size = [96, 72];
          }
        }

        const info = getSpriteInfo(`${mix}/${name}`, size[0], size[1], 'terrain', true);
        if ( info ) {
          TREE.sprites[name] = info;
        }
      }
    });

    Object.keys(TREE.overlays).forEach((name) => {
      if ( !TREE.sprites[name] ) {
        const size = SPRITE_SIZES[name] || [24, 24];
        const info = getSpriteInfo(`${mix}/${name}`, size[0], size[1], 'overlay', true);
        if ( info ) {
          TREE.sprites[name] = info;
        }
      }
    });
  });

  Object.keys(TREE.units).forEach((name) => {
    if ( !TREE.sprites[name] ) {
      let size = SPRITE_SIZES[name] || [24, 24];
      if ( SMALL_UNITS.indexOf(name) !== -1 ) {
        size = [24, 24];
      } else if ( LARGE_UNITS.indexOf(name) !== -1 ) {
        size = [48, 48];
      }

      const info = getSpriteInfo(name, size[0], size[1], 'unit', true);
      if ( info ) {
        TREE.sprites[name] = info;
      }
    }
  });

  // Icons
  ['structures', 'units', 'infantry', 'aircraft'].forEach((key) => {
    Object.keys(TREE[key]).forEach((name) => {
      const iconName = TREE[key][name].Icon;
      if ( iconName && !TREE.sprites[iconName] ) {
        TREE.sprites[iconName] = {
          type: 'ui',
          name: iconName,
          size: [64, 48],
          count: 1
        };
      }
    });
  });

  // UI Stuff
  ['gdi', 'jp', 'nod'].forEach((team) => {
    TREE.sprites[`hradar_${team}`] = {
      type: 'ui',
      size: [160, 142],
      count: 43
    };
  });
};

///////////////////////////////////////////////////////////////////////////////
// MAIN
///////////////////////////////////////////////////////////////////////////////

module.exports = function() {
  console.log('Parsing objects');
  parseObjectList('aircraft', 'aircraft', 'Aircraft');
  parseObjectList('units', 'units', 'Units');
  parseObjectList('infantry', 'infantry', 'Infantry', 'infanims');
  parseObjectList('structures', 'structs', 'Structures', 'stranims');

  console.log('Parsing terrains');
  parseTerrainList();
  console.log('Parsing overlays');
  parseOverlayList();
  console.log('Parsing tiles');
  parseTileList();
  console.log('Parsing levels');
  parseLevels();
  console.log('Generating sprite list');
  generateSpriteList();

  const dest = path.join(DEST, 'mix.json');
  console.log('Writing', dest);
  return fs.writeJsonSync(dest, TREE);
};
