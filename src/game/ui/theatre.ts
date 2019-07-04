/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Box, UIEntity, UIScene, collideAABB, collidePoint } from '../../engine';
import { TheatreScene } from '../scenes/theatre';
import {
  TAB_WIDTH,
  TAB_HEIGHT,
  RADAR_HEIGHT,
  ACTION_HEIGHT,
  SIDEBAR_WIDTH,
  UITab,
  UISidebar,
  UIRadar,
  UIActions,
  UIStructureConstruction,
  UIFactoryConstruction,
  UIActionsName,
  UIConstructionResponse,
  UIConstructionItem,
  UIPowerBar,
  UIButton,
  UIText,
  UIBox
} from './elements';
import { Minimap } from './minimap';
import { MIXMission } from '../mix';
import { createGameMenus } from './mainmenu';
import { GameMapBaseEntity } from '../entity';
import { GameMapMask } from '../map';
import { cellFromPoint, isRectangleVisible } from '../physics';
import { Vector } from 'vector2d';

export class TheatreUI extends UIScene {
  public readonly scene: TheatreScene;
  protected sidebarVisible: boolean = true; // FIXME
  private selectionRectangleStart?: Vector;
  private selectionRectangle?: Box;
  private placeConstruction?: string;
  private currentAction?: UIActionsName;
  private menuOpen: boolean = false;
  private minimap: Minimap;

  public constructor(scene: TheatreScene) {
    super(scene.engine);
    this.scene = scene;
    this.minimap = new Minimap(this, this.scene.map, this.scene.engine);
  }

  public async init(): Promise<void> {
    const onConstruct = this.handleConstructionCallback.bind(this);
    const emitCredits = () => String(this.scene.player.getCredits());
    const mission = this.scene.engine.mix.mission.get(this.scene.name.toUpperCase()) as MIXMission;
    const tabMenu = new UITab('tab-menu', 'Menu', new Vector(0, 0), this);
    const tabSidebar = new UITab('tab-sidebar', 'Sidebar', new Vector(-0, 0), this);

    this.elements.push(tabMenu);
    this.elements.push(new UITab('tab-credits', emitCredits, new Vector(-TAB_WIDTH, 0), this));
    this.elements.push(tabSidebar);

    const sidebar = new UISidebar(new Vector(-0, TAB_HEIGHT), this);
    sidebar.addChild(new UIRadar(new Vector(0, 0), this));
    const btnActions = sidebar.addChild(new UIActions(new Vector(4, RADAR_HEIGHT + 2), this));
    const elStructures = sidebar.addChild(new UIStructureConstruction('structures', new Vector(20,  RADAR_HEIGHT + ACTION_HEIGHT + 6), this));
    const elFactories = sidebar.addChild(new UIFactoryConstruction('factories', new Vector(90,  RADAR_HEIGHT + ACTION_HEIGHT + 6), this));
    sidebar.addChild(new UIPowerBar(new Vector(0,  RADAR_HEIGHT + ACTION_HEIGHT + 2), this));
    sidebar.setVisible(this.sidebarVisible);

    const menu = new UIBox('menu', new Vector(420, 230), new Vector(0.5, 0.5), this);
    menu.addChild(new UIText('title', 'Menu', '6point', new Vector(0.5, 6), this));
    menu.addChild(new UIButton('load-mission', 'Load mission', new Vector(250, 18), new Vector(0.5, 40), this));
    menu.addChild(new UIButton('save-mission', 'Save mission', new Vector(250, 18), new Vector(0.5, 64), this));
    menu.addChild(new UIButton('delete-mission', 'Delete mission', new Vector(250, 18), new Vector(0.5, 88), this));
    const btnControls = menu.addChild(new UIButton('game-controls', 'Game Controls', new Vector(250, 18), new Vector(0.5, 112), this));
    const btnAbort = menu.addChild(new UIButton('abort-mission', 'Abort mission', new Vector(250, 18), new Vector(0.5, 136), this));

    const btnClose = menu.addChild(new UIButton('resume-mission', 'Resume mission', new Vector(125, 18), new Vector(18, 200), this));
    const btnRestate = menu.addChild(new UIButton('restate-mission', 'Restate', new Vector(125, 18), new Vector(282, 200), this));

    const [settings, visuals, sounds] = createGameMenus(this, new Vector(0.5, 0.5), menu);

    const restate = new UIBox('restate', new Vector(560, 170), new Vector(0.5, 0.5), this);
    restate.addChild(new UIText('title', 'Mission Statement', '6point', new Vector(0.5, 6), this));
    const btnCloseRestate = restate.addChild(new UIButton('close-restate', 'Game Controls', new Vector(250, 18), new Vector(0.5, 136), this));

    if (mission) {
      for (let i = 0; i < Object.keys(mission).length; i++) {
        let line: string = (mission as any)[i + 1];
        restate.addChild(new UIText(`line-${i}`, line, '8point', new Vector(18, 38 + (i * 20)), this));
      }
    }

    elStructures.on('change', onConstruct);
    elFactories.on('change', onConstruct);

    tabMenu.on('click', () => {
      menu.setVisible(true);
      this.menuOpen = true;
    });

    tabSidebar.on('click', () => {
      this.toggleSidebar();
    });

    btnActions.on('click', (action?: UIActionsName) => (this.currentAction = action));

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

    this.elements.push(sidebar);
    this.elements.push(menu);
    this.elements.push(settings);
    this.elements.push(visuals);
    this.elements.push(sounds);
    this.elements.push(restate);

    await super.init();
  }

  public onResize(): void {
    const scale = this.engine.getScale();
    this.context.font = `monospace ${14 * scale}px`;

    super.onResize();
  }

  public onUpdate(deltaTime: number): void {
    const { mouse } = this.engine;

    this.minimap.onUpdate(deltaTime);

    super.onUpdate(deltaTime);

    if (!this.menuOpen) {
      if (!this.isMouseOutsideViewport()) {
        if (mouse.wasClicked('left')) {
          this.handleClick();
        } else if (mouse.wasClicked('right')) {
          this.currentAction = undefined;
          this.placeConstruction = undefined;
          this.scene.map.setMask(undefined);
          this.scene.map.unselectEntities();
        }
      }

      this.updateSelectionRectangle();
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
        ctx.fillStyle = 'rgba(0, 255, 0, 0.2)';
        ctx.strokeStyle = '#00ff00';
        ctx.fillRect(x1, y1, w, h);
        ctx.strokeRect(x1, y1, w, h);
      }
    }

    super.onRender(deltaTime, ctx);
    if (this.getSidebarVisible()) {
      this.minimap.onRender(deltaTime, ctx);
    }
    this.updated = false;
  }

  private handleConstructionCallback(state: UIConstructionResponse, item?: UIConstructionItem) {
    if (state === 'construct') {
      this.scene.engine.playArchiveSfx('SPEECH.MIX/bldging1.wav', 'gui', {}, 'eva');
    } else if (state === 'finished') {
      if (item!.type === 'unit') {
        this.scene.engine.playArchiveSfx('SPEECH.MIX/unitredy.wav', 'gui', {}, 'eva');
      } else {
        this.scene.engine.playArchiveSfx('SPEECH.MIX/constru1.wav', 'gui', {}, 'eva');
      }
    } else if (state === 'cancel') {
      this.scene.engine.playArchiveSfx('SPEECH.MIX/cancel1.wav', 'gui', {}, 'eva');
      this.scene.player.addCredits(item!.progress);
    } else if (state === 'busy') {
      this.scene.engine.playArchiveSfx('SPEECH.MIX/bldg1.wav', 'gui', {}, 'eva');
    } else if (state === 'hold') {
      this.scene.engine.playArchiveSfx('SPEECH.MIX/onhold1.wav', 'gui', {}, 'eva');
    } else if (state === 'tick') {
      this.scene.engine.playArchiveSfx('SOUNDS.MIX/clock1.wav', 'gui', { volume: 0.25, block: true });
      this.scene.player.subScredits(1.0); // FIXME
    } else if (state === 'place') {
      const name = item!.name.toUpperCase();
      this.placeConstruction = name;
      const mask = new GameMapMask(name, this.scene.map);
      this.scene.map.setMask(mask);
    }
  }

  private handleConstructionPlot(cell: Vector) {
    const name = this.placeConstruction as string;
    const type = this.scene.engine.mix.getType(name);

    if (type) {
      this.scene.map.factory.load(type, {
        name,
        cell,
        player: this.scene.player.getId(),
        theatre: this.scene.map.theatre
      });
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
      const canAttack = selected.some(s => s.canAttack());
      const attack = canAttack && hit.isAttackable(selected[0]);

      if (attack) {
        selected.forEach((s, i) => s.attack(hit, i === 0));
      } else {
        if (this.currentAction === 'sell') {
          hit.sell();
        } else if (this.currentAction === 'repair') {
          hit.repair();
        } else {
          const deployable = selected.filter(s => s.isDeployable());
          if (deployable.length > 0) {
            deployable[0].deploy();
            this.toggleSidebar(true); // FIXME
          } else {
            map.unselectEntities();
            hit.setSelected(true);
          }
        }

        console.log('Hit', point, cell, hit);
      }
    } else {
      map.moveSelectedEntities(cell);
    }
  }

  public toggleSidebar(toggle?: boolean): void {
    const sidebar = this.getElementByName('sidebar') as UIEntity;
    if (typeof toggle === 'undefined') {
      toggle = !sidebar.isVisible();
    }

    this.sidebarVisible = toggle;
    sidebar.setVisible(this.sidebarVisible);
    this.scene.onUIToggle();
    console.debug('TheatreUI::toggleSidebar()', this.sidebarVisible);
  }

  private updateSelectionRectangle(): void {
    const active = this.engine.mouse.isPressed('left');
    const position = this.engine.mouse.getVector();

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

    const rect = {
      x1: this.selectionRectangle!.x1 + map.position.x,
      x2: this.selectionRectangle!.x2 + map.position.x,
      y1: this.selectionRectangle!.y1 + map.position.y,
      y2: this.selectionRectangle!.y2 + map.position.y
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
    const { mouse } = this.engine;
    const map = this.scene.map;
    const pos = map.getRealMousePosition(mouse.getPosition());
    const selected = map.getSelectedEntities();
    const hovering = map.getEntityFromVector(pos, true);
    const canAttack = selected.some(s => s.canAttack());
    const cell = cellFromPoint(pos);
    const revealed = map.isFowVisible() ? map.fow.isRevealedAt(cell) : true;

    let cursor = 'default';
    if (!this.menuOpen && !this.isMouseOutsideViewport()) {
      if (this.currentAction === 'sell') {
        cursor = hovering && hovering.isSellable() ? 'sell' : 'cannotSell';
      } else if (this.currentAction === 'repair') {
        cursor = hovering && hovering.isRepairable() ? 'repair' : 'cannotRepair';
      } else {
        if (hovering && selected.length > 0 && hovering.isAttackable(selected[0]) && canAttack) {
          cursor = revealed ? 'attack' : 'move';
        } else if (hovering && hovering.isSelectable()) {
          if (selected[0] === hovering &&  hovering.isDeployable()) {
            cursor = 'expand';
          } else {
            cursor = 'select';
          }
        } else if (selected.length > 0) {
          const movable = selected.some((s: GameMapBaseEntity): boolean => s.isMovable());
          if (movable) {
            const walkable = map.grid.isWalkableAt(cell.x, cell.y);
            cursor = walkable || !revealed ? 'move' : 'unavailable';
          } else {
            cursor = 'default';
          }
        }
      }
    }

    this.scene.engine.cursor.setCursor(cursor);
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
