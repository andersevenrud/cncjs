/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import {
  Box,
  UIEntity,
  UIScene,
  MousePosition,
  collideAABB,
  collidePoint,
  capitalize,
  requestLoadFile,
  requestSaveFile
} from '../../engine';
import {
  TAB_WIDTH,
  TAB_HEIGHT,
  RADAR_HEIGHT,
  ACTION_HEIGHT,
  SIDEBAR_WIDTH,
  ACTION_WIDTH,
  BUTTON_WIDTH,
  BUTTON_HEIGHT,
  CONSTRUCTION_HEIGHT,
  UIMinimap,
  UITab,
  UISidebar,
  UIRadar,
  UIIconButton,
  UIConstruction,
  UIPowerBar,
  UITooltip,
  UIButton,
  UIText,
  UIBox
} from './elements';
import {
  buildableStructures,
  buildableInfantry,
  buildableUnits,
  usableSpecials,
  MIXMission,
  MIXCursorType
} from '../mix';
import { TheatreScene } from '../scenes/theatre';
import { createGameMenus } from './mainmenu';
import { GameEngine } from '../game';
import { GameMapBaseEntity } from '../entity';
import { GameMapMask } from '../map';
import { ConstructionQueue } from '../construction';
import { cellFromPoint, isRectangleVisible } from '../physics';
import { Vector } from 'vector2d';

export const SCROLL_BORDER = 2;
export type ActionsName = 'sell' | 'repair'

export class TheatreUI extends UIScene {
  public readonly scene: TheatreScene;
  protected sidebarVisible: boolean = false;
  private selectionRectangleStart?: Vector;
  private selectionRectangle?: Box;
  private placeConstruction?: string;
  private currentAction?: ActionsName;
  private menuOpen: boolean = false;
  private cursor: MIXCursorType = 'default';
  private mapButton?: UIIconButton;
  private minimap?: UIMinimap;
  private sidebar?: UISidebar;
  private constructionCallback?: Function;

  public constructor(scene: TheatreScene) {
    super(scene.engine);
    this.scene = scene;
  }

  public async init(): Promise<void> {
    const theatre = this.scene.map.theatre;
    const player = this.scene.map.player;
    const data = this.scene.map.getData();
    const structures = [...buildableStructures];
    const factories = [...buildableInfantry, ...buildableUnits, ...usableSpecials];

    const structureConstruction = new ConstructionQueue(structures, player, this.scene.engine);
    const factoryConstruction = new ConstructionQueue(factories, player, this.scene.engine);

    if (data) {
      structureConstruction.setBuildLevel(data.BuildLevel);
      structureConstruction.updateAvailable();

      factoryConstruction.setBuildLevel(data.BuildLevel);
      factoryConstruction.updateAvailable();
    }

    // Tabs
    const emitCredits = () => String(player.getCredits());
    const tabMenu = new UITab('tab-menu', 'Menu', new Vector(0, 0), this);
    const tabCredits = new UITab('tab-credits', emitCredits, new Vector(-TAB_WIDTH, 0), this);
    const tabSidebar = new UITab('tab-sidebar', 'Sidebar', new Vector(-0, 0), this);

    // Sidebar
    const cy = RADAR_HEIGHT + ACTION_HEIGHT + 6;
    const tooltip = new UITooltip('tooltip', new Vector(0, 0), this);
    const minimap = new UIMinimap(this.scene.map, this);
    const sidebar = new UISidebar(new Vector(-0, TAB_HEIGHT), this);
    const btnSell = sidebar.addChild(new UIIconButton('sell', 'UPDATEC.MIX/hsell.png', new Vector(49, 16), new Vector(4, RADAR_HEIGHT + 2), this));
    const btnRepair = sidebar.addChild(new UIIconButton('sell', 'UPDATEC.MIX/hrepair.png', new Vector(49, 16), new Vector(4 + ACTION_WIDTH, RADAR_HEIGHT + 2), this));
    const btnMap = sidebar.addChild(new UIIconButton('sell', 'UPDATEC.MIX/hmap.png', new Vector(49, 16), new Vector(8 + ACTION_WIDTH * 2, RADAR_HEIGHT + 2), this));
    const elStructures = sidebar.addChild(new UIConstruction('structures', theatre, structureConstruction, new Vector(20,  cy), this)) as UIConstruction;
    const elStructuresUp = sidebar.addChild(new UIIconButton('structures-up', 'UPDATEC.MIX/hstripup.png', new Vector(BUTTON_WIDTH, BUTTON_HEIGHT), new Vector(20, cy + CONSTRUCTION_HEIGHT + 2), this)) as UIIconButton;
    const elStructuresDown = sidebar.addChild(new UIIconButton('structures-down', 'UPDATEC.MIX/hstripdn.png', new Vector(BUTTON_WIDTH, BUTTON_HEIGHT), new Vector(20 + BUTTON_WIDTH, cy + CONSTRUCTION_HEIGHT + 2), this)) as UIIconButton;
    const elFactories = sidebar.addChild(new UIConstruction('factories', theatre, factoryConstruction, new Vector(90, cy), this)) as UIConstruction;
    const elFactoriesUp = sidebar.addChild(new UIIconButton('factories-up', 'UPDATEC.MIX/hstripup.png', new Vector(BUTTON_WIDTH, BUTTON_HEIGHT), new Vector(90, cy + CONSTRUCTION_HEIGHT + 2), this)) as UIIconButton;
    const elFactoriesDown = sidebar.addChild(new UIIconButton('factories-down', 'UPDATEC.MIX/hstripdn.png', new Vector(BUTTON_WIDTH, BUTTON_HEIGHT), new Vector(90 + BUTTON_WIDTH, cy + CONSTRUCTION_HEIGHT + 2), this)) as UIIconButton;

    sidebar.addChild(new UIPowerBar(new Vector(0,  RADAR_HEIGHT + ACTION_HEIGHT + 2), this));
    sidebar.addChild(new UIRadar(new Vector(0, 0), this));
    sidebar.addChild(minimap);
    sidebar.setVisible(this.sidebarVisible);

    // Game Menu
    const menu = new UIBox('menu', new Vector(420, 230), new Vector(0.5, 0.5), this);
    menu.addChild(new UIText('title', 'Menu', '6point', new Vector(0.5, 6), this));
    const btnLoad = menu.addChild(new UIButton('load-mission', 'Load mission', new Vector(250, 18), new Vector(0.5, 40), this));
    const btnSave = menu.addChild(new UIButton('save-mission', 'Save mission', new Vector(250, 18), new Vector(0.5, 64), this));
    menu.addChild(new UIButton('delete-mission', 'Delete mission', new Vector(250, 18), new Vector(0.5, 88), this));
    const btnControls = menu.addChild(new UIButton('game-controls', 'Game Controls', new Vector(250, 18), new Vector(0.5, 112), this));
    const btnAbort = menu.addChild(new UIButton('abort-mission', 'Abort mission', new Vector(250, 18), new Vector(0.5, 136), this));

    const btnClose = menu.addChild(new UIButton('resume-mission', 'Resume mission', new Vector(125, 18), new Vector(18, 200), this));
    const btnRestate = menu.addChild(new UIButton('restate-mission', 'Restate', new Vector(125, 18), new Vector(282, 200), this));

    const [settings, visuals, sounds] = createGameMenus(this, new Vector(0.5, 0.5), menu);

    const restate = new UIBox('restate', new Vector(600, 170), new Vector(0.5, 0.5), this);
    restate.addChild(new UIText('title', 'Mission Statement', '6point', new Vector(0.5, 6), this));
    const btnCloseRestate = restate.addChild(new UIButton('close-restate', 'Game Controls', new Vector(250, 18), new Vector(0.5, 136), this));

    const mission = this.scene.engine.mix.mission.get(this.scene.name.toUpperCase()) as MIXMission;
    if (mission) {
      for (let i = 0; i < Object.keys(mission).length; i++) {
        let line: string = (mission as any)[i + 1];
        restate.addChild(new UIText(`line-${i}`, line, '8point', new Vector(18, 38 + (i * 20)), this));
      }
    }

    // Glue
    const onConstruct = (parent: UIConstruction) => (item: any) => {
      const name = item.name.toUpperCase();
      this.placeConstruction = name;
      const mask = new GameMapMask(name, this.scene.map);
      this.scene.map.setMask(mask);

      this.constructionCallback = () => parent.emit('placed', item);
    };

    elStructures.on('place', onConstruct(elStructures));
    elStructuresUp.on('click', () => elStructures.moveUp());
    elStructuresDown.on('click', () => elStructures.moveDown());

    elFactories.on('place', onConstruct(elFactories));
    elFactoriesUp.on('click', () => elFactories.moveUp());
    elFactoriesDown.on('click', () => elFactories.moveDown());

    const onTooltipOver = (root: UIEntity) => (position: Vector, text: string) => {
      const dimension = tooltip.getDimension();
      const newPosition = root.getRealPosition()
        .add(position)
        .subtract(new Vector(dimension.x, dimension.y / 2));

      tooltip.setPosition(newPosition);
      tooltip.setText(text);
      tooltip.setVisible(true);
    };

    const onTooltipOut = () => {
      tooltip.setVisible(false);
    };

    elStructures.on('mouseover', onTooltipOver(elStructures));
    elStructures.on('mouseout', onTooltipOut);
    elFactories.on('mouseover', onTooltipOver(elFactories));
    elFactories.on('mouseout', onTooltipOut);

    btnSave.on('click', () => {
      const data = this.scene.map.toJson();
      const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
      requestSaveFile(blob, 'cncjs-savegame.json')
    });

    btnLoad.on('click', async () => {
      const str = await requestLoadFile();
      const savefile = JSON.parse(str);
      this.scene.map.init(savefile);
    });

    tabMenu.on('click', () => {
      menu.setVisible(true);
      this.menuOpen = true;

      tabSidebar.setDisabled(true);
      sidebar.setDisabled(true);
      elStructures.setDisabled(true);
      elFactories.setDisabled(true);
    });

    tabSidebar.on('click', () => {
      this.toggleSidebar();
    });

    btnSell.on('click', () => this.currentAction = 'sell');
    btnRepair.on('click', () => this.currentAction = 'repair');
    btnMap.on('click', () => {
      if (player.hasMinimap()) {
        minimap.setVisible(!minimap.isVisible());
      }
    });

    btnAbort.on('click', () => {
      this.scene.engine.sound.playlist.pause();
      this.scene.engine.playArchiveSfx('SPEECH.MIX/batlcon1.wav', 'gui', {
        done: () => this.scene.engine.pushMenuScene()
      }, 'eva');
    });

    btnControls.on('click', () => {
      menu.setVisible(false);
      settings.setVisible(true);
    });

    btnClose.on('click', () => {
      menu.setVisible(false);
      this.menuOpen = false;

      tabSidebar.setDisabled(false);
      sidebar.setDisabled(false);
      elStructures.setDisabled(false);
      elFactories.setDisabled(false);
    });

    btnRestate.on('click', () => {
      restate.setVisible(true);
      menu.setVisible(false);
    });

    btnCloseRestate.on('click', () => {
      restate.setVisible(false);
      menu.setVisible(true);
    });

    menu.setDecorations(1);
    restate.setDecorations(1);
    restate.setVisible(false);
    settings.setVisible(false);
    visuals.setVisible(false);
    sounds.setVisible(false);
    menu.setVisible(false);
    tooltip.setVisible(false);

    this.elements.push(tabMenu);
    this.elements.push(tabCredits);
    this.elements.push(tabSidebar);
    this.elements.push(sidebar);
    this.elements.push(menu);
    this.elements.push(settings);
    this.elements.push(visuals);
    this.elements.push(sounds);
    this.elements.push(restate);
    this.elements.push(tooltip);

    this.sidebar = sidebar;
    this.minimap = minimap;
    this.mapButton = btnMap as UIIconButton;
    this.mapButton.setDisabled(true);
    this.toggleSidebar(player.canConstruct());
    this.toggleMinimap(player.hasMinimap());

    await super.init();
  }

  public onResize(): void {
    const scale = this.engine.getScale();
    this.context.font = `monospace ${14 * scale}px`;

    super.onResize();
  }

  public onUpdate(deltaTime: number): void {
    const { mouse } = this.engine;

    super.onUpdate(deltaTime);

    if (!this.menuOpen) {
      if (!this.isMouseOutsideViewport()) {
        if (mouse.wasClicked('left')) {
          this.handleClick();
        } else if (mouse.wasClicked('right')) {
          this.currentAction = undefined;
          this.placeConstruction = undefined;
          this.constructionCallback = undefined;
          this.scene.map.setMask(undefined);
          this.scene.map.unselectEntities();
        }
      }

      this.updateSelectionRectangle();
    }

    if (this.mapButton && this.scene.map.player.hasMinimap()) {
      this.mapButton.setDisabled(false);
    }

    this.updateCursor();
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    if (this.updated) {
      this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);
      this.context.fillStyle = '#000000';
      this.context.fillRect(0, 0, this.dimension.x, TAB_HEIGHT);
    }

    if (this.selectionRectangle) {
      const { x1, x2, y1, y2 } = this.selectionRectangle;
      const w = x2 - x1;
      const h = y2 - y1;

      if (isRectangleVisible(this.selectionRectangle)) {
        ctx.lineWidth = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeRect(x1 - 0.5, y1 - 0.5, w, h);
      }
    }

    super.onRender(deltaTime, ctx);
    this.updated = false;
  }

  private handleConstructionPlot(cell: Vector) {
    const name = this.placeConstruction as string;
    const type = this.scene.engine.mix.getType(name);
    const player = this.scene.map.player.getId();

    if (name === 'ION') {
      this.scene.map.factory.load('effect', { name: 'IONSFX', cell, player });
    } else if (name === 'ATOM') {
      this.scene.map.factory.load('effect', { name: 'ATOMSFX', cell, player });
    } else if (type) {
      this.scene.map.factory.load(type, { name, cell, player });
    }

    if (this.constructionCallback) {
      this.constructionCallback();
    }

    this.placeConstruction = undefined;
    this.scene.map.setMask(undefined);
  }

  private handleClick(): void {
    if (this.selectionRectangle && isRectangleVisible(this.selectionRectangle)) {
      return;
    }

    const map = this.scene.map;
    const position = this.engine.mouse.getVector();
    const point = map.getRealMousePosition(position);
    const cell = cellFromPoint(point);

    if (this.placeConstruction) {
      this.handleConstructionPlot(cell);
      return;
    }

    const hit = map.getEntities()
      .filter(e => e.isSelectable())
      .find(e => collidePoint(point, e.getSelectionBox()));

    if (hit) {
      const selected = map.getSelectedEntities();
      console.log('Hit', point, cell, hit);

      if (this.cursor === 'select') {
        map.unselectEntities();
        hit.setSelected(true);
      } else if (this.cursor === 'attack') {
        selected.forEach((s, i) => s.attack(hit, i === 0));
      } else if (this.cursor === 'sell') {
        hit.sell();
      } else if (this.cursor === 'repair') {
        hit.repair();
      } else if (this.cursor === 'expand') {
        const deployable = selected.filter(s => s.isDeployable());
        if (deployable.length > 0) {
          deployable[0].deploy();
          this.toggleSidebar(true); // FIXME
        }
      }
    } else {
      if (this.cursor === 'move') {
        map.moveSelectedEntities(cell);
      }
    }
  }

  public toggleMinimap(toggle?: boolean): void {
    if (!this.minimap) {
      return;
    }

    if (typeof toggle === 'undefined') {
      toggle = !this.minimap.isVisible();
    }
    this.minimap.setVisible(toggle);
  }

  public toggleSidebar(toggle?: boolean): void {
    if (!this.sidebar) {
      return;
    }

    if (typeof toggle === 'undefined') {
      toggle = !this.sidebar.isVisible();
    }

    this.sidebarVisible = toggle;
    this.sidebar.setVisible(this.sidebarVisible);
    this.scene.onUIToggle();
    console.debug('TheatreUI::toggleSidebar()', this.sidebarVisible);
  }

  private updateSelectionRectangle(): void {
    const active = this.engine.mouse.isPressed('left');
    const position = this.engine.mouse.getVector();

    if (this.selectionRectangle && isRectangleVisible(this.selectionRectangle)) {
      this.setDisabled(true);
    } else {
      this.setDisabled(false);
    }

    if (active) {
      if (!this.selectionRectangleStart) {
        this.selectionRectangleStart = position;
      }
    } else {
      if (this.selectionRectangle && isRectangleVisible(this.selectionRectangle)) {
        this.handleSelectionRectangle();
      }
      this.selectionRectangle =  undefined;
      this.selectionRectangleStart =  undefined;
    }

    if (this.selectionRectangleStart) {
      const x1 = Math.min(position.x, this.selectionRectangleStart.x);
      const y1 = Math.min(position.y, this.selectionRectangleStart.y);
      const x2 = Math.max(position.x, this.selectionRectangleStart.x);
      const y2 = Math.max(position.y, this.selectionRectangleStart.y);

      this.selectionRectangle = { x1, x2, y1, y2 };
    }
  }

  private handleSelectionRectangle(): void {
    const map = this.scene.map;
    const position = map.getPosition();

    const rect = {
      x1: this.selectionRectangle!.x1 + position.x,
      x2: this.selectionRectangle!.x2 + position.x,
      y1: this.selectionRectangle!.y1 + position.y,
      y2: this.selectionRectangle!.y2 + position.y
    };

    const selected = map.getEntities()
      .filter(entity => collideAABB(rect, entity.getSelectionBox()))
      .filter(entity => entity.isSelectable());

    if (selected.length > 0) {
      map.unselectEntities();
      selected
        .filter(e => e.isPlayer())
        .filter(e => e.isMovable())
        .forEach((e, i) => e.setSelected(true, i === 0));
    }
  }

  private updateCursor(): void {
    const mpos = this.engine.mouse.getPosition();

    let cursor: MIXCursorType = 'default';
    if (!this.menuOpen) {
      cursor = this.getViewportCursor(mpos);

      let scrollV = new Vector(0, 0);
      let scrollC = '';
      if (mpos.y <= SCROLL_BORDER) {
        scrollV.setY(-1);
        scrollC += 'n';
      } else if (mpos.y >= (this.dimension.y - SCROLL_BORDER)) {
        scrollV.setY(1);
        scrollC += 's';
      }

      if (mpos.x <= SCROLL_BORDER) {
        scrollV.setX(-1);
        scrollC += 'w';
      } else if (mpos.x >= (this.dimension.x - SCROLL_BORDER)) {
        scrollV.setX(1);
        scrollC += 'e';
      }

      scrollV.mulS((this.engine as GameEngine).getScrollSpeed());

      if (scrollV.x !== 0 || scrollV.y !== 0) {
        const scrolled = this.scene.map.moveRelative(scrollV);
        if (scrollC.length > 0) {
          cursor = ('pan' + scrollC) as MIXCursorType;
          if (!scrolled) {
            cursor = ('cannot' + capitalize(cursor)) as MIXCursorType;
          }
        }
      }
    }

    this.cursor = cursor;
    this.scene.engine.cursor.setCursor(cursor);
  }

  private getViewportCursor(mpos: MousePosition): MIXCursorType {
    const map = this.scene.map;
    const pos = map.getRealMousePosition(mpos);
    const selected = map.getSelectedEntities();
    const hovering = map.getEntityFromVector(pos, true);
    const canAttack = selected.some(s => s.canAttack());
    const cell = cellFromPoint(pos);
    const revealed = map.isFowVisible() ? map.fow.isRevealedAt(cell) : true;

    if (!this.isMouseOutsideViewport()) {
      if (this.currentAction === 'sell') {
        return hovering && hovering.isSellable() ? 'sell' : 'cannotSell';
      } else if (this.currentAction === 'repair') {
        return hovering && hovering.isRepairable() ? 'repair' : 'cannotRepair';
      } else {
        if (hovering && selected.length > 0 && hovering.isAttackable(selected[0]) && canAttack) {
          return revealed ? 'attack' : 'move';
        } else if (revealed && hovering && hovering.isSelectable()) {
          return selected[0] === hovering &&  hovering.isDeployable()
            ? 'expand'
            : 'select';
        } else if (selected.length > 0) {
          const movable = selected.some((s: GameMapBaseEntity): boolean => s.isMovable());
          if (movable) {
            const walkable = map.grid.isWalkableAt(cell.x, cell.y);
            return walkable || !revealed ? 'move' : 'unavailable';
          }
        }
      }
    }

    return 'default';
  }

  private isMouseOutsideViewport(): boolean {
    const pos = this.engine.mouse.getVector();
    return !collidePoint(pos, this.scene.getScaledViewport());
  }

  public isMenuOpen(): boolean {
    return this.menuOpen;
  }

  public getSidebarVisible(): boolean {
    return this.sidebarVisible;
  }

  public getViewport(): Box {
    return {
      x1: 0,
      x2: this.dimension.x - (this.sidebarVisible ? SIDEBAR_WIDTH : 0),
      y1: TAB_HEIGHT,
      y2: this.dimension.y
    };
  }
}
