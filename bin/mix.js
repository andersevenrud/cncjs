#!/usr/bin/env node

const cp = require('child_process');
const path = require('path');
const argv = require('minimist')(process.argv.slice(2));
const mixJson = require('../src/cli/mix-json.js');
const mixConvert = require('../src/cli/mix-convert.js');

const ROOT = path.resolve(path.dirname(__dirname));
const DEST = path.resolve(ROOT, '.tmp/');
const DIST = path.resolve(ROOT, 'dist');

///////////////////////////////////////////////////////////////////////////////
// MAIN
///////////////////////////////////////////////////////////////////////////////

const makeStuffz = () => {
  cp.execSync(`zip -r ${DIST}/data.zip * -x speech/* -x sounds/* -x music/*`, {
    cwd: DEST,
    stdio: 'pipe'
  });
};

if ( argv.json ) {
  mixJson();
  makeStuffz();
} else {
  mixConvert.makePalette();
  mixConvert.makeSounds();
  mixConvert.makePalette();
  mixConvert.makeSprites().then(() => {
    mixJson();
    makeStuffz();
  });
}
