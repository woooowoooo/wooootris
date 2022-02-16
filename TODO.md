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
- [x] Moving pieces (Left, Right)
	- [x] Locking
- [x] Super Rotation System
	- [x] Rotation (Z: counter, X/Up: clockwise, A/Shift: 180)
	- [x] Kicks
- [x] Drops
	- [x] Hard (Space)
	- [x] Soft (Down)
- [x] Death
	- [x] Retry (R)
- [ ] Modes
	- [ ] 40 lines (sprint)
	- [ ] Regular
		- [ ] Levels
		- [ ] Speed up gravity over time

## Handling
(in frames) (SDF is a multiplier to gravity)
- [ ] Automatic Repeat Rate: How fast the pieces move left and right
- [x] Delayed Auto Shift: How long it takes for ARR to happen
- [ ] Soft Drop Factor: How fast does soft drop happen

# Scoring
- [x] Line clear
	- [ ] Separate 1, 2, 3 line clear
- [ ] Tetris
- [ ] T-Spin
	- [ ] 3-corner rule, 2-corner rule exceptions
		- [ ] Super T-Spin Double (STSD)
		- [ ] Fin T-Spin Double
	- [ ] T-Spin 1, 2, 3 (clears that amount of lines)
	- [ ] T-Spin mini 1, 2
- [ ] Perfect Clears
- [ ] Combos (line clears)
- [ ] Back-to-backs (tetrises and t-spins)
- [ ] High scores
	- [ ] LocalStorage