/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */

/*
 * This code is based on https://github.com/mrdoob/stats.js
 */

var WIDTH = 80, HEIGHT = 48,
  TEXT_X = 3, TEXT_Y = 2,
  GRAPH_X = 3, GRAPH_Y = 15,
  GRAPH_WIDTH = 74, GRAPH_HEIGHT = 30;

export default class Graph {

  constructor(name, fg, bg, cb) {
    this.canvas = document.createElement('canvas');
    this.canvas.width = WIDTH;
    this.canvas.height = HEIGHT;

    const context = this.canvas.getContext('2d');
    this.context = context;
    this.min = Infinity;
    this.max = 0;
    this.name = name || '';
    this.width = WIDTH;
    this.height = HEIGHT;
    this.bg = bg || '#000000';
    this.fg = fg || '#ffffff';
    this.cb = cb || function() {};

    context.fillStyle = bg;
    context.fillRect( 0, 0, WIDTH, HEIGHT );

    context.fillStyle = fg;
    context.fillText( name, TEXT_X, TEXT_Y );
    context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );

    context.fillStyle = bg;
    context.globalAlpha = 0.9;
    context.fillRect( GRAPH_X, GRAPH_Y, GRAPH_WIDTH, GRAPH_HEIGHT );
  }

  update() {
    const [value, maxValue] = this.cb(this);
    const context = this.context;

    this.min = Math.min(this.min, value);
    this.max = maxValue ? maxValue : Math.max(this.max, value);

    context.font = 'bold 9px Helvetica,Arial,sans-serif';
    context.textBaseline = 'top';

    context.fillStyle = this.bg;
    context.globalAlpha = 1;
    context.fillRect(0, 0, WIDTH, GRAPH_Y);
    context.fillStyle = this.fg;
    context.fillText(Math.round(value) + ' ' + this.name + ' (' + Math.round(this.min) + '-' + Math.round(this.max) + ')', TEXT_X, TEXT_Y);

    context.drawImage(this.canvas, GRAPH_X + 1, GRAPH_Y, GRAPH_WIDTH - 1, GRAPH_HEIGHT, GRAPH_X, GRAPH_Y, GRAPH_WIDTH - 1, GRAPH_HEIGHT);

    context.fillRect(GRAPH_X + GRAPH_WIDTH - 1, GRAPH_Y, 1, GRAPH_HEIGHT);

    context.fillStyle = this.bg;
    context.globalAlpha = 0.9;
    context.fillRect(GRAPH_X + GRAPH_WIDTH - 1, GRAPH_Y, 1, Math.round((1 - (value / this.max)) * GRAPH_HEIGHT));
  }

  render(target, x, y) {
    target.drawImage(this.canvas, x, y);
  }
}
