/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

export const TICK_LENGTH = 80;

export const DEFAULT_THEME = 5;

export const MINIMAP_SIZE = [156, 138]; // 2px border

export const SOUNDS = { // FIXME
  roger: {count: 2, separator: '-'},
  ritaway: {count: 2, separator: '-'},
  report1: {count: 4, separator: '-'},
  ackno: {count: 4, separator: '-'},
  await1: {count: 4, separator: '-'},
  nuyell: {count: [1, 3, 4, 5]}
};

export const ICONS = {
  'DESERT.MIX': 'DESEICNH.MIX',
  'TEMPERAT.MIX': 'TEMPICNH.MIX',
  'WINTER.MIX': 'TEMPICNH.MIX'
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

export const ZINDEX = {
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
  default: 0,
  pann: 1,
  panne: 2,
  pane: 3,
  panse: 4,
  pans: 5,
  pansw: 6,
  panw: 7,
  pannw: 8,
  invalid: 9,
  move: 10,
  unavailable: 11,
  select: [12, 6],
  attack: [18, 8],
  expand: [53, 9]
  // TODO
};
