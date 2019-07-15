# TODO

## Engine

- [x] Base Engine
- [x] Scene switching
- [x] Fully async
- [x] Buffered renderer
- [x] Buffered Keyboard
- [x] Buffered Mouse
- [x] Pointer lock
- [x] Touch support
- [ ] Gamepad support
- [x] Contextual Audio
- [x] Data Archive support
- [x] Image loaders
- [x] Sound loaders
- [x] Sprites from fixed grid
- [ ] Sprites from dynamic grid
- [x] Animations
- [x] General loaders
- [x] Basic physics
- [x] Debugging support
- [x] User Interfaces
- [x] Caching support
- [ ] Add support for embedding in templates (non-fullscreen)

## Game

- [x] Scenes
    - [x] Main menu
    - [x] Team selection
    - [x] Movies
    - [ ] Scores (in progress)
    - [ ] Level Selection (in progress)
    - [x] Theatre
- [x] Data
    - [x] MIX Data interfaces
    - [x] Parse original data (ini)
    - [x] Render original maps (binary)
    - [x] Music playlist
    - [ ] Add custom coordinates for reinforcement locations
- [x] User interface
    - [x] Selection
    - [x] Selection rectangle
    - [x] Elements
    - [x] Menus
    - [x] Construction
    - [x] Construction mask on map
    - [x] Button icon support
    - [x] Tooltips
    - [x] Render active unit selection
- [x] Rendering
    - [x] Map
    - [x] Entities
    - [x] Effects
    - [x] Projectiles
    - [x] Health bar
    - [x] Fog of war
    - [x] Smudge
    - [x] Rendering order
- [x] Map
    - [ ] Win conditions
    - [ ] Triggers
    - [ ] Reinforcements
    - [x] Clamp viewport position on movement
    - [x] Minimap
    - [x] Rendering passes
    - [x] Layers
    - [ ] Animate shorelines
- [x] Structures, Units & Infantry
    - [x] Movement
    - [x] Rotation
    - [x] Sight
    - [x] Building
    - [x] Attacking
    - [ ] Patrol
    - [ ] Force shot target (CTRL key)
    - [x] Death
    - [ ] Harvesting
    - [ ] Boarding and unboarding vehicles
    - [x] Damage indication
    - [x] Turrets
    - [ ] Tower turrets
    - [x] Infantry random idle animations
    - [ ] Aircraft
    - [x] Boats
    - [ ] Spawn units and infantry in the correct structures
- [x] Weapons
    - [x] Warheads and Effects
    - [x] Tails and muzzle flashes
    - [ ] Nukes
    - [ ] ION Cannon
    - [ ] Special effects (like for obelisk)
    - [ ] Area of effect
    - [ ] Inaccuracy
    - [x] Double shots
    - [ ] Arcing
    - [ ] Curving
    - [ ] Heatseeker fuel
- [x] Mechanics
    - [x] Credits
    - [x] Sew together fences
    - [x] Player abstraction
    - [x] Tech tree
    - [ ] Apply correct timings to animations and actions
    - [x] Selling
    - [x] Repairing
    - [ ] Capturing
    - [ ] C4-ing
    - [ ] Primary structure selection
    - [ ] Subcell infantry group damage division
    - [x] Minimap availability
    - [ ] Destruction of certain entities spawns infantry or civilians
    - [ ] Squashing of infantry when units drive over
    - [ ] Tiberium spread
    - [ ] Tiberium trees
- [x] Sounds
    - [x] Unit reporting
    - [x] Effects
    - [x] Projectiles
    - [x] EVA
- [x] Pathfinding
    - [ ] Movement weights
    - [ ] Movement soft collisions
- [ ] AI
    - [ ] Use triggers
    - [ ] Attack nearest
    - [ ] SAM launchers
    - [ ] Boats
- [x] Savegames
    - [x] Basic support for load/save
    - [ ] Reset scene on load
    - [ ] Save FOW state
    - [ ] Save map position
    - [ ] Save player states
    - [ ] Improve save format

## Misc

- [ ] Fix font matrixes

## Tools

- [ ] Asset conversion script (in progress)

## Future

- [ ] Multiplayer
- [ ] Look into using 'createImageBitmap'
- [ ] Look into using 'OffscreenCanvas'
- [ ] Look into using 'WebWorker' for AI etc
- [ ] Custom build for legacy or older browsers
