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
import ConstructObject from '../objects/construct';
import UIContainer from '../../engine/ui/container';
import Sprite from '../../engine/sprite';
import {sort, randomInteger} from '../../engine/util';
import {tileFromPoint} from '../physics';
import {TILE_SIZE, ICONS, SOUNDS, THEMES} from '../globals';

const TICK_LENGTH = 80; // FIXME
const DEFAULT_THEME = 5; // FIXME
const SCROLL_MARGIN = 4; // FIXME
const SCROLL_SPEED = 3; // FIXME

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
    this.soundDebounce = {};
    this.guiContainers = [];
    this.currentGUI = -1;
    this.minimapVisible = true;
    this.minimapAvailable = true; // FIXME
    this.sidebarVisible = true;
    this.tickerBuildings = null;
    this.tickerUnits = null;
    this.cursorName = 'default';
    this.constructObject = null;

    this.player = null;
    this.buildables = {
      structures: [],
      units: []
    };
  }

  async load() {
    console.info('Loading Theater', this.options);

    const mapName = this.options.map;
    const level = this.engine.data.levels[mapName];
    const buildables = this.getBuildables();

    const tmap = {desert: 'DESERT.MIX', winter: 'WINTER.MIX'};
    const theatre = tmap[level.theater] || 'TEMPERAT.MIX';

    const audioNames = [
      'audio:button',
      'audio:cancel1',
      'audio:bldging1',
      'audio:constru1',
      'audio:constru2',
      'audio:clock1',
      'audio:cashturn',
      'audio:accom1',
      'audio:fail1',
      'audio:reinfor1',
      'audio:batlcon1',
      'audio:bldg1',
      'audio:xplos',
      'audio:xplobig4',
      ...buildables.units.map(iter => {
        if ( iter.PrimaryWeapon && iter.PrimaryWeapon.Report ) {
          return 'audio:' + iter.PrimaryWeapon.Report;
        }
        return null;
      }),
      ...buildables.units.map(iter => {
        if ( iter.SecondaryWeapon && iter.SecondaryWeapon.Report ) {
          return 'audio:' + iter.SecondaryWeapon.Report;
        }
        return null;
      })
    ];

    Object.keys(SOUNDS).forEach((k) => {
      const count = SOUNDS[k].count;
      if ( count instanceof Array ) {
        count.forEach((i) => audioNames.push(`audio:${k}${i}`));
      } else {
        for ( let i = 0; i < count; i++ ) {
          const s = SOUNDS[k].separator || '';
          audioNames.push(`audio:${k}${s}${i + 1}`);
        }
      }
    });

    const spriteNames = [
      'sprite:htabs',
      'sprite:options',
      'sprite:hside1',
      'sprite:hside2',
      'sprite:hradar_gdi',
      'sprite:hradar_nod',
      'sprite:hstripdn',
      'sprite:hstripup',
      'sprite:hrepair',
      'sprite:hsell',
      'sprite:hmap',
      'sprite:hpips',
      'sprite:hclock',
      'sprite:trans',
      'sprite:bib1',
      'sprite:bib2',
      'sprite:bib3',
      'sprite:smokey',

      // FIXME: Filtered
      ...buildables.structures.map(iter => `sprite:${iter.Id}`),
      ...buildables.structures.map(iter => `sprite:${ICONS[theatre]}/${iter.Icon}`),
      ...buildables.units.map(iter => `sprite:${ICONS[theatre]}/${iter.Icon}`),
      ...buildables.units.map(iter => `sprite:${iter.Id}`)
    ];

    console.log('Sounds', audioNames);
    console.log('Sprites', spriteNames);

    await super.load([
      ...audioNames.filter(iter => !!iter),
      ...spriteNames.filter(iter => !!iter)
    ]);

    this.buildables = buildables;
    this.players = Player.createAll(level.players, level.info.Player);
    this.player = this.getMainPlayer();
    this.map = new Map(this.engine, theatre, level);
    this.minimap = new MiniMap(this.engine, this.map);
    this.triggers = new Triggers(this.engine, this, this.map, level);
    this.tickerBuildings = new TickerElement(this.engine, 'structures', {
      buildables: this.buildables.structures
    });
    this.tickerUnits = new TickerElement(this.engine, 'units', {
      buildables: this.buildables.units
    });

    await this.map.load(level);
    await this.minimap.load();

    this.loadUI(level);

    this.engine.sounds.setSoundHandler((i, c) => this.playSound(i, c));
    this.playTheme(DEFAULT_THEME);

    const myObjects = this.map.objects.filter(o => o.isFriendly());
    if ( myObjects.length ) {
      const {tileX, tileY} = myObjects[0];
      const {vw, vh} = this.getViewport();
      const posX = (tileX * TILE_SIZE) - (vw / 2);
      const posY = (tileY * TILE_SIZE) - (vh / 2);
      this.setOffset(posX, posY);
    }

    this.loaded = true;
  }

  loadUI(level) {
    const playerName = this.player.teamName.toLowerCase();

    this.guiContainers = [
      new UIContainer(this.engine, [
        {type: 'rect', x: 0, y: 0, w: -1, h: 14},
        {type: 'tab', x: 0, y: 0, label: 'Options', cb: () => (this.currentGUI = 0)},
        {type: 'tab', x: -320, y: 0, label: () => {
          const mp = this.getMainPlayer();
          return String(mp.credits);
        }, cb: () => {
          if ( this.engine.options.debugMode ) {
            const mp = this.getMainPlayer();
            mp.addCredits(1000);
          }
        }},
        {type: 'tab', x: -160, y: 0, label: 'Sidebar', cb: () => this.toggleSidebar()}
      ]),

      new UIContainer(this.engine, [
        {type: 'rect', x: 0, y: 0, w: 160, h: -1, texture: true},
        {type: 'sprite', name: 'hradar_' + playerName, x: 0, y: 0},
        {type: 'sprite', name: 'hside1', x: 1, y: 142, index: 1},
        {type: 'sprite', name: 'hside2', x: 1, y: 142 + 118, index: 1},
        {type: 'sprite', name: 'hrepair', pressIndex: 1, x: 5, y: 143, cb: () => this.setMode('repair')},
        {type: 'sprite', name: 'hsell', pressIndex: 1, x: 5 + 53, y: 143, cb: () => this.setMode('sell')},
        {type: 'sprite', name: 'hmap', index: this.minimapAvailable ? 0 : 2, pressIndex: this.minimapAvailable ? 1 : 2, x: 5 + 106, y: 143, cb: () => this.toggleMinimap()},
        {type: 'sprite', name: 'hstripup', pressIndex: 1, x: 20, y: 357, cb: () => this.tickerBuildings.up()},
        {type: 'sprite', name: 'hstripdn', pressIndex: 1, x: 20 + 33, y: 357, cb: () => this.tickerBuildings.down()},
        {type: 'sprite', name: 'hstripup', pressIndex: 1, x: 70 + 20, y: 357, cb: () => this.tickerUnits.up()},
        {type: 'sprite', name: 'hstripdn', pressIndex: 1, x: 70 + 20 + 33, y: 357, cb: () => this.tickerUnits.down()},
        {instance: this.tickerBuildings, x: 20, y: 164, cb: (e, cb) => this.clickBuildable(e, cb)},
        {instance: this.tickerUnits, x: 20 + 64 + 6, y: 164, cb: (e, cb) => this.clickBuildable(e, cb)},
        {instance: this.minimap, visible: () => this.sidebarVisible && this.minimapVisible}
      ], {x: -160, y: 14}),

      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 0, y: 0, w: 450, h: 270},
        {type: 'text', text: ['Menu'], x: 30, y: 15, w: 390, h: 20, underline: true, center: true},
        {type: 'button', label: 'Load Mission', x: 135, y: 80, w: 180, h: 18},
        {type: 'button', label: 'Save Mission', x: 135, y: 110, w: 180, h: 18},
        {type: 'button', label: 'Delete Mission', x: 135, y: 140, w: 180, h: 18},
        {type: 'button', label: 'Game Controls', x: 135, y: 50, w: 180, h: 18, cb: () => (this.currentGUI = 2)},
        {type: 'button', label: 'Abort Mission', x: 135, y: 170, w: 180, h: 18, cb: () => {
          this.engine.pushScene('title');
          this.engine.sounds.playSound('batlcon1', {}, () => this.destroy());
        }},
        {type: 'button', label: 'Mission Briefing', x: (450 - 180 - 24), y: 230, w: 180, h: 18, cb: () => (this.currentGUI = 1)},
        {type: 'button', label: 'Resume Mission', x: 24, y: 230, w: 180, h: 18, cb: () => (this.currentGUI = -1)}
      ], {center: {width: 450, height: 270}}),

      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 0, y: 0, w: 620, h: 130},
        {type: 'text', text: ['Mission Statement'], x: 30, y: 15, w: 550, h: 20, underline: true, center: true},
        {type: 'text', text: level.brief, x: 30, y: 40, w: 130, h: 100},
        {type: 'button', label: 'Options', x: 220, y: 100, w: 180, h: 18, cb: () => (this.currentGUI = 0)}
      ], {center: {width: 620, height: 130}}),

      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 0, y: 0, w: 400, h: 300},
        {type: 'text', text: ['Game Controls'], x: 30, y: 15, w: 340, h: 20, underline: true, center: true},

        {type: 'text', text: ['GAME SPEED:'], x: 30, y: 50, w: 340, h: 20},
        {type: 'slider', x: 30, y: 65, w: 340, h: 18, value: 0.5}, // TODO
        {type: 'text', text: ['Slower'], x: 30, y: 90, w: 50, h: 20},
        {type: 'text', text: ['Faster'], x: 330, y: 90, w: 50, h: 20},

        {type: 'text', text: ['SCROLL RATE:'], x: 30, y: 130, w: 340, h: 20},
        {type: 'slider', x: 30, y: 145, w: 340, h: 18, value: 0.5}, // TODO
        {type: 'text', text: ['Slower'], x: 30, y: 170, w: 50, h: 20},
        {type: 'text', text: ['Faster'], x: 330, y: 170, w: 50, h: 20},

        {type: 'button', label: 'Visual Controls', x: 30, y: 200, w: 340, h: 18, cb: () => (this.currentGUI = 3)},
        {type: 'button', label: 'Sound Controls', x: 30, y: 230, w: 340, h: 18, cb: () => (this.currentGUI = 4)},

        {type: 'button', label: 'Options', x: 110, y: 270, w: 180, h: 18, cb: () => (this.currentGUI = 0)}
      ], {center: {width: 400, height: 300}}),

      // TODO
      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 0, y: 0, w: 450, h: 270},
        {type: 'text', text: ['Visual Controls'], x: 30, y: 15, w: 390, h: 20, underline: true, center: true},
        {type: 'button', label: 'Game Controls', x: (450 - 180 - 24), y: 230, w: 180, h: 18, cb: () => (this.currentGUI = 2)}
      ], {center: {width: 450, height: 270}}),

      // TODO
      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 0, y: 0, w: 450, h: 270},
        {type: 'text', text: ['Sound Controls'], x: 30, y: 15, w: 390, h: 20, underline: true, center: true},
        {type: 'button', label: 'Game Controls', x: (450 - 180 - 24), y: 230, w: 180, h: 18, cb: () => (this.currentGUI = 2)}
      ], {center: {width: 450, height: 270}})

    ];
  }

  update() {
    const busy = this.currentGUI !== -1;

    this.gui = [
      this.guiContainers[0],
      this.sidebarVisible ? this.guiContainers[1] : null,
      busy ? this.guiContainers[2 + this.currentGUI] : null
    ].filter(iter => !!iter);

    super.update();

    this.handleMouse();
    this.handleKeyboard();

    if ( this.constructObject ) {
      this.constructObject.update();
    }

    this.updateScroll();

    this.cursorName = this.getCursor();

    this.engine.pauseTick = busy; // FIXME: This needs a better solution

    if ( this.loaded ) {
      this.cursor.setCursor(this.cursorName);

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

  updateScroll() {
    if ( this.guiHit ) {
      return;
    }

    const mouse = this.engine.mouse;
    const kbd = this.engine.keyboard;
    const cfg = this.engine.configuration;
    const {vw, vh} = this.engine.getViewport();
    const [mouseX, mouseY] = mouse.getPosition();

    let scrollX = 0;
    let scrollY = 0;

    if ( kbd.keyDown(cfg.getKey('PAN_UP')) ||
        (mouse.captured && mouseY <= SCROLL_MARGIN) ) {
      scrollY = -SCROLL_SPEED;
    } else if ( kbd.keyDown(cfg.getKey('PAN_DOWN')) ||
               (mouse.captured && mouseY >= (vh - SCROLL_MARGIN)) ) {
      scrollY = SCROLL_SPEED;
    }

    if ( kbd.keyDown(cfg.getKey('PAN_LEFT')) ||
        (mouse.captured && mouseX <= SCROLL_MARGIN) ) {
      scrollX = -SCROLL_SPEED;
    } else if ( kbd.keyDown(cfg.getKey('PAN_RIGHT')) ||
               (mouse.captured && mouseX >= (vw - SCROLL_MARGIN)) ) {
      scrollX = SCROLL_SPEED;
    }

    this.moveMap(scrollX, scrollY);
  }

  handleSelectionRect() {
    if ( this.guiHit ) {
      return;
    }

    const mouse = this.engine.mouse;
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
          .filter((obj) => obj.isSelectable() && obj.isFriendly() && obj.isUnit());

        this.map.select(objects);
      }
    }
  }

  handleMouse() {
    const mouse = this.engine.mouse;
    const {vw} = this.getViewport();
    const [mouseX, mouseY] = mouse.getPosition();
    const {offsetX, offsetY} = this.engine.getOffset();

    if ( (mouseY > 14 && mouseX < vw) ) {
      const leftClick = mouse.buttonClicked('LEFT');
      if ( leftClick ) {
        this.clickViewport(leftClick);
      }

      const rightClick = mouse.buttonClicked('RIGHT');
      if ( rightClick ) {
        if ( this.mode ) {
          this.setMode(null);
        } else {
          this.map.unselect();
        }
      }

      if ( this.mode === 'build' ) {
        if ( this.constructObject ) {
          this.constructObject.move(
            (Math.floor((mouseX + offsetX) / TILE_SIZE) * TILE_SIZE) - offsetX,
            (Math.floor((mouseY + offsetY) / TILE_SIZE) * TILE_SIZE) - offsetY
          );
        }
      } else if ( !this.mode ) {
        this.handleSelectionRect();
      }
    }

    const [panX, panY] = mouse.getPan();
    if ( panX !== null && panY !== null ) {
      this.engine.setOffset(panX, panY);
    }
  }

  handleKeyboard() {
    const kbd = this.engine.keyboard;
    const cfg = this.engine.configuration;

    if ( kbd.keyClicked(cfg.getKey('THEME_PREV')) ) {
      this.prevTheme();
    } else if ( kbd.keyClicked(cfg.getKey('THEME_NEXT')) ) {
      this.nextTheme();
    }

    if ( kbd.keyClicked(cfg.getKey('CANCEL')) ) {
      this.map.unselect();
    }

    if ( this.engine.options.debugMode ) {
      if ( kbd.keyClicked(cfg.getKey('DEBUG_DESTROY')) ) {
        this.map.selectedObjects.forEach((o) => (o.health = 0));
      } else if ( kbd.keyClicked(cfg.getKey('DEBUG_FOG')) ) {
        this.map.fog.visible = !this.map.fog.visible;
      }
    }
  }

  render(target, delta) {
    if ( !this.loaded ) {
      return;
    }

    this.map.render(target, delta);

    // Building overlay
    if ( this.constructObject ) {
      this.constructObject.render(target);
    }

    // Drag rectangle
    if ( this.currentGUI === -1 && !this.guiHit ) {
      if ( this.engine.mouse.dragging ) {
        const {x1, x2, y1, y2} = this.engine.mouse.getCurrentRect();
        target.strokeStyle = '#00ff00';
        target.fillStyle = 'rgba(0, 255, 0, .1)';
        target.fillRect(x1, y1, (x2 - x1), (y2 - y1));
        target.strokeRect(x1, y1, (x2 - x1), (y2 - y1));
      }
    }

    super.render(target, delta);

    if ( this.engine.options.debug ) {
      const mp = this.getMainPlayer();
      let selected = '';

      if ( this.map.selectedObjects.length === 1 ) {
        let obj = this.map.selectedObjects[0];
        selected = `${obj.tileX}x${obj.tileY}x${obj.tileS} (${Math.round(obj.x)}x${Math.round(obj.y)}) ${obj.animation.name} o:${obj.animation.offset} f:${obj.animation.frame} d:${obj.direction}`;
      }

      this.debugOutput = [
        `Objects: ${this.map.objects.length} (${this.map.visibleObjects})`,
        `Tick: ${this.engine.currentTick} (${this.gameTick})`,
        `Map: ${this.map.id} - ${this.map.tilesX}x${this.map.tilesY} (${this.map.width}x${this.map.height})`,
        `Player: ${mp.playerName} - ${mp.teamName} c:${mp.credits} p:${mp.power}`,
        `Selected: (${this.map.selectedObjects.length}) ${selected}`
      ];
    }
  }

  clickViewport({x, y}) {
    const {offsetX, offsetY} = this.engine.getOffset();
    const clickX = x + offsetX;
    const clickY = y + offsetY;
    const {tileX, tileY} = tileFromPoint(clickX, clickY);

    if ( (tileX < 0 || tileY < 0) || (tileX > this.map.tilesX - 1 || tileY > this.map.tilesY - 1) ) {
      return;
    }

    console.debug('clicked viewport', [clickX, clickY], [tileX, tileY], [x, y]);

    if ( this.mode === 'build' && this.constructObject ) {
      const {entry, valid, cb} = this.constructObject;
      if ( valid ) {
        cb();

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

    if ( found.length ) {
      if ( this.mode === 'sell' ) {
        const mp = this.getMainPlayer();
        let sold = false;
        for ( let i = 0; i < found.length; i++ ) {
          const o = found[i];
          if ( o.isSellable() ) {
            const refund = found[0].sell();
            mp.addCredits(refund);
            sold = true;
          }
        }

        if ( sold ) {
          return;
        }
      }
    }

    const selected = this.map.selectedObjects;
    const hasSelected = selected.length;

    if ( hasSelected ) {
      const tileBlocked = this.map.fog.visible ? !this.map.fog.getVisibility(tileX, tileY) : false;

      if ( tileBlocked ) {
        return;
      } else {
        const hasSelectedMovable = hasSelected ? selected[0].isMovable() : false;
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
    const {xb, yb, mx, my} = this.getScrollBounds();

    const newX = Math.min(Math.max(-xb, x), mx);
    const newY = Math.min(Math.max(-yb, y), my);

    super.setOffset(newX, newY);

    return [newX, newY];
  }

  getScrollBounds() {
    const {width, height} = this.map;
    const {vw, vh} = this.getViewport();
    const xb = Math.round(vw / 2);
    const yb = Math.round(vh / 2);
    const mx = width - vw + xb;
    const my = height - vh + yb;

    return {xb, yb, mx, my};
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

  setMode(mode, options, cb) {
    this.mode = mode;
    this.constructObject = null;

    if ( mode === 'build' ) {
      this.constructObject = new ConstructObject(this.engine, options, cb);
    }
  }

  moveMap(deltaX, deltaY) {
    if ( deltaX === 0 && deltaY === 0 ) {
      return;
    }

    const {offsetX, offsetY} = this.getOffset();
    const {xb, yb, mx, my} = this.getScrollBounds();

    const [newX, newY] = this.setOffset(
      Math.round(offsetX + deltaX),
      Math.round(offsetY + deltaY)
    );

    let reachedEndX = (newX <= -xb || newX >= mx);
    let reachedEndY = (newY <= -yb || newY >= my);

    let cursorName = '';
    let reached = [];

    if ( deltaY < 0 ) {
      cursorName += 'n';
      reached.push(reachedEndY);
    } if ( deltaY > 0 ) {
      cursorName += 's';
      reached.push(reachedEndY);
    }

    if ( deltaX < 0 ) {
      cursorName += 'w';
      reached.push(reachedEndX);
    } if ( deltaX > 0 ) {
      cursorName += 'e';
      reached.push(reachedEndX);
    }

    if ( cursorName ) {
      let reachedEnd = reached.filter(i => !!i).length === cursorName.length;
      this.cursorName = reachedEnd ? 'cannotPan' + cursorName : 'pan' + cursorName;
    }
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
    this.engine.sounds.playSong(src, {}, (played) => {
      if ( this.engine.sounds.musicEnabled && played ) {
        this.nextTheme();
      }
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

  clickBuildable(entry, cb) {
    cb = cb || function() {};

    console.info('Build', entry);

    if ( !Sprite.instance(this.engine, entry.Id) ) {
      console.warn('Sprite was not found for this entry', entry);
    }

    if ( this.constructObject ) {
      this.engine.sounds.playSound('bldg1');
      return;
    }

    this.setMode('build', entry, cb);
  }

  getCursor() {
    const [mouseX, mouseY] = this.engine.mouse.getPosition();
    const {vw} = this.engine.getViewport();

    if ( mouseY <= 14 || mouseX >= vw || this.currentGUI !== -1 ) {
      return 'default';
    }

    const {offsetX, offsetY} = this.engine.getOffset();
    const {tileX, tileY} = tileFromPoint(mouseX + offsetX, mouseY + offsetY);
    const gridItem = this.map.getGrid(tileX, tileY);
    const currentObject = gridItem ? gridItem.object : null;
    const selectedObject = this.map.selectedObjects[0];

    if ( this.mode === 'sell' ) {
      return currentObject && currentObject.isSellable() ? 'sell' : 'cannotSell';
    } else if ( this.mode === 'repair' ) {
      return currentObject && currentObject.isRepairable() ? 'repair' : 'cannotRepair';
    } else if ( selectedObject ) {
      if ( currentObject && currentObject.isAttackable() ) {
        return selectedObject.isFriendly() ? 'attack' : 'default';
      }

      if ( currentObject === selectedObject && currentObject.isExpandable() ) {
        return 'expand';
      } else if ( selectedObject.isMovable() ) {
        const insideFog = this.map.fog.visible ? !this.map.fog.getVisibility(tileX, tileY) : false;
        const insideTile = !currentObject;
        return !insideTile || insideFog ? 'unavailable' : 'move';
      }
    }

    if ( currentObject && currentObject.isSelectable() ) {
      return currentObject.isFriendly() ? 'select' : 'default';
    }

    return 'default';
  }

  getBuildables(buildLevel = -1, techLevel = -1) {
    const data = this.engine.data;
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
      const iter = data.structures[s] || data.units[s] || data.infantry[s] || data.aircraft[s];
      return iter;
    };

    const structureKeys = Object.keys(data.structures).filter(s => filter(data.structures[s]));
    const unitKeys = Object.keys(data.infantry).filter(s => filter(data.infantry[s]))
      .concat(Object.keys(data.units).filter(s => filter(data.units[s])))
      .concat(Object.keys(data.aircraft).filter(s => filter(data.aircraft[s])));

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

  playSound(soundId, cb) {
    const sound = SOUNDS[soundId];
    const origSoundId = soundId;

    if ( sound ) {
      const tmp = sound.count;
      const index = tmp instanceof Array ? randomInteger(0, tmp.length - 1) : randomInteger(1, tmp);
      soundId += (sound.separator || '') + String(tmp instanceof Array ? tmp[index] : index);

      // FIXME: This is here because usually it's the "multiple" ones we don't want
      if ( typeof this.soundDebounce[origSoundId] !== 'undefined' ) {
        clearTimeout(this.soundDebounce[origSoundId]);
        delete this.soundDebounce[origSoundId];
      }
    }

    this.soundDebounce[origSoundId] = setTimeout(() => cb(soundId), 10);
  }
}
