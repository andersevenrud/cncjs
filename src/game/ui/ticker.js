/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import Sprite from '../../engine/sprite';
import UIElement from '../../engine/ui/element';

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
  }

  up() {
    this.offset = Math.max(0, this.offset - 1);

    this.engine.sounds.playSound('button', {volume: 0.5});
  }

  down() {
    this.offset = Math.min(this.offset + 1, this.buildables.length - 5);

    this.engine.sounds.playSound('button', {volume: 0.5});
  }

  click(click) {
    if ( click && this.rect && super.click(click, false) ) {
      const relY = click.y - this.rect.y;
      const relIndex = Math.floor(relY / 48);
      const realIndex = this.offset + relIndex;

      if ( this.buildables[realIndex] ) {
        const obj = this.buildables[realIndex];

        const busy = this.building[obj.Id];
        if ( busy ) {
          if ( click.button !== 1 ) {
            this.engine.sounds.playSound('cancel1');
            delete this.building[obj.Id];
            return true;
          }

          if ( busy.done ) {
            this.callback(obj, () => {
              delete this.building[obj.Id];
            });
          }
        } else {
          this.engine.sounds.playSound('bldging1');

          this.building[obj.Id] = {
            cost: obj.Cost,
            current: obj.Cost,
            done: false
          };
        }
      }

      return true;
    }

    return false;
  }

  update() {
    const {x, y} = this.rect;
    const max = Math.min(4, this.buildables.length - 1 - this.offset);
    const elements = [];

    for ( let i = 0; i < max; i++ ) {
      const o = this.buildables[i + this.offset];
      const s = Sprite.instance(o.Icon);

      const busy = this.building[o.Id];
      const b = busy ? this.clockSprite : null;
      const c = busy
        ? b.count - Math.round(b.count * (busy.current / busy.cost))
        : 0;

      if ( busy && !busy.done ) {
        busy.current = Math.max(0, busy.current - 10);

        if ( busy.current <= 0 ) {
          busy.done = true;

          this.engine.sounds.playSound('constru1', {queue: true});
        } else if ( (busy.current % 20) === 0 ) {
          this.engine.sounds.playSound('clock1', {volume: 0.5});
        }
      }

      const d = busy && busy.done;
      elements.push([s, x, y + (i * s.height), !!b, c, d]);
    }

    this.elements = elements;
  }

  render(target) {
    for ( let i = 0; i < this.elements.length; i++ ) {
      const [s, x, y, b, c, d] = this.elements[i];

      s.render(target, x, y);

      if ( b ) {
        this.clockSprite.render(target, x, y, c);

        if ( d ) {
          const lx = x + (s.width / 2) - (this.labelSprite.width / 2);
          const ly = y + (s.height / 2) - (this.labelSprite.height / 2);
          this.labelSprite.render(target, Math.round(lx), Math.round(ly), 3);
        }
      }
    }
  }
}
