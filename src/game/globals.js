/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

export const TILE_SIZE = 24;

export const UPDATE_RATE = 1000 / 30; // 30Hz

export const MINIMAP_SIZE = [156, 138]; // 2px border

export const ZINDEX = {
  smudge: 0,
  structure: 1,
  overlay: 2,
  unit: 10,
  infantry: 10,
  terrain: 20,
  effect: 30,
  projectile: 100
};

export const PLAYER_NAMES = [
  'GoodGuy',
  'BadGuy',
  'Neutral',
  'Special'/*,
  'Multi1',
  'Multi2',
  'Multi3',
  'Multi4',
  'Multi5',
  'Multi6'*/
];

export const ICONS = {
  'DESERT.MIX': 'DESEICNH.MIX',
  'TEMPERAT.MIX': 'TEMPICNH.MIX',
  'WINTER.MIX': 'TEMPICNH.MIX'
};

export const SOUNDS = { // FIXME
  roger: {count: 2, separator: '-'},
  ritaway: {count: 2, separator: '-'},
  report1: {count: 4, separator: '-'},
  ackno: {count: 4, separator: '-'},
  await1: {count: 4, separator: '-'},
  nuyell: {count: [1, 3, 4, 5]},
  frag1: 'xplobig4',
  frag3: 'xplobig6',
  'veh-hit1': 'xplos',
  'veh-hit2': 'xplos',
  'veh-hit3': 'xplos',
  atomsfx: 'nukexplo',
  fball1: 'xplos',
  'art-exp1': 'xplosml2',
  napalm1: 'flamer2',
  napalm2: 'flamer2',
  napalm3: 'flamer2'
};

export const WALLS = ['sbag', 'cycl', 'brik', 'wood'];

export const IDLE_ANIMS = ['Idle1', 'Idle2', 'Wave', 'Greet', 'Salute'];

export const WAYPOINT_NAMES = {
  25: 'flare',
  26: 'start',
  27: 'unload'
};

export const WAYPOINT_IDS = {
  flare: 25,
  start: 26,
  unload: 27
};

export const LEVELS = {
  gdi: [
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
  ],
  nod: [
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
  ]
};
