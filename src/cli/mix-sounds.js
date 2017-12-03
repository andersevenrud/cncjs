/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
const fs = require('fs-extra');
const path = require('path');

const ROOT = path.resolve(__dirname + '/../../');
const SRC = path.resolve(ROOT, 'src/data');
const DEST = path.resolve(ROOT, '.tmp/');
const DIST = path.resolve(ROOT, 'dist');

async function makeSounds() {
  const copy = (dir, zip) => {
    const mix = path.resolve(SRC, dir);
    fs.readdirSync(mix).filter((f) => f.match(/\.wav$/)).forEach((f) => {
      const src = path.resolve(SRC, dir, f);
      const dest = zip ? path.resolve(DEST, dir, f) : path.resolve(DIST, dir, f);

      console.log(src, '=>', dest);
      fs.mkdirpSync(path.dirname(dest));
      fs.copyFileSync(src, dest);
    });
  };

  copy('AUD.MIX', true);
  copy('SPEECH.MIX', true);
  copy('SOUNDS.MIX', true);

  copy('TRANSIT.MIX');
  copy('SCORES.MIX');
}

module.exports = makeSounds;
