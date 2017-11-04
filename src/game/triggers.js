/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

const TRIGGERS = {
  'Time': 'processTimer',
  'Bldgs Destr': 'processBuildingsDestroyed',
  'All Destr.': 'processAllDestroyed'
};

/**
 * Trigger handling class
 */
export default class Triggers {

  /**
   * @param {Engine} engine Engine reference
   * @param {Scene} scene Scene reference
   * @param {Map} map Map reference
   * @param {Object} level Level data
   */
  constructor(engine, scene, map, level) {
    this.engine = engine;
    this.scene = scene;
    this.map = map;

    this.triggers = Object.assign({}, level.triggers);
    this.reinforcements = Object.assign({}, level.reinforcements);
    this.teamTypes = Object.assign({}, level.teamTypes);
  }

  processAllDestroyed(tick, name, options) {
    const playerObjects = this.map.getObjectsFromFilter(o => o.isPlayerObject());
    const friendlyObjects = playerObjects.filter(o => o.isFriendly());
    const enemyObjects = playerObjects.filter(o => !o.isFriendly());

    let handle;
    if ( options.result.toLowerCase() === 'win' ) {
      if ( !enemyObjects.length ) {
        handle = () => {
          this.engine.sounds.playSound('accom1');
          this.engine.pushScene('movie', {movie: options.Win});
          this.engine.pushScene('score', {
            // FIXME
            player: this.scene.getMainPlayer().playerName
          });
          this.engine.pushScene('globe'); // FIXME
          this.engine.pushScene('title'); // FIXME
          this.scene.destroy();
        };
      }
    } else if ( options.result.toLowerCase() === 'lose' ) {
      if ( !friendlyObjects.length ) {
        handle = () => {
          this.engine.sounds.playSound('fail1');
          this.engine.pushScene('movie', {movie: options.Lose});
          this.engine.pushScene('title');
          this.scene.destroy();
        };
      }
    }

    if ( handle ) {
      handle();

      return true;
    }

    return false;
  }

  processBuildingsDestroyed(tick, name, options) {
    return false;
  }

  processReinforcement(tick, name, options) {
    /*
    const {player, teamtype} = options;
    const tt =  this.teamTypes[teamtype];
    */
    this.engine.sounds.playSound('reinfor1');
  }

  processTimer(tick, name, options) {
    if ( options.action === 'Time' ) {
      if ( tick >= options.counter ) {
        if ( options.result.match(/reinforce/i) ) {
          this.processReinforcement(tick, name, options);
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

}
