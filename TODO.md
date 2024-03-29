# Experience
- [x] Tetris background
- [x] Main Menu
	- [ ] Graphic title
	- [x] Singleplayer menu
- [x] Ingame
	- [x] Center queued pieces
	- [x] Show score effects (combo, b2b)
	- [x] Temporarily show last move
	- [x] Game over screen
- [ ] Settings
	- [x] Volume slider
	- [ ] Column amount
	- [x] Grid toggle
	- [ ] Skins
	- [ ] Movement settings
		- [x] Automatic Repeat Rate
		- [x] Delayed Auto Shift
		- [ ] Soft Drop Factor

## Sounds
- [ ] More fitting music
- [ ] Lock sound
- [ ] Death sound
- [ ] Slider move sound

## Documentation
- [x] README.md
- [x] This to-do list
- [x] Controls
	- [ ] Handle custom keybinds
- [x] Instructions
- [x] Credits

# Gameplay
- [x] Grid
	- [x] Hidden rows at top
	- [x] Visible lines
- [x] Pieces
	- [x] 7bag
	- [x] Upcoming pieces
	- [x] Hold piece (C)
	- [x] Ghost piece
- [x] Gravity
	- [x] Collision detection
	- [x] Reduce frame speed
- [x] Death
	- [x] Return scores
	- [x] Retry (R)
- [x] Lock to 60 fps

## Modes
- [ ] Regular
	- [ ] Levels
	- [ ] Speed up gravity over time
- [x] 40 lines (sprint)
- [x] No gravity (default)

## Multiplayer
- [x] Peer-to-peer connection
	- [x] Feedback
	- [ ] Custom IDs
	- [ ] Confirm match
	- [ ] Disconnect
		- [ ] Auto-disconnect
- [ ] Gameplay
	- [ ] Display
	- [ ] Sync pieces

## Movement Controls
- [x] Moving pieces (Left, Right)
	- [x] Locking
- [x] Super Rotation System
	- [x] Rotation (Z: counter, X/Up: clockwise, A/Shift: 180)
	- [x] Kicks
- [x] Drops
	- [x] Hard (Space)
	- [x] Soft (Down)
- [ ] Custom keybinds

# Scoring
- [x] Line clear
	- [x] 1, 2, 3, 4 line clear (100, 300, 500, 800)
- [x] T-Spin
	- [x] 3-corner rule
		- [x] T-Spin 0, 1, 2, 3 (400, 800, 1200, 1600)
	- [x] 2-corner rule
		- [x] T-Spin mini 0, 1, 2 (100, 200, 400)
		- [ ] 2-corner rule exceptions (Super TSD, Fin TSD)
- [x] Perfect Clears
- [x] Back-to-backs (tetrises and t-spins, 1.5×)
- [x] Combos (line clears, 50 × combo length)
- [x] Soft/hard drop (1 or 2 points per cell)
- [x] High scores
	- [x] LocalStorage