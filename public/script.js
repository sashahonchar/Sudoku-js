console.clear();

var sudoku;

const Part = (() => {
	function Part(opts = {}) {
		this.createElem(opts);
	}
	var P = Object.assign(Part.prototype, {constructor: Part, element: 'div'});
	P.createElem = function(opts = {}) {
		const pt = Object.getPrototypeOf(this);
		const {parent, element = pt.element, className = pt.constructor.name.toLowerCase()} = opts;
		this.elem = Object.assign(document.createElement(element), {className});
		if(parent) parent.appendChild(this.elem);
		return this.elem;
	}
	return Part;
})();
const Row = (() => {
	function Row(opts = {}) {
		Part.apply(this, arguments);
	}
	var P = Row.prototype = Object.assign(new Part(), {constructor: Row});
	return Row;
})();
const Cell = (() => {
	function Cell({row, col} = {}) {
		Part.apply(this, arguments);
		this.row = row;
		this.col = col;
		this.elem.setAttribute('row', row);
		this.elem.setAttribute('col', col);
		this.given = undefined;
		this.value = undefined;
		this.cageValue = undefined;
		this.colour = undefined;
		this.candidates = [];
		this.pencilMarks = [];
		this.childElems = {};
	}
	Cell.StateKeys = ['v','c','pm','cl','hl'];
	Cell.reStripSlashes = /\/+$/;
	var P = Cell.prototype = Object.assign(new Part(), {constructor: Cell});
	P.getChildElem = function(className) {
		if(this.childElems[className] === undefined) {
			this.childElems[className] = this.elem.appendChild(Object.assign(document.createElement('div'), {className}));
		}
		return this.childElems[className];
	};
	P.clearChildElem = function(className) {
		if(this.childElems[className] !== undefined) {
			this.childElems[className].remove();
			this.childElems[className] = undefined;
		}
	};
	P.highlight = function(val) {
		//console.info('Cell.highlight(%s);', val);
		this.elem.classList.toggle('highlight', val);
	};
	P.error = function(val) {
		//console.info('Cell.error(%s);', val);
		this.elem.classList.toggle('error', val);
	};
	P.hasState = function(state) {
		return this.elem.classList.contains(state);
	};
	P.clear = function({levels = 0, mode = 'normal'} = {}) {
		//console.info('Cell.clear({levels = %s, mode = %s});', levels, mode);
		if(mode === 'colour' && this.colour !== undefined) {
			this.colour = undefined;
			this.hideColour();
		}
		else if(this.value !== undefined) {
			this.clearChildElem('cell-value');
			this.value = undefined;
			this.showCandidates();
			this.showPencilMarks();
		}
		else if(this.candidates.length > 0 || this.pencilMarks.length > 0) {
			this.hideCandidates();
			this.candidates.length = 0;
			this.hidePencilMarks();
			this.pencilMarks.length = 0;
		}
		else {
			this.colour = undefined;
			this.hideColour();
		}
		if(levels > 1) return this.clear({levels: levels - 1});
		return this;
	};
	// Styles
		P.addStyle = function(style) {
			this.getChildElem('cell-style ' + style);
		};
		P.addBorder = function(type, dir) {
			this.getChildElem(`cell-border border-${type} ${type}-${dir}`);
		};
	// Given
		P.setGiven = function(given) {
			//console.info('Cell.setGiven(%s);', given);
			this.getChildElem('cell-given').textContent = this.given = given;
			return this;
		};
	// Value
		P.setValue = function(value) {
			//console.info('Cell.setValue(%s);', value);
			if(this.given) return;
			this.getChildElem('cell-value').textContent = this.value = value;
			this.hideCandidates();
			this.hidePencilMarks();
			return this;
		};
	// Cage value
		P.setCageValue = function(value) {
			this.getChildElem('cell-cagevalue').textContent = this.cageValue = value;
			return this;
		};
	// Candidates
		P.hideCandidates = function() {
			this.clearChildElem('cell-candidate');
		};
		P.showCandidates = function() {
			if(this.candidates.length === 0 || this.value !== undefined) return;
			this.getChildElem('cell-candidate').textContent = this.candidates.join('');
		}
		P.toggleCandidates = function(digit) {
			//console.info('Cell.toggleCandidates(%s);', digit);
			if(this.given) return;
			var cand = this.candidates;
			var idx = cand.indexOf(digit);
			if(idx === -1) cand.push(digit)
			else cand.splice(idx, 1);
			cand.sort();
			if(cand.length === 0) this.hideCandidates();
			else this.showCandidates();
		};
	// Pencil marks
		P.hidePencilMarks = function(number) {
			Object.keys(this.childElems)
				.filter(key => key.match(/^cell-pencilmark/))
				.forEach(key => this.clearChildElem(key));
		};
		P.showPencilMarks = function() {
			//console.log('showPencilMarks:', this.pencilMarks.join(', '));
			if(this.pencilMarks.length === 0 || this.value !== undefined) return;
			this.hidePencilMarks();
			this.pencilMarks.forEach((pm, idx) => this.getChildElem('cell-pencilmark pm-' + idx).textContent = pm);
		}
		P.togglePencilMark = function(digit) {
			//console.info('Cell.togglePencilMark(%s);', digit);
			if(this.given) return;
			var pm = this.pencilMarks;
			var idx = pm.indexOf(digit);
			if(idx === -1) pm.push(digit)
			else pm.splice(idx, 1);
			pm.sort();
			if(pm.length === 0) this.hidePencilMarks();
			else this.showPencilMarks();
		};
	// Colour
		P.hideColour = function() {
			this.elem.classList.remove('colour-1', 'colour-2', 'colour-3', 'colour-4', 'colour-5', 'colour-6', 'colour-7', 'colour-8', 'colour-9', 'colour-0');
		};
		P.showColour = function() {
			this.elem.classList.remove('colour-1', 'colour-2', 'colour-3', 'colour-4', 'colour-5', 'colour-6', 'colour-7', 'colour-8', 'colour-9', 'colour-0');
			if(this.colour !== undefined) this.elem.classList.add('colour-' + this.colour);
		};
		P.toggleColour = function(colour) {
			this.colour = colour;
			this.showColour();
		};
	// Helpers
		P.toRC = function() {
			return `r${this.row + 1}c${this.col + 1}`;
		};
		P.fromJSON = function(json) {
			//console.info('Cell.fromJSON("%s");', JSON.stringify(json));
			if(json.g !== undefined) this.setGiven(json.g);
			if(json.v !== undefined) this.setValue(json.v);
			if(json.c !== undefined) json.c.split(',').forEach(can => this.toggleCandidates(can));
			if(json.pm !== undefined) json.pm.split(',').forEach(pm => this.togglePencilMark(pm));
			if(json.cl !== undefined) this.toggleColour(json.cl);
			if(json.hl === true) this.highlight(true);
		};
		P.toJSON = function() {
			var json = {
				g: this.given,
				v: this.value,
				c: this.candidates.join(','),
				pm: this.pencilMarks.join(','),
				cl: this.colour,
				hl: this.hasState('highlight'),
			};
			Object.keys(json).forEach(key => 
				([undefined, '', false].includes(json[key]))
				 || (Array.isArray(json[key]) && json[key].length === 0)
				? delete json[key]
				: null
			);
			if(Object.keys(json).length > 0) {
				json.rc = this.toRC();
			};
			return json;
		};
		P.serialize = function() {
			var json = this.toJSON();
			return Cell.StateKeys
				.map(key => {
					var val = json[key];
					if(val === undefined) return '';
					if(val === true) return 1;
					if(val === false) return '';
					return val;
				})
				.join('/')
				.replace(Cell.reStripSlashes, '');
			};
		P.deserialize = function(data) {
			var json = {};
			var vals = data.split('/');
			Cell.StateKeys
				.forEach((key, idx) => {
					var val = vals[idx];
					if(key === 'hl' && val === '1') val = true;
					if(val !== '' && val !== undefined) json[key] = val;
				});
			this.fromJSON(json);
		};
	
	return Cell;
})();
const Grid = (() => {
	function Grid(opts = {}) {
		this.elem = opts.parent.querySelector('.cells');
		this.cells = [];
		this.createCells(opts);
	}
	var P = Object.assign(Grid.prototype, {constructor: Grid});
	P.clearCells = function() {
		this.elem.querySelectorAll('*').forEach(elem => elem.remove());
		this.cells.length = 0;
	};
	P.createCells = function({rows = 9, cols = 9}) {
		const size = 64,
					width = cols * size,
					height = rows * size,
					margin = 2 * size;
		this.clearCells();
		this.rows = rows;
		this.cols = cols;
		//board.style.width = `${width}px`;
		//board.style.height = `${height}px`;
		document.querySelectorAll('svg#underlay, svg#overlay')
			.forEach(svg => {
				svg.style.width = `${width + 2 * margin}px`;
				svg.style.height = `${height + 2 * margin}px`;
				svg.style.margin = `-${margin}px 0 0 -${margin}px`;
				svg.setAttribute('viewBox', `-${margin} -${margin} ${width + 2 * margin} ${height + 2 * margin}`);
			});
		document.querySelectorAll('svg#timeline')
			.forEach(svg => {
				svg.style.width = `${width}px`;
				svg.style.height = `${size}px`;
				svg.style.margin = `0 0 0 0`;
				svg.setAttribute('viewBox', `0 0 ${width} ${size}`);
			});
		//document.querySelector('#board');
		for(var r = 0; r < rows; r++) {
			this.cells[r] = [];
			var row = new Row({parent: this.elem});
			for(var c = 0; c < cols; c++) {
				this.cells[r][c] = new Cell({parent: row.elem, row: r, col: c})
			}
		}
	};
	P.getCell = function(r, c) {
		return (this.cells[r] || [])[c];
	};
	P.elemToCell = function(elem) {
		if(typeof elem.getAttribute !== 'function') return undefined;
		var row = elem.getAttribute('row'), col = elem.getAttribute('col');
		return this.getCell(row, col);
	};
	P.getCellList = function() {
		var cells = this.cells, cellList = [];
		for(var r = 0; r < cells.length; r++) {
			var row = cells[r];
			for(var c = 0; c < row.length; c++) {
				cellList.push(row[c]);
			}
		}
		return cellList;
	};
	return Grid;
})();

const SvgRenderer = (() => {
	function SvgRenderer(opts = {}) {
		this.svgId = 0;
	}
	var P = Object.assign(SvgRenderer.prototype, {constructor: SvgRenderer});
	P.renderPart = function({target = 'underlay', type, attr = {}, content}) {
		//console.info('App.renderPart({target, type, attr, content});', target, type, attr, content);
		var svg = document.querySelector('svg#' + target), svgNS = svg.namespaceURI;
		var part = document.createElementNS(svgNS, type);
		Object.keys(attr).forEach(key => part.setAttribute(key, attr[key]));
		if(content) part.textContent = content;
		svg.appendChild(part);
		return part;
	};
	P.renderLine = function({target = 'overlay', color = 'none', thickness, wayPoints}) {
		return this.renderPart({
			target, type: 'path',
			attr: {
				'fill': 'none',
				'stroke': color,
				'stroke-width': thickness,
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round',
				'd': wayPoints.map(([r, c], idx) => `${idx === 0 ? 'M' : 'L'}${64 * c} ${64 * r}`).join(' '),
			}
		});
	};
	P.renderArrow = function({target = 'overlay', color = 'none', thickness, headLength, wayPoints}) {
		var size = thickness * 12;
		var g = this.renderPart({type: 'g', attr: {stroke: color, 'stroke-width': thickness}});
		var def = g.appendChild(this.renderPart({type: 'defs'}));
		var marker = def.appendChild(this.renderPart({type: 'marker', attr: {
			id: 'arrow_' + (this.svgId++),
			markerUnits: 'userSpaceOnUse',
			markerWidth: size, markerHeight: size, refX: size * 0.8 + thickness, refY: size * 0.5, orient: 'auto'
		}}));
		var path = marker.appendChild(this.renderPart({type: 'path', attr: {
			fill: 'none',
			//d: 'M25 40 L40 25 L25 10'
			d: `M${0.5*size} ${0.8*size} L${0.8*size} ${0.5*size} L${0.5*size} ${0.2*size}`
		}}));
		var arrow = g.appendChild(this.renderPart({
			target, type: 'path',
			attr: {
				'fill': 'none',
				'stroke-linecap': 'round',
				'stroke-linejoin': 'round',
				'marker-end': 'url(#'+marker.id+')',
				'd': wayPoints.map(([r, c], idx) => `${idx === 0 ? 'M' : 'L'}${64 * c} ${64 * r}`).join(' '),
			}
		}));
		return g;
	};
	P.renderRect = function({target, center, width, height, borderSize = 0, backgroundColor = 'none', borderColor = 'none', rounded, opacity = 1}) {
		borderSize = borderSize || borderColor !== 'none' ? 2 : 0;
		return this.renderPart({
			target, type: 'rect',
			attr: {
				'fill': backgroundColor,
				'rx': rounded ? width * 64 : 0,
				'ry': rounded ? height * 64 : 0,
				'stroke': borderColor,
				'stroke-width': borderSize,
				'x': (center[1] - width * 0.5) * 64 + 0.5 * borderSize,
				'y': (center[0] - height * 0.5) * 64 + 0.5 * borderSize,
				'width': width * 64 - 1 * borderSize,
				'height': height * 64 - 1 * borderSize,
				opacity
			}
		});
	};
	P.renderText = function({target, center, width, height, color = '#000', fontSize, text}) {
		this.renderPart({
			target, type: 'rect',
			attr: {
				'fill': '#fff',
				'stroke': 'none',
				'x': (center[1] - width * 0.5) * 64 + 2,
				'y': (center[0] - height * 0.5) * 64 + 2,
				'width': width * 60 - 1,
				'height': height * 60 - 1,
			}
		});
		switch(fontSize) {
			case 28: fontSize = 34; break;
			case 30: fontSize = 34; break;
		}
		this.renderPart({
			target, type: 'text',
			attr: {
				x: (center[1] + 0.0 * width) * 64 + 2,
				y: (center[0] + 0.1 * height) * 64 + 2,
				'text-anchor': 'middle',
				'dominant-baseline': 'middle',
				//style: 'font-size: ' + (fontSize === 28 ? 34 : 24) + 'px;',
				style: `font-size: ${fontSize}px;`,
			},
			content: text,
		});
	};
	return SvgRenderer;
})();

const Replay = (() => {
	function Replay() {}
	const P = Object.assign(Replay.prototype, {constructor: Replay});
	const tSepA = '/', tSepB = 'T', tSepC = '_';
	const reActA = Replay.reActA = new RegExp('(hl|sl|ds|vl|pm|cd|co|cl|ud|rd)(?:\:([^'+tSepA+',]+))?(?:'+tSepA+'([0-9]+))?', 'ig');
	const reActB = Replay.reActB = new RegExp('(HL|SL|DS|VL|PM|CD|CO|CL|UD|RD)(?:([^'+tSepB+']+))?(?:'+tSepB+'([0-9]+))?', 'g');
	const reActC = Replay.reActC = new RegExp('([A-Z])(?:([^'+tSepC+']+))?(?:'+tSepC+'([0-9]+))?', 'g');	
	const reRCVal = Replay.reRCVal = /r([0-9]+)c([0-9]+)(?:\s*[:=]\s*([a-zA-Z0-9]+))?/g;
	const reNum = Replay.reNum = /[0-9a-f]{2}/g;
	const reCellArg = Replay.reCellArg = /^(hl|sl|ds)$/i;
	const actA = 'hl,vl,pm,cd,co,cl,ud,rd,sl,ds'.split(',');
	const rcToNum = Replay.rcToNum = w => rcv => {
		reRCVal.lastIndex = 0;
		const [_, r, c, v] = [...(reRCVal.exec(rcv) || [])];
		return ((Number(r) - 1) * w + (Number(c) - 1)).toString(16).padStart(2, '0');
	};
	const numToRc = Replay.numToRc = w => hex => {
		const num = parseInt(hex, 16), r = Math.floor(num / w) + 1, c = num % w + 1;
		const rcv = `r${r}c${c}`;
		return rcv;
	};
	const listRcvToNum = Replay.listRcvToNum = w => rcvList => rcvList.toLowerCase().match(reRCVal).map(rcToNum(w)).join('');
	const listNumToRcv = Replay.listNumToRcv = w => numList => numList.toLowerCase().match(reNum).map(numToRc(w)).join('');
	const reExec = re => str => {
		re.lastIndex = 0;
		var [_, ...res] = re.exec(str);
		re.lastIndex = 0;
		return res;
	};
	const parseActA = Replay.parseActA = reExec(reActA);
	const parseActB = Replay.parseActB = reExec(reActB);
	const parseActC = Replay.parseActC = reExec(reActC);
	const actA2B = Replay.actA2B = w => {
		var convertRc = listRcvToNum(w);
			return act => {
			try {
				var [type, arg, dt] = parseActA(act);
				var res = type.toUpperCase();
				if(arg) {
					if(reCellArg.test(type)) arg = convertRc(arg);
					res += arg;
				}
				res += tSepB + (dt || 0);
			} catch(err) {
				console.error(err);
				console.error('Error in Replay.actA2B for act:', act);
				throw err;
			}
			return res;
		};
	};
	const actB2A = Replay.actB2A = w => {
		var convertRc = listNumToRcv(w);
		return act => {
			try {
				var [type, arg, dt] = parseActB(act);
				var res = type;
				if(arg) {
					if(reCellArg.test(res)) arg = convertRc(arg);
					res += ':' + arg;
				}
				if(dt) res += tSepA + dt;
				res = res.toLowerCase();
			} catch(err) {
				console.error(err);
				console.error('Error in Replay.actB2A for act:', act);
				throw err;
			}
			return res;
		};
	};
	const actA2C = Replay.actA2C = w => {
		var convertRc = listRcvToNum(w);
		return act => {
			try {
				var [type, arg, dt] = parseActA(act);
				var res = String.fromCodePoint(actA.indexOf(type) + 'A'.codePointAt(0));
				if(arg) {
					if(reCellArg.test(type)) arg = convertRc(arg);
					res += arg;
				}
				res += tSepC + (dt || 0);
			} catch(err) {
				console.error(err);
				console.error('Error in Replay.actA2B for act:', act);
				throw err;
			}
			return res;
		};
	};
	const actC2A = Replay.actC2A = w => {
		var convertRc = listNumToRcv(w);
		return act => {
			try {
				var [type, arg, dt] = parseActC(act);
				var res = actA[type.codePointAt(0) - 'A'.codePointAt(0)];
				if(arg) {
					if(reCellArg.test(res)) arg = convertRc(arg);
					res += ':' + arg;
				}
				if(dt) res += tSepA + dt;
				res = res.toLowerCase();
			} catch(err) {
				console.error(err);
				console.error('Error in Replay.actB2A for act:', act);
				throw err;
			}
			return res;
		};
	};
	const replayA2B = Replay.replayA2B = (replay, w = 9) => replay.match(reActA).map(actA2B(w)).join('');
	const replayB2A = Replay.replayB2A = (replay, w = 9) => replay.match(reActB).map(actB2A(w)).join(',');
	const replayA2C = Replay.replayA2C = (replay, w = 9) => replay.match(reActA).map(actA2C(w)).join('');
	const replayC2A = Replay.replayC2A = (replay, w = 9) => replay.match(reActC).map(actC2A(w)).join(',');
	return Replay;
})();

const Puzzle = (() => {
	function Puzzle(opts = {}) {
		this.app = opts.app;
		this.grid = this.app.grid;
		this.currentPuzzle = undefined;
		this.replayStack = [];
		this.undoStack = [];
		this.redoStack = [];
		this.cells = [];
		this.selectedCells = [];
		this.puzzleCache = {};
		//this.highlightedCells = [];
		this.startTime = this.lastActTime = Date.now();
		this.replayTimeoutId = undefined;
		
		Object.defineProperties(this, {
			currentPuzzle: {get: () => this.app.currentPuzzle, set: (val) => this.app.currentPuzzle = val},
			//highlightedCells: {get: () => this.app.highlightedCells, set: (val) => this.app.highlightedCells = val},
			highlightedCells: {get: () => console.error('Puzzle.highlightedCells GET DEPRECATED!'), set: (val) => console.error('Puzzle.highlightedCells SET DEPRECATED!')},
			rows: {get: () => this.grid.rows, set: (val) => this.grid.rows = val},
			cols: {get: () => this.grid.cols, set: (val) => this.grid.cols = val},
		});
	}
	var P = Object.assign(Puzzle.prototype, {constructor: Puzzle});
	Puzzle.reRCRange = /^r([0-9]+)c([0-9]+)(?:-r([0-9]+)c([0-9]+))?$/;
	Puzzle.reRCVal = /^r([0-9]+)c([0-9]+)(?:\s*[:=]\s*([a-zA-Z0-9]+))?$/;
	Puzzle.reRCSplit = /(?=r[0-9]+c[0-9]+)/;
	Puzzle.ActionLongToShort = {
		highlight: 'sl',
		select: 'sl',
		deselect: 'ds',
		value: 'vl',
		pencilmarks: 'pm',
		candidates: 'cd',
		colour: 'co',
		clear: 'cl',
		undo: 'ud',
		redo: 'rd',
	};
	Puzzle.ActionShortToLong = {
		hl: 'select',
		sl: 'select',
		ds: 'deselect',
		vl: 'value',
		pm: 'pencilmarks',
		cd: 'candidates',
		co: 'colour',
		cl: 'clear',
		ud: 'redo',
		rd: 'undo',
	};
	Puzzle.Modes = ['normal', 'corner', 'centre', 'colour'];//, 'pen'];
	Puzzle.parseRCVal = function(rcv) {
		var [_, r, c, val] = Puzzle.reRCVal.exec(rcv);
		return [r, c, val];
	};
	Puzzle.logTimeResolutionMs = 50;
	// Cells
		P.getCells = function(query) {
			var segments = query === '' ? [] : query.split(/\s*,\s*/);
			var cells = [];
			segments.forEach(segment => {	
				var [_, r1, c1, r2, c2] = Puzzle.reRCRange.exec(segment);
				r1 = parseInt(r1); c1 = parseInt(c1);
				r2 = parseInt(r2 || r1); c2 = parseInt(c2 || c1);
				for(var c = c1 - 1; c < c2; c++) for(var r = r1 - 1; r < r2; r++) {
					cells.push(this.grid.getCell(r, c));
				}
			});
			return cells;
		};
	// Board
		P.clearPuzzle = function() {
			this.clearSelection();
			this.grid.cells.forEach(row => row.forEach(cell => cell.clear({levels: 3})));
		};
		P.createPuzzle = function({rows = this.rows, cols = this.cols}) {
			//console.log('Puzzle.createPuzzle({rows: %s, col: %s});', rows, cols);
			this.grid.createCells({rows, cols});
			this.cells = this.grid.getCellList();
			this.restartPuzzle();
		};
		P.restartPuzzle = function() {
			/*
			if(this.preserveStacks !== true) {
				this.replayStack.length = 0;
				this.undoStack.length = 0;
				this.redoStack.length = 0;
			}
			*/
			this.replayStack.length = 0;
			this.undoStack.length = 0;
			this.redoStack.length = 0;
			this.startTime = this.lastActTime = Date.now();
			this.clearPuzzle();
		};
	// Loading
		P.loadPuzzle = function(puzzle) {
			//console.info('Puzzle.loadPuzzle(puzzle);', puzzle);
			for(var i = 1; i <= 9; i++) {
				puzzle.cages.push(
					{cells: `r${i}c1-r${i}c9`, sum: 45},
					{cells: `r1c${i}-r9c${i}`, sum: 45}
				);
			}
			this.currentPuzzle = puzzle;
			this.restartPuzzle();
			this.grid.cells.forEach(row => row.forEach(cell => Object.keys(cell.childElems).forEach(key => cell.clearChildElem(key))));
			(puzzle.givens || []).forEach(given => {
				var [r, c, val] = Puzzle.parseRCVal(given);
				this.grid.getCell(r - 1, c - 1).setGiven(val);
			});
			(puzzle.cages || []).forEach(cage => {
				var cells = this.getCells(cage.cells);
				if(cage.style !== undefined) {
					cells.forEach(cell => {
						if(cells.indexOf(this.grid.getCell(cell.row + 0, cell.col - 1)) === -1) cell.addBorder(cage.style, 'l');
						if(cells.indexOf(this.grid.getCell(cell.row + 0, cell.col + 1)) === -1) cell.addBorder(cage.style, 'r');
						if(cells.indexOf(this.grid.getCell(cell.row - 1, cell.col + 0)) === -1) cell.addBorder(cage.style, 't');
						if(cells.indexOf(this.grid.getCell(cell.row + 1, cell.col + 0)) === -1) cell.addBorder(cage.style, 'b');
					});
				}
				if(cage.cageValue !== undefined) {
					var [r, c, val] = Puzzle.parseRCVal(cage.cageValue);
					this.grid.getCell(r - 1, c - 1).setCageValue(val);
				}
			});
		};
		P.serializeState = function() {
			var cells = this.cells, cols = this.cols, state = [];
			cells.forEach(cell => state[cell.row * cols + cell.col] = cell.serialize());
			return {id: this.puzzleId, state: state.join('|')};
		};
		P.deserializeState = function(data) {
			return this.loadRemoteCTCPuzzle(state.id)
				.then(() => data.state.split('|').forEach((data, idx) => this.grid.getCell(Math.floor(idx / 9), idx % 9).deserialize(data)));	 
		};
		P.loadCTCPuzzle = function(ctcPuzzle) {
			var puzzle = this.app.convertPuzzle(ctcPuzzle);
			this.loadPuzzle(puzzle);
		};
		P.loadRemoteCTCPuzzle = function(puzzleId) {
			this.puzzleId = puzzleId;
			return Promise.resolve()
				.then(() => this.puzzleCache[puzzleId]
						? this.puzzleCache[puzzleId]
						: fetch('https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/' + puzzleId + '?alt=media')
							.then(res => res.json())
							.then(json => this.puzzleCache[puzzleId] = json)
				)
				.then(ctcPuzzle => this.loadCTCPuzzle(ctcPuzzle))
				.catch(err => console.error('fetch error:', err));
		};
	// Selection
		P.clearSelection = function() {
			//console.info('Puzzle.clearSelection();');
			this.selectedCells.forEach(cell => cell.highlight(false));
			this.selectedCells.length = 0;
		};
		P.select = function(cells) {
			var selectedCells = this.selectedCells;
			if(cells === undefined) throw new Error('Select requires cells');
			if(!Array.isArray(cells)) cells = [cells];			
			//console.info('Puzzle.select([%s]);', this.cellsToString(cells));
			cells = cells.filter(cell => !selectedCells.includes(cell));
			if(cells.length > 0) this.act({type: 'select', arg: cells});
		};
		P.deselect = function(cells, skipAct) {
			var selectedCells = this.selectedCells;
			if(cells === undefined) cells = [...selectedCells];
			if(!Array.isArray(cells)) cells = [cells];
			//console.info('Puzzle.deselect([%s]);', this.cellsToString(cells));
			cells = cells.filter(cell => selectedCells.includes(cell));
			if(cells.length !== 0) this.act({type: 'deselect', arg: cells});
		};
	// Actions
		P.cellsToString = function(cells) {
			//console.info('Puzzle.cellsToString(cells);', cells);
			if(cells === undefined) cells = 'none';
			if(cells === 'none') cells = [];
			if(!Array.isArray(cells)) cells = [cells];
			cells = cells.map(cell => cell.toRC()).join('');
			return cells || '-';
		};
		P.parseCells = function(cells) {
			//console.info('Puzzle.parseCells(cells);', cells);
			if(['none', '-', ''].includes(cells)) cells = [];
			if(['highlighted', 'selected', undefined].includes(cells)) cells = this.selectedCells;
			if(typeof cells === 'string') {
				//cells = (cells.split(/\s*,\s*/) || [])
				cells = (cells.split(Puzzle.reRCSplit) || [])
					.map(Puzzle.parseRCVal.bind(Puzzle))
					.map(([r, c, val]) => this.grid.getCell(r - 1, c - 1));
			}
			if(!Array.isArray(cells)) cells = [cells];
			if(cells === this.selectedCells) cells = [...cells];
			return cells;
		};
		P.actionToString = function(action) {
			if(typeof action === 'string') return action;
			const type = Puzzle.ActionLongToShort[action.type] || '-';
			var arg = '-';
			switch(type) {
				case 'hl':
				case 'sl':
				case 'ds':
					arg = this.cellsToString(action.arg); break;
				case 'cl': 
					//console.warn('actionToString CLEAR:', action, type, action.arg, Puzzle.Modes, Puzzle.Modes.indexOf(action.arg));
					arg = Puzzle.Modes.indexOf(action.arg); break;
				default:
					if(action.arg !== undefined) arg = action.arg;
			}
			return type + (arg !== '-' ? ':' + arg : '');
		};
		P.parseAction = function(action) {
			//console.info('Puzzle.parseAction(action);', action);
			if(typeof action === 'string') {				
				const [type, arg, time] = Replay.parseActA(action);
				action = {type: Puzzle.ActionShortToLong[type] || 'unknown'};
				switch(type) {
					case 'hl':
					case 'sl':
					case 'ds':
						action.arg = this.parseCells(arg);
						break;
					case 'cl': action.arg = Puzzle.Modes[arg]; break;
					default:
						if(arg !== undefined && arg !== '-') action.arg = arg;
				}
			}
			return action;
		};
		P.logReplayAct = function(act) {
			var t = Date.now(), dt = Date.now() - this.lastActTime;
			this.lastActTime = t;
			this.replayStack.push(act + '/' + Math.round(dt / Puzzle.logTimeResolutionMs));
		};
		P.exec = function(action) {
			var {type, arg} = this.parseAction(action), selectedCells = this.selectedCells;
			//console.info('Puzzle.exec("%s");', this.actionToString(action));
			switch(type) {
				case 'highlight':
				case 'select':
					if(typeof arg === 'string') arg = this.parseCells(arg);
					//if(arg === undefined) arg = [...selectedCells]
					if(arg === undefined) console.error('Cannot select UNDEFINED cells!');
					arg.forEach(cell => {
						cell.highlight(true);
						selectedCells.push(cell);
					});
					/*
						if(typeof arg === 'string') {
							//console.warn('arg is string:', action, arg);
							arg = this.parseCells(arg);
							//console.warn('  arg parsed:', arg);
						}
						if(arg === undefined) arg = this.highlightedCells;

						//console.log('  cellsToString(arg):', this.cellsToString(arg));
						//console.log('  cellsToString(highlightedCells):', this.cellsToString(this.highlightedCells));

						//if(this.cellsToString(arg) === this.cellsToString(this.highlightedCells)) return false;
						this.deselect();
						//console.log('  select(arg):', arg);
						this.select(arg);
						this.highlightedCells.length = 0;
						this.highlightedCells.push.apply(this.highlightedCells, arg);
					*/
					return true;
				case 'deselect':
					if(typeof arg === 'string') arg = this.parseCells(arg);
					arg.forEach(cell => {
						cell.highlight(false);
						this.selectedCells.splice(this.selectedCells.indexOf(cell), 1);
					});
					//console.error('Implement DESELECT:', this.cellsToString(arg));
					return true;
				case 'clear': selectedCells.forEach(cell => cell.clear({mode: arg})); return true;
				case 'value': selectedCells.forEach(cell => cell.setValue(arg)); return true;
				case 'candidates': selectedCells.forEach(cell => cell.toggleCandidates(arg)); return true;
				case 'pencilmarks': selectedCells.forEach(cell => cell.togglePencilMark(arg)); return true;
				case 'colour': selectedCells.forEach(cell => cell.toggleColour(arg)); return true;
				default: console.error('Puzzle.act: unkown action type:', type, action); return false;
			}
			throw new Error('Invalid type!');
		};
		P.act = function(action) {
			action = this.parseAction(action);
			var act = this.actionToString(action);
			//console.info('Puzzle.act("%s");', act, action);
			/*
			if(!/^(highlight|select|deselect|undo|redo|hl|sl|ds|ud|rd)$/.test(action.type)) {
				console.warn('Messing with highlight:', action);
				var nextSelectedCells = this.cells.filter(cell => cell.hasState('highlight'));
				var prevSelection = this.cellsToString(this.selectedCells);
				var nextSelection = this.cellsToString(nextSelectedCells);
				console.log('  prevSelection:', prevSelection);
				console.log('  nextSelection:', nextSelection);
				if(prevSelection !== nextSelection) {
					//console.warn('Squeeze highlight in before action:', action);
					// Squeeze highlight in before action
					var selAction = {type: 'select', cells: nextSelectedCells};
					var selAct = this.actionToString(selAction);
					if(this.exec(selAction)) {
						this.logReplayAct(selAct);
						this.redoStack.length = 0;
						this.undoStack.push(selAct);
					}
				}
			}
			*/
			if(action === 'ud' || action.type === 'undo') {
				if(this.undoStack.length > 0) {
					this.logReplayAct(act);
					//this.redoStack.push(this.undoStack.pop());
					do {
						var undoAct = this.undoStack.pop();
						this.redoStack.push(undoAct);
					} while(this.undoStack.length > 0 && ['sl', 'ds'].includes(Replay.parseActA(undoAct)[0]));
					this.clearPuzzle();
					this.undoStack.forEach(act => this.exec(act));
				}
			}
			else if(action === 'rd' || action.type === 'redo') {
				if(this.redoStack.length > 0) {
					this.logReplayAct(act);
					//var redoAct = this.redoStack.pop(); this.undoStack.push(redoAct); this.exec(redoAct);
					do {
						var redoAct = this.redoStack.pop();
						this.undoStack.push(redoAct);
						this.exec(redoAct);
					} while(this.redoStack.length > 0 && ['sl', 'ds'].includes(Replay.parseActA(redoAct)[0]));
				}
			}
			else {
				if(this.exec(action)) {
					this.logReplayAct(act);
					this.redoStack.length = 0;
					this.undoStack.push(act);
				}
			}
			//console.log('Post act:', this.replayStack, this.redoStack, this.undoStack);
		};
	// Replay
		P.replayStop = function() {
			clearTimeout(this.replayTimeoutId);
		};
		P.replayLength = function(replay, opts = {}) {
			var actions = [...replay.actions], playTime = 0;
			actions.forEach(action => playTime += Number(action.split('/')[1]) * Puzzle.logTimeResolutionMs);
			return playTime;
		};
		P.replayPlay = function(replay, opts = {}) {
			console.info('Puzzle.replayPlay(replay, opts);', replay, opts);
			var actions = [...replay.actions],
					maxDelay = opts.maxDelay || 5000,
					speed = opts.speed || 1,
					playToTime = opts.playToTime || -1,
					step = 0,
					playTime = 0,
					doAction = undefined;
			const nextStep = () => {
				if(doAction !== undefined) this.act(doAction);
				if(actions.length <= step) return;
				doAction = actions[step++];
				const [type, arg, time] = Replay.parseActA(doAction);
				const stepTime = Number(time) * Puzzle.logTimeResolutionMs;
				playTime += stepTime;
				if(playToTime !== -1 && playTime > playToTime) {
					console.log('Exiting replay at step %s/%s time %s due to limit %s', step, actions.length, playTime, playToTime);
					return;
				}
				if(speed !== -1) {
					const delay = Math.min(maxDelay, stepTime) / speed;
					this.replayTimeoutId = setTimeout(nextStep, delay);
				}
				else {
					nextStep();
				}
			};
			this.replayStop();
			this.restartPuzzle();
			//console.log('actions:', actions);
			nextStep();
		};
	// Checker
		P.checkCells = function(cells, errors = []) {
			console.info('Puzzle.checkCells(cells, errors);', cells);
			cells.forEach(cell => {
				if((cell.given || cell.value) === undefined) {
					//console.error('Error in cell values:', cell, cell.given || cell.value);
					errors.push({type: 'missing', expected: 'any value', found: cell.given || cell.value, cells: [cell], part: 'cell'});
				}
			});
			return errors;
		};
		P.checkCages = function(cages, errors = []) {
			console.info('Puzzle.checkCages(cages, errors);', cages);
			cages.forEach(cage => {
				var cells = this.getCells(cage.cells);
				var cellValues = cells.map(cell => cell.given || cell.value).filter(val => val !== undefined);
				if(cells.length !== cellValues.length) {
					//console.error('Error in cage cell count:', cage, cells.length, cellValues.length);
					errors.push({type: 'count', expected: cells.length, found: cellValues.length, cells: cells.map(cell => cell.given || cell.value).filter(val => val !== undefined), part: 'cage', cage: cage});
				}
				var uniqueValues = [...new Set(cellValues)];
				if(cellValues.length !== uniqueValues.length) {
					//console.error('Error in cage uniqueness:', cage, cells.length, uniqueValues.length);
					//errors.push({type: 'unique', expected: cells.length, found: uniqueValues.length, cells: cells.filter(cell => cells.filter(c => cell.value === c.value).length > 1), part: 'cage', cage: cage});
					errors.push({type: 'unique', expected: cells.length, found: uniqueValues.length, cells: cells.filter(cell => cellValues.filter(val => val === (cell.given || cell.value)).length > 1), part: 'cage', cage: cage});
				}
				if(cage.sum !== undefined) {
					var cellSum = cellValues.map(val => Number(val)).reduce((cur, acc) => cur + acc, 0);
					if(cellSum !== cage.sum) {
						//console.error('Error in cage sum:', cage, cage.sum, cellSum);
						errors.push({type: 'sum', expected: cage.sum, found: cellSum, cells: cells, part: 'cage', cage: cage});
					}
				}
			});
			return errors;
		};
		P.check = function() {
			console.info('Puzzle.check();', this.currentPuzzle);
			var puzzle = this.currentPuzzle;
			if(!puzzle) return;
			//this.deselect();
			var errors = [];
			var cells = this.cells;
			this.checkCells(cells, errors);
			this.checkCages(puzzle.cages, errors);
			cells.forEach(cell => cell.error(false));
			if(errors.length) {
				console.info('%s errors found:', errors.length, errors);
				var cellErrors = {};
				errors.forEach(err => {
					if(['missing', 'unique'].includes(err.type)) {
						(err.cells || []).forEach(cell => {
							var rc = cell.toRC();
							cellErrors[rc] = cellErrors[rc] || {cell: cell, errors: []};
							cellErrors[rc].errors.push(err);
						});
					}
				});
				Object.values(cellErrors || {}).forEach(({cell, errors}) => {
					cell.error(true);
					console.info('%s errors in cell[%s]:', errors.length, cell.toRC(), ...errors);
				});
				setTimeout(() => alert('That doesn\'t look right!'), 10);
			}
			else {
				alert('Looks good to me!');
			}
		};
	return Puzzle;
})();

const App = (() => {
	function App(opts = {}) {
		this.grid = new Grid({parent: document.getElementById('board'), rows: 9, cols: 9});
		this.svgRenderer = new SvgRenderer();
		this.puzzle = new Puzzle({app: this});
		// Bind all handlers
		Object.getOwnPropertyNames(Object.getPrototypeOf(this))
			.filter(prop => /^handle/.test(prop) && typeof this[prop] === 'function')
			.forEach(prop => this[prop] = this[prop].bind(this));
		this.currentInput = 'none';
		this.currentInputTimeoutId = undefined;
		this.doubleTaps = {};
		this.move = 'none';
		this.paintState = 'none';
		this.paintStateVal = false;		
		this.highlighting = undefined;
		this.mode = 'normal';
		this.startTime = this.lastActTime = Date.now();
		//this.highlightedCells = [];
		//this.replayStack = [];
		//this.undoStack = [];
		//this.redoStack = [];
		this.puzzleCache = {};
		this.createPuzzle({rows: 9, cols: 9});
		this.attachHandlers();
		['highlightedCells', 'replayStack', 'undoStack', 'redoStack'].forEach(prop =>
			Object.defineProperty(this, prop, {get: () => console.error('App.'+prop+' GET DEPRECATED!'), set: (val) => console.error('App.'+prop+' SET DEPRECATED!')})
		);
	}
	var P = Object.assign(App.prototype, {constructor: App});
	App.reDigit = /^(?:Numpad|Digit|btn-)([0-9])$/;
	App.Modes = Puzzle.Modes;
	App.ModeToAction = {
		'normal': 'value',
		'corner': 'pencilmarks',
		'centre': 'candidates',
		'colour': 'colour',
		'pen': 'pen',
	};
	App.colorHexToRGBA = (hex, alpha) => {
		hex = parseInt(hex.replace(/^#/, ''), 16);
		return `rgba(${hex>>16&255},${hex>>8&255},${hex>>0&255},${alpha})`;
	};
	App.CurrentInputTimeoutMs = 500;
	App.LongInputTimeout = 700;
	App.DoubleInputTimeout = 500;
	App.DoubleInputDistance = 10;
	App.distance = (a, b) => { const dx = b.x - a.x, dy = b.y - a.y; return Math.round(Math.sqrt(dx * dx + dy * dy)); };
	// Puzzle
		P.createPuzzle = function(opts) { return this.puzzle.createPuzzle(opts); };
		P.clearPuzzle = function() { return this.puzzle.clearPuzzle(); };
		P.restartPuzzle = function() { return this.puzzle.restartPuzzle(); };
		P.getCells = function(query) { return this.puzzle.getCells(query); };
		P.loadPuzzle = function(puzzle) { return this.puzzle.loadPuzzle(puzzle); };
		P.loadCTCPuzzle = function(ctcPuzzle) { return this.puzzle.loadCTCPuzzle(ctcPuzzle); };
		P.loadRemoteCTCPuzzle = function(puzzleId) { return this.puzzle.loadRemoteCTCPuzzle(puzzleId); };
		P.testDotPuzzle = function() {
			var underlaySvg = document.querySelector('svg#underlay'),
					overlaySvg = document.querySelector('svg#overlay')
			this.createPuzzle({rows: 9, cols: 9});					
			[...underlaySvg.children].forEach(child => (child.nodeName !== 'defs') ? child.remove() : null);
			[...overlaySvg.children].forEach(child => (child.nodeName !== 'defs') ? child.remove() : null);
			for(var row = 0; row < 10; row++) {
				for(var col = 0; col < 10; col++) {
					App.renderRect({
						center: [row + 0, col + 0],
						rounded: true,
						width: 0.2,
						height: 0.2,
						backgroundColor: '#000000'
					});
				}
			}
			this.testDot = true;
		};
		P.convertPuzzle = function(puzzle) {
			console.warn('App.convertPuzzle(puzzle);', puzzle);
			var svgRenderer = this.svgRenderer;
			var underlaySvg = document.querySelector('svg#underlay'),
					overlaySvg = document.querySelector('svg#overlay');
			var rows = puzzle.cells.length, cols = Math.max.apply(Math, puzzle.cells.map(row => row.length));
			this.createPuzzle({rows, cols});
			[...underlaySvg.children].forEach(child => (child.nodeName !== 'defs') ? child.remove() : null);
			[...overlaySvg.children].forEach(child => (child.nodeName !== 'defs') ? child.remove() : null);
			puzzle.lines.forEach(svgRenderer.renderLine.bind(svgRenderer));
			puzzle.arrows.forEach(svgRenderer.renderArrow.bind(svgRenderer));
			[].concat(puzzle.underlays, puzzle.overlays).forEach(part => {
				var target = puzzle.underlays.indexOf(part) !== -1 ? 'underlay' : 'overlay';
				if(typeof part.text === 'string' && part.text.length > 0) {
					svgRenderer.renderText(Object.assign({}, part, {target}));
				}
				else { // rect
					var borderColor = part.borderColor || 'none';
					var backgroundColor = part.backgroundColor || 'none';
					var opacity = 0.5;
					if(backgroundColor === '#000000') opacity = 1;
					if(part.rounded) {
						opacity = 1;
						if(borderColor !== 'none') borderColor = App.colorHexToRGBA(borderColor, 0.5);
					}
					//if(borderColor !== 'none') borderColor = App.colorHexToRGBA(borderColor, 0.5);
					//if(backgroundColor !== 'none') backgroundColor = App.colorHexToRGBA(backgroundColor, 0.5);
					//console.log('rect colours:', part, backgroundColor, borderColor, opacity);
					svgRenderer.renderRect(Object.assign({}, part, {target, borderColor, backgroundColor, opacity}));
				}
			});
			var givens = [], cages = [];
			puzzle.cells.forEach((row, r) => row.forEach((cell, c) => { if(cell.value) givens.push(`r${1 + r}c${1 + c}=${cell.value}`); }));
			puzzle.regions.forEach(cells => {
				var cage = {cells: cells.map(([r, c]) => `r${1 + r}c${1 + c}`).join(','), style: 'box'};
				if(cells.length === 9) cage.sum = 45;
				cages.push(cage);
			});
			puzzle.cages.forEach(cage => {
				if(cage.cells.length === 0) {
					console.warn('Cage without cells:', cage);
					return;
				}
				var labelCell = [...cage.cells].sort(([r1, c1], [r2, c2]) => 
						(r1 === r2)
							? c2 - c1
							: r2 - r1
					 ).pop();
				var outCage = {
					cells: cage.cells.map(([r, c]) => `r${1 + r}c${1 + c}`).join(','),
					style: 'killer',
				};
				if(cage.value !== undefined && cage.value !== '') {
					outCage.cageValue = `r${1 + labelCell[0]}c${1 + labelCell[1]}: ${cage.value}`;
					if(!isNaN(cage.value)) outCage.sum = parseInt(cage.value);
				}
				//console.log('cage:', cage, outCage);
				cages.push(outCage);
			});
			return {givens, cages};
		};
		P.handleCancelRestartPuzzle = function() {
			//console.warn('handleCancelRestartPuzzle();');
			//document.removeEventListener('mousedown', this.handleCancelRestartPuzzle);
			var btnRestart = document.querySelector('button.confirm-restart');
			if(btnRestart) {
				btnRestart.classList.remove('confirm-restart');
				btnRestart.textContent = 'Restart';
			}
		};
	// Actions
		P.act = function(action) { return this.puzzle.act(action); };
		P.replayPlay = function(replay, opts) { return this.puzzle.replayPlay(replay, opts); };
		P.check = function() { return this.puzzle.check(); };
	// Cell Actions
		P.changeMode = function(mode, tempChange) {
			//console.info('App.changeMode("%s", %s);', mode, tempChange === true, this.mode, this.prevMode);
			if(tempChange && this.prevMode === undefined) this.prevMode = this.mode;
			if(mode === undefined && this.prevMode !== undefined) {
				mode = this.prevMode;
				this.prevMode = undefined;
			}
			if(mode === undefined) return;
			if(!tempChange) this.prevMode = undefined;
			document.querySelector('.controls-main').classList.remove('mode-normal', 'mode-corner', 'mode-centre', 'mode-colour');
			document.querySelector('.controls-main').classList.add('mode-' + mode);
			this.mode = mode;
		};
		P.select = function(cells) { return this.puzzle.select(cells); };
		P.deselect = function(cells) { return this.puzzle.deselect(cells); };
		P.smartSelectCell = function(cell) {
			//console.info('App.smartSelectCell(cell);', cell, this.mode);
			const makeSelector = (cell, type) => {
				if(Array.isArray(type)) return type.reduce((acc, cur) => acc || makeSelector(cell, cur), undefined); 
				var selFn, selVal;
				switch(type) {
					case 'normal': selVal = cell.value || cell.given || ''; selFn = c => (c.value || c.given) === selVal; break;
					case 'corner': selVal = cell.pencilMarks.join(''); selFn = c => c.pencilMarks.join('') === selVal; break;
					case 'centre': selVal = cell.candidates.join(''); selFn = c => c.candidates.join('') === selVal; break;
					case 'colour': selVal = cell.colour || ''; selFn = c => c.colour === selVal; break;
				}
				return (selVal !== '') ? selFn : undefined;
			};
			var cells = [], selector;
			switch(this.mode) {
				case 'normal': selector = makeSelector(cell, ['normal', 'colour', 'centre', 'corner']); break;
				case 'corner': selector = makeSelector(cell, ['normal', 'corner', 'centre', 'colour']); break;
				case 'centre': selector = makeSelector(cell, ['normal', 'centre', 'corner', 'colour']); break;
				case 'colour': selector = makeSelector(cell, ['colour', 'normal', 'centre', 'corner']); break;
			}
			if(selector !== undefined) cells = this.grid.getCellList().filter(selector);
			if(cells.length > 0) {
				this.deselect();
				this.select(cells);
			}
		};
	// Test Dot Puzzle
		P._testDotStart = function(event) {
			var cell = this.dragCell = this.grid.elemToCell(event.target);
			var svg = document.querySelector('svg#overlay'), svgNS = svg.namespaceURI;
			var part = this.dragLine = document.createElementNS(svgNS, 'path');
			var attr = {
				'fill': 'none',
				'stroke': '#666666',
				'stroke-width': 10,
				'd': [[cell.row + 0, cell.col + 0], [cell.row + 0, cell.col + 0]].map(([r, c], idx) => `${idx === 0 ? 'M' : 'L'}${64 * c} ${64 * r}`).join(' ')
			};	
			Object.keys(attr).forEach(key => part.setAttribute(key, attr[key]));
			svg.appendChild(part);
		};
		P._testDotEnd = function(event) {
			if(this.dragLine) {
				this.dragLine = undefined;
			}
		};
		P._testDotMove = function(event) {
			if(this.dragLine) {
				var cell = this.grid.elemToCell(event.target);
				this.dragLine.setAttribute('d', [
					[this.dragCell.row + 0, this.dragCell.col + 0],
					[cell.row + 0, cell.col + 0]
				].map(([r, c], idx) => `${idx === 0 ? 'M' : 'L'}${64 * c} ${64 * r}`).join(' '));
			}
		};
	// Event Handlers
		P.attachHandlers = function() {
			window.addEventListener('focus', event => console.warn('window.on(focus)'), {useCapture: true});
			
				//document.querySelector('.grid').addEventListener('
			// input
				document.addEventListener('mousedown', this.handleInputdown, {passive: false});
				document.addEventListener('touchstart', this.handleInputdown, {passive: false});
				document.addEventListener('mouseup', this.handleInputup, {passive: false});
				document.addEventListener('touchend', this.handleInputup, {passive: false});
				document.addEventListener('touchmove', this.handleInputmove, {passive: false});
				document.addEventListener('mousemove', this.handleInputmove, {passive: false});
			// Keys
				document.addEventListener('keydown', this.handleKeydown, {useCapture: true});
				document.addEventListener('keyup', this.handleKeyup, {useCapture: true});
			// Outside
				window.addEventListener('blur', this.handleCancel);
				document.addEventListener('touchcancel', this.handleCancel);
			// Buttons
				document.querySelectorAll('button')
					.forEach(btn => {
						btn.addEventListener('keydown', this.handleButton);
						btn.addEventListener('click', this.handleButton);
					});
		};
		P.getEventTarget = function(event) {
			//console.info('App.getEventTarget(event);');
			var point = (event.touches && event.touches[0]) || event;
			return document.elementFromPoint(point.clientX, point.clientY);
		};
		P.handleInputTimeout = function() {
			//console.info('App.handleInputTimeout();', this.currentInput);
			this.currentInput = 'none';
		};
		P.checkInput = function(event) {
			var eventType = event.type.replace(/^(mouse|touch|pointer).*/, '$1');
			var proceed = (this.currentInput === 'none' || this.currentInput === eventType);
			//console.info('  checkInput "%s": %s -> %s = %s', event.type, this.currentInput, eventType, proceed);
			clearTimeout(this.currentInputTimeoutId);
			this.currentInputTimeoutId = setTimeout(this.handleInputTimeout, App.CurrentInputTimeoutMs);
			if(proceed && this.currentInput !== eventType) this.currentInput = eventType;
			return proceed;
		};
		P.didInputMove = function() {
			var prevPos = this.specialInputPos, inputPos = this.inputPos;
			this.specialInputPos = inputPos;
			return !(prevPos && App.DoubleInputDistance > App.distance(prevPos, inputPos));
		};
		P.handleInputdown = function(event) {
			if(!this.checkInput(event)) return;
			//console.info('App.handleInputdown(event);', event.type, this.currentInput, this.waitingForDoubleInput);
			var {clientX: x, clientY: y} = (event.touches && event.touches[0]) || event;
			this.inputPos = {x, y};
			clearTimeout(this.longInputTimoutId);
			clearTimeout(this.doubleInputTimoutId);
			if(this.waitingForDoubleInput && !this.didInputMove()) {
				this.waitingForDoubleInput = false;
				this.handleSpecialInput(event);
				return;
			}
			var {clientX: x, clientY: y} = (event.touches && event.touches[0]) || event;
			this.specialInputPos = this.inputPos;
			this.waitingForDoubleInput = true;
			this.doubleInputTimoutId = setTimeout(() => this.waitingForDoubleInput = false, App.DoubleInputTimeout);
			this.longInputTimoutId = setTimeout(() => {
				if(!this.didInputMove()) this.handleSpecialInput(event);
			}, App.LongInputTimeout);
			this.handleDragStart(event);
		};
		P.handleInputup = function(event) {
			if(!this.checkInput(event)) return;
			//console.info('App.handleInputup(event);', event.type, this.currentInput);
			clearTimeout(this.longInputTimoutId);
			this.handleDragEnd(event);
		};
		P.handleInputmove = function(event) {
			if(!this.checkInput(event)) return;
			//console.info('App.handleInputmove(event);', event.type, this.currentInput);
			var {clientX: x, clientY: y} = (event.touches && event.touches[0]) || event;
			this.inputPos = {x, y};
			this.handleDragMove(event);
		};
		P.handleSpecialInput = function(event) { // double or long input
			//console.warn('App.handleSpecialInput(event);', event);
			if(event.target.classList.contains('cell')) {
				var cell = this.grid.elemToCell(event.target);
				if(cell) this.smartSelectCell(cell);
			}
		};
		
		P.handleCancel = function(event) {
			//console.info('App.handleCancel:', event.type, event, event.target);
			if(this.isDragging === false) this.deselect();
		};
		P.handleDragStart = function(event) {
			if(event.target.nodeName === 'BUTTON') return;
			//console.info('App.handleDragStart(event);');
			this.isDragging = true;
			this.handleCancelRestartPuzzle();
			if(!event.target.classList.contains('cell')) {
				//this.act({type: 'deselect'});
				return this.deselect();
			}
			this.highlighting = true;
			if(!event.ctrlKey && event.target.nodeName !== 'BUTTON') this.deselect();
			var cell = this.grid.elemToCell(event.target);
			if(cell) {
				if(event.ctrlKey && cell.hasState('highlight')) this.highlighting = false;
				//cell.highlight(this.highlighting);
				if(this.highlighting) {
					this.select(cell);
				}
				else {
					this.deselect(cell);
				}
			}
		};
		P.handleDragEnd = function(event) {
			//console.info('App.handleDragEnd(event);');
			this.isDragging = false;
			if(this.highlighting !== undefined) {
				var nextHighlightedCells = this.grid.getCellList().filter(cell => cell.hasState('highlight'));
				//this.act({type: 'select', arg: nextHighlightedCells});
				this.highlighting = undefined;
			}
			//event.preventDefault();
		};
		P.handleDragMove = function(event) {
			if(this.isDragging !== true) return;
			//console.info('App.handleDragMove(event);', this.highlighting);
			var eventTarget = this.getEventTarget(event);
			if(this.highlighting !== undefined) {
				var cell = this.grid.elemToCell(eventTarget);
				if(cell) {
					//cell.highlight(this.highlighting);
					this.select(cell);
				}
			}
		};
		P.doPressDigit = function(digit) {
			//console.log('App.doPressDigit(%s); mode: %s', digit, this.mode);
			if(this.mode === 'colour' && digit === '1') {
				//console.log('Pressed colour 1!');
				this.act({type: 'clear', arg: this.mode});
			}
			else {
				this.act({type: App.ModeToAction[this.mode], arg: digit});
			}
		};
		P.handleKeydown = function(event) {
			//console.info('App.handleKeydown:', event.type, event, event.target);
			if(event.repeat) return;
			if(App.reDigit.test(event.code)) {
				this.doPressDigit(event.code.replace(App.reDigit, '$1'));
				if(event.ctrlKey) event.preventDefault();
			}
			else if((event.key === 'Control' && event.shiftKey) || (event.key === 'Shift' && event.ctrlKey)) {
				this.changeMode('colour', true);
			}
			else if(event.key === 'Control') {
				this.changeMode('centre', true);
			}
			else if(event.key === 'Shift') {
				this.changeMode('corner', true);
			}
			else if(event.key === 'Escape') {
				this.deselect();
				this.act({type: 'deselect'});
			}
			else if(event.code === 'Space') {
				var modes = App.Modes;
				var mode = this.prevMode || this.mode;
				var nextMode = modes[(modes.indexOf(mode) + (event.shiftKey ? 3 : 1)) % modes.length];
				this.changeMode(nextMode);
			}
			else if(['Backspace', 'Delete'].includes(event.key)) {
				this.act({type: 'clear', arg: this.mode});
			}
			else if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
				var selectedCells = this.puzzle.selectedCells;
				if(selectedCells.length > 0) {
					var selectCell = selectedCells[selectedCells.length - 1];
					var {row, col} = selectCell;
					var cols = this.grid.cells.length, rows = this.grid.cells[row].length;
					switch(event.key) {
						case 'ArrowLeft': col = (col + cols - 1) % cols; break;
						case 'ArrowRight': col = (col + cols + 1) % cols; break;
						case 'ArrowUp': row = (row + rows - 1) % rows; break;
						case 'ArrowDown': row = (row + rows + 1) % rows; break;
					}
					selectCell = this.grid.getCell(row, col);
					if(!event.ctrlKey) this.deselect();
					this.select(selectCell);
				}
			}
			else if(event.code === 'KeyZ' && event.ctrlKey) {
				this.act({type: 'undo'});
			}
			else if(event.code === 'KeyY' && event.ctrlKey) {
				this.act({type: 'redo'});
			}
			else {
				console.log('Unhandled keydown event: key, code, ctrl, alt, shift, meta:', event.key, event.code, event.ctrlKey, event.altKey, event.shiftKey, event.metaKey);
			}			
		};
		P.handleKeyup = function(event) { // Cancel temp mode
			//console.info('App.handleKeyup:', event.type, event, event.target);
			if(event.key === 'Control' || event.key === 'Shift') {
				this.changeMode();
			}
		};
		P.handleButton = function(event) {
			//console.warn('App.handleButton:', event.type, event, event.code, this);
			if(event.repeat) return;
			if(event.type === 'keydown' && event.code !== 'Enter') return;
			event.stopPropagation();
			var control = event.target.dataset['control'];
			if(control.match(/[0-9]/)) {
				this.doPressDigit(control);
			}
			else if(control.match(/^(normal|corner|centre|colour)$/)) {
				this.changeMode(control);
			}
			switch(control) {
				case 'delete': this.act({type: 'clear', arg: this.mode}); break;
				case 'undo': this.act({type: 'undo'}); break;
				case 'redo': this.act({type: 'redo'}); break;
				case 'restart':
					var btnRestart = event.target;
					if(btnRestart.classList.contains('confirm-restart')) {
						this.handleCancelRestartPuzzle();
						this.restartPuzzle();
					}
					else {
						btnRestart.classList.add('confirm-restart');
						btnRestart.textContent = 'Confirm?';
					}
					break;
				case 'check': this.check(); break;
				case 'import': 
					this.loadRemoteCTCPuzzle(document.querySelector('input[data-control="puzzleid"]').value);
					break;
				case 'savereplay':
					this.savedReplay = JSON.stringify({puzzleId: this.puzzleId, actions: this.replayStack.join(',')});
					console.log('savedReplay:', this.savedReplay);
					break;
				case 'replayplay': this.replayPlay(JSON.parse(this.savedReplay)); break;
				case 'replayff': this.replayPlay(JSON.parse(this.savedReplay), {maxDelay: 0, speed: -1}); break;
				case 'replaystop': this.replayStop(); break;
				case 'testdot': this.testDotPuzzle(); break;
			}
			//console.log(event.target.dataset['data-control']
		};
	return App;
})();

document.addEventListener('DOMContentLoaded', () => {
	//document.head.querySelector('link[rel="shortcut icon"]').setAttribute('href', 'https://app.crackingthecryptic.com/favicon.ico');
	var headIcon = document.head.querySelector('link[rel="shortcut icon"]');
	if(headIcon) headIcon.setAttribute('href', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAMAAABEpIrGAAABXFBMVEX////aGk0daJs8fakaZpnhOmfcIVRFg67+/f5nmLvjRG7cI1XbHlDnaovkRnAuc6LhPGjdJ1g0d6Ynb6DgNmP7/P3++vvw9fj3zdhUjrQ5e6gjbZ4gap3qfZrfMmD2+fv+9vj98/XM3emxy92Ut9DztMTwnbNEgq1AgKswdaQqcqHob4/iQWveLl3n7/T87/Pj7PPd6PD75+zC1uS40OD40tyiwdWZutKCrMh/qcd8qMZtnr/xo7ddkrdOiLBIhrChh6iqep7mZYflVXviT3fiS3Tq8PX64uj63+bF2Oanxdn2yNT2xNGHpMHzrsBwn8Dyrb95lribl7Xuk6zukartj6jMiaZFeqaEgKVifKXuiaNveKHNgaBHc6B7dp5Sb53peZbnd5aOa5ReZJLcb5HpcJCiZ4+yZo2eYYukXojcYIW1WIHLWIC9T3rRR3LVQm3lPmrSPGnTM2LXMF5v7Cm9AAABh0lEQVQ4y72S51PCQBDFs5dLciQxjQBSBRGRZu+CdHvvvfde/v8ZwUkAB/KNcb/97r3budt9VJtrvpOQkUFrfUPQ9zI4tmhp8EPOi73uKSvdWYDzqAfHpxzNWihEkRUeUsfYzsmYGyGUa65R7y3rkQIIUkDI0zjGeZFtXLOHGwxKQBIgqYC6HezqsWO6D2E5467rRAHQeVG8Ha5S/zrycWfvpbzT1IfcXyqvQqnTPOiexa8sA+Uxg6ezTzroa6Te0hF+YRmRTRg4g0+fH1f/fquDZRRp1wDXJKKRrdlwNFBDupWBr8E/GBxLWiuDkDYn1UPLTYbLh6tv8Btgi/todGjO0ZxlfFO6MGhUwzS6FhPDptw/U9mGZ/+jdsd1EJXvFFB3glUy9xkN1TvyN5/VNAATISTswVolEZzMNQZGFPwSpCQVilvoN1MTWt9k46PGFihnOgVMJRT3Hhwbd1CDQ83BHEiwYpJ5Q26XZeyLAqgnaJqyqkgAkrmsb4KyrOXeYNdoN6HaWj9O3CwsngKXCwAAAABJRU5ErkJggg==');
	var app = window.app = new App({});
	// Plain: https://cracking-the-cryptic.web.app/sudoku/FLFpq4pMH3
	var plainPuzzle = {
		givens: 'r1c5: 1, r1c9: 8, r2c5: 2, r3c6: 3, r4c1: 9, r4c7: 4, r5c2: 8, r5c8: 5, r6c3: 7, r6c9: 6, r7c4: 6, r8c5: 5, r9c1: 3, r9c5: 4'.split(/\s*,\s*/),
		cages: [
			{cells: 'r1c1-r3c3', style: 'box', sum: 45},
		],
	};
	// Killer-webapp:https://cracking-the-cryptic.web.app/sudoku/hHRgM7R8h7
	// Killer-data: https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/hHRgM7R8h7?alt=media
	var killerPuzzle = {
		givens: 'r1c5: 5, r5c1: 8, r5c9: 9, r9c5: 6'.split(/\s*,\s*/),
		cages: [
			{cells: 'r1c1-r3c3', style: 'box', sum: 45}, {cells: 'r1c4-r3c6', style: 'box', sum: 45}, {cells: 'r1c7-r3c9', style: 'box', sum: 45},
			{cells: 'r4c1-r6c3', style: 'box', sum: 45}, {cells: 'r4c4-r6c6', style: 'box', sum: 45}, {cells: 'r4c7-r6c9', style: 'box', sum: 45},
			{cells: 'r7c1-r9c3', style: 'box', sum: 45}, {cells: 'r7c4-r9c6', style: 'box', sum: 45}, {cells: 'r7c7-r9c9', style: 'box', sum: 45},
			{cells: 'r1c1-r4c1,r1c2', style: 'killer', sum: 20, cageValue: 'r1c1: 20'},
			{cells: 'r1c3-r1c4', style: 'killer', sum: 14, cageValue: 'r1c3: 14'},
			{cells: 'r1c6-r1c7', style: 'killer', sum: 10, cageValue: 'r1c6: 10'},
			{cells: 'r1c8,r1c9-r4c9', style: 'killer', sum: 20, cageValue: 'r1c8: 20'},
			{cells: 'r2c2-r3c2', style: 'killer', sum: 11, cageValue: 'r2c2: 11'},
			{cells: 'r2c3-r2c7', style: 'killer', sum: 21, cageValue: 'r2c3: 21'},
			{cells: 'r2c8-r3c8', style: 'killer', sum: 13, cageValue: 'r2c8: 13'},
			{cells: 'r3c3-r3c4,r4c4', style: 'killer', sum: 10, cageValue: 'r3c3: 20'},
			{cells: 'r3c5-r4c5', style: 'killer', sum: 12, cageValue: 'r3c5: 12'},
			{cells: 'r3c6-r3c7,r4c6', style: 'killer', sum: 12, cageValue: 'r3c6: 12'},
			{cells: 'r4c2-r6c2,r4c3,r6c3', style: 'killer', sum: 27, cageValue: 'r4c2: 27'},
			{cells: 'r4c8-r6c8,r4c7,r6c7', style: 'killer', sum: 27, cageValue: 'r4c6: 27'},
			{cells: 'r5c3-r5c4', style: 'killer', sum: 9, cageValue: 'r5c3: 9'},
			{cells: 'r5c6-r5c7', style: 'killer', sum: 10, cageValue: 'r5c6: 10'},
			{cells: 'r6c1-r9c1,r9c2', style: 'killer', sum: 20, cageValue: 'r6c1: 20'},
			{cells: 'r6c4-r7c4,r7c3', style: 'killer', sum: 8, cageValue: 'r6c4: 8'},
			{cells: 'r6c5-r7c5', style: 'killer', sum: 16, cageValue: 'r6c5: 16'},
			{cells: 'r6c6-r7c6,r7c7', style: 'killer', sum: 14, cageValue: 'r6c6: 14'},
			{cells: 'r6c9-r9c9,r9c8', style: 'killer', sum: 19, cageValue: 'r6c9: 19'},
			{cells: 'r7c2-r8c2', style: 'killer', sum: 11, cageValue: 'r7c2: 11'},
			{cells: 'r7c8-r8c8', style: 'killer', sum: 13, cageValue: 'r7c8: 13'},
			{cells: 'r8c3-r8c7', style: 'killer', sum: 23, cageValue: 'r8c3: 23'},
			{cells: 'r9c3-r9c4', style: 'killer', sum: 13, cageValue: 'r9c3: 13'},
			{cells: 'r9c6-r9c7', style: 'killer', sum: 13, cageValue: 'r9c7: 13'},
		],
	};
	app.loadPuzzle({givens: [], cages: [
		{cells: 'r1c1-r3c3', style: 'box', sum: 45}, {cells: 'r1c4-r3c6', style: 'box', sum: 45}, {cells: 'r1c7-r3c9', style: 'box', sum: 45},
		{cells: 'r4c1-r6c3', style: 'box', sum: 45}, {cells: 'r4c4-r6c6', style: 'box', sum: 45}, {cells: 'r4c7-r6c9', style: 'box', sum: 45},
		{cells: 'r7c1-r9c3', style: 'box', sum: 45}, {cells: 'r7c4-r9c6', style: 'box', sum: 45}, {cells: 'r7c7-r9c9', style: 'box', sum: 45},
	]});
		
	// Plain Sudoku: 73FN293dR8
	// Killer: hHRgM7R8h7
			
	var testPuzzles = {
		'PdRDmtPdqg': {
			ctcId: 'PdRDmtPdqg',
			name: 'Test',
			setter: 'Simon Anthony',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/PdRDmtPdqg',
			newUrl: 'https://ctc.svenneumann.com/sudoku/PdRDmtPdqg',
			notes: 'Mixed features for testing'
		},
		'TmMBJj8jbr': {
			ctcId: 'TmMBJj8jbr',
			name: 'C.T.C.',
			setter: 'Prasanna Seshadri',
			videoId: '0JMmSxhyfIo',
			videoUrl: 'https://www.youtube.com/watch?v=0JMmSxhyfIo',
			videoHost: 'Simon',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/TmMBJj8jbr',
			newUrl: 'https://ctc.svenneumann.com/sudoku/TmMBJj8jbr',
			notes: '14 rules'
		},
		'2JPFBJQTJ4': {
			ctcId: '2JPFBJQTJ4',
			name: 'An 18th Birthday Special!',
			setter: 'Johtaja',
			videoId: 'Ss5cS37XfNs',
			videoUrl: 'https://www.youtube.com/watch?v=Ss5cS37XfNs',
			videoHost: 'Simon',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/2JPFBJQTJ4',
			newUrl: 'https://ctc.svenneumann.com/sudoku/2JPFBJQTJ4',
			notes: '',
			description: 'Normal sudoku rules apply. On thermometers, digits increase from the bulb to the end(s). Clues outside the grid show the sums of diagonals indicated by arrows. The digits in the cage sum to 18.',
		},
		'jpQPjrm7H4': {
			ctcId: 'jpQPjrm7H4',
			name: 'Summer of 78',
			setter: 'Axel Abrahamsson (Dubax)',
			videoId: 'EfGpQtqA-90',
			videoUrl: 'https://www.youtube.com/watch?v=EfGpQtqA-90',
			videoHost: 'Simon',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/jpQPjrm7H4',
			newUrl: 'https://ctc.svenneumann.com/sudoku/jpQPjrm7H4',
			notes: '',
			description: 'Normal sudoku rules apply. In addition both marked diagonals must contain the digits 1 to 9. Clues outside the grid indicate the sum of cells sandwiched between the 1 and 9 in the relevant column/row.',
		},
		'BjDnndmJF7': {
			ctcId: 'BjDnndmJF7',
			name: 'Pick The Right 5',
			setter: 'Kurt Hugo Schneider',
			videoId: 'kxcFKeyER0o',
			videoUrl: 'https://www.youtube.com/watch?v=kxcFKeyER0o',
			videoHost: 'Simon',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/BjDnndmJF7',
			newUrl: 'https://ctc.svenneumann.com/sudoku/BjDnndmJF7',
			notes: '',
			description: 'Normal sudoku rules apply. In addition both marked diagonals must contain the digits 1 to 9. Clues outside the grid indicate the sum of cells sandwiched between the 1 and 9 in the relevant column/row.',
		},
		'jgDtbQDnpm': {
			ctcId: 'jgDtbQDnpm',
			name: 'Little Killer',
			setter: 'Bastien Vial-Jaime',
			videoId: 'to6f4D33h78',
			videoUrl: 'https://www.youtube.com/watch?v=to6f4D33h78',
			videoHost: 'Simon',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/jgDtbQDnpm',
			newUrl: 'https://ctc.svenneumann.com/sudoku/jgDtbQDnpm',
			notes: '',
			description: 'Normal sudoku rules apply. Clues outside the grid give the sum of all the digits in the direction of the arrow. (Numbers may repeat in these sums).',
		},
		'HPqJQH822F': {
			ctcId: 'HPqJQH822F',
			name: 'Killer Sudoku',
			setter: 'Christoph Seeliger',
			source: 'World Sudoku Championship 2019',
			videoId: 'dTk5XLu05So',
			videoUrl: 'https://www.youtube.com/watch?v=dTk5XLu05So',
			videoHost: 'Simon',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/HPqJQH822F',
			newUrl: 'https://ctc.svenneumann.com/sudoku/HPqJQH822F',
			notes: '',
			description: 'Normal sudoku rules apply. In addition, cells within cages must sum to the small number given in the top left cell of each cage. Numbers may NOT repeat within cages.',
		},
		'TPHt967Npg': {
			ctcId: 'TPHt967Npg',
			name: 'Odd/Even Sudoku',
			setter: 'Ashish Kumar',
			videoId: 'pzVy93NhOzY',
			videoUrl: 'https://www.youtube.com/watch?v=pzVy93NhOzY',
			videoHost: 'Simon',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/TPHt967Npg',
			newUrl: 'https://ctc.svenneumann.com/sudoku/TPHt967Npg',
			notes: '',
			description: 'Puzzle 1: Grey circles can bonly be EVEN digits.\nPuzzle 2: Grey circles can only be ODD digits.\n!!!!!!!!!',
		},
		'FRgj24r4N9': {
			ctcId: 'FRgj24r4N9',
			name: 'Poisoned Bagel',
			setter: 'Bismuth',
			videoId: 'xRoCWkm_8KE',
			videoUrl: 'https://www.youtube.com/watch?v=xRoCWkm_8KE',
			videoHost: 'Simon',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/FRgj24r4N9',
			newUrl: 'https://ctc.svenneumann.com/sudoku/FRgj24r4N9',
			notes: '',
			description: 'Normal sudoku rules apply. The circles in the grid are the centers of rotationally symmetric "galaxies". Every cell in the grid is part of a galaxy. Digits may not repeat in a galaxy. The number by each circle represents the sum of the digits in that galaxy. Galaxies treat the grid as a torus, that is, rows 1 and 9 are adjacent, and columns 1 and 9 are adjacent.',
			replay: '',
		},
		'fRftpGmpdT': {
			ctcId: 'fRftpGmpdT',
			appUrl: 'https://cracking-the-cryptic.web.app/sudoku/fRftpGmpdT',
			newUrl: 'https://ctc.svenneumann.com/sudoku/fRftpGmpdT',
			replay: 'HL1fT115CO7T34HL48T16CO7T1HLT8HL494a4bT58HL494aT46HLT249HL494aT87CO4T13HLT7HL16T125HL1628T9CO4T7HL31T11HL1eT23CO4T7HL20T8CO4T1HL21T8CO4T3HL1dT10CO4T3HL35T15HL30T111CO4T11HL32T7CO4T1HL50T10CO4T4HL04T10CO4T1HL21T7HL232c35T125CO4T11HL3eT10HL47T16HLT17HL3e47T22HL47T5HL3eT8HL47T22HLT15HL47T50HLT32HL08T40CO4T4HLT10HL11T23HL08T16HL11T21CO7T20HL1aT20CO4T3HL3eT16CO4T0HL47T9CO7T2HL08T27VL2T2HL11T13HL1147T13CD1T9CD9T8HLT26HL10T41CO4T17HL19T12HL0fT11HL0607080f1011T78CLT6CLT3CLT3HL47T16CLT8CLT3CLT3HL3eT24CO7T10HL08T21CO7T3HL11T8CO4T14HL47T8CO4T0VL2T15HL35T10HL3eT8CD1T3CD9T15HL08T9CD1T9CD9T4HL46T22HL3dT31CO4T38HL3cT12CO4T2HL3bT11CO4T7HL34T11HL07T16CO4T4HL06T4CO4T1HL18T14HL05T26CO4T6HL17T10HL21T43HL3bT159HL43T42HL4cT14HL464fT105CO4T27HL34T10HL2bT21HL1019T36HL2bT27HL3dT20HL1922T18HL10T9CO4T3HL2bT7HL1922T16HL28T182HL363fT42HL36T4HL242d363fT31CO4T113HL37T9HL4b4cT37CO4T3HLT11HL0001T130CO4T4HL0009T41CO4T1HL1dT7HL31T96HL26T83HL0aT86HL0bT17HL0cT14HL16T24HL3aT163HL44T9HL4eT15HL3a43T46CO4T6HL4dT9HL21T21HL33T207HL34T10HL3cT41HL26T855HL272829T484CO4T195HL32T10HL31T17CO7T37VL9T27HL3bT9HL30T50HL2fT56CO4T18HL33T8CO4T2HL3cT7HL46T94HL28T78VL4T18HL3bT10HL0dT30CO4T3HL17T9HLT275HL2fT44HL38T47HL41T41HL1d1eT179HL40T359CO4T19HL4bT8HL2aT165HL262aT16HL4dT41HL0f18212aT366HL21T11HL2aT14HL262aT12CO4T4HL3cT12HL46T23HL2bT86CO7T13HL25T14CO7T1HL2bT23HL252bT24CD1T14CD9T4HL2627T29HL2627292aT13CD2T23CD3T2CD5T21CD6T2HL24T32HL242cT12CD7T17CD8T1HL3dT98HL46T42HL3637T81HL37T7CO4T5HL0a13T17CO4T3HL19T7CO4T3HL2cT14HL1cT168HL25T16HL1bT9CO4T5HL2eT8HL12T9CO9T17CO7T31VL9T18HL25T9HL13141516T267HL000104050607090a0d10111316191a1b1d1e20212324262728292a2c2d2f3032333536373a3b3c3d3f40434647494a4b4c4f50T154HL18191aT34HL23T4HL18T24HL21T21CO4T0HL18T14CO4T22HL22T11HL19T13HL1314T59HL15T30HL16T20HL1415T15CO4T4HL17T10CO9T21CO7T32VL1T37HL29T10HL0eT28CO4T76HL29T9HL44T47HL2fT173HL020bT51HL0bT6HL0fT12CO6T33HL21T11HL0fT33CO7T31HL18T9HL0fT17HL0b0cT21HL0cT5HL0fT9CD1T45CD9T6HL22T24HL0fT9HL2bT24HL18T13HL0fT7HL454eT119HL4eT7HL454eT41HL4eT21HL45T13HL4eT7HL45T15HL13141516T239HL18191aT24HL13141516T139CD1T21CD2T1CD3T2CD4T6CD4T35CD4T20CD4T7CD2T6CD3T4CD1T13CD2T8CD3T5CD4T6CD5T8CD2T82CD6T163CD2T156CD4T0CD5T4CD6T4CD2T20CD3T7HL0fT45HL4aT615HL42T43HL41T14HL03T22HL02T8HL41T16HL02T14HL41T14HL38T36HL41T22HL0241T17HL31T89HL3bT31HL222b34T641HL1c252eT16HL222b34T16HL3dT111HL424344T1203CO4T30HL4cT12HL45T20CO7T19HL41T7CO7T6VL9T36HL45T11VL1T2HL3eT17VL9T10HL08T16VL1T1HL0fT12VL9T1HL39T79VL1T5HL03T37VL9T1HL0bT26VL1T29CO7T101HL02T10CO4T5HL03T15CO7T1CO4T6HL0cT3CO4T12HL03T6CO7T1HL39T16CO7T5HL38T8CO4T2HL4eT21CO7T8CO4T11HL4dT11CO7T34VL9T36HL4eT37HL4bT49HL424344T33CD3T209CD4T4CD5T5CD3T61CD4T1CD5T2CD4T9CD5T4CD6T5CD4T50CD5T2CD6T2CD5T8CD6T3CD7T4HL46T185HL3f4046T23CD3T18CD4T9CD8T32HL39T28HL43T13HL46T15CD3T27HL3f40T20PM3T4HL4aT5HL43T19HL44T18CD7T17HL4fT97HL4eT162HL4e4fT8CD6T180CD4T5HL46T31VL8T10HL3f40T21CD8T17PM3T21HL3c3dT106CD5T51CD7T0HL46T30HL42T132HL44T11HL43T12HL3a3bT167CD2T134CD6T1HL424344T375HL3a3bT326HL3a3b3c3dT131CLT4HL45T76HL46T16CLT30CLT32HL3f40T10CLT3HL3f4046T20CD3T20CD4T1CD8T8HL4fT27HL46T5CD3T4HL4e4fT12HLT257HL4e4fT22HLT527HL0c0d0eT279CD3T63CD4T8CD5T6CD3T112CD6T42CD6T32CD3T11CD4T33CD6T82HL424344T261HL0c0d0eT180HL141516T92CD3T68CD3T30CD3T39CD3T18CD3T14CD4T40CD7T49CLT36HL0c0dT18HL0c0d0eT17HL141516T39CD4T23CD5T2CD4T43CD5T4HL0c0d0eT52CLT5PM3T21HL424344T29CLT3CD7T294CD6T1CD5T32CLT1975CD8T32HL42T57CD8T17HL424344T13CD3T85CD7T1CD4T17CD6T2HL4dT28HL44T5CD7T21HL43T30CD4T20HL4cT17HL46T60CLT10HL3f40T10CLT5HL3f4046T31CD7T687HL2d2e2fT297CD7T24CD7T17CD7T15CD2T131CD6T4HL38T20HL2fT12CLT23HL2eT4CLT4HL2dT2CLT2HL36T7HL3fT4HL48T3HL3fT7CLT5HL40T3CLT3HL41T2HL42T3HL43T3HL44T3HL45T2HL46T3CLT9HL4e4fT91CLT3CD4T200CD6T1HL3c3d46T41CD5T34CD7T12CD8T1HL46T47HL3f40T188HL46T116CD8T15HL3fT17HL3f40T11CD2T234CD2T19CD3T20CD5T6CD3T205CD7T2CD3T19CD4T128CD6T1HL2fT431HL3f40T12HL4aT9HL3f40T16CLT3HL49T10HL4eT78HL4e4fT21HL424344T45HL4b4cT13HL4e4fT14HL494aT14HL363738T38HL4bT14HL3a3bT301CD2T220CD3T2CD4T358HL3c3dT644PM8T88HL3cT44HL3dT7HL3cT6HL3a3bT38HL3c3dT166HL3aT386HL3a3bT14HL00010204050607090a0c0d0e10111314151618191a1b1d1e20212324262728292a2c2d2f303233353637383a3b3c3d3f404243444647494a4b4c4e4f50T27HL3dT16HL3a3bT107PM3T19HL424344T23CD3T6HL42T190HL4243T200CD7T46HL44T84HL3f40T22CD3T55CD5T60CD7T21HL3c3dT126HL46T9HL3cT11HL3dT6HL46T11HL3c3dT16HL424344T29HL494aT13PM8T24HL4b4cT47HL494a4b4cT86CD2T28CD3T7CD3T11CD5T20CD7T14CD8T1HL4b4cT81CD8T18PM7T439HL494aT24CD7T17HLT17HL4cT153HL4bT69HL494a4bT83HL4aT317HL4bT35HL4cT17CD2T40HLT18HL494a4bT19HL4cT9HL4bT550HL3aT12CD2T6HL44T12HL3bT8HL3b4bT13PM2T11HL4dT18HL3a3bT39HL3f40T25PM3T5HL4bT14HL3a3bT11HL494aT148HL363738T32HL35T565HL45T150HL0f45T13HL06T41CD7T44CD5T28HL02T44CD3T74CD6T28HL4aT61CD2T6HL4bT80HL49T10HL4aT43HL0009T123HL16T224HL0001T223CD3T125CD5T2CD5T14CD4T6CD7T125CD6T7CD7T34CD6T2CD6T72CD7T12CD6T301CD7T2CD6T885HL000102T151PM6T46HL05T115HL0507T10CD5T128CD7T28CD8T1HL19T149HL05T28CD7T18HL0607T10PM7T17HL35T129HL232c35T19HL232cT13PM7T3HL1aT14HL06T34HL0c0d0eT530CD3T250CD4T1CD7T15CD5T46CD6T8HL17T35HL0dT7CD4T11HL0eT15CD7T4HL090aT163HL090a1011T13CD2T30CD8T84CLT60HL13141516T348HL18191aT147CD8T287CD4T8CD5T2HL23T1576HL1aT11HL19T21HL07T6CD8T23HL05T41VL8T14HL44T48CD8T7HL43T17VL8T14HL3bT218HL3aT17VL3T12HL3bT5VL2T2HL4bT43CD2T5PM2T8HL49T32VL2T23HL4b4cT21HL4aT9VL8T10HL4b4cT51PM7T24HL43T31HL3bT31HL29T25CD2T12HL16T142CD5T84CD6T2CD7T6HL0dT41CD3T5PM3T9HL07T103PM7T28HL06T31PM7T4UDT54UDT3UDT5UDT3UDT5UDT6UDT4UDT3UDT4UDT4UDT3UDT3UDT3UDT4UDT4UDT5UDT4UDT6UDT6UDT4UDT5UDT4UDT4UDT6UDT10UDT9UDT8UDT4UDT4UDT5HLT2695HL18191aT303HL05T137CLT19HL0607T14UDT22UDT5UDT4UDT3UDT3UDT3UDT59UDT5UDT4UDT3UDT3UDT2UDT21HL050607T105CLT23HL000102T22CLT4HL0fT9HL1819T17HLT4HL18191aT19HL18T6HL050607T45CD8T303CD7T133CD5T105CD6T228CD6T73HL000102T104CD3T24CD4T5CD6T16HL0607T88HL18191aT375HLT244HL18191aT18CLT4HLT9HL18191aT16CD9T65CD9T10CD8T4CD7T38CD2T44CD6T242CD3T2CLT57PM8T27HL0607T25CD8T5HL05T13VL8T6HL19T16HL0607T11HL19T10HL18191aT37CD8T93CD6T222CD3T1PM8T100HL1011T16CD2T25CD4T15HL2cT87HL11T11VL4T8HL10T10VL2T4HL1aT11HL0c0d0eT111CLT2HL090aT24HL090a0c0d0eT35CD3T26CD5T7CD6T5CD7T4CD8T9HL16T36HL0c0d0eT16CD8T15HL090aT78CD3T36CD6T12HL0c0d0eT155CD7T14HL090aT81CD5T14HL0c0d0eT43HL1516T176CD4T43CD7T40HL1314T38CD2T24CD5T33HL0eT55HL16T8VL7T24HL15T6VL5T1VL4T16HL0dT80HL1aT80CD3T17HL44T254CD8T29HL43T10VL8T2HL42T28VL6T32HL44T4VL4T1HL3bT16HL3aT14VL3T6HL3bT4VL2T1HL4bT32CD2T6PM2T5HL49T20VL2T12HL4aT22VL8T52HL4b4cT23PM7T8HL4cT22VL5T19HL4bT8VL7T1HL0dT36VL6T27HL0cT13CD6T16HL0eT8CD6T3HL29T103CD2T23HL20T12CD3T26CD5T2CD6T4HL27T93CD6T41HL1eT14CD2T38CD3T19CD5T16HL31T131HL1e27T141HL0eT203VL5T18HL0cT8VL3T3HL1e27T21CD3T3HL2029T28CD5T16HL35T205HL23T7CD4T41CD4T11CD5T5CD6T10CD7T8CD8T7HL35T35CD5T23CD6T1CD8T6CD8T39HL23T23HL1d1eT239HL38T88HL41T149HL3a3bT38HL3c3dT41CD5T105PM8T18HL46T13VL5T23HL3f40T21CD5T24PM2T3PM2T21PM3T5HL4fT37HL07T26VL7T11HL06T7VL5T6HL3dT22VL8T4HL3cT7VL7T2HL19T35CD8T19HL363738T34CD4T29CD5T1CD6T16HL4aT45HL38T21HL28T543HL35T162HL34T9HL2234T16CD1T51CD3T39CD4T13CD6T51CD8T24CD8T11CD9T37HL3dT39HL34T6CD9T23HL22T9CD1T8HL3dT35HL22T23CLT107HL34T5CLT2HL33T12HL4eT238VL6T17HL4fT6VL4T2HL18T95CD6T21HL2aT8CD6T2HL4aT41HL02T42VL3T19HL0001T18CD3T5HL2fT17HL26T7CD3T7HL2fT12HL34T261HL2234T10CD1T20CD9T35CD3T44CD6T1HL22T36CD1T7HL34T8CD9T15HL23T11HL09T377HL00T9VL4T19HL09T10VL7T4HL0aT8VL8T7HL01T9VL6T12HL37T34HL40T75HL37T5CD6T2HL3fT10VL3T35HL40T7VL7T6HL36T64CD4T23HL13T169VL5T15HL14T7VL2T2HL26T10CD2T4HL37T28VL4T5HL38T9HL41T53HL38T6CD4T15HL2fT13HL1d2fT22CD4T63CD7T1HL38T26HL2fT5VL4T3HL1dT7VL7T1HL30T12HL39T183HL23T58HL2cT10VL7T27HL23T14CD7T4PM7T7HL24T38VL8T9HL2dT24HL1b2dT10CD2T28CD5T46CD6T1HL38T45HL36T64HL3fT8HL243fT29HL42T88HL2eT48HL1c2eT9CD3T54CD1T19CD9T67HL37T25HL2eT6CD9T22HL1cT6CD1T10HL2eT17HL1cT16HL2eT8HL1cT7HL2eT7HL1cT6HL2eT8HL33T574HL2133T11CD2T27CD3T3CD4T7CD5T22CD5T7CD8T35HL33T60CD4T22CD8T23HL2aT18HL33T39HL3233T423HL2eT59VL1T18HL34T20CD1T5HL19T9HL22T7HL25T51VL9T5HL1cT17VL3T73HL22T17HL2bT16VL1T17HL22T7VL9T14HL34T37CO4T15HL22T13CO7T4HL2eT15CO7T1HL1cT9CO4T2HL34T36HL46T11HL34T13HL22T9HL2021T96HL20T51VL6T19HL21T6VL4T2HL29T28VL3T17HL2aT26CD3T11HL26T32VL6T12HL1bT50CD6T19HL23T11CD6T3HL34T308HL38T310VL5T17HL36T8VL6T2HL2dT16CD6T28HL3435T91PM6T67HL191aT29PM6T2HL23T39VL8T13HL1aT11VL6T17HL19T11VL3T12HL18T4VL8T14HL33T38HL2aT125VL2T2HL33T4VL3T2HL27T13VL5T16HL1eT5VL2T2HL1bT14VL5T5HL2dT9VL2T1HL34T66VL6T12HL35T15VL4T0VL3T7HLT35UDT63UDT7UDT8HL34T25UDT17UDT6UDT8HL3eT15HL34T9VL6T21HL35T6VL5T10HLT7HL1cT44HL020c191c29333a3f50T1HL0dT51HL010d1a20263436424eT2HL30T29HL050a182324303d434aT1HL32T45HL0709161d2c323c404bT1HL1fT30HL080b171f2b2e394548T1HL1eT17HL0410141e2a2d3b4749T1HL29T36HL020c191c29333a3f50T1HL28T25HL00111521282f37444fT1HL27T21HL060e131b273538464cT1HL20T30HL010d1a20263436424eT1HL32T28HL0709161d2c323c404bT1HL30T28HL050a182324303d434aT1HLT209',
			replay2: 'HL50T1659CO4T12HL4849T23CO4T3HLT12HL4a4b4cT64HL4d4e4fT35HLT12HL2fT46CO7T28HL38T10HL41T31HL30T16CO4T4HL2eT13CO4T5HL42T7HL33T57CO4T22HL3cT10HL1fT14CO7T5HL13T7CO7T13HL28T12CO4T2HL0dT6HL16T6CO4T2HL32T10HL14T21HL12T16CO7T5CO4T12HL14T8CO4T13HL27T19HL15T8HL26T70HL25T6CO4T6HL2fT11HL02T12CO4T1HL27T8HL16T146HL1415T64HL1dT7HL15T6CO7T8HL1eT10HL15T8VL9T25HL14T9UDT39UDT6UDT15UDT10UDT8HL1eT11HL31T647HL2dT15HLT30CO7T0HL2dT46CO7T11HL3132333435T22CO4T19HL2dT16VL1T5HL37T9HL2eT6CD6T30CD8T1HL1b1c1d2426T37CO4T26HL26T11HL27T12HL30T13HL3fT207CO7T18HL40T28HL37T10HL36T5VL4T4CLT30CO4T31HL0009T14CO4T2HL3fT25VL9T17HL36T13CD4T58CD6T25HL40T36HLT74HL40T71CO4T34HL49T23HL36T413HL40T38HL41T85HL38T16HL37T17CO4T11HL41T12HL40T83HL41T74CO4T3CO7T20HL38T12CO4T17HL4aT5CO4T1HL424344454647T14CO4T2HL40T19VL2T16HL4aT9HL41T5VL1T2HL42T7HL0bT50CO4T15HL15T7HL28T14HL39T104HL010aT185PM9T27HL0aT11HL1eT234HL27T57HL1eT10CO4T49HL28T10HL20T40CO4T51HL21T7CO4T1HL2bT13HL2223T8PM9T17HL2bT9HL29T41HL2729T10PM9T18HL31T9HL3bT154HL16T155HL1628T24HL45T161HL434cT27HL43T8HL4cT199CO4T18HL3aT16HL16T51HL15T21CO7T39VL9T23HL14T11VL4T33HL48T45HL3648T8PM4T10HL38T13HL1718191aT81CO4T13HL29T10HL2aT16HL27T8PM9T21HL29T10CO7T31HL27T10CO4T19HL29T30VL9T12HL32T10HL3bT170HL2a2bT127CO4T30HL2cT9CO7T21HL35T12HL2cT25VL1T2HL35T8HL47T68HL23T46HL22T40VL9T19CO7T43HL23T15CO4T2HL35T17HL23T9PM9T38HL43T40HL2831T168HL3aT45HL4dT154HL3aT23HL4eT92VL9T31CO7T30HL4fT12HL4dT43HL4cT12HL4dT66HL4bT13CO4T9HL4dT25HL4d4fT9PM1T5HLT8HL3eT61CO4T50HL50T8HL23T98HL1aT9HL11T18HL1aT51HL23T46HL11T8CO7T17HL08T16CO4T15HL1aT9HL11T28VL9T14HL1a23T11CD2T27CD3T2CLT62HL1aT68VL2T4HL23T5VL4T18HL1aT30HL23T10HL2021T65CD7T22CD8T1HLT51HL2a2bT22HL0aT93PM9T53HL01T21VL9T3CO7T35HL0aT9CO4T4HL14T10HL1eT20HL10T56CO4T2HL19T11HL0fT75HL0eT6HL0c0dT11CO4T5HL16T7HL03T119CO7T30HL04050607T13CO5T19CO4T51HL04T25HL03T11VL1T4HL0cT12HL39T32CO4T6HL43T9HL10T42HL0fT8HL0eT62CO4T20HL0fT7CO7T16VL1T17HL10T10VL7T23HL19T9HL3cT73CO4T21HL46T10HL3dT26HL3eT33HL3aT63CO7T21HL3bT10HL3aT20VL9T20HL28T16VL2T3HL31T5VL3T2HL3bT14HL44T21HL43T107HL3dT53VL1T9CO7T35HL3bT10CO4T23HL4fT7CO4T2HL46T14HL4dT17VL1T4HL4fT7PM1T3HL46T9HL4dT19CO7T25HL3bT16HL3b3cT44HL45T38HL3cT10VL4T15HL3bT7VL3T1VL2T11HL36T51VL6T22HL48T11VL4T9HL4aT12HL37384aT50CD3T17CD5T62CD8T23HL39T28HL2a2bT83CD3T151CD8T1HL34T120HL33T107HL21T10VL7T26HL20T9VL8T3HL3435T39CD5T17CD6T1HL2eT39VL8T10HL37T9CD8T21HL38T26HL384aT9PM8T16HL32T68HL3032T8CD4T34CD7T34HL3aT82HL1cT19HL0a1cT9CD3T26CD5T9CD6T36HL1cT71HL25T9HL26T12HL1cT10HL1d1eT79HL1b1d1eT17CD2T25CD3T27CD4T8CD4T6CD5T8CD6T17HL26T38HL1dT8CD6T18HL1bT48CD6T7HL1cT18HL1eT28CD2T39CD3T2HL27T22CD5T21CD6T1HL26T149HL2426T16CD5T64CD6T1CD7T19HL2eT42HL24T8CD6T17HL26T36CD6T36HL27T14VL6T19HL1eT15VL5T4HL1b1c1dT39CD5T24HL26T32HL1cT12VL6T14HL0aT16CD6T23HL3e47T306HL083e47T13CD3T29CD5T27CD6T1CD7T16HL11T31HL08T6CD6T17HL35T20HL3eT6CD6T10HL47T13HL39T94CD3T48CD5T10CD7T28CD8T1CD5T43HL45T88HL1845T25HL061845T8CD3T20CD5T10CD6T16CD8T12HL18T64HL21T10HL18T6HL06T11CD6T26HL0bT61HLT731HL3cT119HL45T7CD8T19HL4fT15HL3e47T55HL4b4cT220HL4b4c4fT15CD2T23CD3T4CD5T33CD6T2HL4cT81CD2T9CD3T4HL4bT22CD5T20CD6T1HL494a4b4c4d4e4f50T154HL3e47T41PM7T26HL08T21CD7T6HL19T209HL0719T8HL00020405060708090a0b0c0d0e101214161718191a1b1c1d1e20212324252627282a2b2e303132333435363738393b3c3e4042434445464748494a4b4c4f50T5HL07T16VL4T13HL22T11HL4bT563CD2T51VL3T138HL4aT12CD3T7HL3738T18PM3T5HL39T7CD3T6HL3eT64CD3T5HL4fT22CD3T4HL45T16HL454647T24HL46T9HL4cT15HL4bT6HL42T19HL0c42T16CD1T30CD1T14CD2T3CD4T16CD7T30CD8T1HL0dT33HL0cT10CD7T18HL42T19CD2T24HL4aT210VL5T73HL38T19VL8T14HL37T15VL3T13HL0aT5VL5T22HL26T68VL7T17HL24T12VL5T4HL4cT33VL6T15HL4fT35VL2T8HL0e17T138PM6T26HL1819T48PM6T22HL17T10CD6T4HL0eT7HL17T9CD6T4PM6T9HL0eT13VL6T21HL44T52HL1744T26HL051744T7CD3T16CD4T4CD5T7CD7T16HL05T26CD4T33HL17T9CD4T4HL44T56CD3T39HL43T66CD4T25CD5T2CD7T21CD8T1HL040d16T86CD4T22CD5T1CD7T10CD8T1HL0dT20CD5T29CD7T13HL16T10CD4T14HL04T9CD4T4HL0c0dT30PM4T8HL000912T459CD2T31CD3T2CD7T35CD8T1HL13T29HL09T19CD7T33HL12T23CD2T12HL0bT53CD2T18CD3T2HL0c0dT216HL0bT15HL090bT10PM3T7HL00T14CD3T4HL12T5CD3T2HL1dT37HL0b1dT10HL090b1dT7HL090b1b1dT9HL17T192HL0517T24PM3T6HL39T165VL7T13HL42T12HL424344T17CD7T16HL3eT11VL5T20HL47T8VL7T52HL45T35CD5T19HL35T11VL6T11HL34T7VL5T5HL08T22VL4T5VL3T6HL05T22PM3T17CD3T6HL17T8VL3T5HL18T49CD3T5HL06T14CD3T2HL46T107CD3T44CD6T1HL19T30CD3T17CD6T2CD8T10CD3T21HL4546T33HL424344T22HL0cT190VL2T7HL0bT7VL3T4HL1dT6VL2T2HL1bT12VL3T9HL09T9VL2T7UDT25CD3T103PM3T29HL0009T52HL09T19VL8T22HL00T6CD2T12HL12T95VL7T21HL00T13VL9T1UDT19UDT4UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT8UDT7UDT4UDT10UDT6HL1718191aT73HL17T8HL0cT28VL2T11HL0bT17HL09T43CD2T11HL0bT5CD2T1HL00T52VL2T4HL1bT76VL3T3HL0bT10VL3T5HL1dT6VL2T1HL09T32VL8T10HL12T6VL7T1HL16T29CD7T32HL0405T21PM7T7HL30T70VL4T12HL32T16VL7T1HL05T17VL6T9VL5T8HL04T9VL7T1HL16T31VL8T12HL0dT8VL4T7HL19T55VL6T17HL18T8VL5T3HL06T42VL8T10HL2aT45VL3T13HL2bT12VL8T1HL45T18VL6T14HL46T7VL3T1HL42T47VL8T48HL43T16CD8T15VL5T38HL44T5VL4T0HLT62',
		},
		'7FTq4BpLhf': {
			ctcId: '7FTq4BpLhf',
			replay: 'HL1b1d1e1f20212425T232HL1bT6HL2526T36PM2T3HL434cT230PM7T30HL29T57VL7T2HL22T32VL7T1HL06T22VL7T2HL13T30VL7T2HL3f48T37PM7T5HL434cT281CD6T21CD7T1PM6T8PM6T23PM7T1HL32T66VL6T3HL363fT218HL414aT312PM9T25HL010aT18PM9T11HL3bT624HL050e3bT13CD3T20CD4T5CD5T7HL10T32HL05T7CD5T33HL0eT11HL3bT17CD5T22HL0eT37VL5T14HL191aT66PM5T8HL3dT60HL3aT33HL4bT20HL040dT223PM1T5HL1e27T15PM1T3HL14T591HL4aT92HL48494aT63HL374041T42HLT495HL15T34HL040dT155CD1T33CD2T2PM1T28HL1516T352PM8T33HL0708T21PM8T12HL3aT132HL3cT230HL2a33T122PM5T19HL0f1011T33HL191aT11HL2a33T108HL3cT159HL333cT18HL0fT238HL33T15CD5T63CD8T39CD9T2HL2aT17HL21T3HL18T5HL0fT4CD6T51CD9T24HL18T10HL21T3HL2aT3HL33T3HL3cT3CD8T73CD9T1HL33T25HL2aT3HL21T77HL18T3HL0fT3HL0eT4HL0dT7HL0cT3HL0bT3HL0aT3HL0bT22HL0cT6HL0dT4HL0eT3HL17T10HL20T3HL17T15HL0eT3HL0fT6HL10T4HL19T16HL22T5HL2bT3HL34T3HL3dT3HL46T3HL45T3HL44T3HL43T2HL42T3CD3T179CD8T60CD9T1HL4bT29HL42T12HL4bT7HL42T97HL39T3HL3aT4HL31T33HL28T3HL1fT3HL1eT3CD1T48CD4T32CD3T17HL27T70HL1eT11HL14T62CD3T78CD4T5HL1dT70HL1eT8HL27T7HL28T6HL1fT6HL16T4HL17T3HL18T6HL19T12HL1aT4HL23T9HL22T117HL21T3HL20T3HL1fT3HL28T15HL1fT4HL16T4HL1615T12HL161514T4HL16151415T6HL16T12HL1615T10HL1516T32CD3T0CD4T4CD5T10CD5T20CD8T35HL17T56HL18T18HL19T7HL31T131HL3fT112HL1b1c1d1e1f20212223T167HL31T475CD3T62CD5T13CD9T39HL3aT124HL09T150CD1T37CD3T13CD4T5CD6T25HL3aT288HL1f283aT16CD3T33CD4T1CD5T4CD8T18HL43T40HL3aT7CD5T20HL1f28T34HL1fT17HL1f28T12CD8T17HL16T12HL3aT20HL31T56HL28T99HL3aT48CD9T48HL16T12HL3aT18HL28T124CD9T26HL1f2831T178HL090a0b0c0d0eT100HL191aT28HL3c3d3eT70HL46474f50T16HL3dT33HL1dT103CD1T32CD3T44CD4T1HL1cT71HL13T74HL0aT3HL0a09T13HL090aT80PM6T0HL1aT59HL1a19T16HL191aT14CD5T0CD6T1PM5T9HL0fT102VL9T15HL33T26HL3cT10VL9T17VL8T12HL33T7VL5T17HL2aT12PM5T8HL31T8CD5T26HL3aT11CD8T16HL0aT50PM9T19HL01T6VL9T1HL2aT139VL6T61HL1cT45VL6T8HL09T40VL6T4HL0aT6PM6T17HL38393a3b3c3d3eT181HL29T72HL33T20HL34T9HL23T99CD1T16CD3T17HL1dT156HL1eT12HL1fT15VL5T53HL28T14CD5T7HL31T221HL3aT10HL2425T154PM5T27HL0aT16HL000aT6CD1T16CD3T3CD4T5HL09121b242d363f48494aT208HL4d4e4f50T68HL4fT10HL3dT98CD1T23CD2T2CD9T59HL3aT48HL2d2eT19HL2d2e34T13CD1T13CD2T1CD3T2CD2T10CD8T40CD9T1HL30T35HL2eT11CD9T22HL2dT17CD9T2HL34T30HL3c3dT227HL0708T591CD1T53CD2T2CD3T4CD4T5CD8T26CD1T35HL08T120CD4T22HL1eT130HL1e2728T15HL08111aT333HL0710T22PM4T40HL3a3bT121HL3637T242CD1T24CD2T2CD3T3CD4T6CD9T25HL3fT23HL3637T12CD9T21HL36T22CD2T9HL37T18HL27T112CD1T34CD3T1CD4T3CD9T9HL31T48HL1dT66HL26T9HL4bT68CD3T36CD4T1CD8T7CD9T1CD3T19HL3a3bT42HL3a3b42T7HL2b2cT244CD1T15CD3T2CD8T74CD9T1HL46T87HL363738393a3b3c3dT66HL39424bT31HL424bT14PM8T28HL15T21CD8T3PM8T7HL16T7VL8T2HL1415T59HL0708T224HL242526T452HL2425T61HL26T195HL0710T35HL46T31HL4f50T48HL4fT24HL3d4647T15HL1d1eT225HL27T554CD4T33HL424bT19HL4bT6CD4T7HL26T34HL2641T29HL26414aT7CD1T24CD2T2CD3T3CD9T51HL41T25CD1T7HL4aT6CD2T3CD3T20HL26T23CD9T33HL4aT147HL41T9HL28T105HL1e28T42PM4T19HL15T29HL0515T11PM4T11HL3bT31HL3a3bT11PM4T10HL37T30CD4T8HL36T5CD4T2HL424bT91HL3a3bT16HL4849T55PM4T30HL1dT134VL4T17HL14T12VL3T7HL15T9VL4T2HL1eT8CD4T22PM4T31HL05T29VL3T1HL3bT14VL4T0HL3aT16CD4T5PM3T10PM3T46PM4T16HL0aT157CD3T29HL00T7CD3T3HL28T82VL4T41HL1eT143HL4bT34HL424bT12HL42T28HL3a42T13PM3T13HL424bT33HL4bT10HL424bT35PM8T22HL3aT162HL3a42T21PM3T7HL313aT26HL343dT82HL31343a3dT13HL2bT261CD9T30HL464fT59HL4750T11PM9T6HL2cT19CD9T3HL3f404142434445464748494a4b4c4d4e4f50T138HL3dT89CD9T6HL4750T13HL3aT9VL9T2HL31T9VL3T9UDT44UDT5UDT6UDT8UDT9UDT9HL46T11HL343dT24HL31343a3dT14HL424bT124PM9T29HL42T91CD3T103HL3aT16VL3T3HL32T13HL31T8VL9T8HL27T8CD9T19HL37T33HL36T7VL1T4HL37T5VL2T11HL3dT15VL9T19HL34T17CD9T16HL2cT133VL9T13UDT98UDT3UDT3UDT2UDT3UDT2UDT3UDT3UDT3UDT3UDT2UDT3UDT2UDT3UDT3UDT3UDT3UDT3UDT4UDT5UDT4UDT6UDT13UDT12UDT8UDT3UDT3UDT3UDT4UDT4UDT4UDT95UDT9UDT9UDT25UDT14UDT9UDT27UDT16UDT5UDT15UDT9UDT7UDT8UDT8HL343dT50HL31343a3dT22HL040d161f2831343a3d434cT25HL071019222b343d464fT36HL2bT98CD9T21HL4750T19HL3d4750T8PM9T6HL34T11HL2c34T9PM9T7HL313aT112HL3aT6HL3a424bT9PM9T7HL31T31HL2731T6PM9T6HL2425T395HL46T789HL1eT83HL1e27T88HL1eT44HL1e23T14HL4aT126HL26T77HL264aT13HL1d264aT76HL1d1e264aT54HL1d1e26274aT7HL1d1e26274a4bT26HL4aT210HL264aT14HL1e264aT11HL1e26274aT6HL1e2326274aT17HL1e2326272c4aT7HL1e2326272c4a50T34HLT59CO5T0HL23T18HL2cT6HL232cT9HL232c50T12HL232c4a50T12HL23272c4a50T18HL1e23272c4a50T5HL1e2326272c4a50T6CO4T37HLT8HL2bT33HL27T44HL274aT27HL23274aT14HL1eT19HL1e2cT48HL28T36HL2bT36CD1T3HL4fT57HL4647T27HL4fT6HL3d4fT7HL3d4f50T11PM1T7HL4fT13HL4aT16HL36374aT27PM1T25HL42T15HL2d2eT31HL262d2eT8PM1T6HL31T10HL46T16HL4fT423HL50T12HL2c50T9HL232c50T5HL1f232c50T12HL1e1f232c50T7HL27T11HL1e27T6HL1e2627T6HL1e26274aT11HL1e26274a50T11HL1e26272c4a50T9HL1e2326272c4a50T5HLT28CLT0HL23T25HL232cT6HL232c50T10HL232c4a50T12HL23262c4a50T10HL2326272c4a50T4HL1e2326272c4a50T4CLT17HLT9UDT17UDT15UDT11UDT10UDT8UDT9UDT8UDT9UDT8UDT12HLT18HL232cT15HL1e2326272cT17HL1e2326272c4aT9HL1e2326272c4a50T12CO3T19HLT15HL2d2e3637T72HL2d2e3436373dT17HL0a2d2e3436373dT92HL010a2d2e3436373dT7HL0aT21HL2d2e3637T21HL2d2e3436373dT17HL4fT558HL46T26HLT542HL39T383HL393cT19HL393c3eT6HL02393c3eT15HL020b393c3eT6HL020b2f393c3eT10HL3f404849T182CD4T26CD5T2CD8T14CD7T0HL3f40T36CD4T14HL4049T17CD7T19HL3fT58HL2425T708CD1T39CD2T2CD3T16CD5T27CD8T23HL2fT28HL25T7HL24T7CD2T6HL4142T520HL41T168CD3T17HL42T93VL3T47HL27T16CD3T9HL1eT6VL1T2HL27T9VL9T13HL31T15VL3T8HL3aT8VL9T11HL3dT24CD9T24PM9T6HL4750T29HL2cT10CD9T6PM9T6HL34T7VL9T2HL3637T106HL37T23CD2T4HL3637T14PM1T27HL3dT16VL2T4HL07T55CD2T2HL23T48VL3T7HL2bT22VL8T14HL2cT7VL1T7HL08T27CD3T7HL07T18CD8T16PM8T6HL08T11VL8T1HL07T26HL0710T26HL23T19HL08111a23T52HL07T20VL4T6HL10T9PM4T5HL00T22VL1T2HL0aT5VL4T1HL24T15HL242dT14CD1T3HL2eT7HL2dT16PM1T6HL2eT17HL25T20CD1T14HL26T13HL262eT7HL26T26HL264aT22HL36T24VL3T7HL37T5VL1T2HL2dT16VL8T14HL24252eT24CD8T20HL36T15HL24T18VL5T16HL25T12CD5T18PM5T9HL3fT60CD5T23HL48T7CD5T2HL4049T18PM5T17HL3fT161VL7T20HL48T16VL4T1HL49T20CD4T19PM4T7HL43T28VL6T9HL4cT6VL7T1HL4aT68VL9T56HL41T8VL2T11HL4bT11VL8T13HL49T58VL5T14HL40T11VL8T2HL26T22CD2T16VL1T9HL2eT13VL3T11HL25T6VL1T2VL2T7HL04T60VL2T3HL0dT4VL1T1HL1011T43CD2T18CD3T72HL11T26VL2T3HL10T5VL3T4HL50T85HL4eT12HL4fT6VL1T3HL47T28VL9T16HL50T10CLT5HL46T94VL5T13HL50T10VL6T21HL19T10VL6T1HL1aT5VL5T1',
		},
		'J6Ln72n7JP': {
			ctcId: 'J6Ln72n7JP',
			replay: 'HL161f26272829313aT252HL32T18HL2032T7PM1T5HL030c15T24HL03T7HL030c15T21HL030cT22PM1T3HL32T14HL111a232c353e4750T37HL111a232c353e45464750T22HL111a232c353c3e4546474e50T19HL4fT8VL2T6HL38T44HL3637T9PM2T4HL040d161f28313a43T60HL040c0d0e0f1011161f28313a43T29HL3aT26HL3bT20HL2425262728292aT98HL1b2425262728292aT23HL1b1d2425262728292aT7HL1cT29HL1c2dT9PM3T5HL2aT69HL3e47T11PM3T4HL32T104HL1732T8HL172032T6HL20T8HL2032T7CD1T6CD3T2PM1T19HL030cT58HL0cT15VL3T21HL03T5VL1T1HL0708T49PM3T10PM3T52HL07T8VL3T1HL28T116HL15T106VL2T3HL0bT48HL02T9HL0001T21PM2T10HL39424bT68CD7T23CD8T1CD9T1HL3aT20HL39T8CD9T11HL42T7CD7T4HL4cT80HL4dT58HL3b444dT17CD4T31CD5T1CD6T2HL3bT42CD4T18HL4dT10CD4T3HL44T5VL4T2HL3aT174HL2d2e2f30T311HL3f4041424344T62HL373f4041424344T31HL373f404142434448494aT42HL38T9HL3638T7PM4T14HL232c333435T155HL212223T106HL2b2cT15PM5T15HL34T69HL222bT19HL34T6HL2234T11HL22T12VL6T3HL3e47T37PM6T7HL2b2cT98HL232cT20PM7T17HL2b34T262HL10192b34T22CD1T29CD3T14CD3T8CD4T6CD5T12CD8T32HL19T22HL10T8HL19T59HL10T44HL2bT24HL34T19CD4T25CD5T14HL2bT38CD1T7HL040d16T123CD4T58CD5T1CD6T2HL16T38HL04T11VL6T15HL0d16T11CD6T3HL1f2831T50CD7T37CD8T2CD9T1HL29T108VL2T26HL232a2b2c35T79HL33T15HL2133T7PM2T11HL050e17T219CD7T36CD8T1CD9T1HL20T19HL0eT6CD7T21HL1aT401HL081aT11HL06081aT8CD1T17CD4T9CD5T4CD8T18CD9T0HL19T40HL06T7CD1T3HL08T4CD1T2HL1aT40HL08T87CD4T22HL1aT7CD4T2HL38T173HL36T20HL30T18HL304450T4HL30T22HL32333435T28HL323334T13HL232c32333435T10HL2bT53HL212bT8PM4T28HL3e47T101CD3T79CD6T1PM3T7PM6T1HL3c454fT30HL3c454eT40CD1T21CD5T33CD8T19HL3cT20CD1T10HL454eT45HL45T7CD1T5HL4eT5VL1T1HL3cT28HL3c45T10HL3cT20HL45T71HL3cT5VL8T9HL45T12VL5T4HL3aT88HL39T7VL7T17HL4bT12CD7T14HL28T27CD7T2HL0bT159HL0aT12HL091213T31HL13T20HL0912T8PM1T5HL4049T38HL40T13VL1T6HL49T10HL4aT363HL4849T38PM7T28HL31T172CD8T21HL494a4b4c4d4e4fT178HL43T17HL38T7HL3637T12HL242526272829T100HL1c242526272829T39HL1c2425262728292e2fT33HL12131415T42HL0a12131415T10HL020a12131415T6HL0001T87HL1dT15VL2T10HL06T86HL30313233T32HL16T223HL1eT8HL0dT6VL4T16HL16T5VL5T2HL06T16CD4T17HL21T11VL4T14HL2bT6CD4T7PM4T7HL33T42HL06T42CD8T14HL33T16VL9T39HL06T18VL5T7HL08T18CD5T7HL1aT6CD5T3HL1019T9CD5T5HL090aT81HL09T20VL5T3HL12T11VL1T9HL10T26HL191aT17CD1T5HL10T7VL1T3HL19T41VL4T17HL0001T131CD2T24CD4T2PM4T21PM4T10PM2T16HL38T85HL384aT48PM5T24HL41T36HL02T155VL7T12HL0bT18HL0a0bT159CD6T59CD8T6CD9T1HL0aT32HL0bT13CD6T11HL0aT13VL6T2HL13T16CD8T29CD9T1HL05T173CD7T13HL17T8VL7T1HL38414aT149CD4T41CD5T7CD8T24CD9T0HL39T25HL38T13HL41T9CD4T13CD5T26HL38T10CD8T16CD9T1HL41T17HL4aT3HL41T10HL4aT7CD4T28HL38T81VL4T41HL4aT8VL5T3HL36T18PM5T15PM5T30PM4T14HL38T66HL25T23HL1b1cT10HL242dT8PM4T16HL00T12VL2T6HL01T5VL4T6HL36T65PM2T3HL37T4VL2T2HL232c35T294CD1T29CD5T52CD7T33HL34T558HL3dT21HL34T6HL2b34T94CLT2CD5T53CD7T38CD8T10CD7T6UDT294UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT4UDT3UDT3UDT3UDT3UDT3UDT6UDT3UDT3UDT3UDT2UDT3UDT2UDT3UDT2UDT3UDT2UDT3UDT3UDT2UDT3UDT3UDT3UDT2UDT15UDT3UDT3UDT2UDT3UDT3UDT2UDT2UDT3UDT3UDT3UDT2UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT7UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT3UDT36UDT25UDT20HL33T97CLT37HL06T9CLT2HL0633T15CD2T18CD9T50HL34T41HL3dT13HL33T10HL06T71HL11T11HL06T8VL9T12HL33T20VL2T5HL05T41CD9T16HL17T9CD9T1HL0eT6VL9T1HL1fT45CD9T3HL08T43CD9T3HL1aT11CD9T2HL10T103CD4T20HL19T8CD5T5HL1aT20CD5T2HL19T176VL4T66HL1aT12HL10T137CD8T140HL1aT20HL081aT10PM8T6HL17T29HL0517T8PM8T8HL2b34T76PM8T7HL35T199HL34T119HL35T63HL000102T149HL0aT12HL0001T223CD2T14CD4T1PM2T7HLT32HL02T14CD5T30CD7T8CD8T1HL05T94HL0508T10HL05081aT33HL0508171aT8PM8T15HL3637T51HL00013637T15HL49T281HL41T250CD8T71CD9T1HL40T53HL3fT3CD3T26CD6T1HL0bT132CD5T89CD8T13HL090aT50CD1T18CD2T9CD2T16CD5T42CD6T1CD8T22HL13T28HL0aT5CD1T3CD5T30HL2eT107HL010a131c252e2fT121HL38T25HL4aT74HL384aT14HL38T57HL4aT40HL38T12HL02T21VL7T73HL05T15VL8T12HL17T9VL7T2HL08T20VL5T20HL10T8VL1T3HL1aT7VL8T11HL2bT28VL5T15HL34T11VL8T31HL2cT66HL35T27VL1T3HL232cT58CLT6HL2cT123VL7T11HL23T7VL9T1HL09T216CD1T9PM1T6HL12T5VL1T2HL13T46VL9T69HL414aT90PM9T21HL2dT93VL9T3HL32T32VL3T14HL20T13VL1T2HL32T43HL31T8VL7T12HL1fT27VL8T2HL28T8VL9T2HL2425T65CD4T50CD8T46HL1cT12HL1c1bT8HL1b1cT40CD3T0CD7T44HL1cT21PM3T6HL1bT8VL7T13HL1cT10VL3T3HL25T80HL010a131c252eT19HL2eT17HL2425T14HL36T44HL39T15HL38T6VL4T3HL36T24PM4T9HL4aT112CD5T26CD8T3CD9T4HL16T162HL0bT8VL8T15HL0aT10VL6T19HL09T15VL5T11HL41T33VL9T10HL4aT5VL5T21HL42T14VL8T5HL4bT6VL9T3HL4dT24VL6T21HL3bT7VL5T1HL25T68VL8T16HL24T15VL4T1HL3fT80HL4849T38CD7T57CD8T1HL49T30VL7T2HL48T6VL8T3HL3637T141CD2T30CD3T8CD6T23PM2T25HL37T12HL36T18CD6T16HL37T30CD3T20HL00T93VL2T3HL01T5VL4T8HL36T21VL3T3HL3fT13VL6T10HL37T15VL2T7HL47T20VL3T17HL3eT14VL6T7HLT213',
		},
		'npM6B443HL': {
			ctcId: 'npM6B443HL',
		},
	};
	app.testPuzzles = testPuzzles;
	
	var alphaPuzzles = {
		'hDNMJqPmTh': {
			ctcId: 'hDNMJqPmTh',
			appUrl: 'https://app.crackingthecryptic.com/sudoku/hDNMJqPmTh',
			name: 'Araf Sudoku',
			setter: 'Phistomefel',
			rules: 'Normal sudoku rules apply. The grid must be decomposed into different areas. Each cell belongs to exactly one area. Each area contains exactly two clues. The sum of all digits in an area lies between the two clues, but may not reach them. For example, if the clues for an area are 21 and 24, the sum of the digits in the area is 22 or 23. Digits may not repeat within an area.',
			videoId: 'M3oVi4cBRxE',
			videoUrl: 'https://www.youtube.com/watch?v=M3oVi4cBRxE',
			videoHost: 'Simon',
			notes: 'Alpha testing, game 1. Needs a lot of colouring.'
		},
		'BLLGjtrb4P': {
			ctcId: 'BLLGjtrb4P',
			appUrl: 'https://app.crackingthecryptic.com/sudoku/BLLGjtrb4P',
			name: '16 Cups Of Tea',
			setter: 'Sumanta Mukherjee',
			rules: 'Normal sudoku rules apply.  In cages, digits must sum to the small clue given in the top left corner of the cage.  Digits cannot repeat in a cage.  Clues outside the grid give the sum of cells along the indicated diagonal.  Inequality signs in the grid point to the lower of the two cells involved.',
			videoId: 'dDdd8iBQMQk',
			videoUrl: 'https://www.youtube.com/watch?v=dDdd8iBQMQk',
			videoHost: 'Simon',
			notes: 'Alpha testing, game 2. Little killer/killer hybrid.'
		},
		'qr6dDQJRpf': {
			ctcId: 'qr6dDQJRpf',
			appUrl: 'https://app.crackingthecryptic.com/sudoku/qr6dDQJRpf',
			name: 'Battlefield Sudoku',
			setter: 'Big Tiger',
			rules: 'Normal sudoku rules apply. Consider the first X cells and the last Y cells of a row or column where X is the number in the first cell and Y is the number in the last cell. A clue outside the grid gives the sum of the digits where these groups overlap, or the sum of the digits in the gap between the groups if they don\'t overlap.',
			videoId: 'qRMqYWqUnPc',
			videoUrl: 'https://www.youtube.com/watch?v=qRMqYWqUnPc',
			videoHost: 'Simon',
			notes: 'Alpha testing, game 3. lots outside the grid.'
		},
		'TmMBJj8jbr': {
			ctcId: 'TmMBJj8jbr',
			appUrl: 'https://app.crackingthecryptic.com/sudoku/TmMBJj8jbr',
			name: 'C.T.C.',
			setter: 'Prasanna Seshadri',
			rules: `Normal killer sudoku rules apply (cells in cages must sum to the total given in the top left of each cage). Cage totals have been coded Each letter represents a unique digit. Even numbers within the cages are shaded.`,
			videoId: '0JMmSxhyfIo',
			videoUrl: 'https://www.youtube.com/watch?v=0JMmSxhyfIo',
			videoHost: 'Simon',
			notes: 'Alpha testing, game 4. Prasanna’s 14 rules!'
		},
		'j2gtNR4Mg4': {
			ctcId: 'j2gtNR4Mg4',
			appUrl: 'https://app.crackingthecryptic.com/sudoku/j2gtNR4Mg4',
			name: 'Partial Coded Killer',
			setter: 'Scott Strosahl',
			rules: 'Normal sudoku rules apply. Consider the first X cells and the last Y cells of a row or column where X is the number in the first cell and Y is the number in the last cell. A clue outside the grid gives the sum of the digits where these groups overlap, or the sum of the digits in the gap between the groups if they don\'t overlap.',
			videoId: 'jayJVjqAS3k',
			videoUrl: 'https://www.youtube.com/watch?v=jayJVjqAS3k',
			videoHost: 'Simon',
			notes: 'Alpha testing, game 5. Scott Strosahl’s partial coded killer'
		},
	};
	app.alphaPuzzles = alphaPuzzles;
	
	var puzzleId;
	
	//puzzleId = 'TmMBJj8jbr';
	//puzzleId = 'npM6B443HL';
	//puzzleId = 'qr6dDQJRpf';
	console.log('puzzleId:', puzzleId);
	
	var urlQueryPuzzleId = new URLSearchParams(document.location.search).get('puzzleid');
	console.log('urlQueryPuzzleId:', urlQueryPuzzleId);
	if(typeof urlQueryPuzzleId === 'string') puzzleId = urlQueryPuzzleId;
	
	var urlPathPuzzleId = (document.location.pathname.match(/^\/sudoku\/([^/]+)$/) || [])[1];
	console.log('urlPathPuzzleId:', urlPathPuzzleId);
	if(typeof urlPathPuzzleId === 'string') puzzleId = urlPathPuzzleId;
	
	console.log('puzzleId:', puzzleId);
	if(typeof puzzleId === 'string') {
		app.loadRemoteCTCPuzzle(puzzleId);
	}
	
	//https://cdpn.io/killroy/debug/oNbEjjJ/xnMabZPbWdvr?puzzleid=7FTq4BpLhf
	/*
	var puzzle = testPuzzles['fRftpGmpdT'];
	console.log('puzzle:', puzzle);
	app.loadRemoteCTCPuzzle(puzzle.ctcId)
	.then(() => {
		var replay = {actions: puzzle.replay.split(',')};
		console.log('replayActions:', puzzle.replay.length, replay.actions.length, app.puzzle.replayLength(replay));
		console.time('replayPlay');
		//app.puzzle.replayPlay(replay, {speed: -1, playToTime: app.puzzle.replayLength(replay) * 0.3});
		//console.log(replay.actions.slice(752, 760));
		//replay.actions.length = 752;
		//app.puzzle.replayPlay(replay, {speed: -1});
		console.timeEnd('replayPlay');
	});
	*/
	
	/*
	https://ctc.svenneumann.com/sudoku/2gNGNPdtHP
	https://ctc.svenneumann.com/sudoku/BjDnndmJF7
	https://ctc.svenneumann.com/sudoku/T43rMR8FGj
	https://ctc.svenneumann.com/sudoku/jpQPjrm7H4
	https://ctc.svenneumann.com/sudoku/2JPFBJQTJ4
	https://ctc.svenneumann.com/sudoku/TmMBJj8jbr
	https://ctc.svenneumann.com/sudoku/5uH7kmNDQhY
	*/
			// Fetch filled values
	// [...document.querySelectorAll('div[class="cell"]')].map(cell => `r${cell.getAttribute('row')}c${cell.getAttribute('col')}=${(cell.querySelector('.cell-value') || {}).textContent}`).join(',');
	/*
	puzzle: btjTmJ64d4
	'r0c0=7,r0c1=1,r0c2=3,r0c3=8,r0c4=9,r0c5=6,r0c6=4,r0c7=2,r0c8=5,r1c0=2,r1c1=8,r1c2=5,r1c3=7,r1c4=4,r1c5=3,r1c6=9,r1c7=6,r1c8=1,r2c0=6,r2c1=4,r2c2=9,r2c3=1,r2c4=5,r2c5=2,r2c6=3,r2c7=8,r2c8=7,r3c0=4,r3c1=6,r3c2=7,r3c3=9,r3c4=3,r3c5=8,r3c6=1,r3c7=5,r3c8=2,r4c0=5,r4c1=2,r4c2=8,r4c3=4,r4c4=6,r4c5=1,r4c6=7,r4c7=3,r4c8=9,r5c0=9,r5c1=3,r5c2=1,r5c3=5,r5c4=2,r5c5=7,r5c6=6,r5c7=4,r5c8=8,r6c0=8,r6c1=7,r6c2=2,r6c3=3,r6c4=1,r6c5=4,r6c6=5,r6c7=9,r6c8=6,r7c0=3,r7c1=5,r7c2=6,r7c3=2,r7c4=7,r7c5=9,r7c6=8,r7c7=1,r7c8=4,r8c0=1,r8c1=9,r8c2=4,r8c3=6,r8c4=8,r8c5=5,r8c6=2,r8c7=7,r8c8=3'
		.split(',')
		.forEach(cellVal => {
			var [_, r, c, val] = Puzzle.reRCVal.exec(cellVal);
			app.grid.getCell(r, c).setValue(val);
		});
		
		
	Diagonals: rNLJPPB9d3
	*/
	
	//[...app.puzzle.replayStack]
	//app.puzzle.replayPlay(, {});
	/*
	var len = app.puzzle.replayLength(rep);
	const o = {};
	o.handleMove = function(event) {};
	o.handleMove = function(event) {
		var w = document.documentElement.clientWidth;
		var t = Math.round(event.clientX / w * len);
		app.puzzle.replayPlay(rep, {speed: -1, playToTime: t});
	};
	document.addEventListener('mousemove', event => o.handleMove(event));
	*/
});