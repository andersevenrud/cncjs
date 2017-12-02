/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Map from './map';
import Player from './player';
import {TILE_SIZE, WAYPOINT_IDS} from 'game/globals';
import {sort, unique} from 'engine/util';

const TICK_LENGTH = 80; // FIXME

const TRIGGERS = {
  'Time': 'processTimer',
  'Bldgs Destr.': 'processBuildingsDestroyed',
  'All Destr.': 'processAllDestroyed'
};

const RESULTS = {
  'Reinforce': 'processReinforcement',
  'Create Team': 'processCreateTeam'
};

export default class Level {

  constructor(engine, theatre, level) {
    this.engine = engine;
    this.map = null;
    this.levelTick = 0;
    this.buildLevel = level.info.BuildLevel;
    this.players = [];
    this.theatre = theatre;
    this.level = level;

    this.triggers = Object.assign({}, level.triggers);
    this.reinforcements = Object.assign({}, level.reinforcements);
    this.waypoints = [...level.waypoints];
    this.teamTypes = Object.assign({}, level.teamTypes);
    this.cellTriggers = [];

    /*
    this.cellTriggers = Object.keys(level.cellTriggers).map((p) => {
      const {tileX, tileY} = tileFromIndex(p, data.width);
      return {
        tileX,
        tileY,
        name: data.cellTriggers[p]
      };
    });
    */
  }

  static queue(engine, name, options) {
    const team = options.team;
    const level = engine.data.levels[name];
    const brief = level.info.Brief;

    engine.pushScene('movie', {
      movie: brief
    });

    engine.pushScene('theater', {
      team: team,
      map: name
    });
  }

  async load() {
    this.players = Player.createAll(this.engine, this.level.players, this.level.info.Player);
    this.map = new Map(this.engine, this.theatre, this.level);

    await this.map.load(this.level);

    const startPos = this.waypoints[WAYPOINT_IDS.start];
    if ( startPos ) {
      const [tileX, tileY] = startPos;
      const {vw, vh} = this.engine.scene.getViewport();
      const posX = (tileX * TILE_SIZE) - (vw / 2);
      const posY = (tileY * TILE_SIZE) - (vh / 2);
      this.engine.scene.setOffset(posX, posY);
    }
  }

  update() {
    const tick = this.engine.currentTick;
    const triggers = tick === 1 || (tick % TICK_LENGTH) === 0;

    this.map.update();

    if ( triggers ) {
      this.process(this.levelTick);

      this.levelTick++;
    }
  }

  render(target, delta) {
    this.map.render(target, delta);
  }

  abort() {
    this.engine.pushScene('title');
    this.engine.sounds.playSound('batlcon1', {}, () => this.engine.scene.destroy());
  }

  win(options) {
    const mp = this.getMainPlayer();

    this.engine.sounds.playSound('accom1');
    this.engine.pushScene('movie', {movie: options.Win});
    this.engine.pushScene('score', {
      player: mp
    });
    this.engine.pushScene('globe', {
      player: mp,
      level: this.level.id
    });
    this.engine.scene.destroy();
  }

  lose(options) {
    this.engine.sounds.playSound('fail1');
    this.engine.pushScene('movie', {movie: options.Lose});
    this.engine.pushScene('title');
    this.engine.scene.destroy();
  }

  reinforce(player, options, report = false) {
    const tt = this.teamTypes[options.teamtype];

    console.group('Reinforce');
    console.warn('*** TODO ***');
    console.log('Player', player);
    console.log('Options', options);
    console.log('TeamType', tt);
    console.groupEnd();

    if ( report ) {
      this.engine.sounds.playSound('reinfor1');
    }
  }

  processAllDestroyed(tick, name, options) {
    const playerObjects = this.map.getObjectsFromFilter(o => o.isPlayerObject());
    const friendlyObjects = playerObjects.filter(o => o.isFriendly());
    const enemyObjects = playerObjects.filter(o => !o.isFriendly());

    let handle;
    if ( options.result.toLowerCase() === 'win' ) {
      if ( !enemyObjects.length ) {
        handle = () => this.win(options);
      }
    } else if ( options.result.toLowerCase() === 'lose' ) {
      if ( !friendlyObjects.length ) {
        handle = () => this.lose(options);
      }
    }

    if ( handle ) {
      handle();

      return true;
    }

    return false;
  }

  processBuildingsDestroyed(tick, name, options) {
    const player = this.players.find(p => p.playerName === options.player);
    const buildings = this.map.getObjectsFromFilter((o) => {
      return o.player === player && o.isStructure();
    });

    if ( !buildings.length ) {
      this.reinforce(player, options);
      return true;
    }

    return false;
  }

  processCreateTeam(tick, name, options) {
    const player = this.players.find(p => p.playerName === options.player);
    const tt = this.teamTypes[options.teamtype];

    console.group('Create Team');
    console.warn('*** TODO ***');
    console.log('Player', player);
    console.log('Options', options);
    console.log('TeamType', tt);
    console.groupEnd();
  }

  processReinforcement(tick, name, options) {
    const player = this.players.find(p => p.playerName === options.player);
    this.reinforce(player, options, true);
  }

  processTimer(tick, name, options) {
    if ( options.action === 'Time' ) {
      if ( tick >= options.counter ) {
        if ( RESULTS[options.result] ) {
          this[RESULTS[options.result]](tick, name, options);
        }
        return true;
      }
    }

    return false;
  }

  /**
   * Processes any queued triggers
   * @param {Number} tick Game Tick
   * @param {String} name Trigger name
   * @param {Object} options Trigger options
   * @return {Boolean}
   */
  processTrigger(tick, name, options) {
    const fn = TRIGGERS[options.action];
    if ( typeof this[fn] === 'function' ) {
      return this[fn](tick, name, options);
    }
    return false;
  }

  /**
   * Processes any queued triggers
   * @param {Number} gameTick Game Tick
   */
  process(gameTick) {
    console.debug('Processing triggers...', this.triggers);

    const keys = Object.keys(this.triggers);
    for ( let i = 0; i < keys.length; i++ ) {
      const triggerName = keys[i];
      const trigger = this.triggers[triggerName];
      let result;
      try {
        result = this.processTrigger(gameTick, triggerName, trigger);
      } catch ( e ) {
        console.warn(e);
      }

      if ( result ) {
        console.info('Trigger executed', triggerName, trigger, '@', gameTick);

        if ( typeof result === 'function' ) {
          try {
            setTimeout(() => {
              result(triggerName, trigger);
            }, 1);
          } catch ( e ) {
            console.warn(e);
          }
        }
        delete this.triggers[triggerName];
      }
    }
  }

  // FIXME: Surely, there's a better name for this
  getMainPlayer() {
    return this.players.find(p => p.current);
  }

  getBuildables(type) {
    const {structures, infantry, units, aircraft} = this.engine.data;
    const mp = this.getMainPlayer();

    const built = unique(this.map.getObjectsFromFilter((iter) => {
      return iter.player === mp && iter.isStructure();
    })).map(iter => iter.options.SubType || iter.id);

    const isBuildable = iter => !!iter.Icon;

    const canBuild = (iter) => {
      if ( this.engine.options.debug === 3 ) {
        return true;
      }

      if ( iter.Type === 'structure' && built.indexOf('fact') === -1 ) {
        return false;
      }

      if ( iter.Type === 'infantry' && built.indexOf('bar') === -1 ) {
        return false;
      }

      if ( iter.Type === 'unit' && built.indexOf('war') === -1 ) {
        return false;
      }

      if ( iter.Owner ) {
        const found = iter.Owner.map(s => s.toLowerCase())
          .indexOf(mp.playerName.toLowerCase()) !== -1;

        if ( !found ) {
          return false;
        }
      }

      let available = iter.BuildLevel <= this.buildLevel;

      if ( available && iter.Prerequisites && iter.Prerequisites !== 'none' ) {
        // FIXME: Multiple ?
        available = built.indexOf(iter.Prerequisites) !== -1;
      }

      return available;
    };

    if ( type === 'structures' ) {
      const result = Object.values(structures)
        .filter(isBuildable)
        .filter(iter => canBuild(iter));

      return sort(result, 'BuildLevel');
    }

    const result = [
      ...Object.values(infantry).filter(isBuildable),
      ...Object.values(units).filter(isBuildable),
      ...Object.values(aircraft).filter(isBuildable)
    ].filter(iter => canBuild(iter));

    return sort(result, 'BuildLevel');
  }

}
