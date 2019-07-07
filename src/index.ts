/*!
 * cnsjs - JavaScript C&C Remake
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import './index.scss';
import { GameEngine } from './game/game';
import { throttle } from './engine';

const oninit = async (): Promise<void> => {
  const canvas = document.createElement('canvas');
  const body = document.querySelector('body') as HTMLElement;
  body.appendChild(canvas);

  const game: GameEngine = new GameEngine(canvas, {
    debugMode: process.env.DEBUG_MODE === 'true',
    updateRate: typeof process.env.TICK_RATE === 'undefined'
      ? undefined
      : parseFloat(process.env.TICK_RATE),

    sound: {
      muted: process.env.SOUND_MUTED === 'true'
    }
  });

  const onresize = (): void => game.resize();
  const onleave = (): void => game.pause();
  const onenter = (): void => game.resume();

  window.addEventListener('resize', throttle(onresize, 100));
  document.addEventListener('mouseleave', onleave);
  document.addEventListener('mouseenter', onenter);

  game.run();

  await game.init();
};

window.addEventListener('load', oninit);
