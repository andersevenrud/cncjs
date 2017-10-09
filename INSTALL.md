# cncjs

This guide explains (briefly) how to manually build and run the game from source.

## Requirements

* `node` version 6 or newer
* `zip`
* `imagemagick`
* Copy of the **Windows 95** (aka "Gold") editon of the game

## Building

1. Install dependencies
2. Convert game data
3. Compile game sources

### Dependencies

*Please note the requirements*

```bash
npm install
```

### Convert data

All game files go into `src/data/`.

* Extract the `.mix` files into their respective directories using [XCC Utilities](http://xhp.xwis.net/utilities/).
    * Use `.png` without compression and corrections for all sprites
    * Use `.wav` for all sounds and music
    * Use `.avi` for movies (`Intel Video 5.10` codec)
* Download all `.ini` files from [this site](http://nyerguds.arsaneus-design.com/cnc95upd/inirules/)
    * **Note:** There's an error in `grids.ini` at line 158. It should be `2` and not `1` as an index.


When done, run the conversion and packing utility:

```bash
npm run mix
```

### Compile Sources

After extracting and converting all data, you can proceed to build:

```bash
npm run build
```

## Running

After successfully building the game and its data files, the `dist/` directory is ready for serving.

*You will need a webserver because game data is transferred via a `.zip` file that requires CORS.*
