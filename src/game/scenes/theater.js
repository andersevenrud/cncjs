/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Map from '../map';
import GameScene from '../scene';
import Player from '../player';
import Sprite from '../../engine/sprite';
import {tileFromPoint, collidePoint} from '../../engine/physics';
import {UPDATE_RATE, TILE_SIZE} from '../../engine/globals';
import {SOUNDS, ICONS, THEMES, DEFAULT_THEME, TICK_LENGTH} from '../globals';

const MODE_NONE = 0;
const MODE_BUILD = 1;
const MODE_REPAIR = 2;
const MODE_SELL = 3;

export default class TheaterScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);

    this.currentTheme = -1;
    this.players = [];
    this.buildObject = null;

    this.ui = {
      buildables: {
        structures: [],
        units: []
      },
      mode: MODE_NONE,
      minimap: true, // TODO
      structureOffset: 0,
      unitOffset: 0,
      visible: true,
      width: 160
    };
  }

  async load() {
    console.info('Loading Theater', this.options);

    this.engine.sounds.setSoundLibrary(SOUNDS);

    const mapName = this.options.map;
    const level = this.engine.mix.getLevel(mapName);

    this.players = Player.createAll(level.players, level.info.Player);
    this.map = new Map(this.engine, level);

    await this.map.load(level);

    const buildables = this.engine.mix.getBuildables();
    const spriteNames = [
      'htabs',
      'hside1',
      'hside2',
      'hradar_' + this.getMainPlayer().teamName.toLowerCase(),
      'hstripdn',
      'hstripup',
      'hrepair',
      'hsell',
      'hmap',
      'hclock',
      'trans',
      ...buildables.structures.map(iter => `${ICONS[this.map.theatre]}/${iter.Icon}`),
      ...buildables.units.map(iter => `${ICONS[this.map.theatre]}/${iter.Icon}`)
    ];

    this.ui.buildables = buildables;

    await super.load(spriteNames);

    const {tileX, tileY} = level.tacticalPos;
    const {vw, vh} = this.getViewport();
    this.setOffset(
      (tileX * TILE_SIZE) + (vw / 2),
      (tileY * TILE_SIZE) + (vh / 2)
    );
    this.playTheme(DEFAULT_THEME);
  }

  update() {
    super.update();
    this.handleKeyboard();
    this.handleMouse();

    if ( this.loaded ) {
      this.updateUI();

      const tick = this.currentTick;
      if ( tick === 1 || (tick % TICK_LENGTH) === 0 ) {
        this.processTriggers();
      }

      this.map.update();
    }
  }

  updateUI() {
    let cursorName = 'default';

    const [mouseX, mouseY] = this.engine.mouse.getPosition();
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
      const tileBlocked = this.map.renderFOW ? this.map.fowGrid[tileY][tileX] !== 1 : false;
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

    this.cursorName = cursorName;
  }

  handleMouse() {
    const mouse = this.engine.mouse;
    const [panX, panY] = mouse.getPan();
    const [mouseX, mouseY] = mouse.getPosition();
    const {offsetX, offsetY} = this.engine.getOffset();

    if ( panX !== null && panY !== null ) {
      this.engine.setOffset(panX, panY);
    }

    if ( this.ui.mode === MODE_NONE ) {
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

    if ( this.ui.mode === MODE_BUILD ) {
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
      if ( !this.clickUI(click) ) {
        this.clickViewport(click);
      }
    }

    if ( right ) {
      this.setMode(MODE_NONE);
    }
  }

  handleKeyboard() {
    const kbd = this.engine.keyboard;

    if ( kbd.keyDown('W') ) {
      this.moveMap(0, -10);
    }
    if ( kbd.keyDown('A') ) {
      this.moveMap(-10, 0);
    }
    if ( kbd.keyDown('S') ) {
      this.moveMap(0, 10);
    }
    if ( kbd.keyDown('D') ) {
      this.moveMap(10, 0);
    }

    if ( kbd.keyClicked(',') ) {
      this.prevTheme();
    } else if ( kbd.keyClicked('.') ) {
      this.nextTheme();
    } else if ( kbd.keyClicked('DELETE') ) {
      this.map.selectedObjects.forEach((o) => (o.health = 0)); // FIXME
    } else if ( kbd.keyClicked('ESC') ) {
      this.map.unselect();
    } else if ( kbd.keyClicked('F3') ) {
      this.map.renderFOW = !this.map.renderFOW;
    }
  }

  render(target, delta) {
    if ( !this.loaded ) {
      return;
    }

    this.map.render(target, delta);
    this.renderUI(target, delta);
    super.render(target, delta);
  }

  renderUI(target, delta) {
    const {vx, vy, vw, vh} = this.getViewport();
    const tabSprite = Sprite.getFile('htabs');
    const backTexture = Sprite.getFile('btexture').createImage(1);
    const hside1 = Sprite.getFile('hside1');
    const hside2 = Sprite.getFile('hside2');
    const left = this.engine.width - (this.ui.visible ? this.ui.width : 0);
    const mp = this.engine.scene.getMainPlayer();

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
    if ( this.engine.mouse.dragging ) {
      const {x1, x2, y1, y2} = this.engine.mouse.getCurrentRect();
      target.strokeStyle = '#00ff00';
      target.fillStyle = 'rgba(0, 255, 0, .1)';
      target.fillRect(x1, y1, (x2 - x1), (y2 - y1));
      target.strokeRect(x1, y1, (x2 - x1), (y2 - y1));
    }

    // Top bar
    target.fillStyle = '#000000';
    target.fillRect(0, 0, this.engine.width, tabSprite.height);

    target.fillStyle = '#eeeeee';
    target.font = '12px cnc';

    const credits = String(mp.credits);
    const main = 'Menu';
    const sidebar = 'Sidebar';

    tabSprite.render(target, 0, 0);
    target.fillText(main, 0 + (tabSprite.width / 2) - (target.measureText(main).width / 2), 11);

    tabSprite.render(target, this.engine.width - tabSprite.width * 2, 0);
    target.fillText(credits, this.engine.width - (tabSprite.width * 2) + (tabSprite.width / 2) - (target.measureText(credits).width / 2), 11);

    tabSprite.render(target, this.engine.width - tabSprite.width, 0);
    target.fillText(sidebar, this.engine.width - tabSprite.width + (tabSprite.width / 2) - (target.measureText(sidebar).width / 2), 11);

    // Side bar
    if ( this.ui.visible ) {
      const ptrn = target.createPattern(backTexture, 'repeat');
      target.fillStyle = ptrn;
      target.fillRect(left, tabSprite.height, this.ui.width, this.engine.height);

      // Map
      target.fillStyle = 'rgba(0, 0, 0, .5)';
      target.fillRect(left, tabSprite.height, 160, 142);

      // Actions
      hside1.render(target, left, tabSprite.height + 142, 1);
      hside2.render(target, left, tabSprite.height + 142 + 118, 1);

      // Other UI
      const objects = this.getUIElements();
      for ( let i = 0; i < objects.length; i++ ) {
        let obj = objects[i];
        if ( obj.sprite && obj.sprite.render ) {
          obj.sprite.render(target, obj.x1, obj.y1);
        }
      }

      // Minimap
      if ( this.ui.minimap ) {
        target.drawImage(this.map.mmCanvas, left + 2, tabSprite.height + 2);
      }
    }

    // Debug info
    if ( this.engine.options.debug ) {
      const mp = this.getMainPlayer();
      this.debugOutput = [
        `UI: scale:${this.engine.options.scale.toFixed(1)}x fow:${String(this.map.renderFOW)}`,
        `FPS: ${(this.engine.fpsAverage).toFixed(0)} c:${(this.engine.fps).toFixed(0)} d:${(this.engine.delta * 1000).toFixed(2)}ms u:${this.engine.updateTime.toFixed(2)} (${Math.round(1000 / UPDATE_RATE)}Hz)`,
        `Viewport: ${[vx, vy, vw, vh].join(' ')}`,
        `Map: ${this.map.id} - ${this.map.tilesX}x${this.map.tilesY} (${this.map.width}x${this.map.height})`,
        `Objects: t:${this.map.objects.length} s:${this.map.selectedObjects.length} v:${this.map.visibleObjects}`,
        `Pos: x:${this.gameX} y:${this.gameY}`,
        `Sound: s:${String(this.engine.sounds.soundEnabled)} m:${String(this.engine.sounds.musicEnabled)} t:${this.currentTheme}`,
        `Player: ${mp.playerName} - ${mp.teamName} c:${mp.credits} p:${mp.power}`,
        `Game: tick:${this.engine.currentTick}`,
        '',
        'Press <F2> to toggle Debug',
        'Press <F3> to toggle FOW',
        'Press <F5> to toggle Scale',
        'Press <F6> to toggle Sound',
        'Press <F7> to toggle Music'
      ];
    } else {
      this.debugOutput = null;
    }
  }

  clickUI({x, y}) {
    const {vw} = super.getViewport();

    if ( y > 14 && (this.ui.visible && x < (vw - this.ui.width)) ) {
      return false;
    }

    const objects = this.getUIElements();

    if ( objects.length ) {
      const hit = objects.find((iter) => collidePoint({x, y}, iter));
      if ( hit ) {
        console.info('Hit UI Element', hit);
        hit.fn();

        return true;
      }
    }

    return false;
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

    if ( this.ui.mode === MODE_BUILD && this.buildObject ) {
      const {entry, valid} = this.buildObject;
      if ( valid ) {
        this.map.addObject({
          tileX,
          tileY,
          team: this.getMainPlayer().team,
          id: entry.Id,
          type: entry.Type
        });

        this.setMode(MODE_NONE);
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
      const tileBlocked = this.map.renderFOW ? this.map.fowGrid[tileY][tileX] !== 1 : false;

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

  async clickBuildable(entry) {
    console.info('Build', entry);

    this.setMode(MODE_BUILD);

    const sprite = await Sprite.loadFile(this.engine, entry.Id);
    this.buildObject = {
      sprite,
      entry,
      pattern: null,
      valid: false,
      x: null,
      y: null
    };
  }

  moveMap(deltaX, deltaY) {
    const {offsetX, offsetY} = this.getOffset();
    this.setOffset(
      Math.round(offsetX + deltaX),
      Math.round(offsetY + deltaY)
    );
  }

  playTheme(id) {
    const src = THEMES[id].filename;
    this.engine.sounds.playSong(src).then((el) => {
      el.addEventListener('ended', () => this.nextTheme());
    });
    this.currentTheme = id;
  }

  processTriggers() {
    console.debug('Processing triggers...');
  }

  nextTheme() {
    this.playTheme((this.currentTheme + 1) % THEMES.length);
  }

  prevTheme() {
    const n = (this.currentTheme - 1);
    this.playTheme(n < 0 ? THEMES.length - 1 : n);
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

  getUIElements() {
    const {vw} = super.getViewport();

    const tabSprite = Sprite.getFile('htabs');

    const elements = [{
      x1: 0,
      x2: tabSprite.width,
      y1: 0,
      y2: tabSprite.height
    }, {
      x1: (vw - 160),
      x2: vw,
      y1: 0,
      y2: tabSprite.width,
      fn: () => (this.ui.visible = !this.ui.visible)
    }];

    const makeFromSprite = (s, x, y, cb) => {
      return {
        fn: cb || function() {},
        sprite: s,
        x1: x,
        x2: x + s.width,
        y1: y,
        y2: y + s.height
      };
    };

    if ( this.ui.visible ) {
      const buildables = this.ui.buildables;
      const left = this.engine.width - this.ui.width;

      const radarSprite = Sprite.getFile('hradar_' + this.getMainPlayer().teamName.toLowerCase());

      elements.push(makeFromSprite(radarSprite, left, tabSprite.height));

      //FIXME
      elements.push(makeFromSprite(Sprite.getFile('hrepair'), left + 4, tabSprite.height + radarSprite.height + 2, () => {
        this.setMode(MODE_REPAIR);
      }));
      elements.push(makeFromSprite(Sprite.getFile('hsell'), left + 4 + 53, tabSprite.height + radarSprite.height + 2, () => {
        this.setMode(MODE_SELL);
      }));
      elements.push(makeFromSprite(Sprite.getFile('hmap'), left + 4 + 106, tabSprite.height + radarSprite.height + 2, () => {
        this.ui.minimap = !this.ui.minimap; // FIXME
      }));

      elements.push(makeFromSprite(Sprite.getFile('hstripup'), left + 20, 371, () => {
        this.ui.structureOffset = Math.max(0, this.ui.structureOffset - 1);
      }));
      elements.push(makeFromSprite(Sprite.getFile('hstripdn'), left + 20 + 33, 371, () => {
        this.ui.structureOffset = Math.min(this.ui.structureOffset + 1, buildables.structures.length - 5);
      }));

      const maxStructures = Math.min(4, buildables.structures.length - 1 - this.ui.structureOffset);
      for ( let i = 0; i < maxStructures; i++ ) {
        let o = buildables.structures[i + this.ui.structureOffset];
        let s = Sprite.getFile(o.Icon);
        elements.push(makeFromSprite(s, left + 20, 178 + (i * s.height), () => {
          this.clickBuildable(o);
        }));
      }

      elements.push(makeFromSprite(Sprite.getFile('hstripup'), left + 70 + 20, 371, () => {
        this.ui.unitOffset = Math.max(0, this.ui.unitOffset - 1);
      }));
      elements.push(makeFromSprite(Sprite.getFile('hstripdn'), left + 70 + 20 + 33, 371, () => {
        this.ui.unitOffset = Math.min(this.ui.unitOffset + 1, buildables.units.length - 5);
      }));

      const maxUnits = Math.min(4, buildables.units.length - 1 - this.ui.unitOffset);
      for ( let i = 0; i < maxUnits; i++ ) {
        let o = buildables.units[i + this.ui.unitOffset];
        let s = Sprite.getFile(o.Icon) || {width: 64, height: 48};
        elements.push(makeFromSprite(s, left + 20 + 64 + 6, 178 + (i * s.height), () => {
          this.clickBuildable(o);
        }));
      }

    }

    return elements;
  }

  setMode(mode) {
    this.ui.mode = mode;
    this.buildObject = null;
  }

  getViewport() {
    let {vw, vh, vx, vy} = super.getViewport();
    if ( this.ui.visible ) {
      vw -= this.ui.width;
    }
    return {vx, vy, vw, vh};
  }
}
