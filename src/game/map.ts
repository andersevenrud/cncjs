/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Entity, MousePosition, Box, collidePoint, collideAABB } from '../engine';
import { Grid, AStarFinder, DiagonalMovement } from 'pathfinding';
import { SmudgeEntity } from './entities/smudge';
import { TerrainEntity } from './entities/terrain';
import { InfantryEntity } from './entities/infantry';
import { EffectEntity } from './entities/effect';
import { UnitEntity } from './entities/unit';
import { StructureEntity } from './entities/structure';
import { OverlayEntity } from './entities/overlay';
import { StructureMaskEntity } from './entities/mask';
import { GameMapEntitySelection } from './entities/selection';
import { GameEntity } from './entity';
import { MIXMapTrigger, MIXPlayerName, MIXMapData, MIXMapEntityData, MIXSaveGame, wallNames, playerMap } from './mix';
import { GameEngine } from './game';
import { spriteFromName } from './sprites';
import { cellFromPoint, CELL_SIZE } from './physics';
import { Player } from './player';
import { FOW } from './fow';
import { Vector } from 'vector2d';

type PlayerMap = [MIXPlayerName, Player];

const players: PlayerMap[] = playerMap
  .map((name: string, index: number): any => {
    return [name, new Player(index, name as MIXPlayerName)];
  });

export const sortByZindex = (a: GameEntity, b: GameEntity) => {
  const x = a.getZindex();
  const y = b.getZindex();
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
};

/**
 * Map Entity Factory
 */
export class GameMapEntityFactory {
  private readonly map: GameMap;
  protected static readonly entityMap: any = {
    terrain: TerrainEntity,
    overlay: OverlayEntity,
    effect: EffectEntity,
    infantry: InfantryEntity,
    unit: UnitEntity,
    structure: StructureEntity,
    smudge: SmudgeEntity
  };

  public constructor(map: GameMap) {
    this.map = map;
  }

  public async load(type: string, data: MIXMapEntityData, cb?: Function): Promise<void> {
    const Class: any = GameMapEntityFactory.entityMap[this.getRealType(type, data)];
    if (Class) {
      const entity = new Class(data, this.map);
      if (cb) {
        cb(entity);
      }
      return this.map.addEntity(entity);
    } else {
      console.warn('Invalid', type, data);
    }

    return undefined;
  }

  public getRealType(type: string, data: MIXMapEntityData): string {
    if (wallNames.indexOf(data.name) !== -1) {
      return 'structure';
    }

    return type;
  }
}

/**
 * Map Triggers
 */
export class GameMapTrigger {
  private trigger: MIXMapTrigger;
  private map: GameMap;
  private done: boolean = false;

  public constructor(trigger: MIXMapTrigger, map: GameMap) {
    this.trigger = trigger;
    this.map = map;
  }

  public process(): void {
    if (this.done) {
      return;
    }

    if (this.trigger.condition === 'All Destr.') {
      const met = this.map.getEntities()
        .filter(entity => entity.player && entity.player.getName() === this.trigger.playerName)
        .length === 0;

      if (met) {
        if (this.trigger.action === 'Win') {
          this.map.engine.onTheatreWon();
        } else if (this.trigger.action === 'Lose') {
          this.map.engine.onTheatreLost();
        }
        this.done = true;
      }
    }
  }
}

declare var window: any;

/**
 * Map
 */
export class GameMap extends Entity {
  private readonly players: Map<MIXPlayerName, Player> = new Map(players);
  private triggers: GameMapTrigger[] = [];
  protected readonly name: string;
  protected entities: GameEntity[] = [];
  protected visibleEntities: number = 0;
  protected mapDimension: Vector = new Vector(64, 64);
  protected fowVisible: boolean = true;
  protected created: boolean = false;
  protected mask?: StructureMaskEntity;
  protected viewport: Box = { x1: 0, x2: 800, y1: 0, y2: 600 };
  public grid: Grid = new Grid(64, 64);
  public readonly player: Player;
  public readonly data: MIXMapData;
  public readonly engine: GameEngine;
  public readonly fow: FOW = new FOW(this);
  public readonly terrain: Entity = new Entity();
  public readonly objects: Entity = new Entity();
  public readonly overlay: Entity = new Entity();
  public readonly factory: GameMapEntityFactory = new GameMapEntityFactory(this);
  public readonly selection: GameMapEntitySelection = new GameMapEntitySelection(this);

  public constructor(name: string, data: MIXMapData, player: MIXPlayerName, engine: GameEngine) {
    super();
    this.name = name;
    this.engine = engine;
    this.data = data;
    this.player = this.players.get(player) as Player;
    this.player.setSessionPlayer(true);

    window.map = this;
  }

  public toString(): string {
    const mpos = this.engine.mouse.getPosition();
    const point = cellFromPoint(this.getRealMousePosition(mpos));
    const dimension = this.mapDimension.toString();
    const size = this.dimension.toString();
    const pos = this.position.toString();
    const current = point.toString();
    const entities = this.entities.filter(e => e.isSelected()).map(e => ` - ${e.toString()}`).join('\n');
    const player = this.player.toString();
    return `${this.name} ${size}${pos} ${current}${dimension}\nEntities: ${this.visibleEntities}/${this.entities.length}\nPlayer: ${player}\n${entities}`;
  }

  public toJson(): any {
    return {
      name: this.name,
      entities: this.entities.filter(e => !e.isDestroyed()).map(e => e.toJson())
    };
  }

  public async init(save?: MIXSaveGame): Promise<void> {
    console.time();
    const data = this.data;
    console.log(data);

    for (let p of this.players.values()) {
      const n = p.getName();
      if (data.players[n]) {
        p.load(data.players[n]);
      }
    }

    this.mapDimension = data.map.size.clone() as Vector;
    this.grid = new Grid(this.mapDimension.x, this.mapDimension.y);
    this.triggers = data.triggers.map(trigger => new GameMapTrigger(trigger, this));

    const d = this.mapDimension.clone().mulS(CELL_SIZE) as Vector;

    this.setDimension(d);
    this.objects.setDimension(d);
    this.terrain.setDimension(d);
    this.overlay.setDimension(d);
    this.fow.setDimension(d);

    const createEntityFrom = (type: string, list: any) =>
      list.map((data: any) => this.factory.load(type, data));

    await this.selection.init();
    await this.fow.init();
    await this.drawBaseMap(data);

    if (save) {
      this.entities = [];

      await Promise.all(save.entities.map(e => {
        return this.factory.load(e.type, {
          ...e,
          cell: new Vector(e.cell.x, e.cell.y)
        });
      }));
    } else {
      await Promise.all([
        ...createEntityFrom('smudge', data.smudge),
        ...createEntityFrom('terrain', data.terrain),
        ...createEntityFrom('overlay', data.overlays),
        ...createEntityFrom('structure', data.structures),
        ...createEntityFrom('infantry', data.infantry),
        ...createEntityFrom('unit', data.units)
      ]);
    }

    this.entities.sort(sortByZindex);
    this.entities
      .filter(e => e.isWall())
      .forEach(e => e.updateWall());

    const start = data.waypoints.find(w => w.name === 'start');
    if (start) {
      console.debug('GameMap::init()', 'Starting at start', start.cell.toString());
      const scale = this.engine.getScale();
      const vw = (this.viewport.x2 - this.viewport.x1) / scale;
      const vh = (this.viewport.y2 - this.viewport.y1) / scale;
      this.position = new Vector(
        Math.round((start.cell.x * CELL_SIZE) - (vw / 2) + (CELL_SIZE / 2)),
        Math.round((start.cell.y * CELL_SIZE) - (vh / 2) + (CELL_SIZE / 2))
      );
    }

    this.created = true;
    console.timeEnd();
  }

  protected async drawBaseMap(data: MIXMapData): Promise<void> {
    for (let y = 0; y < this.mapDimension.y; y++) {
      for (let x = 0; x < this.mapDimension.x; x++) {
        const pos = new Vector(CELL_SIZE * x, CELL_SIZE * y);
        const tile = data.tiles[y + data.map.offset.y][x + data.map.offset.x];
        const source = `${data.map.theatre.toUpperCase()}.MIX/${tile.name.toLowerCase()}.png`;
        const sprite = spriteFromName(source);

        if (sprite) {
          const f = new Vector(0, tile.index);
          try {
            await this.engine.loadArchiveSprite(sprite);
            sprite.render(f, pos, this.context);
          } catch (e) {
            console.error('GameMap::drawBaseMap()', [x, y], e);
          }
        } else {
          console.warn('Failed to find', name);
        }

        if (!tile.passable) {
          this.grid.setWalkableAt(x, y, false);
        }
      }
    }
  }

  public createPath(source: Vector, destination: Vector, force: boolean = false): Vector[] {
    console.debug('GameMap::createPath()', source, destination);

    const finder = new AStarFinder({
      diagonalMovement: DiagonalMovement.Always
    });

    const sx = Math.max(0, source.x);
    const sy = Math.max(0, source.y);
    const dx = Math.min(this.mapDimension.x - 1, Math.max(0, destination.x));
    const dy = Math.min(this.mapDimension.y - 1, Math.max(0, destination.y));
    const g = this.grid.clone();

    if (force) {
      g.setWalkableAt(destination.x, destination.y, true);
    }

    const path = finder.findPath(sx, sy, dx, dy, g);
    path.shift(); // FIXME

    return path.map(([x, y]) => new Vector(x, y));
  }

  public onResize(viewport: Box): void {
    this.viewport = viewport;
  }

  public onUpdate(deltaTime: number): void {
    if (this.mask) {
      this.mask.onUpdate(deltaTime);
    }

    // FIXME: All players
    const power: [number, number] = [0, 0];

    this.entities.forEach(e => {
      if (e.isPlayer()) {
        power[0] += e.getPowerProduction();
        power[1] += e.getPowerDrain();
      }

      e.onUpdate(deltaTime);
    });

    this.player.setPower(power);
    this.fow.onUpdate(deltaTime);

    if ((this.engine.ticks % 10) === 0) {
      this.triggers.forEach(trigger => trigger.process());
    }
  }

  public onRender(deltaTime: number, context: CanvasRenderingContext2D): void {
    const visible = this.getVisibleEntities();
    const overlay = this.overlay.getContext();
    const objects = this.objects.getContext();
    const terrain = this.terrain.getContext();

    const vw = this.viewport.x2 - this.viewport.x1;
    const vh = this.viewport.y2 - this.viewport.y1;
    const sx = this.position.x;
    const sy = this.position.y;
    const sw = Math.max(vw - sx, this.dimension.x - sx);
    const sh = Math.max(vh - sy, this.dimension.y - sy);
    const dx = this.viewport.x1;
    const dy = this.viewport.y1;
    const dw = sw;
    const dh = sh;

    context.clearRect(dx, dy, dw, dh);
    terrain.clearRect(0, 0, this.dimension.x, this.dimension.y);
    objects.clearRect(0, 0, this.dimension.x, this.dimension.y);
    overlay.clearRect(0, 0, this.dimension.x, this.dimension.y);

    visible.forEach(e => e.onRender(deltaTime));

    if (this.mask) {
      this.mask.onRender(deltaTime, overlay);
    }

    context.drawImage(this.canvas, sx, sy, sw, sh, dx, dy, dw, dh);
    context.drawImage(this.terrain.getCanvas(), sx, sy, sw, sh, dx, dy, dw, dh);
    context.drawImage(this.objects.getCanvas(), sx, sy, sw, sh, dx, dy, dw, dh);
    context.drawImage(this.overlay.getCanvas(), sx, sy, sw, sh, dx, dy, dw, dh);

    if (this.fowVisible) {
      this.fow.onRender(deltaTime);
      context.drawImage(this.fow.getCanvas(), sx, sy, sw, sh, dx, dy, dw, dh);
    }

    if (this.engine.getDebug()) {
      context.lineWidth = 1;

      const c = CELL_SIZE / 2;
      for (let y = 0; y < this.mapDimension.y; y++) {
        for (let x = 0; x < this.mapDimension.x; x++) {
          const px = CELL_SIZE * x - this.position.x + dx;
          const py = CELL_SIZE * y - this.position.y + dy;
          const v = new Vector(x, y);
          const waypoint = this.data.waypoints.find(w => w.cell.equals(v));
          const celltrigger = this.data.cellTriggers.find(w => w.cell.equals(v));

          if (this.grid.isWalkableAt(x, y)) {
            context.strokeStyle = 'rgba(255, 200, 255, 0.05)';
            context.strokeRect(px + 0.5, py + 0.5, CELL_SIZE, CELL_SIZE);
          } else {
            context.fillStyle = 'rgba(255, 0, 0, 0.1)';
            context.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          }

          if (waypoint) {
            context.fillStyle = 'rgba(0, 0, 255, 0.1)';
            context.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            context.fillStyle = 'rgba(255, 255, 255, 0.5)';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(waypoint.name || String(waypoint.id), px + c, py + c);
          }

          if (celltrigger) {
            context.fillStyle = 'rgba(0, 255, 255, 0.1)';
            context.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            context.fillStyle = 'rgba(255, 255, 255, 0.5)';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(celltrigger.name, px + c, py + c);
          }
        }
      }
    }

    this.visibleEntities = visible.length;
  }

  public moveRelative(offset: Vector): boolean {
    const scale = this.engine.getScale();
    const npos = this.position.clone().add(offset) as Vector;

    const vw = (this.viewport.x2 - this.viewport.x1);
    const vh = (this.viewport.y2 - this.viewport.y1);
    const vx = vw / scale;
    const vy = vh / scale;
    const margin = 100;

    const minX = -(vx - margin);
    const minY = -(vy - margin);
    const maxX = this.dimension.x - margin;
    const maxY = this.dimension.y - margin;

    const x = Math.min(Math.max(minX, npos.x), maxX);
    const y = Math.min(Math.max(minY, npos.y), maxY);

    this.position = new Vector(Math.trunc(x), Math.trunc(y));

    const reachedX = npos.x >= minX && npos.x <= maxX ? 0 : 1;
    const reachedY = npos.y >= minY && npos.y <= maxY ? 0 : 1;
    const num = offset.clone().abs().toArray().reduce((acc, val) => acc + (val ? 1 : 0), 0);
    return num !== (reachedY + reachedX);
  }

  public async addEntity(entity: GameEntity): Promise<void> {
    try {
      const cell = entity.getCell();
      if (cell.x < 0 || cell.y < 0 || cell.x > this.mapDimension.x || cell.y > this.mapDimension.y) {
        console.debug('GameMapEntity::addEntity()', 'Not adding entity outside borders', cell.toArray(), entity);
        return;
      }

      await entity.init();
      this.entities.push(entity);

      if (entity.player) {
        const es = this.getEntities()
          .filter(e => e.isPlayer());

        entity.player.update(es);
      }

      if (this.created) {
        if (entity.isWall()) {
          this.entities
            .filter(e => e.isWall())
            .forEach(e => e.updateWall());
        }

        this.entities.sort(sortByZindex);
      }
    } catch (e) {
      console.error(e);
    }
  }

  public removeEntity(entity: GameEntity): void {
    entity.destroy();

    const index = this.entities.findIndex(e => e === entity);
    if (index !== -1) {
      if (entity.isWall()) {
        this.entities
          .filter(e => e.isWall())
          .forEach(e => e.updateWall());
      }

      this.entities.splice(index, 1);
    }

    if (entity.player) {
      const es = this.getEntities().filter(e => e.isPlayer());
      entity.player.update(es);
    }
  }

  public moveSelectedEntities(to: Vector): void {
    const selected = this.getSelectedEntities();
    selected.forEach((e, i) => e.move(to, i === 0));
  }

  public unselectEntities(): void {
    this.entities.forEach(e => e.setSelected(false));
  }

  public toggleFow(): void {
    this.fowVisible = !this.fowVisible;
  }

  public setMask(mask?: StructureMaskEntity): void {
    if (mask) {
      mask.init();
    }

    this.mask = mask;
  }

  public getEntityFromVector(position: Vector, selectable: boolean): GameEntity | undefined {
    return this.entities.find(e => {
      const h = collidePoint(position, e.getBox());
      return h ? (selectable ? e.isSelectable() : false) : false;
    });
  }

  public getEntityFromCell(cell: Vector): GameEntity | undefined {
    return this.entities.find(e => collidePoint(cell, e.getCellBox()));
  }

  public getSelectedEntities(): GameEntity[] {
    return this.entities.filter(e => e.isSelected());
  }

  public getVisibleEntities(): GameEntity[] {
    const scale = this.engine.getScale();
    const viewbox: Box = {
      x1: this.viewport.x1 * scale + this.position.x,
      x2: this.viewport.x2 / scale + this.position.x,
      y1: this.viewport.y1 * scale + this.position.y,
      y2: this.viewport.y2 / scale + this.position.y
    };

    const visible = this.entities.filter(e => collideAABB(e.getRenderBox(), viewbox));

    if (this.fowVisible) {
      return visible.filter(e => {
        const box = e.getCellBox();
        for (let y = box.y1 - 1; y <= box.y2; y++) {
          for (let x = box.x1 - 1; x <= box.x2; x++) {
            if (this.fow.isRevealedAt(new Vector(x, y))) {
              return true;
            }
          }
        }

        return false;
      });
    }

    return visible;
  }

  public getEntities(): GameEntity[] {
    return this.entities;
  }

  public getMapDimension(): Vector {
    return this.mapDimension.clone() as Vector;
  }

  public getData(): MIXMapData | undefined {
    return this.data;
  }

  public getTheatre(): string {
    return this.data.map.theatre;
  }

  public getPlayerById(id: number): Player | undefined {
    for (let p of this.players.values()) {
      if (p.getId() === id) {
        return p;
      }
    }

    return undefined;
  }

  public getEntitiesFromCell(cell: Vector, test: Function = () => true): GameEntity[] {
    return this.entities
      .filter(e => {
        const c: Vector = e.getCell();
        const d: Vector = e.getDimension();
        return collidePoint(cell, {
          x1: c.x,
          x2: c.x + Math.floor(d.x / CELL_SIZE) - 1,
          y1: c.y,
          y2: c.y + Math.floor(d.y / CELL_SIZE) - 1
        }) && test(e);
      });
  };

  public getRealMousePosition(position: MousePosition | Vector): Vector {
    return new Vector(
      (position.x - this.viewport.x1) + this.position.x,
      (position.y - this.viewport.y1) + this.position.y
    );
  }

  public isFowVisible(): boolean {
    return this.fowVisible;
  }

  public isCreated(): boolean {
    return this.created;
  }
}

