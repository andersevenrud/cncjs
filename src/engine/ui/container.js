/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

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
        return new ClassRef(obj);
      } else if ( obj.instance ) {
        const instance = obj.instance;
        delete obj.instance;
        instance.setOptions(obj);
        return instance;
      }

      return null;
    }).filter(iter => !!iter);

    console.log(this.elements);
  }

  /**
   * Updates elements
   * @param {Object} viewport The viewport box
   */
  update(viewport) {
    const {vw, vh} = viewport;

    let ratio = 1;
    let left = this.options.x === null ? 0 : this.options.x;
    let top = this.options.y === null ? 0 : this.options.y;

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
      const {width, height} = this.options.center;

      left = (vw / 2) - (width / 2);
      top = (vh / 2) - (height / 2);
    }

    for ( let i = 0; i < this.elements.length; i++ ) {
      const el = this.elements[i];
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

      el.update();
    }
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
   * Checks if a click collides with elements
   * @param {Object} click A mouse click
   * @return {Boolean}
   */
  click(click) {
    let clicked;

    for ( let i = 0; i < this.elements.length; i++ ) {
      const el = this.elements[i];
      if ( el.isVisible() && el.click(click) ) {
        clicked = true;
      }
    }

    return clicked;
  }

}
