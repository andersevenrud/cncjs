# cncjs

This guide explains (briefly) how to manually build and run the game from source.

## Requirements

* `node` version 6 or newer
* `zip`
* `imagemagick`
* `ffmpeg`
* Copy of the **Windows 95** (aka "Gold") editon of the game

## Building

1. Install dependencies
2. Convert game data
3. Compile game sources

### Dependencies

*Please note the requirements*

```bash
npm install

git submodule init
git submodule update
```

### Convert data

**You can contact me to get a ready-to-use archive if you want to skip this**.

All game files go into `src/data/`.

* Extract the `.mix` files into their respective directories using [XCC Utilities](http://xhp.xwis.net/utilities/).
    * Use `.png` without compression and corrections for all sprites
    * Use `.wav` for all sounds and music
    * Use `.avi` for movies (`Cinepack` codec)
    * Put `.pal` files in `GAME.DAT`

When done, run the conversion and packing utility:

```bash
npm run mix
```

### Development environment

Run this to run incremental builds and open development server at `localhost:9090`:

```
npm run start:dev
```

### Compile Sources

After extracting and converting all data, you can proceed to build:

```bash
npm run build
```

Copy the `dist/` directory to your web server directory.
