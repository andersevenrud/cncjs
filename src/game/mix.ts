/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import EventEmitter from 'eventemitter3';
import { Animation, DataArchive, capitalize } from '../engine';
import { Vector } from 'vector2d';
import * as INI from 'ini';

export type MIXTeamName = 'gdi' | 'nod' | 'neutral';
export type MIXPlayerName = 'GoodGuy' | 'BadGuy' | 'Neutral' | 'Special' | 'Multi1' | 'Multi2' | 'Multi3' | 'Multi4' | 'Multi5' | 'Multi6';
export type MIXCursorType = 'default' | 'select' | 'move' | 'attack' | 'expand' | 'unavailable' | 'sell' | 'cannotSell' | 'cannotRepair' | 'repair' | 'cannotRepair' | 'pann' | 'panne' | 'pane' | 'panse' | 'pans' | 'pansw' | 'panw' | 'pannw' | 'invalid' | 'nuke' | 'ion' | 'enter' | 'c4' | 'cannotPann' | 'cannotPanne' | 'cannotPane' | 'cannotPanse' | 'cannotPans' | 'cannotPansw' | 'cannotPanw' | 'cannotPannw';
export type MIXGridValue = 'x' | 'X' | '-' | '+' | '*' | '.';
export type MIXFontGlyphs = number[][];

export interface MIXMapEntityData {
  name: string;
  cell: Vector;
  player?: number;
  health?: number;
  subcell?: number;
  action?: string;
  direction?: number;
  trigger?: string;
}

export interface MIXSaveGameEntityData extends MIXMapEntityData {
  cell: any;
  type: string;
}

export interface MIXSaveGame {
  name: string;
  entities: MIXSaveGameEntityData[];
}

export interface MIXMapEntitySounds {
  [Key: string]: number;
}

export interface MIXMapTileData {
  name: string;
  cell: Vector;
  index: number;
  passable: boolean;
}

export interface MIXMapWaypoint {
  id: number;
  cell: Vector;
  name: string;
}

export interface MIXMapWaypointMap {
  [Key: string]: string;
}

export interface MIXMapData {
  width: number;
  height: number;
  theatre: string;
  offset: Vector;
  waypoints: MIXMapWaypoint[];
  terrain: MIXMapEntityData[];
  tiles: MIXMapTileData[][];
  infantry: MIXMapEntityData[];
  units: MIXMapEntityData[];
  structures: MIXMapEntityData[];
  overlays: MIXMapEntityData[];
  smudge: MIXMapEntityData[];
};

export interface MIXCursor {
  index: number;
  x: number;
  y: number;
  count: number;
}

export interface MIXObject {
  Owner: string[];
  SecondaryWeapon: string;
  PrimaryWeapon: string;
  Armor?: number;
  Speed?: number;
  Sight?: number;
  Cost: number;
  HitPoints: number;
  OverlapList?: string;
  OccupyList?: string;
}

export type MIXCursorMap = {
  [Key in MIXCursorType]: MIXCursor;
}

export interface MIXAircraft extends MIXObject {
  TurningSpeed: number;
  BuildLevel: number;
  HitPoints: number;
  Ammo: number;
  Buildable: boolean;
  Invulnerable: boolean;
  ValidTarget: boolean;
  Selectable: boolean;
  HasRotorBlades: boolean;
  Airplane: boolean;
  IsTransport: boolean;
  Prerequisites: string[];
  NameID: number;
  TechLevel: number;
}

export interface MIXAnimation {
  Report: string;
  Frames: number;
  FirstFrame: number;
  DrawLowest: boolean;
  Graphic: string;
}

export interface MIXBullet {
  Explosion: string;
  Warhead: string;
  RotationSpeed: number;
  BulletSpeed: number;
  AA: boolean;
  Inaccurate: boolean;
  NoRotation: boolean;
  SmokeTrail: boolean;
  Invisible: boolean;
  Arcing: boolean;
  High: boolean;
  Image: string;
}

export interface MIXGrid {
  name: string;
  offset?: Vector;
  grid: MIXGridValue[][];
}

export interface MIXHouse {
  SideLetter: string;
  ColorScheme: string; // TeamName
  DefaultColor: number;
  NameID: number;
  ShortName: string; // TeamName
}

export interface MIXInfantryAnimation {
  Ready: number[];
  Guard: number[];
  Prone: number[];
  Walk: number[];
  FireUp: number[];
  Down: number[];
  Crawl: number[];
  Up: number[];
  FireProne: number[];
  Idle1: number[];
  Idle2: number[];
  StartFistCombat: number[];
  HopPunch: number[];
  Punch: number[];
  RoundhouseKick: number[];
  FaceHit1: number[];
  FaceHit2: number[];
  FaceHit3: number[];
  GutHit1: number[];
  GutHit2: number[];
  GutHit3: number[];
  StopFistCombat: number[];
  Die1: number[];
  Die2: number[];
  Die3: number[];
  Die4: number[];
  Die5: number[];
  Wave: number[];
  Greet: number[];
  Salute: number[];
  Bow: number[];
  Arm: number[];
  Beg: number[];
  Executed: number[];
}

export interface MIXInfantry extends MIXObject {
  BuildLevel: number;
  HitPoints: number;
  SequenceInfo: string;
  Ammo: number;
  Infiltrate: boolean;
  IsWanderer: boolean;
  HideTrueName: boolean;
  IsCivilian: boolean;
  FemaleCiv: boolean;
  Prerequisites: string;
  NameID: number;
  TechLevel: number;
}

export interface MIXLand {
  Foot: string; // percentage
  Track: string; // percentage
  Wheel: string; // percentage
  Float: string; // percentage
  Buildable: boolean;
}

export interface MIXMission {
  1: string;
  2?: string;
  3?: string;
  4?: string;
}

export interface MIXOverlay {
  CanBeBurnt: number;
  NameId: string;
}

export interface MIXSound {
  Volume: number;
  Class: string;
}

export interface MIXStructureAnimation {
  Structure: string;
  BuildingState: number;
  StartFrame: number;
  Frames: number;
  Delay: number;
}

export interface MIXStructureDimension {
  X: number;
  Y: number;
}

export interface MIXStructure extends MIXObject {
  ExitList: string;
  Dimensions: string;
  PowerDrain: number;
  PowerProduction: number;
  TiberiumStorage: number;
  BuildLevel: number;
  StartFacing: number;
  Factory: string;
  Buildable: boolean;
  Repairable: boolean;
  FiresTwice: boolean;
  HasTurret: boolean;
  TheaterSensitive: boolean;
  Invulnerable: boolean;
  Selectable: boolean;
  CanBeCaptured: boolean;
  CanBePrimary: boolean;
  WallSpecial: boolean;
  HideTrueName: boolean;
  HasBib: boolean;
  Sensors: boolean;
  Prerequisites: string;
  TechLevel: number;
  NameID: number;
  ExitInfo: number;
}

export interface MIXTerrain extends MIXObject {
  Invulnerable: boolean;
  Options: number;
  Theaters: string[];
}

export interface MIXTheatre {
  MixName: string;
  Extension: string;
}

export interface MIXTheme {
  NameID: number;
  FirstMission: number;
  Length: number;
  ShowInPlaylist: boolean;
  HasAlternate: boolean;
  AlternateLength: number;
  Title: string;
  IsAvailable: number;
}

export interface MIXTileSet {
  SecondaryTypeCells: string[];
  SecondaryType: string;
  X: number;
  Y: number;
  PrimaryType: string;
  NameID: number;
}

export interface MIXUnit extends MIXObject {
  TurnSpeed: number;
  MovementType: number;
  BuildLevel: number;
  Ammo: number;
  CycleGraphics: boolean;
  Cloaked: boolean;
  CantTurn: boolean;
  IsLarge: boolean;
  NoTurretLock: boolean;
  AttackAnimation: boolean;
  AutoRotatingTurret: boolean;
  IsCrewed: boolean;
  Buildable: boolean;
  FiresTwice: boolean;
  HasTurret: boolean;
  Invulnerable: boolean;
  Harvests: boolean;
  Crusher: boolean;
  Crushable: boolean;
  IsTransport: boolean;
  ShownName: boolean;
  IsDinosaur: boolean;
  Prerequisites: boolean;
  TechLevel: number;
  NameID: number;
  DeathAnimation: string;
}

export interface MIXWarhead {
  Spread: number;
  TargetWalls: number;
  TargetWood: number;
  InfantryDeath: number;
  Verses: number[];
}

export interface MIXWeapon {
  Projectile: string;
  Damage: number;
  ROF: number;
  Range: number; // float
  Report: string;
  MuzzleFlash: string;
}

export interface MIXFont {
  width: number;
  height: number;
  glyphs: MIXFontGlyphs;
}

export interface MIXFontMap {
  [Key: string]: MIXFont;
}

// FIXME
export interface MIXRulesGroup {
  [Key: string]: any;
}

export interface MIXRules {
  General: MIXRulesGroup;
  Recharge: MIXRulesGroup;
  Powerups: MIXRulesGroup;
}

export const healthBarColors = ['#00ff00', '#ffff00', '#ff0000'];

export const arrayMap: string[] = [
  'Owner',
  'Prerequisites',
  'Theaters',
  'SecondaryTypeCells',
  'Verses'
];

export const arrayNumberMap: string[] = [
  'Verses'
];

export const defaultTeamMap: MIXTeamName[] = [
  'gdi',
  'nod',
  'neutral',
  'neutral'
];

export const playerMap: MIXPlayerName[] = [
  'GoodGuy',
  'BadGuy',
  'Neutral',
  'Special',
  'Multi1',
  'Multi2',
  'Multi3',
  'Multi4',
  'Multi5',
  'Multi6'
];

export const wallNames: string[] = [
  'SBAG',
  'CYCL',
  'BRIK',
  'BARB',
  'WOOD'
];

export const irrelevantBulletImages: string[] = [
  'FLAME',
  'Laser'
];

export const soundMap: MIXMapEntitySounds = {
  'ACKNO': 4,
  'AFFIRM1': 1,
  'APPEAR1': 1,
  'AWAIT1': 4,
  'BAZOOK1': 1,
  'BEEPY2': 1,
  'BEEPY3': 1,
  'BEEPY6': 1,
  'BLEEP2': 1,
  'BOMBIT1': 1,
  'BUTTON': 1,
  'CASHTURN': 1,
  'CLOCK1': 1,
  'CMON1': 1,
  'COMCNTR1': 1,
  'CONSTRU2': 1,
  'COUNTRY1': 1,
  'COUNTRY4': 1,
  'CRUMBLE': 1,
  'FLAMER2': 1,
  'GIRLOKAY': 1,
  'GIRLYEAH': 1,
  'GOTIT1': 1,
  'GUN18': 1,
  'GUN20': 1,
  'GUN8': 1,
  'GUYOKAY1': 1,
  'GUYYEAH1': 1,
  'HVYDOOR1': 1,
  'ION1': 1,
  'KEEPEM1': 1,
  'KEYSTROK': 1,
  'LAUGH1': 1,
  'LEFTY1': 1,
  'MCOMND1': 1,
  'MCOURSE1': 1,
  'MGUN11': 1,
  'MGUN2': 1,
  'MHELLO1': 1,
  'MHMMM1': 1,
  'MOVOUT1': 1,
  'MPLAN3': 1,
  'MTIBER1': 1,
  'MYES1': 1,
  'MYESYES1': 1,
  'NEWTARG1': 1,
  'NOPRBLM1': 1,
  'NOPROB': 1,
  'NUKEMISL': 1,
  'NUKEXPLO': 1,
  'NUYELL1': 1,
  'NUYELL3': 1,
  'NUYELL4': 1,
  'NUYELL5': 1,
  'OBELPOWR': 1,
  'OBELRAY1': 1,
  'ONIT1': 1,
  'POWRDN1': 1,
  'RAMGUN2': 1,
  'RAMYELL1': 1,
  'READY': 1,
  'REPORT1': 4,
  'RITAWAY': 2,
  'ROCKET1': 1,
  'ROCKET2': 1,
  'ROGER': 2,
  'ROKROLL1': 1,
  'SCOLD1': 1,
  'SCOLD2': 1,
  'SQUISH2': 1,
  'TARGET1': 1,
  'TARGET2': 1,
  'TARGET3': 1,
  'TEXT2': 1,
  'TNKFIRE2': 1,
  'TNKFIRE3': 1,
  'TNKFIRE4': 1,
  'TNKFIRE6': 1,
  'TONE15': 1,
  'TONE16': 1,
  'TRANS1': 1,
  'TUFFGUY1': 1,
  'UGOTIT': 1,
  'UNIT1': 1,
  'VEHIC1': 1,
  'WORLD2': 1,
  'XPLOBIG4': 1,
  'XPLOBIG6': 1,
  'XPLOSML2': 1,
  'XPLOS': 1,
  'YEAH1': 1,
  'YELL1': 1,
  'YES1': 1,
  'YESSIR1': 1,
  'YO1': 1
};

export const cursorMap: MIXCursorMap = {
  default: { index: 0, x: 0, y: 0, count: 1 },
  //defaults: { index: 86, x: 0, y: 0, count: 1 },
  pann: { index: 1, x: 0.5, y: 0, count: 1 },
  panne: { index: 2, x: 1.0, y: 0, count: 1 },
  pane: { index: 3, x: 1.0, y: 0.5, count: 1 },
  panse: { index: 4, x: 1.0, y: 1.0, count: 1 },
  pans: { index: 5, x: 0.5, y: 1.0, count: 1 },
  pansw: { index: 6, x: 0, y: 1.0, count: 1 },
  panw: { index: 7, x: 0, y: 0.5, count: 1 },
  pannw: { index: 8, x: 0, y: 0, count: 1 },
  invalid: { index: 9, x: 0.5, y: 0.5, count: 1 },
  move: { index: 10, x: 0.5, y: 0.5, count: 1 },
  unavailable: { index: 11, x: 0.5, y: 0.5, count: 1 },
  select: { index: 12, x: 0.5, y: 0.5, count: 6 },
  attack: { index: 18, x: 0.5, y: 0.5, count: 8 },
  expand: { index: 53, x: 0.5, y: 0.5, count: 9 },
  //moves: { index: 26, x: 0.5, y: 0.5, count: 1 },
  //unavailables: { index: 27, x: 0.5, y: 0.5, count: 1 },
  repair: { index: 29, x: 0.5, y: 0.5, count: 24 },
  sell: { index: 62, x: 0.5, y: 0.5, count: 24 },
  //something: { index: 88, x: 0.5, y: 0.5, count: 8 },
  nuke: { index: 96, x: 0.5, y: 0.5, count: 7 },
  ion: { index: 103, x: 0.5, y: 0.5, count: 16 },
  enter: { index: 119, x: 0.5, y: 0.5, count: 3 },
  c4: { index: 122, x: 0.5, y: 0.5, count: 3 },
  cannotSell: { index: 125, x: 0.5, y: 0.5, count: 1 },
  cannotRepair: { index: 126, x: 0.5, y: 0.5, count: 1 },
  cannotPann: { index: 130, x: 0.5, y: 0, count: 1 },
  cannotPanne: { index: 131, x: 1.0, y: 0, count: 1 },
  cannotPane: { index: 132, x: 1.0, y: 0.5, count: 1 },
  cannotPanse: { index: 133, x: 1.0, y: 1.0, count: 1 },
  cannotPans: { index: 134, x: 0.5, y: 1.0, count: 1 },
  cannotPansw: { index: 135, x: 0, y: 1.0, count: 1 },
  cannotPanw: { index: 136, x: 0, y: 0.5, count: 1 },
  cannotPannw: { index: 137, x: 0, y: 0, count: 1 }
};

export const waypointMap: MIXMapWaypointMap = {
  25: 'flare',
  26: 'start',
  27: 'unload'
};

export const gdiMaps: string[] = [
  'scg01ea',
  'scg02ea',
  'scg03ea',
  'scg04ea',
  'scg04wa',
  'scg04wb',
  'scg05ea',
  'scg05eb',
  'scg05wa',
  'scg05wb',
  'scg07ea',
  'scg08ea',
  'scg08eb',
  'scg09ea',
  'scg10ea',
  'scg10eb',
  'scg11ea',
  'scg12ea',
  'scg12eb',
  'scg13ea',
  'scg13eb',
  'scg14ea',
  'scg15ea',
  'scg15eb',
  'scg15ec'
];

export const nodMaps: string[] = [
  'scb01ea',
  'scb02ea',
  'scb02eb',
  'scb03ea',
  'scb03eb',
  'scb04ea',
  'scb04eb',
  'scb05ea',
  'scb06ea',
  'scb06eb',
  'scb06ec',
  'scb07ea',
  'scb07eb',
  'scb08ea',
  'scb08eb',
  'scb09ea',
  'scb10ea',
  'scb10eb',
  'scb11ea',
  'scb11eb',
  'scb12ea',
  'scb13ea',
  'scb13eb',
  'scb13ec'
];

export const infantryIdleAnimations: string[] = [
  'Idle1',
  'Idle2',
  'Wave',
  'Greet',
  'Salute'
];

export const fontMap: MIXFontMap = {
  '6point': {
    width: 14,
    height: 16,
    glyphs: [
      [6, 11, 1], [8, 5, 1], [10, 11, 2], [8, 13, 1], [12, 11, 2], [10, 11, 2], [4, 5, 2], [6, 131, 2], [6, 13, 2], [8, 6, 2], [12, 11, 2], [4, 5, 10], [6, 3, 6], [6, 3, 10], [6, 11, 2],
      [9, 11, 2], [9, 11, 2], [9, 11, 2], [9, 11, 2], [9, 11, 2], [9, 11, 2], [9, 11, 2], [9, 11, 2], [9, 11, 2], [9, 11, 2],
      [6, 9, 4], [4, 11, 4], [8, 7, 6], [9, 6, 6], [8, 7, 6], [8, 11, 2], [14, 14, 2],
      [10, 11, 2], [9, 11, 2], [10, 11, 2], [10, 11, 2], [9, 11, 2], [8, 11, 2], [10, 11, 2], [10, 11, 2], [4, 11, 2], [8, 11, 2], [10, 11, 2], [9, 11, 2], [10, 11, 2], [10, 11, 2], [10, 11, 2], [9, 11, 2], [10, 11, 2], [10, 11, 2], [9, 11, 2], [10, 11, 2], [10, 11, 2], [10, 11, 2], [14, 11, 2], [10, 11, 2], [10, 11, 2], [10, 11, 2],
      [5, 13, 1], [6, 11, 2], [5, 13, 1], [10, 7, 2], [10, 3, 13], [6, 5, 2],
      [8, 9, 4], [8, 11, 2], [7, 9, 4], [8, 11, 2], [8, 9, 4], [7, 11, 2], [8, 11, 4], [8, 11, 2], [4, 11, 2], [5, 13, 2], [8, 11, 2], [4, 11, 2], [12, 9, 4], [8, 9, 4], [8, 9, 4], [8, 11, 4], [8, 11, 4], [6, 9, 4], [8, 9, 4], [6, 11, 2], [8, 9, 4], [8, 9, 4], [12, 9, 4], [8, 9, 4], [8, 11, 4], [8, 9, 4],
      [6, 13, 2], [6, 13, 2], [6, 13, 2], [9, 4, 2]
    ]
  },
  '8point': {
    width: 11,
    height: 10,
    glyphs: [
      [4, 9, 0], [6, 4, 0], [8, 7, 1], [8, 9, 0], [10, 9, 0], [7, 9, 0], [5, 5, 0], [6, 9, 0], [6, 9, 0], [9, 7, 0], [8, 7, 0], [5, 5, 5], [6, 3, 3], [5, 4, 5], [9, 8, 1],
      [8, 9, 0], [6, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0],
      [5, 8, 1], [5, 9, 1], [7, 9, 0], [7, 5, 2], [7, 9, 0], [7, 9, 0], [10, 9, 0],
      [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [7, 9, 0], [7, 9, 0], [8, 9, 0], [8, 9, 0], [4, 9, 0], [7, 9, 0], [8, 9, 0], [7, 9, 0], [10, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [10, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0],
      [6, 9, 0], [9, 8, 1], [6, 9, 0], [8, 5, 0], [10, 3, 6], [6, 5, 0],
      [8, 7, 2], [8, 9, 0], [8, 7, 2], [8, 9, 0], [8, 7, 2], [7, 9, 0], [8, 9, 2], [8, 9, 0], [4, 9, 0], [6, 10, 0], [7, 9, 0], [4, 9, 0], [10, 7, 2], [8, 7, 2], [8, 7, 2], [8, 9, 2], [8, 9, 2], [8, 7, 2], [8, 7, 2], [6, 9, 0], [8, 7, 2], [8, 7, 2], [10, 7, 2], [8, 7, 2], [8, 9, 2], [8, 7, 2],
      [6, 9, 0], [4, 9, 0], [6, 9, 0], [9, 5, 0]
    ]
  },
  'vcr': {
    width: 17,
    height: 16,
    glyphs: [
    ]
  }
};

const parseInteger = (val: any): number =>
  String(val).match(/h$/)
    ? parseInt(val, 16)
    : parseInt(val, 10);

const cellFromIndex = (index: number, tilesX: number, offset: Vector): Vector => new Vector(
  index % tilesX,
  Math.trunc(index / tilesX)
).subtract(offset);

const stringToArray = (str: string): string[] => str === 'None'
  ? []
  : str.split(',');

const transformValue = (key: string, value: string, filename: string): any => {
  if (filename === 'GAME.DAT/infanims.ini' || arrayNumberMap.indexOf(key) !== -1) {
    return stringToArray(value).map((i): number => parseInt(i, 10));
  } else if (arrayMap.indexOf(key) !== -1) {
    try {
      return stringToArray(value);
    } catch (e) {
      console.error(e, key, value);
    }
  } else if (value.match(/^[+-]?\d+(\.\d+)?$/) || value.match(/^\.(\d+)/)) {
    return parseFloat(value);
  } else if (value.match(/^(\d+)%$/)) {
    return parseInt(value) / 100;
  } else if (value.match(/^\d+$/)) {
    return parseInt(value, 10);
  } else if (value.match(/^(no|yes)$/i)) {
    return value.toLowerCase() === 'yes';
  }

  return value.toLowerCase() === 'none' ? '' : value;
};

const transformObject = (obj: any, filename: string, name: string): any => {
  const keys = Object.keys(obj);
  return keys.reduce((accumulator, key): any => {
    return {...accumulator, [capitalize(key)]: transformValue(capitalize(key), obj[key], filename)};
  }, {});
};

const parseTiles = (mapRaw: any, offset: Vector, mix: MIX): MIXMapTileData[][] => {
  const result = [];

  const isPassable = (name: string, j: number): boolean => {
    const options =  mix.tilesets.get(name) as MIXTileSet;
    const stc = options.SecondaryTypeCells;
    const st = options.SecondaryType;
    const pt = options.PrimaryType;

    if ( ['Clear', 'Beach'].indexOf(st) !== -1 && stc.length ) {
      const list = stc.map(parseInteger);
      return list.indexOf(j) !== -1;
    } else if ( pt === 'Clear' ) {
      return true;
    }

    return false;
  };

  let i = 0;
  for ( let y = 0; y < 64; y++ ) {
    let row: MIXMapTileData[] = [];
    for ( let x = 0; x < 64; x++ ) {
      let v = mapRaw[i] % 255;
      let index = mapRaw[i + 1];
      let name = mix.tilesetmap.get(v) as string;
      let passable = isPassable(name, index);
      let cell = cellFromIndex(index, 64, offset);
      row.push({ cell, name, passable, index });
      i += 2;
    }

    result.push(row);
  }

  return result;
};

const parseDirection = (str: string, base: number): number => {
  const dir = parseInt(str, 10);
  return dir > 0 ? base - Math.floor((dir / 255) * base) : 0;
};

const mapInfantry = (theatre: string, offset: Vector) => (str: any): MIXMapEntityData => {
  const [player, name, health, cell, subcell, action, direction, trigger] = str.split(',');

  return {
    name,
    subcell: parseInt(subcell, 10),
    action,
    direction: parseDirection(direction, 8),
    trigger,
    health,
    cell: cellFromIndex(cell, 64, offset),
    player: playerMap.findIndex(pn => pn === player)
  };
};

const mapUnits = (theatre: string, offset: Vector) => (str: any): MIXMapEntityData => {
  const [player, name, health, cell, direction, action, trigger] = str.split(',');

  return {
    name,
    action,
    direction: parseDirection(direction, 32),
    trigger,
    health,
    cell: cellFromIndex(cell, 64, offset),
    player: playerMap.findIndex(pn => pn === player)
  };
};

const mapStructures = (theatre: string, offset: Vector) => (str: any): MIXMapEntityData => {
  const [player, name, health, cell, direction, action, trigger] = str.split(',');

  return {
    name,
    action,
    direction: parseDirection(direction, 32),
    trigger,
    health,
    cell: cellFromIndex(cell, 64, offset),
    player: playerMap.findIndex(pn => pn === player)
  };
};


export const parseDimensions = (size: string) => {
  const [x, y] = size.split('x').map(i => parseInt(i, 10));
  return new Vector(x, y);
};

export class MIX extends EventEmitter {
  private archive: DataArchive;
  public readonly aircraft: Map<string, MIXAircraft> = new Map();
  public readonly animations: Map<string, MIXAnimation> = new Map();
  public readonly bullets: Map<string, MIXBullet> = new Map();
  public readonly grids: Map<string, MIXGrid> = new Map();
  public readonly houses: Map<string, MIXHouse> = new Map();
  public readonly infantryAnimations: Map<string, MIXInfantryAnimation> = new Map();
  public readonly infantry: Map<string, MIXInfantry> = new Map();
  public readonly land: Map<string, MIXLand> = new Map();
  public readonly mission: Map<string, MIXMission> = new Map();
  public readonly overlays: Map<string, MIXOverlay> = new Map();
  public readonly sounds: Map<string, MIXSound> = new Map();
  public readonly structureAnimations: Map<string, MIXStructureAnimation> = new Map();
  public readonly structureDimensions: Map<string, MIXStructureDimension> = new Map();
  public readonly structures: Map<string, MIXStructure> = new Map();
  public readonly terrain: Map<string, MIXTerrain> = new Map();
  public readonly theatres: Map<string, MIXTheatre> = new Map();
  public readonly themes: Map<string, MIXTheme> = new Map();
  public readonly tilesets: Map<string, MIXTileSet> = new Map();
  public readonly tilesetmap: Map<number, string> = new Map();
  public readonly units: Map<string, MIXUnit> = new Map();
  public readonly warheads: Map<string, MIXWarhead> = new Map();
  public readonly weapons: Map<string, MIXWeapon> = new Map();
  public readonly rules: Map<string, MIXRules> = new Map();
  public readonly parsedInfantryAnimations: Map<string, Animation> = new Map();

  public constructor(archive: DataArchive) {
    super();
    this.archive = archive;
  }

  private async loadIni(filename: string): Promise<any> {
    const raw = await this.archive.extract(filename, 'text');
    return INI.parse(raw as string);
  }

  private async loadFromIni<T>(filename: string, map: Map<string, T>, key?: string, handler?: Function): Promise<any> {
    const ini: any = await this.loadIni(filename);
    const names: string[] = key ? ini[key] : [];
    const list = key ? Object.values(names) : Object.keys(ini);
    const fn = handler || transformObject;

    list.forEach((name: string) => {
      map.set(name, fn(ini[name], filename, name) as T);
    });

    return ini;
  }

  private async loadStuff(): Promise<void> {
    const promises = [
      this.loadFromIni<MIXAircraft>('GAME.DAT/aircraft.ini', this.aircraft, 'Aircraft'),
      this.loadFromIni<MIXAnimation>('GAME.DAT/anims.ini', this.animations, 'Animations'),
      this.loadFromIni<MIXBullet>('GAME.DAT/bullets.ini', this.bullets, 'Projectiles'),
      this.loadFromIni<MIXHouse>('GAME.DAT/houses.ini', this.houses, 'Houses'),
      this.loadFromIni<MIXInfantryAnimation>('GAME.DAT/infanims.ini', this.infantryAnimations, 'Sequences'),
      this.loadFromIni<MIXInfantry>('GAME.DAT/infantry.ini', this.infantry, 'Infantry'),
      this.loadFromIni<MIXLand>('GAME.DAT/land.ini', this.land),
      this.loadFromIni<MIXMission>('GAME.DAT/mission.ini', this.mission),
      this.loadFromIni<MIXOverlay>('GAME.DAT/overlay.ini', this.overlays, 'Overlay'),
      this.loadFromIni<MIXSound>('GAME.DAT/sounds.ini', this.sounds, 'Sounds'),
      this.loadFromIni<MIXStructureAnimation>('GAME.DAT/stranims.ini', this.structureAnimations, 'StructureAnimations'),
      this.loadFromIni<MIXStructureDimension>('GAME.DAT/strdims.ini', this.structureDimensions, 'StructureDimensions'),
      this.loadFromIni<MIXStructure>('GAME.DAT/structs.ini', this.structures, 'Structures'),
      this.loadFromIni<MIXTerrain>('GAME.DAT/terrain.ini', this.terrain, 'Terrain'),
      this.loadFromIni<MIXTheatre>('GAME.DAT/theaters.ini', this.theatres, 'Theaters'),
      this.loadFromIni<MIXTheme>('GAME.DAT/themes.ini', this.themes, 'Themes'),
      this.loadFromIni<MIXUnit>('GAME.DAT/units.ini', this.units, 'Units'),
      this.loadFromIni<MIXWarhead>('GAME.DAT/warheads.ini', this.warheads, 'Warheads'),
      this.loadFromIni<MIXWeapon>('GAME.DAT/weapons.ini', this.weapons, 'Weapons'),
      this.loadFromIni<MIXRules>('GAME.DAT/rules.ini', this.rules),
      this.loadTileSets(),
      this.loadGrids()
    ];

    await Promise.all(promises);
  }

  public async parse(): Promise<void> {
    console.group('MIX::parse()');
    await this.loadStuff();
    console.groupEnd();
  }

  private async loadTileSets(): Promise<void> {
    const set: any = await this.loadFromIni<MIXTileSet>('GAME.DAT/tilesets.ini', this.tilesets, 'TileSets');
    Object.values(set.TileSets)
      .forEach((name: any, index: number) => this.tilesetmap.set(index, name));
  }

  private async loadGrids(): Promise<void> {
    const fn = (obj: any, filename: string, name: string): MIXGrid => {
      const offset = typeof obj.YShift === 'undefined' && obj.XShift === 'undefined'
        ? undefined
        : new Vector(obj.XShift, obj.YShift);

      const keys = Object.keys(obj).filter((s: string) => s.match(/^\d+$/));
      keys.sort();

      const grid = keys.map(idx => obj[idx].split(''));
      return { name, offset, grid };
    };

    await this.loadFromIni<MIXGrid>('GAME.DAT/grids.ini', this.grids, 'Grids', fn);
  }

  private parseWaypoints(waypoints: any, offset: Vector): MIXMapWaypoint[] {
    return Object.keys(waypoints)
      .map((id: any): MIXMapWaypoint => ({
        id: parseInt(id, 10),
        cell: cellFromIndex(waypoints[id], 64, offset),
        name: waypointMap[id] as string
      }));
  }

  public async loadMap(name: string): Promise<MIXMapData> {
    console.debug('MIX::loadMap()', name);

    const rawIniFile = await this.archive.extract(`GENERAL.MIX/${name}.ini`, 'text');
    const rawBin = await this.archive.extract(`GENERAL.MIX/${name}.bin`, 'array');
    const ini = INI.parse(rawIniFile as string);

    const width = parseInt(ini.MAP.Width, 10);
    const height = parseInt(ini.MAP.Height, 10);
    const diffX = parseInt(ini.MAP.X, 10);
    const diffY = parseInt(ini.MAP.Y, 10);
    const offset = new Vector(diffX, diffY);
    const tiles = parseTiles(rawBin, offset, this);
    const theatre = ini.MAP.Theater.toLowerCase().replace(/e$/, '');
    const infantry = Object.values(ini.INFANTRY).map(mapInfantry(theatre, offset));
    const units = Object.values(ini.UNITS).map(mapUnits(theatre, offset));
    const structures = Object.values(ini.STRUCTURES).map(mapStructures(theatre, offset));
    const waypoints = this.parseWaypoints(ini.Waypoints || ini.WAYPOINTS, offset); // FIXME

    const terrain = Object.keys(ini.TERRAIN)
      .map((key: any) => {
        return {
          cell: cellFromIndex(parseInt(key, 10), 64, offset),
          name: ini.TERRAIN[key].split(',')[0],
          theatre
        };
      });

    const overlays = Object.keys(ini.OVERLAY)
      .map((key: any) => {
        return {
          cell: cellFromIndex(parseInt(key, 10), 64, offset),
          name: ini.OVERLAY[key].split(',')[0],
          theatre
        };
      });

    const smudge = Object.keys(ini.SMUDGE)
      .map((key: any) => {
        return {
          cell: cellFromIndex(parseInt(key, 10), 64, offset),
          name: ini.SMUDGE[key].split(',')[0],
          theatre
        };
      });

    return { theatre, width, height, offset, terrain, tiles, infantry, units, smudge, structures, overlays, waypoints };
  }

  public getProperties(name: string): MIXObject | undefined {
    const type = this.getType(name);
    if (type === 'unit') {
      return this.units.get(name);
    } else if (type === 'infantry') {
      return this.infantry.get(name);
    } else if (type === 'structure') {
      return this.structures.get(name);
    } else if (type === 'aircraft') {
      return this.aircraft.get(name);
    }

    return undefined;
  }

  public getType(name: string): string | undefined {
    if (this.units.get(name)) {
      return 'unit';
    } else if (this.infantry.get(name)) {
      return 'infantry';
    } else if (this.structures.get(name)) {
      return 'structure';
    } else if (this.aircraft.get(name)) {
      return 'aircraft';
    }

    return undefined;
  }

  public getPlaylistThemes(): Map<string, MIXTheme> {
    const newMap: Map<string, MIXTheme> = new Map();

    Array.from(this.themes.keys())
      .filter(k => {
        let i = this.themes.get(k) as MIXTheme;
        return i.ShowInPlaylist && i.IsAvailable;
      })
      .forEach(k => {
        let i = this.themes.get(k) as MIXTheme;
        newMap.set(k, i);
      });

    return newMap;
  }
}
