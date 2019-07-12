/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { UIScene } from '../../engine';
import { UIBox, UIButton } from './elements';
import { MapSelectionScene } from '../scenes/map';
import { MIXTeamName, gdiMaps, nodMaps } from '../mix';
import { Vector } from 'vector2d';

export class MapSelectionUI extends UIScene {
  public readonly scene: MapSelectionScene;
  private readonly list: string[];

  public constructor(teamName: MIXTeamName, scene: MapSelectionScene) {
    super(scene.engine);
    this.scene = scene;
    this.list = teamName === 'nod' ? nodMaps : gdiMaps;
  }

  public async init(): Promise<void> {
    const menu = new UIBox('menu', new Vector(300, 270), new Vector(0.5, 0.5), this);

    const margin = 10;
    const count = 2;
    const width = (300 - (margin * (count + 1))) / count;

    this.list.forEach((name: string, index: number) => {
      const row = Math.floor(index / count);
      const col = index % count;

      const dim = new Vector(width, 16);
      const pos = new Vector(margin + (width + margin) * col, 30 + (row * 18));
      const btn = new UIButton(`map-select-${index}`, name, dim, pos, this);
      btn.on('click', () => this.scene.handleMapSelection(name));
      menu.addChild(btn);
    });
    menu.setDecorations(0);
    menu.setVisible(true);

    this.elements.push(menu);

    await super.init();
  }

  public onResize(): void {
    super.onResize();
  }

  public onUpdate(deltaTime: number): void {
    super.onUpdate(deltaTime);
  }

  public onRender(deltaTime: number, ctx: CanvasRenderingContext2D): void {
    this.context.clearRect(0, 0, this.dimension.x, this.dimension.y);
    super.onRender(deltaTime, ctx);
  }
}
