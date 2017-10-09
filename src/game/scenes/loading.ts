/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { h, app } from 'hyperapp';
import { Scene } from '../../engine';
import { GameEngine } from '../game';

/**
 * Loading Scene
 */
export class LoadingScene extends Scene {
  public engine: GameEngine;
  private root: HTMLElement = document.createElement('div');
  private app?: any;

  public constructor(engine: GameEngine) {
    super(engine);
    this.engine = engine;
  }

  public toString(): string {
    return `Loading`;
  }

  public async init(): Promise<void> {
    this.root.classList.add('loading');
    this.engine.getRoot().appendChild(this.root);

    const view = (state: any) => h('div', {
      class: 'progressbar'
    }, [
      h('div', {
        class: 'progress',
        style: {
          width: `${Math.ceil(state.progress * 100)}%`
        }
      }),
      h('div', {
        class: 'label'
      }, (state.progress * 100).toFixed(2))
    ]);

    this.app = app({
      progress: 0.0
    }, {
      setProgress: (progress: number): any => ({ progress })
    }, view, this.root);
  }

  public onDestroy(): void {
    this.root.remove();
  }

  public onCreate(): void {
    this.on('progress', (progress: number, total: number): void => {
      this.app.setProgress(progress / total);
    });
  }

  public onUpdate(deltaTime: number): void {
  }

  public onRender(deltaTime: number): void {
  }
}
