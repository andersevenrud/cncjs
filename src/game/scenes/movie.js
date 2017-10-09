/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import GameScene from '../scene';

export default class MovieScene extends GameScene {

  constructor(engine, options) {
    super(...arguments);

    this.$container = document.createElement('div');
    this.$container.id = 'movie';
    this.failed = false;
  }

  destroy() {
    if ( this.$container ) {
      this.$container.remove();
      this.$container = null;
    }

    super.destroy(this.options);
  }

  render(target, delta) {
    if ( this.failed ) {
      const {vw, vh} = this.getViewport();

      const text = 'Failed to load movie. Press any key to continue...';

      target.fillStyle = '#ff0000';
      target.font = '12px Monospace';
      target.textBaseline = 'middle';
      target.textAlign = 'center';
      target.fillText(text, vw / 2, vh / 2);
    }
  }

  async load() {
    const video = this.options.movie;
    console.info('Playing movie', video);
    this.$video = document.createElement('video');

    this.$video.addEventListener('error', (err) => {
      console.error(err);
      this.$container.remove();
      this.failed = true;
    });

    this.$video.addEventListener('canplay', () => {
      this.$video.play();
    });

    this.$video.addEventListener('ended', () => {
      this.destroy();
    });

    this.$video.src = `movies/${video}.mp4`;
    this.$container.appendChild(this.$video);
    document.body.appendChild(this.$container);
  }

  update() {
    if ( this.engine.mouse.buttonDown('LEFT') || this.engine.keyboard.keyDown() ) {
      this.destroy();
    }
    super.update(...arguments);
  }

}
