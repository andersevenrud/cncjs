# cncjs

A javascript (typescript) remake of the classic Real-time strategy game "Command & Conquer".

Written on a custom engine using canvas 2d renderer.

## Requirements

You need a copy of the orignal game (Gold edition) v1.06c or a later.

Should run on any modern browser or device that supports ES6.

## Installation

Place all original game files in `original/`.

```
npm install
npm run build
npm run convert
npm run deploy
```

## In-game controls

Standard game controls, with the additional:

* `+` / `?` - Zoom in/out
* `0` / `=` - Main volume up/down
* `.` / `:` - Switch music track
* `m` - Mute main audio

## Development

When in development mode:

* `F1 - F6` - Switch scenes
* `F10` - Toggle FOW
* `F11` - Toggle canvas filtering
* `F12` - Toggle debugging
* `Delete` - Destroys selected entities
* `PageUp` / `PageDown` - Modifies selected entities health
* `End` - Moves entities to current mouse position

You can also pass `scene=<string>` to the URL to select a scene:

* `team`
* `movie` requires parameter `movie=<string>`
* `theatre` requires parameter `map=<string>`

Set `debug=false` to disable debug overlay and `zoom=<number>` for a initial zoom level.

## Shoutout

Without http://nyerguds.arsaneus-design.com/cnc95upd/inirules/ this would not be possible.

## License

This codebase is [MIT Licenses](LICENSE).
