/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Map from '../map';
import GameScene from '../scene';
import Player from '../player';
import Triggers from '../triggers';
import TickerElement from '../ui/ticker';
import MiniMap from '../ui/minimap';
import UIContainer from '../../engine/ui/container';
import Sprite from '../../engine/sprite';
import {tileFromPoint} from '../../engine/physics';
import {TILE_SIZE} from '../../engine/globals';

const TICK_LENGTH = 80;

const DEFAULT_THEME = 5;

const ICONS = {
  'DESERT.MIX': 'DESEICNH.MIX',
  'TEMPERAT.MIX': 'TEMPICNH.MIX',
  'WINTER.MIX': 'TEMPICNH.MIX'
};

const SOUNDS = { // FIXME
  roger: {count: 2, separator: '-'},
  ritaway: {count: 2, separator: '-'},
  report1: {count: 4, separator: '-'},
  ackno: {count: 4, separator: '-'},
  await1: {count: 4, separator: '-'},
  nuyell: {count: [1, 3, 4, 5]}
};

const THEMES = [{
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

export default class TheaterScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);

    this.currentTheme = -1;
    this.players = [];
    this.triggers = null;
    this.gameTick = 0;
    this.map = null;
    this.sidebar = null;
    this.minimap = null;
    this.guiContainers = [];
    this.currentGUI = -1;
    this.minimapVisible = true;
    this.sidebarVisible = true;
    this.tickerBuildings = null;
    this.tickerUnits = null;

    this.buildObject = null;
    this.player = null;
    this.buildables = {
      structures: [],
      units: []
    };
  }

  async load() {
    console.info('Loading Theater', this.options);

    const mapName = this.options.map;
    const level = this.engine.mix.getLevel(mapName);
    const buildables = this.engine.mix.getBuildables();

    this.buildables = buildables;
    this.players = Player.createAll(level.players, level.info.Player);
    this.player = this.getMainPlayer();
    this.map = new Map(this.engine, level);
    this.minimap = new MiniMap(this.engine, this.map);
    this.triggers = new Triggers(this.engine, this, this.map, level);
    this.tickerBuildings = new TickerElement('structures', {
      buildables: this.buildables.structures
    });
    this.tickerUnits = new TickerElement('units', {
      buildables: this.buildables.units
    });

    const spriteNames = [
      'htabs',
      'options',
      'hside1',
      'hside2',
      'hradar_gdi',
      'hradar_nod',
      'hstripdn',
      'hstripup',
      'hrepair',
      'hsell',
      'hmap',
      'hclock',
      'trans',
      ...buildables.structures.map(iter => `${ICONS[this.map.theatre]}/${iter.Icon}`),
      ...buildables.units.map(iter => `${ICONS[this.map.theatre]}/${iter.Icon}`),
      ...await this.map.load(level)
    ];

    await this.minimap.load();
    await super.load(spriteNames);

    const playerName = this.player.teamName.toLowerCase();

    this.guiContainers = [
      new UIContainer(this.engine, [
        {type: 'rect', x: 0, y: 0, w: -1, h: 14},
        {type: 'tab', x: 0, y: 0, label: 'Menu', cb: () => (this.currentGUI = 0)},
        {type: 'tab', x: -320, y: 0, label: () => {
          const mp = this.getMainPlayer();
          return String(mp.credits);
        }},
        {type: 'tab', x: -160, y: 0, label: 'Sidebar', cb: () => this.toggleSidebar()}
      ]),

      new UIContainer(this.engine, [
        {type: 'rect', x: 0, y: 0, w: 160, h: -1, texture: true},
        {type: 'sprite', name: 'hradar_' + playerName, x: 0, y: 0},
        {type: 'sprite', name: 'hside1', x: 1, y: 142, index: 1},
        {type: 'sprite', name: 'hside2', x: 1, y: 142 + 118, index: 1},
        {type: 'sprite', name: 'hrepair', x: 5, y: 143, cb: () => this.setMode('repair')},
        {type: 'sprite', name: 'hsell', x: 5 + 53, y: 143, cb: () => this.setMode('sell')},
        {type: 'sprite', name: 'hmap', x: 5 + 106, y: 143, cb: () => this.toggleMinimap()},
        {type: 'sprite', name: 'hstripup', x: 20, y: 357, cb: () => this.tickerBuildings.up()},
        {type: 'sprite', name: 'hstripdn', x: 20 + 33, y: 357, cb: () => this.tickerBuildings.down()},
        {type: 'sprite', name: 'hstripup', x: 70 + 20, y: 357, cb: () => this.tickerUnits.up()},
        {type: 'sprite', name: 'hstripdn', x: 70 + 20 + 33, y: 357, cb: () => this.tickerUnits.down()},
        {instance: this.tickerBuildings, x: 20, y: 164, cb: e => this.clickBuildable(e)},
        {instance: this.tickerUnits, x: 20 + 64 + 6, y: 164, cb: e => this.clickBuildable(e)},
        {instance: this.minimap, visible: () => this.minimapVisible}
      ], {x: -160, y: 14}),

      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 0, y: 0, w: 450, h: 270},
        {type: 'button', label: 'Load Mission', color: '#555555', x: 135, y: 80, w: 180, h: 18},
        {type: 'button', label: 'Save Mission', color: '#555555', x: 135, y: 110, w: 180, h: 18},
        {type: 'button', label: 'Delete Mission', color: '#555555', x: 135, y: 140, w: 180, h: 18},
        {type: 'button', label: 'Game Controls', x: 135, y: 50, w: 180, h: 18, cb: () => (this.currentGUI = -1)},
        {type: 'button', label: 'Abort Mission', x: 135, y: 170, w: 180, h: 18, cb: () => {
          // TODO: SFX
          this.engine.pushScene('title');
          this.destroy();
        }},
        {type: 'button', label: 'Mission Briefing', x: (450 - 180 - 24), y: 230, w: 180, h: 18, cb: () => (this.currentGUI = -1)},
        {type: 'button', label: 'Resume Mission', x: 24, y: 230, w: 180, h: 18, cb: () => (this.currentGUI = -1)}
      ], {center: {width: 450, height: 270}})
    ];

    const myObjects = this.map.objects.filter(o => o.isFriendly());
    if ( myObjects.length ) {
      const {tileX, tileY} = myObjects[0];
      const {vw, vh} = this.getViewport();
      const posX = (tileX * TILE_SIZE) - (vw / 2);
      const posY = (tileY * TILE_SIZE) - (vh / 2);
      this.setOffset(posX, posY);
    }

    this.engine.sounds.setSoundLibrary(SOUNDS);
    this.playTheme(DEFAULT_THEME);
  }

  update() {
    const busy = this.currentGUI !== -1;

    this.gui = [
      this.guiContainers[0],
      this.sidebarVisible ? this.guiContainers[1] : null,
      busy ? this.guiContainers[2 + this.currentGUI] : null
    ].filter(iter => !!iter);

    const clicked = super.update();
    if ( !clicked && !busy ) {
      this.handleMouse();
    }

    this.handleKeyboard();

    this.engine.pauseTick = busy; // FIXME: This needs a better solution

    if ( this.loaded ) {
      this.cursorName = this.getCursor();

      if ( !busy ) {
        this.map.update();

        const tick = this.engine.currentTick;
        if ( tick === 1 || (tick % TICK_LENGTH) === 0 ) {
          this.triggers.process(this.gameTick);
          this.gameTick++;
        }
      }
    }

    return true;
  }

  handleMouse() {
    const mouse = this.engine.mouse;
    const [panX, panY] = mouse.getPan();
    const [mouseX, mouseY] = mouse.getPosition();
    const {offsetX, offsetY} = this.engine.getOffset();

    if ( panX !== null && panY !== null ) {
      this.engine.setOffset(panX, panY);
    }

    if ( !this.mode ) {
      const rect = mouse.getRect();
      if ( rect ) {
        const {x1, x2, y1, y2} = rect;
        if ( (x2 - x1) > 5 && (y2 - y1) > 5 ) {
          const {offsetX, offsetY} = this.engine.getOffset();

          const selection = {
            x1: x1 + offsetX,
            x2: x2 + offsetX,
            y1: y1 + offsetY,
            y2: y2 + offsetY
          };

          console.log('select rectangle', selection);

          const objects = this.map.getObjectsFromRect(selection)
            .filter((obj) => obj.canSelect() && obj.isFriendly() && obj.isUnit());

          this.map.select(objects);
        }
      }
    }

    const click = mouse.buttonClicked('LEFT');
    const right = mouse.buttonClicked('RIGHT');

    if ( this.mode === 'build' ) {
      if ( this.buildObject ) {
        this.buildObject.x = (Math.floor((mouseX + offsetX) / TILE_SIZE) * TILE_SIZE) - offsetX;
        this.buildObject.y = (Math.floor((mouseY + offsetY) / TILE_SIZE) * TILE_SIZE) - offsetY;
      }
    } else {
      if ( right ) {
        this.map.unselect();
      }
    }

    if ( click ) {
      this.clickViewport(click);
    }

    if ( right ) {
      this.setMode(null);
    }

    if ( this.buildObject ) {
      const {x, y, entry} = this.buildObject;

      if ( x !== null && y !== null ) {
        const pattern = entry.OccupyList;
        const {offsetX, offsetY} = this.engine.getOffset();
        const {tileX, tileY} = tileFromPoint(x + offsetX, y + offsetY);

        if ( pattern ) {
          const result = [];
          for ( let row = 0; row < pattern.length; row++ ) {
            for ( let col = 0; col < pattern[row].length; col++ ) {
              if ( pattern[row][col] ) {
                let spriteImage;

                const valid = this.map.queryGrid(tileX + col, tileY + row, 'value') === 0;
                if ( valid ) {
                  spriteImage = Sprite.getFile('trans').createImage(0);
                } else {
                  spriteImage = Sprite.getFile('trans').createImage(2);
                }

                result.push({
                  valid,
                  sprite: spriteImage,
                  x: x + (col * TILE_SIZE),
                  y: y + (row * TILE_SIZE),
                  w: TILE_SIZE,
                  h: TILE_SIZE
                });
              }
            }
          }

          this.buildObject.pattern = result;
          this.buildObject.valid = result.filter(iter => iter.valid === false).length === 0;
        } else {
          // FIXME
          this.buildObject.pattern = null;
          this.buildObject.valid = true;
        }
      }
    }
  }

  handleKeyboard() {
    const kbd = this.engine.keyboard;
    const cfg = this.engine.configuration;

    if ( kbd.keyDown(cfg.getKey('PAN_UP')) ) {
      this.moveMap(0, -10);
    }
    if ( kbd.keyDown(cfg.getKey('PAN_LEFT')) ) {
      this.moveMap(-10, 0);
    }
    if ( kbd.keyDown(cfg.getKey('PAN_DOWN')) ) {
      this.moveMap(0, 10);
    }
    if ( kbd.keyDown(cfg.getKey('PAN_RIGHT')) ) {
      this.moveMap(10, 0);
    }

    if ( kbd.keyClicked(cfg.getKey('THEME_PREV')) ) {
      this.prevTheme();
    } else if ( kbd.keyClicked(cfg.getKey('THEME_NEXT')) ) {
      this.nextTheme();
    }

    if ( kbd.keyClicked(cfg.getKey('CANCEL')) ) {
      this.map.unselect();
    }

    // FIXME: Debugging
    if ( kbd.keyClicked(cfg.getKey('DEBUG_DESTROY')) ) {
      this.map.selectedObjects.forEach((o) => (o.health = 0)); // FIXME
    } else if ( kbd.keyClicked(cfg.getKey('DEBUG_FOG')) ) {
      this.map.fog.visible = !this.map.fog.visible;
    }

    if ( this.engine.options.debug ) {
      const mp = this.getMainPlayer();

      this.debugOutput = [
        `Objects: ${this.map.objects.length} (${this.map.visibleObjects})`,
        `Tick: ${this.engine.currentTick} (${this.gameTick})`,
        `Map: ${this.map.id} - ${this.map.tilesX}x${this.map.tilesY} (${this.map.width}x${this.map.height})`,
        `Player: ${mp.playerName} - ${mp.teamName} c:${mp.credits} p:${mp.power}`
      ];
    }
  }

  render(target, delta) {
    if ( !this.loaded ) {
      return;
    }

    this.map.render(target, delta);

    // Building overlay
    if ( this.buildObject ) {
      const {x, y, sprite, pattern} = this.buildObject;

      if ( x !== null && y !== null ) {
        if ( pattern ) {
          for ( let i = 0; i < pattern.length; i++ ) {
            const p = pattern[i];
            target.fillStyle = target.createPattern(p.sprite, 'repeat');
            target.fillRect(p.x, p.y, p.w, p.h);
          }
        } else {
          // FIXME
          target.globalAlpha = 0.5;
          sprite.render(target, x, y);
          target.globalAlpha = 1.0;
        }
      }
    }

    // Drag rectangle
    if ( this.currentGUI === -1 ) {
      if ( this.engine.mouse.dragging ) {
        const {x1, x2, y1, y2} = this.engine.mouse.getCurrentRect();
        target.strokeStyle = '#00ff00';
        target.fillStyle = 'rgba(0, 255, 0, .1)';
        target.fillRect(x1, y1, (x2 - x1), (y2 - y1));
        target.strokeRect(x1, y1, (x2 - x1), (y2 - y1));
      }
    }

    super.render(target, delta);
  }

  clickViewport({x, y}) {
    const {offsetX, offsetY} = this.engine.getOffset();
    const clickX = x + offsetX;
    const clickY = y + offsetY;
    const {tileX, tileY} = tileFromPoint(clickX, clickY);

    if ( (tileX < 0 || tileY < 0) || (tileX > this.map.tilesX - 1 || tileY > this.map.tilesY - 1) ) {
      return;
    }

    console.log('clicked real position', [clickX, clickY], [tileX, tileY], [x, y]);

    if ( this.mode === 'build' && this.buildObject ) {
      const {entry, valid} = this.buildObject;
      if ( valid ) {
        this.map.addObject({
          tileX,
          tileY,
          team: this.getMainPlayer().team,
          id: entry.Id,
          type: entry.Type
        });

        this.setMode(null);
      }
      return;
    }

    let found = this.map.getObjectsFromPosition(clickX, clickY, true).filter((iter) => !iter.isMapOverlay());
    if ( !found.length ) {
      found = this.map.getObjectsFromTile(tileX, tileY, true).filter((iter) => !iter.isMapOverlay());
    }

    const selected = this.map.selectedObjects;
    const hasSelected = selected.length;

    if ( hasSelected ) {
      const tileBlocked = this.map.fog.visible ? !this.map.fog.getVisibility(tileX, tileY) : false;

      if ( tileBlocked ) {
        return;
      } else {
        const hasSelectedMovable = hasSelected ? selected[0].canMove() : false;
        const hasSelectedAttackable = hasSelected ? selected[0].canAttack() : false;
        const hasSelectedFriendly = hasSelected ? selected[0].isFriendly() : false;
        const clickedEnemy = found.length ? found[0].isEnemy() : false;
        const clickedFriendly = found.length ? found[0].isFriendly() : false;

        if ( hasSelectedAttackable && clickedEnemy ) {
          this.map.action('attack', found[0]);
          return;
        } else if ( hasSelectedMovable && hasSelectedFriendly && !clickedFriendly ) {
          this.map.action('move', {x: clickX, y: clickY});
          return;
        }
      }
    }

    this.map.select(found);
  }

  setOffset(x, y) {
    const {width, height} = this.map;
    const {vw, vh} = this.getViewport();
    const border = Math.round(vw / 2);

    const mx = width - vw + border;
    const my = height - vh + border;

    const newX = Math.min(Math.max(-border, x), mx);
    const newY = Math.min(Math.max(-border, y), my);

    super.setOffset(newX, newY);
  }

  // FIXME: Surely, there's a better name for this
  getMainPlayer() {
    return this.players.find(p => p.current);
  }

  getPlayerByName(playerName) {
    return this.players.find(p => p.playerName === playerName);
  }

  getPlayerByTeam(playerTeam) {
    return this.players.find(p => p.team === playerTeam);
  }

  setMode(mode, arg) {
    this.mode = mode;
    this.buildObject = null;

    if ( mode === 'build' ) {
      this.buildObject = arg;
    }
  }

  moveMap(deltaX, deltaY) {
    const {offsetX, offsetY} = this.getOffset();
    this.setOffset(
      Math.round(offsetX + deltaX),
      Math.round(offsetY + deltaY)
    );
  }

  getViewport(engine) {
    let {vw, vh, vx, vy} = super.getViewport();
    if ( !engine && this.sidebarVisible ) {
      vw -= 160;
    }
    return {vx, vy, vw, vh};
  }

  /**
   * Plays given theme
   * @param {String} id Theme ID
   */
  playTheme(id) {
    const src = THEMES[id].filename;
    this.engine.sounds.playSong(src).then((el) => {
      el.addEventListener('ended', () => this.nextTheme());
    });
    this.currentTheme = id;
  }

  /**
   * Play next theme
   */
  nextTheme() {
    this.playTheme((this.currentTheme + 1) % THEMES.length);
  }

  /**
   * Play previous theme
   */
  prevTheme() {
    const n = (this.currentTheme - 1);
    this.playTheme(n < 0 ? THEMES.length - 1 : n);
  }

  toggleSidebar() {
    this.sidebarVisible = !this.sidebarVisible; // FIXME
  }

  toggleMinimap() {
    this.minimapVisible = !this.minimapVisible; // FIXME
  }

  async clickBuildable(entry) {
    console.info('Build', entry);

    const sprite = await Sprite.loadFile(this.engine, entry.Id);

    this.setMode('build', {
      sprite,
      entry,
      pattern: null,
      valid: false,
      x: null,
      y: null
    });
  }

  getCursor() {
    let cursorName = 'default';

    const [mouseX, mouseY] = this.engine.mouse.getPosition();
    const {vw} = this.engine.getViewport(true);

    if ( mouseY <= 14 || mouseX >= vw || this.currentGUI !== -1 ) {
      return cursorName;
    }

    const {offsetX, offsetY} = this.engine.getOffset();
    const {tileX, tileY} = tileFromPoint(mouseX + offsetX, mouseY + offsetY);
    const gridItem = this.map.getGrid(tileX, tileY);
    const currentObject = gridItem ? gridItem.object : null;

    const objectsSelected = this.map.selectedObjects;
    const isFriendly = (obj) => obj && obj.isFriendly();
    const selectedCanMove = isFriendly(objectsSelected[0]) && objectsSelected[0].canMove();
    const selectedCanAttack = isFriendly(objectsSelected[0]) && objectsSelected[0].canAttack();
    const notCurrent = objectsSelected.indexOf(currentObject) === -1;

    if ( selectedCanMove && notCurrent ) {
      const tileBlocked = this.map.fog.visible ? !this.map.fog.getVisibility(tileX, tileY) : false;
      cursorName = tileBlocked ? 'unavailable' : 'move';
    }

    if ( currentObject ) {
      if ( isFriendly(currentObject) ) {
        if ( selectedCanMove && currentObject.id === 'mcv' ) {
          cursorName = 'expand';
        } else if ( notCurrent ) {
          cursorName = 'select';
        }
      } else if ( selectedCanAttack ) {
        if ( currentObject.isMapOverlay() ) {
          cursorName = 'unavailable';
        } else {
          cursorName = 'attack';
        }
      }
    }

    return cursorName;
  }
}
