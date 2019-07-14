/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Entity, Sprite, MousePosition, Box, collidePoint, collideAABB } from '../engine';
import { Grid, AStarFinder, DiagonalMovement } from 'pathfinding';
import { TheatreScene } from './scenes/theatre';
import { SmudgeEntity, TerrainEntity, InfantryEntity, EffectEntity, UnitEntity, OverlayEntity, StructureEntity } from './entities';
import { MIXMapData, MIXMapEntityData, MIXSaveGame, wallNames, parseDimensions } from './mix';
import { GameMapBaseEntity } from './entity';
import { GameEngine } from './game';
import { spriteFromName } from './sprites';
import { cellFromPoint, pointFromCell, CELL_SIZE } from './physics';
import { FOW } from './fow';
import { Vector } from 'vector2d';

export const sortByZindex = (a: GameMapBaseEntity, b: GameMapBaseEntity) => {
  const x = a.getZindex();
  const y = b.getZindex();
  return ((x < y) ? -1 : ((x > y) ? 1 : 0));
};

// FIXME: Don't remove this when building stops ? Hide ?
export class GameMapMask extends Entity {
  public readonly name: string;
  public readonly map: GameMap;
  public readonly dimension: Vector = new Vector(CELL_SIZE, CELL_SIZE);
  private readonly sprite: Sprite = spriteFromName('CONQUER.MIX/trans.png');
  private cell: Vector = new Vector(0, 0);
  private white?: CanvasPattern;
  private yellow?: CanvasPattern;
  private red?: CanvasPattern;

  public constructor(name: string, map: GameMap) {
    super();
    this.name = name;
    this.map = map;

    const properties = this.map.engine.mix.structures.get(name);
    if (properties) {
      const size = parseDimensions(properties.Dimensions);
      if (properties.HasBib) {
        size.add(new Vector(0, 1));
      }

      size.mulS(CELL_SIZE);
      this.setDimension(size);
    }
  }

  public async init(): Promise<void> {
    await this.map.engine.loadArchiveSprite(this.sprite);

    this.white = this.sprite.createPattern(new Vector(0, 0)) as CanvasPattern;
    this.yellow = this.sprite.createPattern(new Vector(0, 1)) as CanvasPattern;
    this.red = this.sprite.createPattern(new Vector(0, 2)) as CanvasPattern;
  }

  public onUpdate(deltaTime: number) {
    const mouse = this.map.engine.mouse;
    const point = mouse.getVector();
    const pos = this.map.getRealMousePosition(point);
    const cell = cellFromPoint(pos);
    const position = pointFromCell(cell);

    this.cell = cell;
    this.setPosition(position);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D) {
    const w = this.dimension.x / CELL_SIZE;
    const h = this.dimension.y / CELL_SIZE;

    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const cx = this.cell.x + x;
        const cy = this.cell.y + y;
        let dx = x * CELL_SIZE;
        let dy = y * CELL_SIZE;

        // FIXME: Units and infantry
        const occupied = !this.map.grid.isWalkableAt(cx, cy);
        if (occupied) {
          this.context.fillStyle = this.red || '#ff0000';
        } else if (h > 1 && y > h - 2) {
          this.context.fillStyle = this.yellow || '#ffff00';
        } else {
          this.context.fillStyle = this.white || '#ffffff';
        }

        this.context.fillRect(dx, dy, CELL_SIZE, CELL_SIZE);
      }
    }

    ctx.drawImage(this.canvas, this.position.x, this.position.y);
  }
}

/**
 * Mep Entity Selection
 */
export class GameMapEntitySelection extends Entity {
  public readonly map: GameMap;
  private readonly sprite: Sprite = spriteFromName('CONQUER.MIX/select.png');

  public constructor(map: GameMap) {
    super();
    this.map = map;
  }

  public async init(): Promise<void> {
    await this.map.engine.loadArchiveSprite(this.sprite);
  }

  public render(target: GameMapBaseEntity, ctx: CanvasRenderingContext2D): void {
    // TODO: This can be cached based on dimensions
    const { canvas } = this.sprite;
    const position = target.getPosition();
    const dimension = target.getDimension();
    const isInfantry = target instanceof InfantryEntity;
    const f = isInfantry ? 0 : 1;
    const l = isInfantry ? 3 : 5;
    const o = isInfantry ? new Vector(10, 3) : new Vector(7, 2);
    const size = isInfantry ? new Vector(11, 12) : new Vector(16, 16);

    // top-left
    ctx.drawImage(
      canvas,
      o.x,
      o.y + (f * this.sprite.size.y),
      l,
      l,
      position.x,
      position.y,
      l,
      l
    );

    ctx.drawImage( // top-right
      canvas,
      o.x + size.x - l,
      o.y + (f * this.sprite.size.y),
      l,
      l,
      position.x + dimension.x - l,
      position.y,
      l,
      l
    );

    ctx.drawImage( // bottom-left
      canvas,
      o.x,
      o.y + (f * this.sprite.size.y) + (size.y - l),
      l,
      l,
      position.x,
      position.y + dimension.y - l,
      l,
      l
    );

    ctx.drawImage( // bottom-right
      canvas,
      o.x + size.x - l,
      o.y + (f * this.sprite.size.y) + (size.y - l),
      l,
      l,
      position.x + dimension.x - l,
      position.y + dimension.y - l,
      l,
      l
    );
  }
}

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

  public async load(type: string, data: MIXMapEntityData): Promise<void> {
    const Class: any = GameMapEntityFactory.entityMap[this.getRealType(type, data)];
    if (Class) {
      const entity = new Class(data, this.map);
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
 * Map
 */
export class GameMap extends Entity {
  protected name: string;
  protected entities: GameMapBaseEntity[] = [];
  protected visibleEntities: number = 0;
  protected mapDimension: Vector = new Vector(64, 64);
  protected fowVisible: boolean = true;
  protected created: boolean = false;
  protected mask?: GameMapMask;

  public grid: Grid = new Grid(64, 64);
  public theatre: string = 'temperat';
  public readonly engine: GameEngine;
  public readonly fow: FOW = new FOW(this);
  public readonly scene: TheatreScene;
  public readonly terrain: Entity = new Entity();
  public readonly objects: Entity = new Entity();
  public readonly overlay: Entity = new Entity();
  public readonly factory: GameMapEntityFactory = new GameMapEntityFactory(this);
  public readonly selection: GameMapEntitySelection = new GameMapEntitySelection(this);

  public constructor(name: string, engine: GameEngine, scene: TheatreScene) {
    super();
    this.name = name;
    this.engine = engine;
    this.scene = scene;
  }

  public toString(): string {
    const mpos = this.engine.mouse.getPosition();
    const point = cellFromPoint(this.getRealMousePosition(mpos));
    const dimension = this.mapDimension.toString();
    const size = this.dimension.toString();
    const pos = this.position.toString();
    const current = point.toString();
    const entities = this.entities.filter(e => e.isSelected()).map(e => ` - ${e.toString()}`).join('\n');
    return `${this.name} ${size}${pos} ${current}${dimension}\nEntities: ${this.visibleEntities}/${this.entities.length}\n${entities}`;
  }

  public toJson(): any {
    return {
      name: this.name,
      entities: this.entities.filter(e => !e.isDestroyed()).map(e => e.toJson())
    };
  }

  public async init(save?: MIXSaveGame): Promise<void> {
    console.time();
    const data = await this.engine.mix.loadMap(this.name);

    this.theatre = data.theatre;
    this.mapDimension = new Vector(data.width, data.height);
    this.grid = new Grid(data.width, data.height);

    const wx = CELL_SIZE * this.mapDimension.x;
    const wy = CELL_SIZE * this.mapDimension.y;
    const d = new Vector(wx, wy);

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

    const start = data.waypoints.find(w => w.name === 'start');
    if (start) {
      console.debug('GameMap::init()', 'Starting at start', start.cell.toString());
      this.position = new Vector(
        start.cell.x * CELL_SIZE,
        start.cell.y * CELL_SIZE
      );
    }

    this.created = true;
    console.timeEnd();
  }

  protected async drawBaseMap(data: MIXMapData): Promise<void> {
    for (let y = 0; y < this.mapDimension.y; y++) {
      for (let x = 0; x < this.mapDimension.x; x++) {
        const pos = new Vector(CELL_SIZE * x, CELL_SIZE * y);
        const tile = data.tiles[y + data.offset.y][x + data.offset.x];
        const source = `${data.theatre.toUpperCase()}.MIX/${tile.name.toLowerCase()}.png`;
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

  public getEntitiesFromCell(cell: Vector, test: Function = () => true): GameMapBaseEntity[] {
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
      (position.x - this.scene.viewport.x1) + this.position.x,
      (position.y - this.scene.viewport.y1) + this.position.y
    );
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

    this.scene.player.setPower(power);

    this.fow.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number, context: CanvasRenderingContext2D): void {
    const visible = this.getVisibleEntities();
    const overlay = this.overlay.getContext();
    const objects = this.objects.getContext();
    const terrain = this.terrain.getContext();

    const viewport = this.scene.viewport;
    const vw = viewport.x2 - viewport.x1;
    const vh = viewport.y2 - viewport.y1;
    const sx = this.position.x;
    const sy = this.position.y;
    const sw = Math.max(vw - sx, this.dimension.x - sx);
    const sh = Math.max(vh - sy, this.dimension.y - sy);
    const dx = viewport.x1;
    const dy = viewport.y1;
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
      context.fillStyle = 'rgba(255, 0, 0, 0.1)';
      context.strokeStyle = 'rgba(255, 200, 255, 0.05)';
      context.lineWidth = 1;

      for (let y = 0; y < this.mapDimension.y; y++) {
        for (let x = 0; x < this.mapDimension.x; x++) {
          const px = CELL_SIZE * x - this.position.x + dx;
          const py = CELL_SIZE * y - this.position.y + dy;

          if (this.grid.isWalkableAt(x, y)) {
            context.strokeRect(px + 0.5, py + 0.5, CELL_SIZE, CELL_SIZE);
          } else {
            context.fillRect(px, py, CELL_SIZE, CELL_SIZE);
          }
        }
      }
    }

    this.visibleEntities = visible.length;
  }

  public moveRelative(offset: Vector): boolean {
    const viewport = this.scene.viewport;
    const scale = this.engine.getScale();
    const npos = this.position.clone().add(offset) as Vector;

    const vw = (viewport.x2 - viewport.x1);
    const vh = (viewport.y2 - viewport.y1);
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

  public async addEntity(entity: GameMapBaseEntity): Promise<void> {
    try {
      const cell = entity.getCell();
      if (cell.x < 0 || cell.y < 0 || cell.x > this.mapDimension.x || cell.y > this.mapDimension.y) {
        console.debug('GameMapEntity::addEntity()', 'Not adding entity outside borders', cell.toArray(), entity);
        return;
      }

      // FIXME: Handle this correctly
      if (entity.player) {
        if (['HQ', 'EYE'].indexOf(entity.getName()) !== -1) {
          entity.player.setMinimap(true);
          this.scene.ui.toggleMinimap(true);
        }

        entity.player.setTechLevel(1);
      }

      await entity.init();
      this.entities.push(entity);

      if (entity.isWall()) {
        this.entities
          .filter(e => e.isWall())
          .forEach(e => e.updateWall());
      }

      this.entities.sort(sortByZindex);
    } catch (e) {
      console.error(e);
    }
  }

  public removeEntity(entity: GameMapBaseEntity): void {
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

  public setMask(mask?: GameMapMask): void {
    if (mask) {
      mask.init();
    }

    this.mask = mask;
  }

  public getEntityFromVector(position: Vector, selectable: boolean): GameMapBaseEntity | undefined {
    return this.entities.find(e => {
      const h = collidePoint(position, e.getBox());
      return h ? (selectable ? e.isSelectable() : false) : false;
    });
  }

  public getEntityFromCell(cell: Vector): GameMapBaseEntity | undefined {
    return this.entities.find(e => collidePoint(cell, e.getCellBox()));
  }

  public getSelectedEntities(): GameMapBaseEntity[] {
    return this.entities.filter(e => e.isSelected());
  }

  public getVisibleEntities(): GameMapBaseEntity[] {
    const scale = this.engine.getScale();
    const viewport = this.scene.viewport;
    const viewbox: Box = {
      x1: viewport.x1 * scale + this.position.x,
      x2: viewport.x2 / scale + this.position.x,
      y1: viewport.y1 * scale + this.position.y,
      y2: viewport.y2 / scale + this.position.y
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

  public getEntities(): GameMapBaseEntity[] {
    return this.entities;
  }

  public getMapDimension(): Vector {
    return this.mapDimension;
  }

  public isFowVisible(): boolean {
    return this.fowVisible;
  }

  public isCreated(): boolean {
    return this.created;
  }
}

