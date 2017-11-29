# cncjs

The base engine is complete, so mostly only game features and optimizations are not finished.

## Roadmap

Please note that there are some `TODO` and `FIXME` markers spread around the code not listed here.

Also, these version maps are not final and might change at any point.

### Engine (all)

I might have gone a bit overboard, so this game contains an entirely separate game-engine:

* [x] Variable rendering loop
* [x] Variable tick rates
* [x] Scaling
* [x] Scenes
* [x] Scene queue and switching
* [x] Keyboard
* [x] Mouse
* [x] Mouse Caputure
* [x] Sounds & Music
* [x] Audio contexts
* [x] UI Elements
* [x] UI Containers
* [x] Positional Audio
* [x] Zip Support
* [x] Preloading of assets (caches)
* [x] Sprites
* [x] Animations
* [x] Debugging support
* [ ] Touch support (*partially complete*)
* [ ] Autoscaling
* [x] Relative base element support
* [x] Progress indication
* [x] Physics utilities
* [x] Misc utilities
* [ ] Ogg/MP3 support (currently WAV only)

### v0.1.0

* [x] Tools: Building and packing
* [x] Tools: Data conversion
* [x] Tools: Object palette conversion
* [x] UI: Cursor support
* [x] UI: Basic theatre
* [x] Map: Level Loading
* [x] Map: Culling
* [x] Map: Tiles
* [x] Map: Terrain
* [x] Map: Theater modes
* [x] Map: Effects
* [x] Map: Fog-of-war
* [x] Map: Path-finding (A*)
* [x] Map: Minimap
* [x] Objects: Abstraction
* [x] Objects: Attributes & Options
* [x] Objects: Projectiles
* [x] Scene: Team selection
* [x] Scene: Movie
* [x] Scene: Basic theatre
* [x] Order: Move
* [x] Order: Attacking
* [x] Misc: A player state object etc.
* [x] Misc: Scene handling

### v0.5.0 (current goal)

* [x] Map: Building
* [ ] Map: Optimized path-finding
* [x] Sprites: Animations
* [ ] Sprites: Complete set (**partially complete**)
* [x] Objects: Overlays
* [x] Objects: Projectiles
* [x] Objects: Units
* [x] Objects: Infantry
* [ ] Objects: Aircraft
* [x] Objects: Structures
* [x] Scene: Main Menu
* [x] Scene: Theatre
* [ ] Scene: Level selection (**partially complete**)
* [ ] Scene: Scores (**partially complete**)
* [ ] Order: Guarding
* [ ] Order: Harvesting
* [x] UI: Theatre
* [x] UI: Handle build-levels etc.
* [x] UI: Original font sprites
* [x] Misc: Handle turrets
* [x] Misc: Handle projectiles
* [ ] Misc: Handle transports
* [x] Misc: Handle credits
* [ ] Misc: Handle power
* [x] Misc: Handle selling
* [ ] Misc: Handle repair (**partially complete**)
* [x] Misc: Handle damage models
* [ ] Misc: Handle weapon spread
* [x] Misc: Speech
* [x] Misc: SFX
* [x] Misc: Music (themes)
* [ ] Misc: Make units spawn in their respective construction buildings
* [ ] Misc: Handle tiberium growth and spread
* [ ] Misc: **Some sprites are hitting the canvas size limit! These needs to be split into columns**
* [ ] AI: Collision
* [ ] AI: Grouping (**partially complete**)
* [ ] AI: Triggers and Waypoints (**partially complete**)
* [x] AI: Automatically attack when within range

### v1.0.0

* [ ] Tools: Windows build support
* [ ] Tools: Conversion of original formats
* [ ] Electron binary with automated data build process
* [ ] Optimize
* [ ] Multiplayer
* [ ] Documentation
