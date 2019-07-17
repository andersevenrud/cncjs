/**
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import { Core, Scene } from '../../engine';
import { getScaledDimensions } from '../physics';
import { Vector } from 'vector2d';

/**
 * Movie Scene
 */
export class MovieScene extends Scene {
  private name: string;
  private movieElement: HTMLVideoElement = document.createElement('video');
  private ended: boolean = false;
  private loaded: boolean = false;
  private failed: boolean = false;

  public constructor(name: string, engine: Core) {
    super(engine);

    this.engine = engine;
    this.name = name;
  }

  public destroy(): void {
    if (this.destroyed) {
      return;
    }

    this.ended = true;
    this.loaded = false;
    this.movieElement.pause();
    this.emit('done');

    super.destroy();
  }

  public toString(): string {
    const time = `${this.movieElement.currentTime.toFixed(1)}/${this.movieElement.duration.toFixed(1)}`;
    const dimension = `${this.movieElement.videoWidth}x${this.movieElement.videoHeight}`;
    return `Movie | ${dimension}@${time}`;
  }

  public async init(): Promise<void> {
    this.movieElement.addEventListener('loadedmetadata', (): void => {
      this.engine.sound.createMediaGainNode(this.movieElement);
    });

    this.movieElement.addEventListener('loadeddata', (): void => {
      this.loaded = true;
      this.play();
    });

    this.movieElement.addEventListener('ended', (): void => {
      this.ended = true;
      this.destroy();
    });

    this.movieElement.addEventListener('error', (ev): void => {
      console.error(ev);
      this.failed = true;
    });

    this.movieElement.src = `MOVIES.MIX/${this.name.toLowerCase()}.webm`;
  }

  public onUpdate(deltaTime: number): void {
    if (this.engine.keyboard.wasClicked(['Enter', 'Escape'])) {
      this.destroy();
    }
  }

  public onRender(deltaTime: number): void {
    const context = this.engine.getContext();
    const dimension = this.engine.getScaledDimension();

    if (this.loaded) {
      const { sx, sy, sw, sh, dx, dy, dw, dh } = getScaledDimensions(
        new Vector(
          this.movieElement.videoWidth,
          this.movieElement.videoHeight
        ),
        dimension
      );

      context.drawImage(this.movieElement, sx, sy, sw, sh, dx, dy, dw, dh);
    }

    if (this.ended || this.failed) {
      const str = this.ended ? 'Loading...' : 'Press Enter to continue';
      context.font = 'monospace 20px';
      context.fillStyle = '#ff0000';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(str, dimension.x / 2, dimension.y / 2);
    }
  }

  public onPause(state: boolean): void {
    if (state) {
      this.movieElement.pause();
    } else if (!this.ended) {
      this.play();
    }
  }

  private play() {
    this.movieElement.play()
      .catch(ev => {
        console.error(ev);
        this.failed = true;
      });
  }
}
