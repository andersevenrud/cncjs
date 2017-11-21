/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import UIElement from '../../engine/ui/element';
import {createFontSprite} from './font';
import {collidePoint} from '../../engine/physics';

export default class TickerElement extends UIElement {
  constructor(engine, type, options) {
    super(engine, Object.assign({}, {
      w: 64,
      h: 48 * 4,
      offset: 0,
      buildables: []
    }, options));

    this.type = type;
    this.offset = this.options.offset;
    this.buildables = this.options.buildables;
    this.labelSprite = Sprite.instance('hpips');
    this.clockSprite = Sprite.instance('hclock');
    this.elements = [];
    this.building = {};
    this.tooltipSprite = null;
  }

  up() {
    this.offset = Math.max(0, this.offset - 1);

    this.engine.sounds.playSound('button', {volume: 0.5});
  }

  down() {
    this.offset = Math.min(this.offset + 1, this.buildables.length - 5);

    this.engine.sounds.playSound('button', {volume: 0.5});
  }

  onclick(click) {
    const relY = click.y - this.rect.y;
    const relIndex = Math.floor(relY / 48);
    const realIndex = this.offset + relIndex;

    if ( this.buildables[realIndex] ) {
      const obj = this.buildables[realIndex];
      const busy = this.building[obj.Id];

      if ( busy ) {
        if ( click.button !== 1 ) {
          const refund = busy.cost - busy.current;
          const mp = this.engine.scene.getMainPlayer();
          mp.addCredits(refund);

          this.engine.sounds.playSound('cancel1');
          delete this.building[obj.Id];
          return;
        }

        if ( busy.done ) {
          this.callback(obj, () => {
            delete this.building[obj.Id];
          });
        }
      } else {
        if ( click.button <= 1 ) {
          this.engine.sounds.playSound('bldging1');

          this.building[obj.Id] = {
            cost: obj.Cost,
            current: obj.Cost,
            done: false
          };
        }
      }
    }
  }

  update() {
    const {x, y} = this.rect;
    const max = Math.min(4, this.buildables.length - 1 - this.offset);
    const sounds = this.engine.sounds;
    const mp = this.engine.scene.getMainPlayer();
    const elements = [];

    let createTooltip = false;
    for ( let i = 0; i < max; i++ ) {
      const o = this.buildables[i + this.offset];
      const s = Sprite.instance(o.Icon);

      const busy = this.building[o.Id];
      const b = busy ? this.clockSprite : null;
      const c = busy
        ? b.count - Math.round(b.count * (busy.current / busy.cost))
        : 0;

      if ( busy && !busy.done ) {
        const drain = mp.removeCredits(10);
        busy.current = Math.max(0, busy.current - drain);

        if ( busy.current <= 0 ) {
          busy.done = true;

          sounds.playSound('constru1', {queue: true});
        } else if ( (busy.current % 20) === 0 ) {
          if ( drain > 0 ) {
            sounds.playSound('clock1', {volume: 0.3});
          }
        }
      }

      const d = busy && busy.done;
      const left = x;
      const top = y + (i * s.height);

      let hovering = false;
      if ( this.hovering ) {
        hovering = collidePoint(this.hovering, {
          x1: left,
          y1: top,
          x2: left + s.width,
          y2: top + s.height
        });

        if ( hovering ) {
          createTooltip = o;
        }
      }

      elements.push([s, left, top, !!b, c, d, hovering]);
    }

    this.tooltipSprite = createTooltip
      ? createFontSprite(`Cost: ${createTooltip.Cost}`)
      : null;

    this.elements = elements;
  }

  render(target) {
    for ( let i = 0; i < this.elements.length; i++ ) {
      const [s, x, y, b, c, d, h] = this.elements[i];

      s.render(target, x, y);

      if ( b ) {
        this.clockSprite.render(target, x, y, c);

        if ( d ) {
          const lx = x + (s.width / 2) - (this.labelSprite.width / 2);
          const ly = y + (s.height / 2) - (this.labelSprite.height / 2);
          this.labelSprite.render(target, Math.round(lx), Math.round(ly), 3);
        }
      }

      if ( h && this.tooltipSprite ) {
        const b = 4;
        const tw = this.tooltipSprite.width + (b * 2);
        const th = this.tooltipSprite.height + (b * 2);
        const dx = x - tw;

        target.fillStyle = '#000000';
        target.strokeStyle = '#3c9838';
        target.fillRect(dx, y, tw, th);
        target.strokeRect(dx, y, tw, th);
        target.drawImage(this.tooltipSprite, dx + b, y + b);
      }
    }
  }
}
