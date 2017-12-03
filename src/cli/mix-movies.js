/*!
 * cncjs
 * @author Anders Evenrud <andersevenrud@gmail.com>
 * @license MIT
 */
const cp = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const glob = require('glob-promise');

const ROOT = path.resolve(__dirname + '/../../');
const SRC = path.resolve(ROOT, 'src/data');
const DIST = path.resolve(ROOT, 'dist');

function convertMovie(src, dest) {
  console.log('Converting %s => %s', path.basename(src), path.basename(dest));
  const cmd = `ffmpeg -i ${src} -c:v libvpx -c:a libvorbis ${dest}`;

  return new Promise((resolve, reject) => {
    cp.exec(cmd, {
      stdio: 'pipe'
    }, (error, stdout, stderr) => {
      return error ? reject(stderr) : resolve(stdout);
    });
  });
}

async function makeMovies() {
  const avis = await glob(path.join(SRC, 'MOVIES.MIX') + '/*.avi');
  for ( let i = 0; i < avis.length; i++ ) {
    const filename = avis[i];
    const dest = path.join(DIST, 'movies', path.basename(filename))
      .replace(/\.avi$/, '.webm');

    if ( !fs.existsSync(dest) ) {
      await convertMovie(filename, dest);
    }
  }
}

module.exports = makeMovies;
