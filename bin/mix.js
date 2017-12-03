#!/usr/bin/env node

const program = require('commander');
const cp = require('child_process');
const path = require('path');

const ROOT = path.resolve(path.dirname(__dirname));
const DEST = path.resolve(ROOT, '.tmp/');
const DIST = path.resolve(ROOT, 'dist');

const mixSounds = require('../src/cli/mix-sounds.js');
const mixMovies = require('../src/cli/mix-movies.js');
const mixSprites = require('../src/cli/mix-sprites.js');
const mixJson = require('../src/cli/mix-json.js');

///////////////////////////////////////////////////////////////////////////////
// MAIN
///////////////////////////////////////////////////////////////////////////////

const makeStuffz = () => {
  cp.execSync(`zip -r ${DIST}/data.zip * -x MOVIES.MIX/* -x SCORES.MIX/*`, {
    cwd: DEST,
    stdio: 'pipe'
  });
};

const run = async() => {
  if ( program.sounds || program.all ) {
    console.log('>>> Converting sounds');
    await mixSounds();
  }

  if ( program.movies || program.all ) {
    console.log('>>> Converting movies');
    await mixMovies();
  }

  if ( program.sprites || program.all ) {
    console.log('>>> Converting sprites');
    await mixSprites();
  }

  if ( program.data || program.all ) {
    console.log('>>> Converting data');
    mixJson();
  }

  if ( program.zip || program.all ) {
    makeStuffz();
  }
};

program.version('0.1.0')
  .option('--all', 'Converts everything')
  .option('--sounds', 'Convert sounds')
  .option('--movies', 'Convert movies')
  .option('--sprites', 'Convert sprites')
  .option('--data', 'Convert game data')
  .option('--no-zip', 'Don\'t generate data archive')
  .parse(process.argv);

run();
