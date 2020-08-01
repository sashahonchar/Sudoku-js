/*
// Integration:

				case 'create':
						var generated = sudoku.generate('hard');
						console.log(generated);
						var puzzle = {
							givens: generated
								.split('')
								.map((n, i) => (n !== '.') ? `r${i % 9 + 1}c${Math.floor(i / 9) + 1}: ${n}` : undefined)
								.filter(given => given !== undefined),
							cages: [
								{cells: 'r1c1-r3c3', style: 'box', sum: 45}, {cells: 'r1c4-r3c6', style: 'box', sum: 45}, {cells: 'r1c7-r3c9', style: 'box', sum: 45},
								{cells: 'r4c1-r6c3', style: 'box', sum: 45}, {cells: 'r4c4-r6c6', style: 'box', sum: 45}, {cells: 'r4c7-r6c9', style: 'box', sum: 45},
								{cells: 'r7c1-r9c3', style: 'box', sum: 45}, {cells: 'r7c4-r9c6', style: 'box', sum: 45}, {cells: 'r7c7-r9c9', style: 'box', sum: 45},
							]
						};
						console.log(puzzle);
						this.createPuzzle({rows: 9, cols: 9});
						this.loadPuzzle(puzzle);
					break;
*/

sudoku = (() => {
	var sudoku = {};
	sudoku.init = function() {
		if(sudoku.initialised === true) return;
		sudoku.initialised = true;
		sudoku.DIGITS = '123456789';
		sudoku.ROWS = 'ABCDEFGHI';
		sudoku.COLS = sudoku.DIGITS;
		sudoku.SQUARES = null;
		sudoku.UNITS = null;
		sudoku.SQUARE_UNITS_MAP = null;
		sudoku.SQUARE_PEERS_MAP = null;
		sudoku.MIN_GIVENS = 17;
		sudoku.NR_SQUARES = 81;
		sudoku.DIFFICULTY = {
			"easy": 62,
			"medium":53,
			"hard":44,
			"very-hard": 35,
			"insane": 26,
			"inhuman": 17,
		};
		sudoku.BLANK_CHAR = '.';
		sudoku.SQUARES             = sudoku._cross(sudoku.ROWS, sudoku.COLS);
		sudoku.UNITS               = sudoku._get_all_units(sudoku.ROWS, sudoku.COLS);
		sudoku.SQUARE_UNITS_MAP    = sudoku._get_square_units_map(sudoku.SQUARES, sudoku.UNITS);
		sudoku.SQUARE_PEERS_MAP    = sudoku._get_square_peers_map(sudoku.SQUARES, sudoku.SQUARE_UNITS_MAP);
	};
	sudoku.generate = function(difficulty, unique){
		/* Generate a new Sudoku puzzle of a particular `difficulty`, e.g.,
		`difficulty` must be a number between 17 and 81 inclusive. If it's
		outside of that range, `difficulty` will be set to the closest bound,
		e.g., 0 -> 17, and 100 -> 81.	
		By default, the puzzles are unique, uless you set `unique` to false. 
		(Note: Puzzle uniqueness is not yet implemented, so puzzles are *not* 
		guaranteed to have unique solutions)
		TODO: Implement puzzle uniqueness
		*/
		// If `difficulty` is a string or undefined, convert it to a number or
		// default it to "easy" if undefined.
		sudoku.init();
		if(typeof difficulty === "string" || typeof difficulty === 'undefined') {
			difficulty = sudoku.DIFFICULTY[difficulty] || sudoku.DIFFICULTY.easy;
		}
		// Force difficulty between 17 and 81 inclusive
		difficulty = sudoku._force_range(difficulty, sudoku.NR_SQUARES + 1, sudoku.MIN_GIVENS);
		// Default unique to true
		unique = unique || true;
		// Get a set of squares and all possible candidates for each square
		var blank_board = "";
		for(var i = 0; i < sudoku.NR_SQUARES; ++i) blank_board += '.';
		var candidates = sudoku._get_candidates_map(blank_board);
		// For each item in a shuffled list of squares
		var shuffled_squares = sudoku._shuffle(sudoku.SQUARES);
		for(var si in shuffled_squares) {
			var square = shuffled_squares[si];
			// If an assignment of a random chioce causes a contradictoin, give
			// up and try again
			var rand_candidate_idx = sudoku._rand_range(candidates[square].length);
			var rand_candidate = candidates[square][rand_candidate_idx];
			if(!sudoku._assign(candidates, square, rand_candidate)) break;
			var single_candidates = [];
			for(var si in sudoku.SQUARES) {
				var square = sudoku.SQUARES[si];
				if(candidates[square].length == 1) single_candidates.push(candidates[square]);
			}
			// If we have at least difficulty, and the unique candidate count is
			// at least 8, return the puzzle!
			if(single_candidates.length >= difficulty && sudoku._strip_dups(single_candidates).length >= 8){
				var board = '';
				var givens_idxs = [];
				for(var i in sudoku.SQUARES){
					var square = sudoku.SQUARES[i];
					if(candidates[square].length == 1){
						board += candidates[square];
						givens_idxs.push(i);
					}
					else {
						board += sudoku.BLANK_CHAR;
					}
				}
				// If we have more than `difficulty` givens, remove some random
				// givens until we're down to exactly `difficulty`
				var nr_givens = givens_idxs.length;
				if(nr_givens > difficulty){
					givens_idxs = sudoku._shuffle(givens_idxs);
					for(var i = 0; i < nr_givens - difficulty; ++i){
						var target = parseInt(givens_idxs[i]);
						board = board.substr(0, target) + sudoku.BLANK_CHAR + board.substr(target + 1);
					}
				}
				// Double check board is solvable
				// TODO: Make a standalone board checker. Solve is expensive.
				if(sudoku.solve(board)) return board;
			}
		}
		return sudoku.generate(difficulty);
	};
	sudoku.solve = function(board, reverse) {
		sudoku.init();
		var report = sudoku.validate_board(board);
		if(report !== true) throw report;
		var nr_givens = 0;
		for(var i in board) {
			if(board[i] !== sudoku.BLANK_CHAR && sudoku.DIGITS.includes(board[i])) ++nr_givens;
		}
		if(nr_givens < sudoku.MIN_GIVENS) throw 'Too few givens. Minimum givens is' + sudoku.MIN_GIVENS;
		reverse = reverse || false;
		var candidates = sudoku._get_candidates_map(board);
		var result = sudoku._search(candidates, reverse);
		if(result) {
			var solution = '';
			for(var square in result) solution += result[square];
			return solution;
		}
		return false;
	};
	sudoku._get_candidates_map = function(board){
		var report = sudoku.validate_board(board);
		if(report !== true) throw report;
		var candidate_map = {};
		var squares_values_map = sudoku._get_square_vals_map(board);
		for(var si in sudoku.SQUARES) candidate_map[sudoku.SQUARES[si]] = sudoku.DIGITS;
		for(var square in squares_values_map){
			var val = squares_values_map[square];
			if(sudoku.DIGITS.includes(val)) {
				var new_candidates = sudoku._assign(candidate_map, square, val);
				if(!new_candidates) return false;
			}
		}
		return candidate_map;
	};
	sudoku._search = function(candidates, reverse){
		if(!candidates) return false;
		reverse = reverse || false;
		var max_nr_candidates = 0;
		var max_candidates_square = null;
		for(var si in sudoku.SQUARES) {
			var square = sudoku.SQUARES[si];
			var nr_candidates = candidates[square].length;
			if(nr_candidates > max_nr_candidates) {
				max_nr_candidates = nr_candidates;
				max_candidates_square = square;
			}
		}
		if(max_nr_candidates === 1) return candidates;
		var min_nr_candidates = 10;
		var min_candidates_square = null;
		for(si in sudoku.SQUARES) {
			var square = sudoku.SQUARES[si];
			var nr_candidates = candidates[square].length;
			if(nr_candidates < min_nr_candidates && nr_candidates > 1){
				min_nr_candidates = nr_candidates;
				min_candidates_square = square;
			}
		}
		var min_candidates = candidates[min_candidates_square];
		if(!reverse) {
			//for(var vi in min_candidates) {
			for(var vi = 0; vi < min_candidates.length; vi++) {
				var val = min_candidates[vi];
				var candidates_copy = Object.assign({}, candidates);
				var candidates_next = sudoku._search(sudoku._assign(candidates_copy, min_candidates_square, val));
				if(candidates_next) return candidates_next;
			}
		}
		else {
			for(var vi = min_candidates.length - 1; vi >= 0; --vi) {
				var val = min_candidates[vi];
				var candidates_copy = Object.assign({}, candidates);
				var candidates_next = sudoku._search(sudoku._assign(candidates_copy, min_candidates_square, val), reverse);
				if(candidates_next) return candidates_next;
			}
		}
		return false;
	};
	sudoku._assign = function(candidates, square, val){
		var other_vals = candidates[square].replace(val, '');
		for(var ovi in other_vals) {
			var other_val = other_vals[ovi];
			var candidates_next = sudoku._eliminate(candidates, square, other_val);
			if(!candidates_next) return false;
		}
		return candidates;
	};
	sudoku._eliminate = function(candidates, square, val){
		if(!candidates[square].includes(val)) return candidates;
		candidates[square] = candidates[square].replace(val, '');
		var nr_candidates = candidates[square].length;
		if(nr_candidates === 1){
			var target_val = candidates[square];
			for(var pi in sudoku.SQUARE_PEERS_MAP[square]){
				var peer = sudoku.SQUARE_PEERS_MAP[square][pi];
				var candidates_new = sudoku._eliminate(candidates, peer, target_val);
				if(!candidates_new) return false;
			}
		}
		if(nr_candidates === 0) return false;
		for(var ui in sudoku.SQUARE_UNITS_MAP[square]) {
			var unit = sudoku.SQUARE_UNITS_MAP[square][ui];
			var val_places = [];
			for(var si in unit){
				var unit_square = unit[si];
				if(candidates[unit_square].includes(val)) val_places.push(unit_square);
			}
			if(val_places.length === 0) return false;
			if(val_places.length === 1) {
				var candidates_new = sudoku._assign(candidates, val_places[0], val);
				if(!candidates_new) return false;
			}
		}
		return candidates;
	};
	sudoku._get_square_vals_map = function(board) {
		var squares_vals_map = {};
		if(board.length != sudoku.SQUARES.length) throw new Error("Board/squares length mismatch.");
		for(var i in sudoku.SQUARES) squares_vals_map[sudoku.SQUARES[i]] = board[i];
		return squares_vals_map;
	};
	sudoku._get_square_units_map = function(squares, units){
		var square_unit_map = {};
		for(var si in squares){
			var cur_square = squares[si];
			var cur_square_units = [];
			for(var ui in units){
				var cur_unit = units[ui];
				if(cur_unit.indexOf(cur_square) !== -1) cur_square_units.push(cur_unit);
			}
			square_unit_map[cur_square] = cur_square_units;
		}
		return square_unit_map;
	};
	sudoku._get_square_peers_map = function(squares, units_map){
		var square_peers_map = {};
		for(var si in squares) {
			var cur_square = squares[si];
			var cur_square_units = units_map[cur_square];
			var cur_square_peers = [];
			for(var sui in cur_square_units){
				var cur_unit = cur_square_units[sui];
				for(var ui in cur_unit){
					var cur_unit_square = cur_unit[ui];
					if(cur_square_peers.indexOf(cur_unit_square) === -1 && cur_unit_square !== cur_square) {
						cur_square_peers.push(cur_unit_square);
					}
				}
			}
			square_peers_map[cur_square] = cur_square_peers;
		}
		return square_peers_map;
	};
	sudoku._get_all_units = function(rows, cols){
		/* Return a list of all units (rows, cols, boxes)
		*/
		var units = [];
		// sudoku.ROWS
		for(var ri in rows){
			units.push(sudoku._cross(rows[ri], cols));
		}
		// Columns
		for(var ci in cols){
			 units.push(sudoku._cross(rows, cols[ci]));
		}
		// Boxes
		var row_squares = ["ABC", "DEF", "GHI"];
		var col_squares = ["123", "456", "789"];
		for(var rsi in row_squares){
			for(var csi in col_squares){
				units.push(sudoku._cross(row_squares[rsi], col_squares[csi]));
			}
		}
		return units;
	};
	sudoku.validate_board = function(board){
		if(!board) return "Empty board";	
		if(board.length !== sudoku.NR_SQUARES) return "Invalid board size. Board must be exactly " + sudoku.NR_SQUARES + " squares.";
		for(var i in board) {
			if(!sudoku.DIGITS.includes(board[i]) && board[i] !== sudoku.BLANK_CHAR){
				return "Invalid board character encountered at index " + i + ": " + board[i];
			}
		}
		return true;
	};
	sudoku._cross = function(a, b) {
		var result = [];
		for(var ai in a)
			for(var bi in b)
				result.push(a[ai] + b[bi]);
		return result;
	};
	sudoku._shuffle = function(seq){
		var shuffled = [];
		for(var i = 0; i < seq.length; ++i) shuffled.push(false);
		for(var i in seq) {
			var ti = sudoku._rand_range(seq.length);
			while(shuffled[ti]) ti = (ti + 1) > (seq.length - 1) ? 0 : (ti + 1);
			shuffled[ti] = seq[i];
		}	
		return shuffled;
	};
	sudoku._rand_range = (max = 0, min = 0) => Math.floor(Math.random() * (max - min)) + min;
	sudoku._strip_dups = (seq = []) => [...new Set(seq)];
	sudoku._force_range = (nr, max = 0, min = 0) => Math.min(max || 0, Math.max(min || 0, nr));
	return sudoku;
})();
