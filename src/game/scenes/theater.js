/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Level from 'game/theater/level';
import GameScene from 'game/scene';
import TickerElement from 'game/ui/ticker';
import MiniMap from 'game/ui/minimap';
import ConstructObject from 'game/objects/construct';
import UIContainer from 'engine/ui/container';
import Sprite from 'engine/sprite';
import {randomInteger} from 'engine/util';
import {tileFromPoint} from 'game/physics';
import {TILE_SIZE, ICONS, SOUNDS} from 'game/globals';

const DEFAULT_THEME = 5; // FIXME
const SCROLL_MARGIN = 4; // FIXME
const SCROLL_SPEED = 3; // FIXME

export default class TheaterScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);

    this.currentTheme = -1;
    this.sidebar = null;
    this.minimap = null;
    this.soundDebounce = {};
    this.guiContainers = [];
    this.currentGUI = -1;
    this.minimapVisible = false;
    this.minimapAvailable = false; // FIXME
    this.sidebarVisible = this.engine.options.debug === 3; // FIXME
    this.tickerBuildings = null;
    this.tickerUnits = null;
    this.cursorName = 'default';
    this.constructObject = null;
    this.debugTime = 0;
  }

  async load() {
    console.info('Loading Theater', this.options);

    const mapName = this.options.map;
    const level = this.engine.data.levels[mapName];

    const tmap = {desert: 'DESERT.MIX', winter: 'WINTER.MIX'};
    const theatre = tmap[level.theater] || 'TEMPERAT.MIX';

    const extractAudio = (iter) => {
      if ( iter.PrimaryWeapon && iter.PrimaryWeapon.Report ) {
        return 'audio:' + iter.PrimaryWeapon.Report;
      }
      return null;
    };

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
      'audio:crumble',
      'audio:nukexplo',
      ...Object.values(this.engine.data.aircraft).map(extractAudio),
      ...Object.values(this.engine.data.infantry).map(extractAudio),
      ...Object.values(this.engine.data.units).map(extractAudio)
    ];

    Object.keys(SOUNDS).forEach((k) => {
      if ( typeof SOUNDS[k] === 'string' ) {
        audioNames.push(`audio:${SOUNDS[k]}`);
      } else {
        const count = SOUNDS[k].count;
        if ( count instanceof Array ) {
          count.forEach((i) => audioNames.push(`audio:${k}${i}`));
        } else {
          for ( let i = 0; i < count; i++ ) {
            const s = SOUNDS[k].separator || '';
            audioNames.push(`audio:${k}${s}${i + 1}`);
          }
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
      ...Object.values(this.engine.data.aircraft).map(iter => `sprite:${ICONS[theatre]}/${iter.Icon}`),
      ...Object.values(this.engine.data.aircraft).map(iter => `sprite:${iter.Id}`),

      ...Object.values(this.engine.data.structures).map(iter => `sprite:${iter.Id}`),
      ...Object.values(this.engine.data.structures).filter(iter => iter.Selectable).map(iter => `sprite:${iter.Id}make`),
      ...Object.values(this.engine.data.structures).map(iter => `sprite:${ICONS[theatre]}/${iter.Icon}`),

      ...Object.values(this.engine.data.infantry).map(iter => `sprite:${ICONS[theatre]}/${iter.Icon}`),
      ...Object.values(this.engine.data.infantry).map(iter => `sprite:${iter.Id}`),

      ...Object.values(this.engine.data.units).map(iter => `sprite:${ICONS[theatre]}/${iter.Icon}`),
      ...Object.values(this.engine.data.units).map(iter => `sprite:${iter.Id}`)
    ];

    console.debug('Sounds', audioNames);
    console.debug('Sprites', spriteNames);

    await super.load([
      ...audioNames.filter(iter => !!iter && ['audio:toss', 'audio:dinoatk1', 'audio:none'].indexOf(iter) === -1),
      ...spriteNames.filter(iter => !!iter)
    ]);

    this.level = new Level(this.engine, theatre, level);
    await this.level.load();

    this.minimap = new MiniMap(this.engine, this.level.map);
    await this.minimap.load();

    this.loadUI(level);

    this.engine.sounds.setSoundHandler((i, c) => this.playSound(i, c));
    this.playTheme(DEFAULT_THEME);

    this.engine.addGraph('#O', '#f08', '#201', () => {
      if ( this.level && this.level.map ) {
        return [this.level.map.objects.length];
      }
      return [0, 0];
    });

    this.loaded = true;
  }

  loadUI(level) {
    const mp = this.level.getMainPlayer();
    const playerName = mp.teamName.toLowerCase();

    this.tickerBuildings = new TickerElement(this.engine, 'structures');
    this.tickerUnits = new TickerElement(this.engine, 'units');

    this.guiContainers = [
      new UIContainer(this.engine, [
        {type: 'rect', x: 0, y: 0, w: -1, h: 14},
        {type: 'tab', x: 0, y: 0, label: 'Options', cb: () => (this.currentGUI = 0)},
        {type: 'tab', x: -320, y: 0, label: () => {
          return String(mp.credits);
        }, cb: () => {
          if ( this.engine.options.debugMode ) {
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
        {instance: this.minimap, visible: () => this.getMinimapVisible()}
      ], {x: -160, y: 14}),

      new UIContainer(this.engine, [
        {type: 'box', corners: true, x: 0, y: 0, w: 450, h: 270},
        {type: 'text', text: ['Menu'], x: 30, y: 15, w: 390, h: 20, underline: true, center: true},
        {type: 'button', label: 'Load Mission', x: 135, y: 80, w: 180, h: 18, disabled: true},
        {type: 'button', label: 'Save Mission', x: 135, y: 110, w: 180, h: 18, disabled: true},
        {type: 'button', label: 'Delete Mission', x: 135, y: 140, w: 180, h: 18, disabled: true},
        {type: 'button', label: 'Game Controls', x: 135, y: 50, w: 180, h: 18, cb: () => (this.currentGUI = 2)},
        {type: 'button', label: 'Abort Mission', x: 135, y: 170, w: 180, h: 18, cb: () => this.level.abort()},
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
      this.getSidebarVisible() ? this.guiContainers[1] : null,
      busy ? this.guiContainers[2 + this.currentGUI] : null
    ].filter(iter => !!iter);

    this.guiContainers[0].active = !busy;
    this.guiContainers[1].active = !busy;

    super.update();

    this.cursorName = this.getCursor();

    if ( !busy ) {
      this.handleMouse();
      this.handleKeyboard();

      if ( this.constructObject ) {
        this.constructObject.update();
      }

      this.updateScroll();
    }

    this.engine.pauseTick = busy; // FIXME: This needs a better solution

    if ( this.loaded ) {
      this.cursor.setCursor(this.cursorName);

      if ( !busy ) {
        this.level.update();
      }
    }

    return true;
  }

  updateScroll() {
    if ( this.guiHit || this.currentGUI !== -1 ) {
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

        const objects = this.level.map.getObjectsFromRect(selection)
          .filter((obj) => obj.isSelectable() && obj.isFriendly() && obj.isUnit());

        this.level.map.select(objects);
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
          this.level.map.unselect();
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

    if ( kbd.keyClicked(cfg.getKey('CANCEL')) ) {
      this.level.map.unselect();
    }

    if ( kbd.keyClicked(cfg.getKey('THEME_PREV')) ) {
      this.prevTheme();
    } else if ( kbd.keyClicked(cfg.getKey('THEME_NEXT')) ) {
      this.nextTheme();
    }

    if ( this.engine.options.debugMode ) {
      if ( kbd.keyClicked(cfg.getKey('DEBUG_DESTROY')) ) {
        this.level.map.selectedObjects.forEach((o) => (o.health = 0));
      } else if ( kbd.keyClicked(cfg.getKey('DEBUG_FOG')) ) {
        this.level.map.fog.visible = !this.level.map.fog.visible;
      }
    }
  }

  render(target, delta) {
    if ( !this.loaded ) {
      return;
    }

    this.level.render(target, delta);

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
      const mp = this.level.getMainPlayer();
      const map = this.level.map;
      const [mx, my] = this.engine.mouse.getPosition();
      const {offsetX, offsetY} = this.engine.getOffset();
      const {tileX, tileY} = tileFromPoint(mx + offsetX, my + offsetY);

      let selected = '';
      let gridItem = this.level.map.getGrid(tileX, tileY);
      if ( gridItem ) {
        gridItem = `${gridItem.value} ${gridItem.id} ${String(!!gridItem.object)}`;
      }

      if ( this.level.map.selectedObjects.length === 1 ) {
        let obj = this.level.map.selectedObjects[0];
        selected = `${obj.tileX}x${obj.tileY}x${obj.tileS} (${Math.round(obj.x)}x${Math.round(obj.y)}) ${obj.animation.name} o:${obj.animation.offset} f:${obj.animation.frame} d:${obj.direction}`;
      }

      this.debugOutput = [
        `Mouse: ${Math.round(mx)}x${Math.round(my)} / ${tileX}x${tileY} (${gridItem})`,
        `Objects: ${map.objects.length} (${map.visibleObjects} visible) (${map.selectedObjects.length} selected)`,
        `Tick: ${this.engine.currentTick} (${this.level.levelTick})`,
        `Map: ${map.id} - ${map.tilesX}x${map.tilesY} (${map.width}x${map.height})`,
        `Player: ${mp.playerName} - ${mp.teamName} c:${mp.credits} p:${mp.power}`,
        selected ? `Selected: ${selected}` : '-'
      ];
    }
  }

  clickViewport({x, y}) {
    const map = this.level.map;
    const mp = this.level.getMainPlayer();
    const {offsetX, offsetY} = this.engine.getOffset();
    const clickX = x + offsetX;
    const clickY = y + offsetY;
    const {tileX, tileY} = tileFromPoint(clickX, clickY);

    if ( (tileX < 0 || tileY < 0) || (tileX > map.tilesX - 1 || tileY > map.tilesY - 1) ) {
      return;
    }

    console.debug('clicked viewport', [clickX, clickY], [tileX, tileY], [x, y]);

    if ( this.mode === 'build' && this.constructObject ) {
      const {entry, valid, cb} = this.constructObject;
      if ( valid ) {
        cb();

        map.addObject({
          tileX,
          tileY,
          team: mp.team,
          id: entry.Id,
          type: entry.Type
        });

        this.setMode(null);
      }
      return;
    }

    let found = map.getObjectsFromPosition(clickX, clickY, true).filter((iter) => iter.isUnit());
    if ( !found.length ) {
      found = map.getObjectsFromTile(tileX, tileY, true).filter((iter) => !iter.isMapOverlay());
    }

    if ( found.length ) {
      if ( this.mode === 'sell' ) {
        let sold = false;
        for ( let i = 0; i < found.length; i++ ) {
          const o = found[i];
          if ( o.isSellable() ) {
            found[0].sell();
            sold = true;
          }
        }

        if ( sold ) {
          return;
        }
      }
    }

    const selected = map.selectedObjects;
    const hasSelected = selected.length;

    if ( hasSelected ) {
      const tileBlocked = map.fog.visible ? !map.fog.getVisibility(tileX, tileY) : false;

      if ( tileBlocked ) {
        return;
      } else {
        const hasSelectedMovable = hasSelected ? selected[0].isMovable() : false;
        const hasSelectedAttackable = hasSelected ? selected[0].canAttack() : false;
        const hasSelectedFriendly = hasSelected ? selected[0].isFriendly() : false;
        const clickedEnemy = found.length ? found[0].isEnemy() : false;
        const clickedFriendly = found.length ? found[0].isFriendly() : false;

        const selectedObjects = map.selectedObjects.filter((obj) => obj.isFriendly());
        if ( hasSelectedAttackable && clickedEnemy ) {
          selectedObjects.forEach((o) => {
            o.attack(found[0], true);
          });
          return;
        } else if ( hasSelectedMovable && hasSelectedFriendly && !clickedFriendly ) {
          selectedObjects.forEach((o) => {
            const d = tileFromPoint(clickX, clickY);
            o.move(d.tileX, d.tileY, true);
          });
          return;
        }
      }
    }

    if ( found.length && found[0].isFriendly() && found[0].isExpandable() ) {
      if ( found[0].selected ) {
        found[0].expand();
        return;
      }
    }

    map.select(found);
  }

  setOffset(x, y) {
    const {xb, yb, mx, my} = this.getScrollBounds();

    const newX = Math.min(Math.max(-xb, x), mx);
    const newY = Math.min(Math.max(-yb, y), my);

    super.setOffset(newX, newY);

    return [newX, newY];
  }

  getScrollBounds() {
    const {width, height} = this.level.map;
    const {vw, vh} = this.getViewport();
    const xb = Math.round(vw / 2);
    const yb = Math.round(vh / 2);
    const mx = width - vw + xb;
    const my = height - vh + yb;

    return {xb, yb, mx, my};
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
    if ( !engine && this.getSidebarVisible() ) {
      vw -= 160;
    }
    return {vx, vy, vw, vh};
  }

  /**
   * Plays given theme
   * @param {String} id Theme ID
   */
  playTheme(id) {
    const src = this.engine.data.themes[id].filename;
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
    this.playTheme((this.currentTheme + 1) % this.engine.data.themes.length);
  }

  /**
   * Play previous theme
   */
  prevTheme() {
    const n = (this.currentTheme - 1);
    this.playTheme(n < 0 ? this.engine.data.themes.length - 1 : n);
  }

  playSound(soundId, cb) {
    const sound = SOUNDS[soundId];
    const origSoundId = soundId;

    if ( sound ) {
      if ( typeof sound === 'string' ) {
        cb(sound);
        return;
      }

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

  toggleSidebar(t) {
    this.sidebarVisible = typeof t === 'boolean' ? t : !this.sidebarVisible; // FIXME
  }

  toggleMinimap() {
    if ( this.minimapAvailable ) {
      this.minimapVisible = !this.minimapVisible; // FIXME
    }
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

  getSidebarVisible() {
    return this.sidebarVisible;
  }

  getMinimapVisible() {
    if ( this.engine.options.debug === 3 ) {
      return true;
    }

    return this.sidebarVisible &&
      this.minimapVisible &&
      this.minimapAvailable;
  }

  getCursor() {
    const [mouseX, mouseY] = this.engine.mouse.getPosition();
    const {vw} = this.getViewport();

    if ( mouseY <= 14 || mouseX >= vw || this.currentGUI !== -1 ) {
      return 'default';
    }

    const map = this.level.map;
    const {offsetX, offsetY} = this.engine.getOffset();
    const {tileX, tileY} = tileFromPoint(mouseX + offsetX, mouseY + offsetY);
    const gridItem = map.getGrid(tileX, tileY);
    const currentObject = gridItem ? gridItem.object : null;
    const selectedObject = map.selectedObjects[0];

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
        const insideFog = map.fog.visible ? !map.fog.getVisibility(tileX, tileY) : false;
        const insideTile = !currentObject;
        return !insideTile || insideFog ? 'unavailable' : 'move';
      }
    }

    if ( currentObject && currentObject.isSelectable() ) {
      return currentObject.isFriendly() ? 'select' : 'default';
    }

    return 'default';
  }
}
