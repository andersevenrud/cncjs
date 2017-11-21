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

export const CURSOR_SPRITES = {
  default: {index: 0, offsetX: 0, offsetY: 0},
  defaults: {index: 86, offsetX: 0, offsetY: 0},
  pann: {index: 1, offsetX: 0.5, offsetY: 0},
  panne: {index: 2, offsetX: 1.0, offsetY: 0},
  pane: {index: 3, offsetX: 1.0, offsetY: 0.5},
  panse: {index: 4, offsetX: 1.0, offsetY: 1.0},
  pans: {index: 5, offsetX: 0.5, offsetY: 1.0},
  pansw: {index: 6, offsetX: 0, offsetY: 1.0},
  panw: {index: 7, offsetX: 0, offsetY: 0.5},
  pannw: {index: 8, offsetX: 0, offsetY: 0},
  invalid: {index: 9},
  move: {index: 10},
  unavailable: {index: 11},
  select: {index: 12, count: 6},
  attack: {index: 18, count: 8},
  expand: {index: 53, count: 9},
  moves: {index: 26},
  unavailables: {index: 27},
  repair: {index: 29, count: 24},
  sell: {index: 62, count: 24},
  something: {index: 88, count: 8}, // FIXME
  nuke: {index: 96, count: 7},
  ion: {index: 103, count: 16},
  enter: {index: 119, count: 3},
  c4: {index: 122, count: 3},
  cannotSell: {index: 125},
  cannotRepair: {index: 126},
  cannotPann: {index: 130, offsetX: 0.5, offsetY: 0},
  cannotPanne: {index: 131, offsetX: 1.0, offsetY: 0},
  cannotPane: {index: 132, offsetX: 1.0, offsetY: 0.5},
  cannotPanse: {index: 133, offsetX: 1.0, offsetY: 1.0},
  cannotPans: {index: 134, offsetX: 0.5, offsetY: 1.0},
  cannotPansw: {index: 135, offsetX: 0, offsetY: 1.0},
  cannotPanw: {index: 136, offsetX: 0, offsetY: 0.5},
  cannotPannw: {index: 137, offsetX: 0, offsetY: 0}
  // TODO
};

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
  nuyell: {count: [1, 3, 4, 5]}
};

export const THEMES = [{
  name: 'Air Strike',
  filename: 'airstrik'
}, {
  name: 'Untamed Land',
  filename: 'j1'
}, {
  name: 'Take em\' out',
  filename: 'jdi_v2'
}, {
  name: 'Radio',
  filename: 'radio'
}, {
  name: 'Rain in the night',
  filename: 'rain'
}, {
  name: 'Act on instinct',
  filename: 'aoi'
}, {
  name: 'C&C Thang',
  filename: 'ccthang'
}, {
  name: 'Fight, win, prevail',
  filename: 'fwp'
}, {
  name: 'Industrial',
  filename: 'ind'
}, {
  name: 'Just do it!',
  filename: 'justdoit'
}, {
  name: 'In the line of fire',
  filename: 'linefire'
}, {
  name: 'March to Doom',
  filename: 'march'
}, {
  name: 'Mechanical man',
  filename: 'target'
}, {
  name: 'No mercy',
  filename: 'nomercy'
}, {
  name: 'On the prowl',
  filename: 'otp'
}, {
  name: 'Prepare for battle',
  filename: 'prp'
}, {
  name: 'Deception',
  filename: 'stopthem'
}, {
  name: 'Looks like trouble',
  filename: 'trouble'
}, {
  name: 'Warfare',
  filename: 'warfare'
}];

export const WALLS = ['sbag', 'cycl', 'brik', 'wood'];

export const FONTS = {
  '6point': {
    width: 14,
    height: 16,
    letters: [
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
    letters: [
      [4, 9, 0], [6, 4, 0], [8, 7, 1], [8, 9, 0], [10, 9, 0], [7, 9, 0], [5, 5, 0], [6, 9, 0], [6, 9, 0], [9, 7, 0], [8, 7, 0], [5, 5, 5], [6, 3, 3], [5, 4, 5], [9, 8, 1],
      [8, 9, 0], [6, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0],
      [5, 8, 1], [5, 9, 1], [7, 9, 0], [7, 5, 2], [7, 9, 0], [7, 9, 0], [10, 9, 0],
      [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [7, 9, 0], [7, 9, 0], [8, 9, 0], [8, 9, 0], [4, 9, 0], [7, 9, 0], [8, 9, 0], [7, 9, 0], [10, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0], [10, 9, 0], [8, 9, 0], [8, 9, 0], [8, 9, 0],
      [6, 9, 0], [9, 8, 1], [6, 9, 0], [8, 5, 0], [10, 3, 6], [6, 5, 0],
      [8, 7, 2], [8, 9, 0], [8, 7, 2], [8, 9, 0], [8, 7, 2], [7, 9, 0], [8, 9, 2], [8, 9, 0], [4, 9, 0], [6, 10, 0], [7, 9, 0], [4, 9, 0], [10, 7, 2], [8, 7, 2], [8, 7, 2], [8, 9, 2], [8, 9, 2], [8, 7, 2], [8, 7, 2], [6, 9, 0], [8, 7, 2], [8, 7, 2], [10, 7, 2], [8, 7, 2], [8, 9, 2], [8, 7, 2],
      [6, 9, 0], [4, 9, 0], [6, 9, 0], [9, 5, 0]
    ]
  }
};
