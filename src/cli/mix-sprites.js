/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
const cp = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const Promise = require('bluebird');
const PNG = require('pngjs').PNG;
const INI = require('ini');

const PALETTE = {};
const ROOT = path.resolve(__dirname + '/../../');
const SRC = path.resolve(ROOT, 'src/data');
const DEST = path.resolve(ROOT, '.tmp/');
const DIST = path.resolve(ROOT, 'dist');

function rgbToHex(r, g, b) {
  return ([
    parseInt(r, 10).toString( 16 ),
    parseInt(g, 10).toString( 16 ),
    parseInt(b, 10).toString( 16 )
  ]).map((i) => String(i).padStart(2, 0)).join('');
}

const makePalette = () => {
  const palettes = INI.decode(fs.readFileSync(path.resolve(SRC, 'GAME.DAT', 'colors.ini'), 'utf8'));
  const fromIndex = palettes.YellowPalette.RemapIndexes.split(',').map(i => parseInt(i, 10));
  const toIndex = palettes.RedPalette.RemapIndexes.split(',').map(i => parseInt(i, 10));

  const stream = fs.readFileSync(path.join(SRC, 'GAME.DAT', 'temperat.pal'));
  const result = [];

  for ( let i = 0; i < stream.length; i += 3 ) {
    let r = stream[i];
    let g = stream[i + 1];
    let b = stream[i + 2];

    result.push([
      r > 0 ? Math.floor((r * 255) / 63) : 0,
      g > 0 ? Math.floor((g * 255) / 63) : 0,
      b > 0 ? Math.floor((b * 255) / 63) : 0
    ]);
  }

  for ( let i = 0; i < fromIndex.length; i++ ) {
    let res = result[fromIndex[i]];
    PALETTE[rgbToHex(res[0], res[1], res[2])] = result[toIndex[i]];
  }
};

const walkImageData = (src, dst, cb) => {
  return new Promise((resolve, reject) => {
    fs.createReadStream(src).pipe(new PNG({
      filterType: 4
    })).on('parsed', function() {
      for ( let y = 0; y < this.height; y++ ) {
        for ( let x = 0; x < this.width; x++ ) {
          let idx = (this.width * y + x) << 2;
          cb(this.data, idx, x, y, this.width, this.height);
        }
      }

      this.pack()
        .pipe(fs.createWriteStream(dst))
        .on('error', reject)
        .on('finish', resolve);
    }).on('error', reject);
  });
};

const createTransparency = (src, dest) => {
  console.log('Creating transparency...');
  return walkImageData(src, dest, (data, idx) => {
    const [r, g, b] = [data[idx], data[idx + 1], data[idx + 2]];
    const hex = rgbToHex(r, g, b);

    if ( hex === '000000' ) {
      data[idx + 3] = 0;
    } else if ( hex === '55ff55' ) {
      data[idx] = 0;
      data[idx + 1] = 0;
      data[idx + 2] = 0;
      data[idx + 3] = 128;
    }
  });
};

const createPaletted = (src, dest) => {
  console.log('Creating paletted...');
  return walkImageData(src, dest, (data, idx) => {
    const [r, g, b] = [data[idx], data[idx + 1], data[idx + 2]];
    const hex = rgbToHex(r, g, b);

    if ( PALETTE[hex] ) {
      const [nr, ng, nb] = PALETTE[hex];
      data[idx] = nr;
      data[idx + 1] = ng;
      data[idx + 2] = nb;
    }
  });
};

const makeSpritesFromDirectory = (p, applyPalette, trans) => {
  const root = path.join(SRC, p);

  // FIXME: This could probably need a look-see
  const list = fs.readdirSync(root).filter((f) => {
    return f.match(/\.png$/);
  });

  const group = {};
  let lastPrefix;
  list.forEach((f) => {
    const [prefix] = f.replace(/\.png$/, '').split(/\d{4}/);
    if ( prefix !== lastPrefix ) {
      group[prefix] = 0;
    }
    group[prefix]++;
    lastPrefix = prefix;
  });

  return Promise.each(Object.keys(group), (prefix, idx) => {
    const src = path.resolve(SRC, path.basename(root), prefix);
    const target = prefix.replace(/(\s|\-)$/, '');
    const dest = path.resolve(DEST, `sprites/${p}/${target}.png`);
    const cmd = `convert '${src}*' -append ${dest}`;
    const tff = `/tmp/_cncjs_${p}_${idx}_`;

    fs.mkdirpSync(path.dirname(dest));
    console.log(cmd);
    cp.execSync(cmd);

    const promises = [];

    if ( applyPalette ) {
      promises.push(() => createTransparency(dest, tff + 'transparent.png'));
      promises.push(() => createPaletted(tff + 'transparent.png', tff + 'colored.png'));
      promises.push(() => new Promise((ok) => {
        const cmd = `convert '${tff}transparent.png' '${tff}colored.png' +append ${dest}`;
        cp.execSync(cmd);
        fs.unlinkSync(tff + 'transparent.png');
        fs.unlinkSync(tff + 'colored.png');
        ok();
      }));
    } else if ( trans !== false ) {
      if ( trans instanceof Array ) {
        trans.forEach((n) => {
          if ( n === target ) {
            promises.push(() => createTransparency(dest, dest));
          }
        });
      } else {
        promises.push(() => createTransparency(dest, dest));
      }
    }

    return Promise.each(promises, (fn) => fn());
  });
};

///////////////////////////////////////////////////////////////////////////////
// EXPORTS
///////////////////////////////////////////////////////////////////////////////

async function makeSprites() {
  makePalette();
  await makeSpritesFromDirectory('CONQUER.MIX', true);
  await makeSpritesFromDirectory('CCLOCAL.MIX');
  await makeSpritesFromDirectory('DESEICNH.MIX', false);
  await makeSpritesFromDirectory('TEMPICNH.MIX', false);
  await makeSpritesFromDirectory('UPDATE.MIX', false, false);
  await makeSpritesFromDirectory('UPDATEC.MIX', false, ['hclock', 'hpips']);
  await makeSpritesFromDirectory('GENERAL.MIX', false, false);
  await makeSpritesFromDirectory('TRANSIT.MIX');
  await makeSpritesFromDirectory('TEMPERAT.MIX', false);
  await makeSpritesFromDirectory('DESERT.MIX', false);
  await makeSpritesFromDirectory('WINTER.MIX', false);
}

module.exports = makeSprites;
