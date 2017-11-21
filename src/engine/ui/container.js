/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
import {collidePoint} from '../physics';

/**
 * GUI Element Container base class
 */
export default class UIContainer {

  /**
   * @param {Engine} engine Game Engine reference
   * @param {Object[]} elements GUI Elements
   * @param {Object} [options] Options
   */
  constructor(engine, elements, options) {
    this.clicked = false;
    this.engine = engine;
    this.options = Object.assign({}, {
      x: null,
      y: null,
      center: false,
      scaleTo: null
    }, options || {});

    const map = engine.options.gui;

    this.elements = elements.map((obj) => {
      if ( map[obj.type] ) {
        const ClassRef = map[obj.type];
        delete obj.type;
        return new ClassRef(engine, obj);
      } else if ( obj.instance ) {
        const instance = obj.instance;
        delete obj.instance;
        instance.setOptions(obj);
        return instance;
      }

      return null;
    }).filter(iter => !!iter);

    console.debug('Created UI container', this.elements);
  }

  /**
   * Updates elements
   * @param {Object} viewport The viewport box
   */
  update(viewport) {
    const {vw, vh} = viewport;

    let ratio = 1;
    let left = typeof this.options.x === 'number' ? this.options.x : 0;
    let top = typeof this.options.y === 'number' ? this.options.y : 0;

    if ( left < 0 ) {
      left = vw - Math.abs(left);
    }

    if ( top < 0 ) {
      top = vh - Math.abs(top);
    }

    if ( this.options.scaleTo ) {
      const {width, height} = this.options.scaleTo;

      ratio = Math.min(vw / width, vh / height);
      left = (vw - (width * ratio)) / 2;
    } else if ( this.options.center ) {
      const {width, height, dir} = this.options.center;

      if ( !dir || dir === 'x' ) {
        left = (vw / 2) - (width / 2);
      }

      if ( !dir || dir === 'y' ) {
        top = (vh / 2) - (height / 2);
      }
    }

    const click = this.engine.mouse.buttonClicked();
    const press = this.engine.mouse.buttonDown();
    const pos = this.engine.mouse.getPosition();
    const mousePos = {x: pos[0], y: pos[1]};
    let hit = false;

    for ( let i = 0; i < this.elements.length; i++ ) {
      const el = this.elements[i];

      el.reset();

      if ( !el.isVisible() ) {
        continue;
      }

      const px = el.x < 0 ? (vw - Math.abs(el.x)) : el.x;
      const py = el.y < 0 ? (vh - Math.abs(el.y)) : el.y;

      const x = left + (px * ratio);
      const y = top + (py * ratio);

      let w = el.w === -1 ? vw : el.w * ratio;
      let h = el.h === -1 ? vh : el.h * ratio;

      el.rect = {
        ratio, x, y, w, h,
        x1: x,
        y1: y,
        x2: x + w,
        y2: y + h
      };

      const emit = (name, data) => el['on' + name](data);

      if ( click && collidePoint(click, el.rect) ) {
        emit('click', click);
      } else if ( press && collidePoint(press, el.rect) ) {
        emit('press', press);
      }

      hit = el.clicked || el.pressed;

      if ( collidePoint(mousePos, el.rect) ) {
        emit('hover', mousePos); // NOTE: Last!
      }

      el.update();
    }

    this.clicked = hit;
  }

  /**
   * Renders elements
   * @param {CanvasRenderingContext2D} target Render context
   */
  render(target) {
    for ( let i = 0; i < this.elements.length; i++ ) {
      const el = this.elements[i];
      if ( el.isVisible() ) {
        this.elements[i].render(target);
      }
    }
  }

  /**
   * Propagates an event to elements
   * @param {String} name Event name
   * @param {Object} data Event data
   */
  _event(name, data) {
    for ( let i = 0; i < this.elements.length; i++ ) {
      const el = this.elements[i];
      if ( el.isVisible() ) {
        el['on' + name](data);
      }
    }
  }

}
