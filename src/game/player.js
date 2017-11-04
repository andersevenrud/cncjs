/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

const PLAYER_NAMES = [
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

export default class Player {

  constructor(playerName, opts, current) {
    this.team = PLAYER_NAMES.indexOf(playerName);
    this.playerName = playerName;
    this.teamName = playerName === 'BadGuy' ? 'NOD' : 'GDI'; // FIXME
    this.credits = (opts.Credits || 0) * 100;
    this.power = 0;
    this.current = current === true;
  }

  static createAll(opts, current) {
    const players = PLAYER_NAMES.map((name) => new Player(name, opts[name], name === current));
    console.log('Players', players);
    return players;
  }

}
