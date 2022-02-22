# Gameplay
- [x] Grid
	- [x] Hidden rows at top
	- [ ] Visible lines
- [x] Pieces
	- [x] 7bag
	- [x] Upcoming pieces
	- [x] Hold piece (C)
	- [x] Ghost piece
	- [ ] Skins
- [x] Gravity
	- [x] Collision detection
	- [x] Reduce frame speed
- [x] Death
	- [x] Return scores
	- [x] Retry (R)
- [ ] Modes
	- [ ] 40 lines (sprint)
	- [ ] Regular
		- [ ] Levels
		- [ ] Speed up gravity over time

## Movement Controls
- [x] Moving pieces (Left, Right)
	- [x] Locking
- [x] Super Rotation System
	- [x] Rotation (Z: counter, X/Up: clockwise, A/Shift: 180)
	- [x] Kicks
- [x] Drops
	- [x] Hard (Space)
	- [x] Soft (Down)

## Movement Settings
(in frames) (SDF is a multiplier to gravity)
- [ ] Lock to 60 fps
- [ ] Automatic Repeat Rate: How fast the pieces move left and right
- [x] Delayed Auto Shift: How long it takes for ARR to happen
- [ ] Soft Drop Factor: How fast does soft drop happen

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
- [x] Combos (line clears, 50 × combo length)
- [ ] Back-to-backs (tetrises and t-spins, 1.5×)
- [x] Soft/hard drop (1 or 2 points per cell)
- [x] High scores
	- [ ] LocalStorage