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
	P.clear = function(levels = 0) {
		//console.info('Cell.clear(%s);', levels);
		if(this.value !== undefined) {
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
		if(levels > 1) return this.clear(levels - 1);
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
		this.clearCells();
		board.style.width = `${(cols + 3) * 60}px`;
		board.style.height = `${(rows + 3) * 60}px`;
		document.querySelectorAll('.grid svg').forEach(svg => {
			svg.style.width = `${(cols + 3) * 60}px`;
			svg.style.height = `${(rows + 3) * 60}px`;
			svg.setAttribute('viewBox', `-60 -60 ${(cols + 3) * 60} ${(rows + 3) * 60}`);
		});
		document.querySelector('#board');
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

const App = (() => {
	function App(opts = {}) {
		// Bind all handlers
		Object.getOwnPropertyNames(Object.getPrototypeOf(this))
			.filter(prop => /^handle/.test(prop) && typeof this[prop] === 'function')
			.forEach(prop => this[prop] = this[prop].bind(this));
		this.doubleTaps = {};
		this.move = 'none';
		this.paintState = 'none';
		this.paintStateVal = false;		
		this.highlighting = undefined;
		this.mode = 'normal';
		this.startTime = this.lastActTime = Date.now();
		this.highlightedCells = [];
		this.puzzleCache = {};
		this.replayStack = [];
		this.undoStack = [];
		this.redoStack = [];
		this.createPuzzle({rows: 9, cols: 9});
		this.attachHandlers();
	}
	var P = Object.assign(App.prototype, {constructor: App});
	App.reRCSplit = /(?=r[0-9]+c[0-9]+)/;
	App.reRCRange = /^r([0-9]+)c([0-9]+)(?:-r([0-9]+)c([0-9]+))?$/;
	App.reRCVal = /^r([0-9]+)c([0-9]+)(?:\s*[:=]\s*([a-zA-Z0-9]+))?$/;
	App.reDigit = /^(?:Numpad|Digit|btn-)([0-9])$/;
	App.reActionStr = /^(hl|vl|pm|cd|co|cl)(?:\:(.+))?$/;
	App.Modes = ['normal', 'corner', 'centre', 'colour'];
	App.ModeToAction = {
		'normal': 'value',
		'corner': 'pencilmarks',
		'centre': 'candidates',
		'colour': 'colour',
	};
	App.colorHexToRGBA = (hex, alpha) => {
		hex = parseInt(hex.replace(/^#/, ''), 16);
		return `rgba(${hex>>16&255},${hex>>8&255},${hex>>0&255},${alpha})`;
	};
	App.parseRCVal = function(rcv) {
		var [_, r, c, val] = App.reRCVal.exec(rcv);
		return [r, c, val];
	};
	App.ActionLongToShort = {
		highlight: 'hl',
		value: 'vl',
		pencilmarks: 'pm',
		candidates: 'cd',
		colour: 'co',
		clear: 'cl',
		undo: 'ud',
		redo: 'rd',
	};
	App.ActionShortToLong = {
		hl: 'highlight',
		vl: 'value',
		pm: 'pencilmarks',
		cd: 'candidates',
		co: 'colour',
		cl: 'clear',
		ud: 'redo',
		rd: 'undo',
	};
	App.LongPressTimeout = 600;
	App.doubleTapInterval = 500;
	App.doubleTapDistance = 5;
	App.logTimeResolutionMs = 50;
	// SVG rendering
		App.svgId = 0;
		App.renderPart = ({target = 'underlay', type, attr = {}, content}) => {
			//console.info('App.renderPart({target, type, attr, content});', target, type, attr, content);
			var svg = document.querySelector('svg#' + target), svgNS = svg.namespaceURI;
			var part = document.createElementNS(svgNS, type);
			Object.keys(attr).forEach(key => part.setAttribute(key, attr[key]));
			if(content) part.textContent = content;
			svg.appendChild(part);
			return part;
		};
		App.renderLine = ({target = 'overlay', color = 'none', thickness, wayPoints}) => App.renderPart({
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
		App.renderArrow = ({target = 'overlay', color = 'none', thickness, headLength, wayPoints}) => {
			var size = thickness * 12;
			var g = App.renderPart({type: 'g', attr: {stroke: color, 'stroke-width': thickness}});
			var def = g.appendChild(App.renderPart({type: 'defs'}));
			var marker = def.appendChild(App.renderPart({type: 'marker', attr: {
				id: 'arrow_' + (App.svgId++),
				markerUnits: 'userSpaceOnUse',
				markerWidth: size, markerHeight: size, refX: size * 0.8 + thickness, refY: size * 0.5, orient: 'auto'
			}}));
			var path = marker.appendChild(App.renderPart({type: 'path', attr: {
				fill: 'none',
				//d: 'M25 40 L40 25 L25 10'
				d: `M${0.5*size} ${0.8*size} L${0.8*size} ${0.5*size} L${0.5*size} ${0.2*size}`
			}}));
			var arrow = g.appendChild(App.renderPart({
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
		App.renderRect = ({target, center, width, height, borderSize = 0, backgroundColor = 'none', borderColor = 'none', rounded, opacity = 1}) => {
			borderSize = borderSize || borderColor !== 'none' ? 2 : 0;
			return App.renderPart({
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
		App.renderText = ({target, center, width, height, color = '#000', fontSize, text}) => {
			App.renderPart({
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
			App.renderPart({
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
	// Puzzle
		P.createPuzzle = function({rows = this.rows, cols = this.cols}) {
			//console.log('App.createPuzzle({rows: %s, col: %s});', rows, cols);
			this.rows = rows;
			this.cols = cols;
			if(this.grid === undefined) {
				this.grid = new Grid({parent: document.getElementById('board'), rows, cols});
			}
			else {
				this.grid.createCells({rows, cols});
			}
			this.cells = this.grid.getCellList();
			this.restartPuzzle();
		};
		P.clearPuzzle = function() {
			this.clearHighlight();
			this.grid.cells.forEach(row => row.forEach(cell => cell.clear(3)));
		};
		P.restartPuzzle = function() {
			if(this.preserveStacks !== true) {
				this.replayStack.length = 0;
				this.undoStack.length = 0;
				this.redoStack.length = 0;
			}
			this.startTime = this.lastActTime = Date.now();
			this.clearPuzzle();
		};
		P.getCells = function(query) {
			var segments = query === '' ? [] : query.split(/\s*,\s*/);
			var cells = [];
			segments.forEach(segment => {	
				var [_, r1, c1, r2, c2] = App.reRCRange.exec(segment);
				r1 = parseInt(r1); c1 = parseInt(c1);
				r2 = parseInt(r2 || r1); c2 = parseInt(c2 || c1);
				for(var c = c1 - 1; c < c2; c++) for(var r = r1 - 1; r < r2; r++) {
					cells.push(this.grid.getCell(r, c));
				}
			});
			return cells;
		};
		P.loadPuzzle = function(puzzle) {
			console.info('App.loadPuzzle(puzzle);', puzzle);
			//console.warn('App.loadPuzzle > Adding row/col cages:');
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
				var [r, c, val] = App.parseRCVal(given);
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
					var [r, c, val] = App.parseRCVal(cage.cageValue);
					//console.log(cage.cageValue, r, c, val);
					this.grid.getCell(r - 1, c - 1).setCageValue(val);
				}
			});
		};
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
			console.info('App.convertPuzzle(puzzle);', puzzle);
			var underlaySvg = document.querySelector('svg#underlay'),
					overlaySvg = document.querySelector('svg#overlay');
			var rows = puzzle.cells.length, cols = Math.max.apply(Math, puzzle.cells.map(row => row.length));
			this.createPuzzle({rows, cols});
			[...underlaySvg.children].forEach(child => (child.nodeName !== 'defs') ? child.remove() : null);
			[...overlaySvg.children].forEach(child => (child.nodeName !== 'defs') ? child.remove() : null);
			puzzle.lines.forEach(App.renderLine);
			puzzle.arrows.forEach(App.renderArrow);
			[].concat(puzzle.underlays, puzzle.overlays).forEach(part => {
				var target = puzzle.underlays.indexOf(part) !== -1 ? 'underlay' : 'overlay';
				if(typeof part.text === 'string' && part.text.length > 0) {
					App.renderText(Object.assign({}, part, {target}));
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
					App.renderRect(Object.assign({}, part, {target, borderColor, backgroundColor, opacity}));
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
		P.loadRemotePuzzle = function(puzzleId) {
			this.puzzleId = puzzleId;
			return Promise.resolve()
				.then(() => this.puzzleCache[puzzleId]
						? this.puzzleCache[puzzleId]
						: fetch('https://firebasestorage.googleapis.com/v0/b/sudoku-sandbox.appspot.com/o/' + puzzleId + '?alt=media')
							.then(res => res.json())
							.then(json => this.puzzleCache[puzzleId] = json)
				)
				.then(json => this.convertPuzzle(json))
				.then(puzzle => this.loadPuzzle(puzzle))
				.catch(err => console.error('fetch error:', err));
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
		P.serializeState = function() {
			return {
				puzzleId: app.puzzleId,
				cells: this.cells.map(cell => cell.toJSON()).filter(json => Object.keys(json).length > 0)
			};
		};
		P.deserializeState = function(state) {
			//"{"puzzleId":"DhJD3bG9bF","cells":[{"can":"2","rc":"r2c6"},{"can":"2","col":7,"hl":true,"rc":"r2c7"},{"val":"1","rc":"r3c5"},{"val":"1","rc":"r3c6"},{"col":7,"hl":true,"rc":"r3c7"}]}"
			//app.deserializeState(JSON.parse('{"puzzleId":"DhJD3bG9bF","cells":[{"can":"2","rc":"r2c6"},{"can":"2","col":7,"hl":true,"rc":"r2c7"},{"val":"1","rc":"r3c5"},{"val":"1","rc":"r3c6"},{"col":7,"hl":true,"rc":"r3c7"}]}'));
			return this.loadRemotePuzzle(state.puzzleId)
				.then(() => state.cells.forEach(cellState => {
					var [r, c] = App.parseRCVal(cellState.rc);
					var cell = this.grid.getCell(r - 1, c - 1);
					cell.fromJSON(cellState);
				}));
		};
	// Checker
		P.checkCells = function(cells, errors = []) {
			cells.forEach(cell => {
				if((cell.given || cell.value) === undefined) {
					//console.error('Error in cell values:', cell, cell.given || cell.value);
					errors.push({type: 'missing', expected: 'any value', found: cell.given || cell.value, cells: [cell], part: 'cell'});
				}
			});
			return errors;
		};
		P.checkCages = function(cages, errors = []) {
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
			//console.info('App.check();', this.currentPuzzle);
			var puzzle = this.currentPuzzle;
			if(!puzzle) return;
			this.clearHighlight();
			var errors = [];
			this.checkCells(this.cells, errors);
			this.checkCages(puzzle.cages, errors);
			this.cells.forEach(cell => cell.error(false));
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
	// Actions
		P.parseCells = function(cells) {
			//console.info('App.parseCells(cells);', cells);
			if(cells === 'none' || cells === '-' || cells === '') cells = [];
			if(cells === 'highlighted') cells = this.highlightedCells;
			if(cells === undefined) cells = this.highlightedCells;
			if(typeof cells === 'string') {
				//cells = (cells.split(/\s*,\s*/) || [])
				cells = (cells.split(App.reRCSplit) || [])
					.map(App.parseRCVal.bind(App))
					.map(([r, c, val]) => this.grid.getCell(r - 1, c - 1));
			}
			if(!Array.isArray(cells)) cells = [cells];
			if(cells === this.highlightedCells) cells = [...cells];
			//console.info('  AFTER parseCells:', cells, cells === this.highlightedCells);
			return cells;
		};
		P.cellsToString = function(cells) {
			//console.info('App.cellsToString(cells);', cells);
			if(cells === undefined) cells = 'none';
			if(cells === 'none') cells = [];
			if(!Array.isArray(cells)) cells = [cells];
			//console.log('cells:', cells);
			cells = cells.map(cell => cell.toRC()).join('');
			//console.log('cells:', cells);
			return cells || '-';
		};
		P.actionToString = function(action) {
			const type = App.ActionLongToShort[action.type] || '-';
			var arg = '-';
			if(type === 'hl') {
				arg = this.cellsToString(action.cells);
			}
			else if(action.value !== undefined) {
				arg = action.value;
			}
			return type + (arg !== '-' ? ':' + arg : '');
		};
		P.parseAction = function(action) {
			//console.info('App.parseAction(action);', action);
			if(typeof action === 'string') {
				//console.log('action:', );
				const [_, type, arg] = App.reActionStr.exec(action);
				action = {type: App.ActionShortToLong[type] || 'unknown'};
				if(type === 'hl') {
					action.cells = this.parseCells(arg);
				}
				else if(arg !== undefined && arg !== '-') {
					action.value = arg;
				}
			}
			else if(action.cells !== undefined) {
				action.cells = this.parseCells(action.cells);
			}
			return action;
		};
		P.exec = function(action) {
			//console.info('App.exec(action);', action);
			var {type, cells, value} = this.parseAction(action);
			if(cells === undefined) cells = this.highlightedCells;
			switch(type) {
				case 'highlight':
					if(this.cellsToString(cells) === this.cellsToString(this.highlightedCells)) {
						//console.log('Empty selection:', this.cellsToString(cells), this.cellsToString(this.highlightedCells));
						return false;
					}
					this.clearHighlight().highlightCells(cells);
					this.highlightedCells.length = 0;
					this.highlightedCells.push.apply(this.highlightedCells, cells);
					break;
				case 'clear': cells.forEach(cell => cell.clear()); break;
				case 'value': cells.forEach(cell => cell.setValue(value)); break;
				case 'candidates': cells.forEach(cell => cell.toggleCandidates(value)); break;
				case 'pencilmarks': cells.forEach(cell => cell.togglePencilMark(value)); break;
				case 'colour': cells.forEach(cell => cell.toggleColour(value)); break;
				default:
					console.error('App.act: unkown action type:', type, action);
					return false;
			}
			return true;
		};
		P.logReplayAct = function(act) {
			//this.replayStack.push({act, time: (Date.now() - this.startTime)});
			var t = Date.now(), dt = Date.now() - this.lastActTime;
			this.lastActTime = t;
			this.replayStack.push(act + '/' + Math.round(dt / App.logTimeResolutionMs));
		};
		P.act = function(action) {
			//console.info('App.act("%s");', this.actionToString(action));
			var act = typeof action === 'string' ? action : this.actionToString(action);
			if(action === 'ud' || action.type === 'undo') {
				if(this.undoStack.length > 0) {
					this.logReplayAct(act);
					var undoAct = this.undoStack.pop();
					this.redoStack.push(undoAct);
					this.clearPuzzle();
					this.undoStack.forEach(act => this.exec(act));
				}
			}
			else if(action === 'rd' || action.type === 'redo') {
				if(this.redoStack.length > 0) {
					this.logReplayAct(act);
					var redoAct = this.redoStack.pop();
					this.undoStack.push(redoAct);
					this.exec(redoAct);
				}
			}
			else {
				if(this.exec(action)) {
					this.logReplayAct(act);
					this.redoStack.length = 0;
					this.undoStack.push(act);
				}
			}
			//console.log('replayStack:', this.replayStack.join(','));
			//console.log('undoStack:', this.undoStack.join(','));
			//console.log('redoStack:', this.redoStack.join(','));
			//localStorage.getItem(key)
		};
		P.replayStop = function() {
			clearTimeout(this.replayTimeoutId);
		};
		P.replayPlay = function(replay, opts = {}) {
			console.info('App.replayPlay(replay, opts);', replay, opts);
			var actions = [...replay.actions], maxDelay = opts.maxDelay || 5000, speed = opts.speed || 1, step = 0;
			const nextStep = () => {
				var action = actions[step++];				
				if(action) {
					this.act(Object.assign({}, action, {time: undefined}));
					var nextAction = actions[step];
					if(nextAction) {
						if(speed !== -1) {
							var nextActionDelay = Math.min(maxDelay, (nextAction.time - action.time) / speed);
							this.replayTimeoutId = setTimeout(nextStep, nextActionDelay);
						}
						else {
							nextStep();
						}
					}
				}
				else console.warn('DONE!');
			};
			this.replayStop();
			this.restartPuzzle();
			console.log('actions:', actions);
			//nextStep();
		};
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
		P.highlightCells = function(cells) {
			if(cells !== undefined) {
				if(!Array.isArray(cells)) cells = [cells];
				cells.forEach(cell => cell.highlight(true));
					/*
					if(this.highlightedCells.indexOf(cell) === -1) { 
						cell.highlight(true);
						this.highlightedCells.push(cell);
					}
					*/
				//});
			}
			return this;
		};
		P.clearHighlight = function() {
			//console.info('App.clearHighlight();', this.highlightedCells);
			this.cells.forEach(cell => cell.error(false));
			this.highlightedCells.forEach(cell => cell.highlight(false));
			return this;
		};
		P.smartSelectCell = function(cell) {
			//console.info('App.smartSelectCell(cell);');
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
				case 'corner': selector = makeSelector(cell, ['normal', 'corner', 'colour', 'centre']); break;
				case 'centre': selector = makeSelector(cell, ['normal', 'centre', 'colour', 'corner']); break;
				case 'colour': selector = makeSelector(cell, ['colour', 'normal', 'centre', 'corner']); break;
			}
			if(selector !== undefined) cells = this.cells.filter(selector);
			if(cells.length > 0) {
				this.highlightedCells.length = 0;
				this.act({type: 'highlight', cells: cells});
			}
		};
	// Event Handlers
		P.attachHandlers = function() {
			document.addEventListener('mousedown', this.handleDragStart, {passive: false});
			document.addEventListener('mousemove', this.handleDragMove, {passive: false});
			document.addEventListener('mouseup', this.handleDragEnd, {passive: false});
			document.addEventListener('touchstart', this.handleDragStart, {passive: false});
			document.addEventListener('touchmove', this.handleDragMove, {passive: false});
			document.addEventListener('touchend', this.handleDragEnd, {passive: false});

			// Cells
				//this.grid.elem.addEventListener('mousedown', this.handleMousedown);
				//document.addEventListener('mousedown', this.handleMousedown);
				//document.addEventListener('dblclick', this.handleMousedblclick);
				//document.addEventListener('mouseup', this.handleMouseup);
				//this.grid.elem.addEventListener('mousemove', this.handleMousemove);
			// Keys
				document.addEventListener('keydown', this.handleKeydown, {useCapture: true});
				document.addEventListener('keyup', this.handleKeyup, {useCapture: true});
			// Outside
				//document.addEventListener('mousedown', this.handleCancel);
				document.addEventListener('blur', this.handleCancel);
				document.addEventListener('focusout', this.handleCancel);
				document.addEventListener('touchcancel', this.handleCancel);
			// Buttons
				document.querySelectorAll('button')
					.forEach(btn => {
						btn.addEventListener('keydown', this.handleButton);
						btn.addEventListener('click', this.handleButton);
					});
		};
		P.handleCancel = function(event) {
			console.info('App.handleCancel:', event.type, event, event.target);
			//if(event.target.dataset['control'] !== undefined) return;
			//this.handleMouseup(event);
			//console.log('this.paintState:', this.paintState);
			if(this.paintState === 'none') this.clearHighlight();
		};

		P.__handleMousedown = function(event) {
			//console.info('App.handleMousedown:', event.type, event);
			return;
			if(!event.target.classList.contains('cell')) {
				this.act({type: 'highlight', cells: 'none'});
				return this.clearHighlight();
			}
			if(this.testDot) {
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
				return;
			}
			this.paintState = 'highlight';
			this.paintStateVal = true;
			this.prevHighlightedCells = this.highlightedCells.map(cell => cell.toRC()).join(',');
			if(!event.ctrlKey && event.target.nodeName !== 'BUTTON') this.clearHighlight();

			var cell = this.grid.elemToCell(event.target);
			if(event.ctrlKey && cell.hasState('highlight')) {
				this.paintStateVal = false;
			}
			cell.highlight(this.paintStateVal);
		};
		P.__handleMousemove = function(event) {
			//console.info('App.handleMousemove:', event.type, event, event.target);
			return;
			if(this.testDot && this.dragLine) {
				var cell = this.grid.elemToCell(event.target);
				this.dragLine.setAttribute('d', [
					[this.dragCell.row + 0, this.dragCell.col + 0],
					[cell.row + 0, cell.col + 0]
				].map(([r, c], idx) => `${idx === 0 ? 'M' : 'L'}${64 * c} ${64 * r}`).join(' '));
				return;
			}
			var cell = this.grid.elemToCell(event.target);
			if(this.paintState === 'highlight') {
				cell.highlight(this.paintStateVal);
			}
		};
		P.__handleMouseup = function(event) {
			//console.info('App.handleMouseup:', event.type, event);
			if(this.paintState === 'highlight') {
				var nextHighlightedCells = this.cells.filter(cell => cell.hasState('highlight'));
				this.act({type: 'highlight', cells: nextHighlightedCells});
				this.paintState = 'none';
				this.paintStateVal = false;
			}
			if(this.testDot && this.dragLine) {
				this.dragLine = undefined;
			}
		};

		P.getEventTarget = function(event) {
			//console.warn('getEventTarget');
			var point = (event.touches && event.touches[0]) || event;
			//console.log('event:', event);
			//console.log('event.touches:', event.touches);
			//console.log('point:', point);
			return document.elementFromPoint(point.clientX, point.clientY);
		};
		P.handleLongPress = function(event) {
			//console.log('handleLongPress', event, event.target);
			var eventType = event.type.replace(/^(mouse|touch).*/, '$1');
			var lastTap = this.doubleTaps[eventType];
			if(lastTap !== undefined) {
				lastTap.time = Date.now();
				this.handleDoubleTap(event);
			}
			/*
			this.cancelLongPress();
			if(event.target.classList.contains('cell')) {
				var cell = this.grid.elemToCell(event.target);
				if(cell) this.smartSelectCell(cell);
			}
			*/
		};
		P.cancelLongPress = function() {
			if(this.longPressTimoutId === undefined) return;
			//console.warn('cancelLongPress');
			clearTimeout(this.longPressTimoutId);
			this.longPressTimoutId = undefined;
		};
		P.handleDoubleTap = function(event) {
			var eventType = event.type.replace(/^(mouse|touch).*/, '$1');
			var point = (event.touches && event.touches[0]) || event;
			var now = Date.now(), pos = {x: point.clientX, y: point.clientY};
			//console.log('handleDoubleTap:', eventType);
			var lastTap = this.doubleTaps[eventType];
			if(lastTap !== undefined) {
				var dx = lastTap.x - pos.x, dy = lastTap.y - pos.y;
				var dist = Math.round(Math.sqrt(dx * dx + dy * dy));
				var interval = now - lastTap.time;
				if(interval < App.doubleTapInterval && dist < App.doubleTapDistance) {
					//console.log('handleDoubleTap EXEC:', interval, dist);
					this.dragType = undefined;
					this.cancelLongPress();
					if(event.target.classList.contains('cell')) {
						var cell = this.grid.elemToCell(event.target);
						if(cell) this.smartSelectCell(cell);
					}
					delete this.doubleTaps[eventType];
					return;
				}
			}
			this.doubleTaps[eventType] = {x: pos.x, y: pos.y, time: now};
		};
		P.handleDragStart = function(event) {
			var eventType = event.type.replace(/^(mouse|touch).*/, '$1');
			if(this.dragType !== undefined) return;
			if(event.target.nodeName === 'BUTTON') return;
			if(eventType !== 'touch') {
				// Try to filter mouse events caused by touch events
				if(Date.now() - this.lastTouchEvent < 150) return;
			}
			if(eventType === 'touch') this.lastTouchEvent = Date.now();
			//console.log('handleDragStart', eventType, event);
			this.handleCancelRestartPuzzle();
			this.dragType = eventType;
			this.cancelLongPress();
			this.longPressTimoutId = setTimeout(() => this.handleLongPress(event), App.LongPressTimeout);
			if(!event.target.classList.contains('cell')) {
				this.act({type: 'highlight', cells: 'none'});
				return this.clearHighlight();
			}
			this.highlighting = true;
			if(!event.ctrlKey && event.target.nodeName !== 'BUTTON') this.clearHighlight();
			var cell = this.grid.elemToCell(event.target);
			if(cell) {
				if(event.ctrlKey && cell.hasState('highlight')) this.highlighting = false;
				cell.highlight(this.highlighting);
			}
			this.handleDoubleTap(event);
		};
		P.handleDragMove = function(event) {
			var eventType = event.type.replace(/^(mouse|touch).*/, '$1');
			//console.log('handleDragMove', this.dragType, this.highlighting);
			if(this.dragType !== eventType) return;
			//this.cancelLongPress();
			var eventTarget = this.getEventTarget(event);
			if(this.highlighting !== undefined) {
				var cell = this.grid.elemToCell(eventTarget);
				if(cell) {
					cell.highlight(this.highlighting);
				}
			}
		};
		P.handleDragEnd = function(event) {
			var eventType = event.type.replace(/^(mouse|touch).*/, '$1');
			if(this.dragType !== eventType) return;
			//console.log('handleDragEnd', this.dragType);
			this.cancelLongPress();
			this.dragType = undefined;
			if(this.highlighting !== undefined) {
				var nextHighlightedCells = this.cells.filter(cell => cell.hasState('highlight'));
				this.act({type: 'highlight', cells: nextHighlightedCells});
				this.highlighting = undefined;
			}
			//event.preventDefault();
			if(eventType === 'touch') this.lastTouchEvent = Date.now();
		};
	
		P.__handleMousedblclick = function(event) {
			//console.info('App.handleMousedblclick:', event.type, event);
			if(event.target.classList.contains('cell')) {
				var cell = this.grid.elemToCell(event.target);
				if(cell) this.smartSelectCell(cell);
			}
		};
		P.handleKeydown = function(event) {
			//console.info('App.handleKeydown:', event.type, event, event.target);
			if(event.repeat) return;
			if(App.reDigit.test(event.code)) {
				this.act({type: App.ModeToAction[this.mode], value: event.code.replace(App.reDigit, '$1')});
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
				this.clearHighlight();
				this.act({type: 'highlight', cells: 'none'});
			}
			else if(event.code === 'Space') {
				var mode = this.prevMode || this.mode;
				var nextMode = App.Modes[(App.Modes.indexOf(mode) + (event.shiftKey ? 3 : 1)) % 4];
				this.changeMode(nextMode);
			}
			else if(['Backspace', 'Delete'].includes(event.key)) {
				this.act({type: 'clear'});
			}
			else if(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(event.key)) {
				var highlightedCells = this.highlightedCells;
				if(highlightedCells.length > 0) {
					var highlightCell = this.highlightedCells[this.highlightedCells.length - 1];
					console.log('highlightedCells.length:', highlightedCells.length);
					var {row, col} = highlightCell;
					var cols = this.grid.cells.length, rows = this.grid.cells[row].length;
					switch(event.key) {
						case 'ArrowLeft': col = (col + cols - 1) % cols; break;
						case 'ArrowRight': col = (col + cols + 1) % cols; break;
						case 'ArrowUp': row = (row + rows - 1) % rows; break;
						case 'ArrowDown': row = (row + rows + 1) % rows; break;
					}
					highlightCell = this.grid.getCell(row, col);
					if(!event.ctrlKey) {
						this.clearHighlight().highlightCells(highlightCell);
						this.act({type: 'highlight', cells: highlightCell});
					}
					else {
						this.highlightCells(highlightCell);
						this.act({type: 'highlight', cells: this.highlightedCells.concat(highlightCell)});
					}
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
				this.act({type: App.ModeToAction[this.mode], value: parseInt(control)});
			}
			else if(control.match(/^(normal|corner|centre|colour)$/)) {
				this.changeMode(control);
			}
			switch(control) {
				case 'delete': this.act({type: 'clear'}); break;
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
					this.loadRemotePuzzle(document.querySelector('input[data-control="puzzleid"]').value);
					break;
				case 'savereplay':
					this.savedReplay = JSON.stringify({puzzleId: this.puzzleId, actions: this.replayStack.join(',')});
					console.log('savedReplay:', this.savedReplay);
					break;
				case 'replayplay': this.replayPlay(JSON.parse(this.savedReplay)); break;
				case 'replayff': this.replayPlay(JSON.parse(this.savedReplay), {maxDelay: 0, speed: -1}); break;
				case 'replaystop': this.replayStop(); break;
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
				case 'testdot': this.testDotPuzzle(); break;
			}
			//console.log(event.target.dataset['data-control']
		};
	return App;
})();

document.addEventListener('DOMContentLoaded', () => {
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
		
	// Plain Sudoku: 73FN293dR8
	// Killer: hHRgM7R8h7
	
	var puzzleId = new URLSearchParams(document.location.search).get('puzzleid');
	if(typeof puzzleId !== 'string') puzzleId = (document.location.pathname.match(/^\/sudoku\/([^/]+)$/) || [])[1];
	if(typeof puzzleId === 'string') app.loadRemotePuzzle(puzzleId);
		
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
			replay: 'hl:r1c2r1c3r2c1r2c2r3c1,hl:r1c2r1c3r2c1r2c2r3c1r7c1r8c1r8c2r9c2r9c3,hl:r1c2r1c3r2c1r2c2r3c1r7c1r7c9r8c1r8c2r8c8r8c9r9c2r9c3r9c7r9c8,hl:r1c2r1c3r1c7r1c8r2c1r2c2r2c8r2c9r3c1r3c9r7c1r7c9r8c1r8c2r8c8r8c9r9c2r9c3r9c7r9c8,cd:1,cd:2,cd:3,cd:4,cd:5,hl:r1c8,hl:r1c8r2c9,hl:r1c2r1c8r2c9,hl:r1c2r1c8r2c1r2c9,hl:r1c2r1c8r2c1r2c9r8c1,hl:r1c2r1c8r2c1r2c9r8c1r9c2,hl:r1c2r1c8r2c1r2c9r8c1r9c2r9c8,hl:r1c2r1c8r2c1r2c9r8c1r8c9r9c2r9c8,hl:r9c8,hl:r8c9r9c8,hl:r2c9r8c9r9c8,hl:r1c8r2c9r8c9r9c8,hl:r1c2r1c8r2c9r8c9r9c8,hl:r1c2r1c8r2c1r2c9r8c9r9c8,hl:r1c2r1c8r2c1r2c9r8c1r8c9r9c8,hl:r1c2r1c8r2c1r2c9r8c1r8c9r9c2r9c8,cd:5,hl:r2c3r3c3,hl:r2c3r3c3r7c3r8c3,cd:6,cd:7,cd:8,cd:9,hl:r2c7r3c7,hl:r2c7r3c7r7c7r8c7,cd:6,cd:7,cd:8,cd:9,hl:r3c8,hl:r3c8r7c8,hl:r3c8r7c2r7c8,hl:r3c2r3c8r7c2r7c8,cd:6,cd:7,cd:8,cd:9,hl:r7c4r7c5r7c6,hl:r4c7r5c7r6c7r7c4r7c5r7c6,hl:r3c4r3c5r3c6r4c7r5c7r6c7r7c4r7c5r7c6,hl:r3c4r3c5r3c6r4c3r4c7r5c3r5c7r6c3r6c7r7c4r7c5r7c6,cd:1,cd:2,cd:3,cd:4,cd:5,hl,hl:r8c5,hl:r8c5r9c4,hl:r5c8r8c5r9c4,hl:r4c9r5c8r8c5r9c4,cd:8,cd:9,hl:r7c6,vl:5,hl:r6c7,vl:5,hl:r4c7r5c7,hl:r1c7r4c7r5c7,hl:r1c7r4c7r5c7r9c7,hl:r1c7r4c7r5c7r7c9r9c7,hl:r1c7r4c7r5c7r7c4r7c5r7c9r9c7,hl:r1c7r4c7r5c7r7c1r7c4r7c5r7c9r9c7,cd:5,hl:r6c3,cd:5,hl:r3c6,cd:5,hl:r8c8,hl:r9c8,hl:r8c8,vl:5,hl:r2c8,hl:r3c9,vl:5,hl:r2c8,cd:5,hl:r3c1,cd:5,hl:r8c2,cd:5,hl:r9c3,vl:5,hl:r1c3,cd:5,hl:r2c2,vl:5,hl:r4c3r5c3,cd:5,hl:r3c4r3c5,cd:5,hl,hl:r4c1r5c1,pm:5,hl:r1c4r1c5,pm:5,hl:r2c4,hl:r1c5,hl:r5c8,hl:r4c7r5c8,hl:r3c6r4c7r5c8,hl:r6c9,hl:r2c5r6c9,hl:r1c4r2c5r6c9,hl:r4c8,hl:r4c7,vl:1,hl:r6c9,vl:2,hl:r5c7,cd:1,cd:2,hl:r7c9r8c9,cd:2,hl:r6c3,cd:2,hl:r2c9,cd:2,hl:r1c7,cd:1,hl:r9c7,cd:1,hl:r4c3,cd:1,hl:r5c8,vl:8,hl:r4c9,vl:9,hl:r3c8,cd:8,hl:r7c8,cd:8,hl:r1c4,vl:5,hl:r1c5,pm:5,hl:r2c5,hl:r2c5r3c6,hl:r2c5,cd:1,cd:2,hl:r3c6,cd:3,cd:4,hl:r3c4r3c5,cd:1,cd:2,hl:r3c1,cd:3,cd:4,hl:r4c7,cl,hl:r6c9,cl,cd:1,cd:2,hl:r4c7,cd:3,cd:4,hl:r4c5r5c5,pm:5,hl:r2c9,cd:2,hl:r1c7,cd:1,hl:r6c3,cd:2,hl:r4c3,cd:1,hl:r3c1,hl:r1c3,cd:1,cd:2,hl:r4c1,hl:r4c1r5c2,hl:r4c3,hl:r3c4r4c3,hl:r2c5r3c4r4c3,hl:r1c6,hl:r1c6r5c2,hl:r1c6r5c2r6c1,hl:r1c6,vl:9,hl:r5c2,hl:r5c2r6c1,cd:8,cd:8,cd:8,cd:9,hl:r4c3,hl:r3c4r4c3,hl:r2c5r3c4r4c3,hl:r2c5,vl:2,hl:r3c4,vl:4,hl:r4c3,vl:4,hl:r3c5,vl:3,hl:r5c3r6c3,cd:4,hl:r5c2,vl:9,hl:r6c1,vl:8,hl:r3c2,cd:9,hl:r7c2,cd:9,hl:r4c4r4c5,hl:r4c6,hl:r4c4r4c5r4c6r5c4r5c5r5c6r6c6,hl:r6c4r6c5,pm:9,hl:r3c6,vl:1,hl:r3c1,vl:2,hl:r2c1,cd:2,hl:r1c2,cd:2,hl:r7c1r8c1,cd:2,hl:r7c5,cd:2,hl:r1c7r1c8,hl:r2c8r2c9,cd:2,hl:r1c7r1c8,pm:2,hl:r2c9,hl:r1c8,cd:3,hl:r2c9,hl:r1c8,hl:r2c9,hl:r1c2,hl:r1c2r2c1,cd:3,hl:r1c3,vl:3,hl:r5c3r6c3,cd:3,hl:r1c7,cd:3,hl:r4c1,hl:r5c2,hl:r5c2r8c5,hl:r5c2r7c4r8c5,hl:r5c2r6c3r7c4r8c5,hl:r4c1,hl:r4c1r9c6,hl:r8c1,hl:r9c2,hl:r8c1,hl:r9c2,cd:3,hl:r8c1r8c2,hl:r8c1,hl:r7c1,hl:r8c2,cd:3,hl:r2c8,hl:r1c7,hl:r2c8,hl:r7c1,hl:r8c2,hl:r8c2r9c2,hl:r7c1r8c1,hl:r9c8,hl:r8c9,hl:r9c8,cd:4,cd:4,cd:3,hl:r7c7,hl:r1c5,hl:r1c5r2c4,hl:r1c5,hl:r2c4,hl:r1c5r2c4,hl:r1c5r2c4r4c2,hl:r1c5r2c4r4c2r5c1,hl:r3c3,hl:r2c4,hl:r3c3,hl:r4c2,hl:r4c2r5c1,hl:r1c5r4c2r5c1,hl:r1c5r2c4r4c2r5c1,hl:r5c9,hl:r4c8r5c9,hl:r2c6r4c8r5c9,hl:r1c5r2c6r4c8r5c9,hl:r5c9,hl:r4c8r5c9,hl:r1c5,hl:r1c5r2c6,hl:r9c5,hl:r4c1,hl:r4c1r9c6,hl:r5c2,hl:r5c2r8c5,hl:r5c2r6c3r8c5,hl:r5c2r6c3r7c4r8c5,hl:r4c1,hl:r6c9,hl:r4c1,hl:r5c1,hl:r5c1r6c2,hl:r5c1r6c2r8c4,hl:r5c1r6c2r8c4r9c5,hl:r7c3,hl:r5c1,hl:r5c1r6c2,hl:r7c3,hl:r6c2r7c3,hl:r5c1r6c2r7c3,hl:r8c4,hl:r8c4r9c5,hl:r7c1r8c1,pm:3,hl:r8c2r9c2,pm:2,hl:r5c3r6c3,hl:r6c3,hl:r6c4,hl:r6c2,hl:r4c2r6c2,pm:3,hl:r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9,hl:r4c6r5c6r6c6r7c6,hl:r4c6r5c6r6c4r6c5r6c6r7c6,hl:r4c4r4c5r5c4r5c5,hl:r4c5r5c5r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9,hl:r6c8,hl:r1c6r2c6r3c6r4c6r5c6r6c6r7c6r8c6r9c6,hl:r2c6,hl:r1c5r2c6,hl:r1c5r2c4r2c6,cd:6,cd:7,cd:8,hl:r1c8r2c8r3c8r4c8r5c8r6c8,hl:r2c7r3c7,pm:8,hl:r2c3r3c3,hl:r5c5,hl:r2c3r3c3,pm:9,hl:r7c3r8c3,cd:9,hl:r9c1,vl:9,hl:r9c4,vl:8,hl:r8c5,vl:9,hl:r8c7,cd:9,hl:r1c5,hl:r2c4,cd:8,hl:r6c5,hl:r6c4,vl:9,hl:r6c5,pm:9,hl:r7c7r7c8,pm:9,hl:r1c3r2c3r3c3r4c3r5c3r5c4r6c4r7c4r8c4r9c4,hl:r1c4r2c4,hl:r4c4r5c4r6c4r7c4r8c4r9c4,hl:r4c5r4c6,pm:8,hl:r7c7r7c8,hl:r2c7r3c7,pm:8,hl:r1c8r2c8r3c8,hl:r1c9,hl:r1c4r2c4r3c4r4c4r5c4r6c4r7c4r8c4r9c4,hl:r1c4r2c4r3c4r4c4r5c4r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9r7c4r8c4r9c4,hl:r1c4r2c4r3c4r4c4r5c1r5c2r5c3r5c4r5c5r5c6r5c7r5c8r5c9r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9r7c4r8c4r9c4,hl:r1c4r2c4r3c4r4c1r4c2r4c3r4c4r5c1r5c2r5c3r5c4r5c5r5c6r5c7r5c8r5c9r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9r7c4r8c4r9c4,hl:r1c1r1c4r2c1r2c4r3c1r3c4r4c1r4c2r4c3r4c4r5c1r5c2r5c3r5c4r5c5r5c6r5c7r5c8r5c9r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9r7c1r7c4r8c1r8c4r9c1r9c4,hl:r1c1r1c4r2c1r2c4r3c1r3c4r4c1r4c2r4c3r4c4r4c7r4c8r4c9r5c1r5c2r5c3r5c4r5c5r5c6r5c7r5c8r5c9r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9r7c1r7c4r8c1r8c4r9c1r9c4,hl:r1c1r1c4r1c8r2c1r2c4r2c8r3c1r3c4r3c8r4c1r4c2r4c3r4c4r4c7r4c8r4c9r5c1r5c2r5c3r5c4r5c5r5c6r5c7r5c8r5c9r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9r7c1r7c4r7c8r8c1r8c4r8c8r9c1r9c4r9c8,hl:r1c1r1c4r1c8r2c1r2c4r2c8r3c1r3c4r3c8r4c1r4c2r4c3r4c4r4c7r4c8r4c9r5c1r5c2r5c3r5c4r5c5r5c6r5c7r5c8r5c9r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9r7c1r7c4r7c8r8c1r8c4r8c8r9c1r9c2r9c3r9c4r9c5r9c6r9c7r9c8r9c9,hl:r7c7r8c7,pm:8,hl:r1c9,vl:8,hl:r2c7r3c7,cd:8,hl:r1c1r1c2r1c3r1c4r1c5r1c6r1c7r1c8r1c9,hl:r1c5,cd:8,hl:r2c6,vl:8,hl:r2c3,cd:8,hl:r3c3,vl:8,hl:r2c3,vl:9,hl:r2c7,cd:9,hl:r3c7,hl:r3c7r3c8,pm:9,hl:r2c3r3c3,hl:r7c3r8c3,cd:8,hl:r7c2,vl:8,hl:r7c7,hl:r8c7,vl:8,hl:r7c7,cd:8,pm:8,hl:r5c7r5c8r5c9r6c2r6c3r6c4r6c5r6c6,hl:r3c4r4c4r5c4r6c4,hl:r2c6r3c4r3c6r4c4r4c6r5c4r5c6r6c4r6c6r7c6r8c6r8c7,hl:r2c6r3c4r3c6r4c4r4c6r5c4r5c6r5c7r5c8r6c3r6c4r6c5r6c6r6c7r7c6r8c6r8c7,hl:r2c6r3c4r3c6r4c4r4c6r5c4r5c5r5c6r5c7r5c8r6c3r6c4r6c5r6c6r6c7r7c6r8c6r8c7,hl:r4c5,vl:8,hl:r4c6,pm:8,hl:r5c5,vl:5,hl:r7c5,hl:r5c5,hl:r4c6r5c6r6c6,hl:r6c5,hl:r3c2,cd:8,hl:r3c7r3c8,hl:r1c1,cd:6,cd:7,hl:r9c7,hl:r2c8r2c9,pm:3,hl:r3c2r3c3r3c4r3c5r3c6r3c7r3c8r3c9,hl:r6c5,hl:r6c5r9c5,cd:1,cl,hl:r6c5r7c5,cd:3,hl:r5c1,hl:r4c1,vl:5,hl:r5c1,pm:5,hl:r1c1r2c1r3c1r4c1r5c1r6c1r7c1r8c1r9c1,hl:r9c1r9c2r9c3r9c4r9c5r9c6r9c7r9c8r9c9,hl:r4c2,hl:r4c2r5c1,hl:r4c2r5c1r6c2,cd:3,cd:6,cd:7,hl:r7c3,hl:r1c2r2c2r3c2r4c2r5c2r6c2,hl:r7c3,hl:r1c2r2c2r3c2r4c2r5c2r6c2r7c2r8c2r9c2,hl:r6c5,cl,hl:r6c6,hl:r1c5r2c5r3c5r4c5r5c5r6c5r7c5r8c5r9c5,hl:r9c7r9c8,hl:r2c5r2c6r2c7r2c8r2c9,hl:r1c7r1c8,hl:r5c3r6c3,hl:r8c2r9c2,hl:r7c4,cd:4,hl:r7c5,hl:r7c9,hl:r8c9,hl:r9c8,hl:r8c9,hl:r7c9,hl:r7c9r8c9r9c7r9c8r9c9,cl,hl:r9c7,hl:r9c8,hl:r8c9r9c8,hl:r7c9r8c9r9c8,hl:r7c9r8c9r9c7r9c8,cd:2,cd:1,cd:3,cd:4,hl:r8c9,hl:r9c8,hl:r9c6,hl:r9c7,hl:r7c9r9c7,hl:r1c7r1c8r2c8r2c9,hl:r4c7,hl:r4c7r6c9,hl:r9c7,hl:r9c8,hl:r4c1,hl:r4c1r5c2,hl:r4c1r5c2r8c5,hl:r6c3,hl:r6c3r7c4,hl:r6c3r7c4r9c6,hl:r9c6,vl:7,hl:r7c4,vl:3,hl:r6c3,vl:2,hl:r5c3,vl:1,hl:r7c2,hl:r7c1,cd:3,hl:r8c1,vl:3,hl:r7c1,pm:3,hl:r7c9,cd:3,hl:r8c9,cd:3,hl:r9c8,hl:r8c9,hl:r9c8,cd:2,hl:r7c9,hl:r9c7,cd:2,hl:r7c9r8c9,pm:2,hl:r9c7r9c8,pm:3,hl:r7c9r8c9,hl:r2c9,hl:r7c4,hl:r9c6,hl:r3c4r3c5r3c6r4c4r4c6r5c4r5c6r6c6r7c6r8c6r9c6,hl:r5c6,hl:r1c5r2c5r3c5r4c4r4c5r5c4r6c4r7c4,hl:r1c4r1c5,hl:r7c4,hl:r4c6r5c6r6c6,hl:r7c4,hl:r7c9r8c9,hl:r6c9,vl:1,hl:r4c7,vl:2,hl:r6c9r7c9r8c9,hl:r6c9,hl:r7c9r8c9,cd:1,hl:r2c9,cd:1,hl:r1c7,cd:2,hl:r7c9,vl:2,hl:r8c9,vl:4,hl:r9c7r9c8,cd:4,hl:r9c7,vl:3,hl:r9c8,vl:1,hl:r9c9,cd:6,cd:7,cd:9,cd:9,hl:r5c9,hl:r2c9,vl:2,vl:3,hl:r2c8,pm:3,hl:r1c8,hl:r2c8,hl:r1c8r2c8,cd:1,hl:r9c2,cd:1,hl:r7c1r7c2r7c3r7c4r7c5r7c6r7c7r7c8r7c9,hl:r8c5,hl:r8c2r9c2,hl:r9c2,hl:r8c2,cd:4,hl:r5c7,vl:4,hl:r1c7,vl:1,hl:r1c2,vl:4,hl:r2c1,vl:1,hl:r1c8,vl:2,hl:r2c8,vl:4,hl:r9c2,vl:2,hl:r8c2,vl:1,hl:r7c1,vl:4,hl:r7c5,vl:1,hl:r9c5,hl:r9c9,vl:6,hl:r7c7r7c8,cd:6,hl:r9c6,hl:r9c5,vl:4,hl:r8c6,hl:r8c4r8c6,cd:2,cd:6,cd:7,cd:7,hl:r8c6,hl:r8c4,hl:r7c3,vl:6,hl:r8c3,vl:7,hl:r5c1,cd:3,hl:r3c2,hl:r3c7r3c8,hl:r6c8,hl:r5c9,vl:7,hl:r6c8,hl:r4c8r6c8,cd:3,cd:6,hl:r6c9,hl:r7c8,hl:r4c8r5c8r6c8,hl:r3c8,cd:6,hl:r2c7r3c7,pm:6,hl:r6c5,cd:6,cd:7,hl:r4c1r4c3r4c4r4c5r4c6r4c7r4c8,hl:r5c4,hl:r5c4r5c6,pm:2,hl:r4c1r4c2r4c3r4c4r4c5r4c6r4c7r4c8r4c9,hl:r5c3,hl:r5c4r5c5r5c6r5c7r6c2r6c3r6c4r6c5r6c6,hl:r4c4,vl:1,hl:r6c4r6c5r6c6r6c7r6c8,hl:r1c4r2c4r3c4r4c4r5c4r6c4r7c4r8c4r9c4,hl:r3c5r4c5r5c5r6c5r7c5,hl:r4c6r5c6r6c6,hl:r5c6,vl:3,hl:r5c4,vl:2,hl:r5c1,vl:6,hl:r4c2r5c2r6c2,cd:6,hl:r5c3,hl:r3c2,vl:6,hl:r1c1,vl:7,hl:r1c5,vl:6,hl:r2c4,vl:7,hl:r2c7,vl:6,hl:r3c7,cd:6,hl:r8c4,vl:6,hl:r8c6,vl:2,hl:r6c5,vl:7,hl:r6c2,vl:4,vl:4,vl:3,hl:r4c2,vl:7,hl:r6c8,vl:6,hl:r4c8,vl:3,hl:r4c6,hl:r4c6r6c6,hl:r7c6,hl:r6c6,vl:4,hl:r4c6,vl:6,hl:r9c5,hl:r6c8r9c5,hl:r5c9r6c8r9c5,hl:r5c9r6c8r8c6r9c5,hl:r7c7,vl:7,hl:r7c8,vl:9,hl:r3c8,vl:7,hl:r3c7,vl:9',
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
			replay: 'hl:r6c2,hl:r1c7r1c8r1c9r2c7r2c8r2c9r3c8r3c9,hl:r3c1r3c2,hl:r4c1,hl:r3c1,hl:r3c2,hl:r3c1r3c2r4c1,pm:1,hl:r4c4,hl:r4c8r4c9r5c9,pm:1,hl:r6c9,hl:r4c5r4c6r5c6,cd:1,cd:2,cd:4,hl:r6c6r7c5r7c6,hl:r8c7r9c7r9c8,hl:r1c8r2c8,hl:r1c9,vl:9,hl:r1c8,vl:7,hl:r2c8,vl:6,hl:r1c8r1c9r2c8,cl,pm:9,hl:r1c1r1c2r2c1,pm:9,hl:r3c4r3c5r3c6,pm:9,hl:r2c6r3c4r3c5r3c6,hl:r2c6,hl:r3c6,hl:r8c7r9c7r9c8,pm:9,hl:r9c8,hl:r2c4r3c4r3c5,hl:r3c5,hl:r2c4r3c4,hl:r3c4r3c5,pm:9,hl:r3c6,vl:9,hl:r2c7,hl:r2c6,hl:r3c7,hl:r3c5,hl:r4c4r5c3r5c4,pm:9,hl:r8c7r9c7,hl:r9c7,hl:r4c1,pm:1,hl:r4c2,hl:r9c8,hl:r1c8r2c8r9c8,hl:r1c9,hl:r1c9r8c7r9c7,hl:r6c6,hl:r7c6,hl:r5c5r6c4r6c5,hl:r3c3r4c2r4c3,hl:r3c3,hl:r4c3,vl:8,hl:r4c2,vl:7,hl:r3c3,vl:6,hl:r3c3r4c2r4c3,cl,hl:r3c3,vl:9,hl:r4c3,vl:7,hl:r4c2,vl:5,hl:r3c3r4c2r4c3,cl,hl:r3c3,vl:8,cl,vl:9,hl:r4c3,vl:8,hl:r3c3r4c3,cl,hl:r7c5,hl:r4c5,hl:r5c8,hl:r1c4r1c5r2c4r2c5r3c4r3c5,hl:r1c4r1c5r2c4r2c5r3c4r3c5r3c6,hl:r3c6,hl:r1c6r2c6,cd:7,cd:8,hl:r2c4,hl:r6c6r7c6,hl:r6c6r7c5r7c6,hl:r6c6r7c6,cd:5,cd:6,hl:r7c5,hl:r6c6r7c6,cl,hl:r7c5,cd:8,cd:9,hl:r6c6r7c6,pm:6,cd:6,cd:5,cd:4,hl:r6c7,hl:r3c7r3c8,hl:r3c7,cd:2,cd:3,hl:r5c5r5c6r6c4r6c5r6c6,hl:r5c5r6c4r6c5,cd:3,cd:5,cd:7,hl:r6c6,cd:5,hl:r4c4r5c4,cd:6,cd:8,cd:9,hl:r6c6,cd:6,cd:6,cd:4,cd:8,hl:r4c4r5c4,hl:r5c3,pm:9,cd:5,cd:7,hl:r6c6r7c6,hl:r4c4r5c4,hl:r6c6,hl:r4c4r5c4,hl:r6c6,vl:6,hl:r7c6,cd:6,pm:6,hl:r6c6,pm:6,hl:r7c6,hl:r4c4r5c4,cd:6,hl:r5c3,vl:5,hl:r5c5,cd:5,hl:r6c4r6c5,pm:5,hl:r9c4,vl:2,hl:r7c1r7c2r7c3r8c1r8c2r8c3r9c1r9c2r9c3,hl:r9c4,hl:r7c3,vl:8,hl:r6c2r6c3,hl:r7c3,hl:r6c2r6c3,cd:2,cd:4,hl:r4c1,hl:r3c1r3c2r4c1,hl:r3c1r3c2,hl:r4c8r4c9r5c9,hl:r4c5r4c6r4c8r4c9r5c6r5c9,hl:r6c1,vl:1,hl:r3c1,pm:1,hl:r3c2,vl:1,hl:r3c1,hl:r3c1r4c1,cd:2,cd:5,cd:3,cd:4,hl:r4c1,cd:5,hl:r3c1,cd:2,hl:r8c3r9c3,pm:1,cd:1,cd:9,pm:1,hl:r1c3r2c3r3c3r4c3r5c3r6c3r7c3r8c3r9c3,hl:r1c3r2c3r3c1r3c2r3c3r3c4r3c5r3c6r4c3r5c3r6c3r7c3r8c3r9c3,hl:r4c4,hl:r1c3r2c3r3c3r4c3r5c3r6c3r7c3r8c3r9c3,hl:r1c3r2c2r2c3,hl:r6c4,hl:r3c3r4c2r4c3,hl:r4c2,hl:r8c6r9c5r9c6,hl:r8c2r8c6r9c1r9c2r9c5r9c6,hl:r8c6r9c5r9c6,hl:r9c6,hl:r8c8r9c8,hl:r8c8r8c9r9c9,hl:r6c9,hl:r6c9r7c8r7c9,hl:r7c9,hl:r1c8r1c9r2c8,hl:r1c8r1c9r2c8r8c7r9c7r9c8,hl:r6c8r6c9,hl:r4c7,hl:r5c9,hl:r6c8,hl:r3c1r3c2r3c3r3c4r3c5r3c6r3c7r3c8r3c9,hl:r8c6r9c6,pm:3,hl:r5c5r6c4r6c5,hl:r8c6r9c6,hl:r8c6r9c5r9c6,hl:r9c5,hl:r8c6r9c6,hl:r9c5,hl:r4c7r4c8r4c9,pm:5,hl:r1c3r2c3r3c1r3c2r3c3r4c3r5c3r6c3r7c3r8c3r9c3,hl:r1c1r1c2r2c1,hl:r1c3r2c3r3c3r4c3r5c3r6c3r7c3r8c3r9c3,hl:r9c3,hl:r4c1,vl:3,hl:r3c1,hl:r3c2,hl:r3c1,vl:3,vl:4,hl:r1c1r2c1r3c1r4c1r5c1r6c1r7c1r8c1r9c1,hl:r4c1r4c2r4c3r4c4r4c5r4c6r4c7r4c8r4c9,hl:r5c6,hl:r5c1r5c2,cd:7,cd:9,hl:r5c4,vl:8,hl:r4c4,vl:0,vl:9,hl:r5c5,vl:3,hl:r6c3r6c4r6c5,hl:r6c4r6c5,cd:3,hl:r5c1r5c2r5c3r5c4r5c5r5c6r5c7r5c8r5c9,hl:r6c7r6c8r6c9,cd:3,cd:8,cd:9,hl:r6c7,hl:r6c8,hl:r6c7r6c8,hl:r6c8,hl:r6c7r6c8,cd:9,hl:r6c9,vl:9,hl:r7c7,vl:1,hl:r6c7r6c8,hl:r7c7,hl:r1c7r2c7r3c7r4c7r5c7r6c7r7c7r8c7r9c7,hl:r1c8r1c9r2c8r2c9r3c8r3c9,hl:r2c9r3c8r3c9,hl:r2c9,vl:1,hl:r4c9r5c9,hl:r4c8,vl:1,hl:r4c9r5c9,pm:1,hl:r4c9,vl:5,hl:r5c9,vl:2,hl:r5c6,cd:2,hl:r5c7r5c8,hl:r4c5r4c6,cd:1,hl:r5c6,vl:1,hl:r5c7r5c8,cd:4,cd:6,hl:r4c7,vl:7,hl:r4c2r4c3,cd:6,cd:8,hl:r4c3,vl:6,hl:r4c2,vl:8,hl:r3c3,vl:7,hl:r4c3,hl:r3c8r3c9,cd:8,cd:5,hl:r4c9,hl:r3c9,vl:8,hl:r3c8,vl:5,hl:r3c4r3c5,cd:3,cd:4,cd:6,cd:6,cd:7,cd:7,cd:6,hl:r4c5,hl:r3c6,hl:r3c5,cd:3,hl:r3c4,hl:r3c5,vl:6,hl:r3c4,vl:3,hl:r3c4r3c5,cl,cl,cd:2,cd:3,cd:6,hl:r4c5r5c5,hl:r3c5,cd:3,hl:r2c4,cd:2,cd:3,cd:6,hl:r2c4r3c4,cd:1,cd:1,cd:2,hl:r3c5,vl:2,hl:r3c7,vl:3,hl:r2c6,vl:7,hl:r1c6,vl:8,hl:r6c7,vl:8,hl:r6c8,vl:3,hl:r1c7r2c7,cd:2,cd:4,hl:r5c7,vl:6,hl:r5c8,vl:4,hl:r8c7r9c7,cd:5,cd:9,hl:r9c8,pm:9,hl:r1c9,pm:9,hl:r8c7r9c7,pm:9,hl:r9c8,vl:8,hl:r1c8r1c9r2c8,cd:9,cd:6,cd:7,hl:r3c7,hl:r1c8r2c8,pm:9,hl:r2c8,cd:7,hl:r1c9,cd:0,cd:0,cd:9,hl:r7c8r8c8,hl:r7c5,vl:9,hl:r7c6,vl:4,hl:r4c6,vl:2,hl:r4c5,vl:4,hl:r8c6r9c6,cd:3,cd:5,pm:3,hl:r9c5,vl:6,hl:r8c5,hl:r9c5,hl:r8c4r8c5,hl:r8c5,vl:8,hl:r7c4r8c4,cd:1,cd:7,hl:r7c4,vl:7,hl:r8c4,vl:1,hl:r8c3,vl:9,hl:r9c3,vl:1,hl:r8c7,vl:5,hl:r9c8,hl:r9c7,vl:9,hl:r8c7,hl:r8c6,vl:3,hl:r9c6,vl:5,hl:r7c1r7c2,pm:5,hl:r9c1r9c2,hl:r9c1r9c2r9c9,cd:3,cd:4,cd:7,hl:r9c2,hl:r9c1,vl:7,hl:r9c2,cd:7,hl:r9c9,cd:7,hl:r8c2,cd:3,cd:4,hl:r9c2,hl:r8c2,vl:4,hl:r9c2,vl:3,hl:r9c9,vl:4,hl:r8c8r8c9,cd:7,cd:2,hl:r8c9,vl:7,hl:r8c8,vl:2,hl:r7c8r7c9,hl:r7c8,vl:6,hl:r7c9,vl:3,hl:r8c1,vl:6,hl:r7c1r7c2,cd:2,cd:5,hl:r8c1,hl:r7c1r7c2,pm:5,hl:r6c2,vl:2,hl:r6c3,vl:4,hl:r7c2,vl:5,hl:r7c1,vl:2,hl:r5c1,vl:9,hl:r5c2,vl:7,hl:r6c4,vl:5,hl:r6c5,vl:7,hl:r3c4,vl:6,hl:r2c4,vl:3,hl:r3c7,hl:r1c9,vl:6,hl:r2c8,vl:9,hl:r1c8,vl:7,hl:r1c4,vl:4,hl:r1c5,vl:1,hl:r2c5,vl:5,hl:r1c7,vl:2,hl:r2c7,vl:4,hl:r2c1r2c2r2c3,hl:r2c3,vl:2,hl:r1c3,vl:3,hl:r2c2,vl:6,hl:r1c1r1c2r2c1,pm:9,hl:r1c2,vl:9,hl:r1c1,vl:5,hl:r2c1,vl:8',
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
			replay: 'hl:r1c3r2c3,pm:2,hl:r9c1,hl:r9c1r9c3,pm:4,hl:r7c1r7c2,pm:5,hl:r1c4r2c4r3c4,hl:r4c6,hl:r1c7r2c7,pm:5,hl:r8c7r9c7,pm:6,hl:r3c7r4c7r4c8r4c9r5c7r6c7r7c7,hl:r5c8r6c8,hl:r1c5r2c5r3c5r4c4r5c4r6c4r7c4r8c4r9c4,hl:r4c6r5c6,pm:4,hl:r1c4r2c4r3c1r3c2r3c3r3c4r3c5r3c6r3c7r3c8r3c9,hl:r1c6,hl:r1c6r2c5,pm:7,hl:r1c4r2c4r3c4r4c4r5c4r6c4r7c4r8c4r9c1r9c2r9c3r9c4r9c5r9c6r9c7r9c8r9c9,hl:r1c7r2c7r3c7r4c7r5c7r6c7r7c7r8c7r9c1r9c2r9c3r9c4r9c5r9c6r9c7r9c8r9c9,hl:r9c3,hl:r3c3r4c3r5c3r6c3r7c3r8c3r9c3,hl:r1c2r2c2r3c1r3c2r3c3r4c1r4c2r4c3r5c2r6c2r7c2r8c2r9c2,hl:r6c4,hl:r2c3,hl:r1c3,vl:2,hl:r2c3,pm:2,hl:r8c7,pm:6,vl:6,pm:6,cl,hl:r9c7,vl:6,hl:r7c7,hl:r8c7,cl,hl:r6c3,hl:r6c1r6c2,hl:r6c1,vl:6,hl:r1c2r2c2r2c3r3c2r3c3r4c2r5c2r6c2r7c2r8c2r9c2,hl:r1c2r2c2r3c2r4c2r5c2r6c2r7c2r8c2r9c2,hl:r6c4,hl:r2c2r3c1r3c2r4c1r5c1r6c1r7c1r8c1,hl:r1c3,hl:r1c2,vl:6,hl:r3c4,vl:6,hl:r7c6r8c6r9c6,hl:r7c6r8c6,pm:6,hl:r1c4r2c4r3c4r4c4r5c4r6c4r7c4r8c4r9c4,hl:r1c4r1c5r2c4r2c5r3c4r3c5r4c4r4c5r5c4r5c5r6c4r6c5r7c4r8c4r9c4,hl:r1c1r1c2r1c3r1c4r1c5r1c6r1c7r1c8r1c9,hl:r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8,hl:r8c3,vl:6,hl:r7c6,vl:6,hl:r8c6,pm:6,hl:r7c1r7c2r7c3r7c4r7c5r7c6r7c7r8c4,hl:r7c1r7c2r7c3r7c4r7c5r7c6r7c7r7c8,hl:r4c1r4c2r4c3r5c2r6c2,hl:r5c3r6c3,pm:7,hl:r1c1r1c2r2c2,hl:r1c1r2c1,pm:7,hl:r1c4r2c4,pm:5,hl:r3c1r3c2,pm:5,hl:r4c3,vl:5,hl:r1c3r2c3r3c3r4c3r5c3r6c3r7c3,hl:r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9,hl:r5c7r6c1r6c2r6c3r6c4r6c5r6c6r6c7r6c8r6c9,hl:r4c9,hl:r4c9r5c7,pm:2,hl:r7c8,hl:r1c1r1c2r1c3r1c4r1c5r1c6r1c7r1c8r1c9,hl:r3c5,hl:r2c4r3c5,pm:2,hl:r1c6r1c7r1c8r1c9,hl:r5c4r5c5r5c6r5c7r5c8r5c9r6c2r6c3r6c4,hl:r6c9,hl:r9c5,hl:r5c1r5c2r5c3r5c4r5c5r5c6r5c7r5c8r5c9,hl:r5c3,hl:r1c1r2c1r3c1r4c1r5c1,hl:r6c3,hl:r5c2r6c3,hl:r4c1r5c2r6c3,hl:r5c3,hl:r6c3,hl:r5c2,hl:r4c1r5c2,cd:3,cd:9,hl:r6c3,vl:7,hl:r5c3,pm:7,hl:r5c7r5c8,pm:7,hl:r5c7,pm:7,hl:r5c8,vl:7,hl:r7c9r8c9,pm:7,hl:r1c4r2c4r3c4r4c4r5c4r6c4r7c4r8c4r9c4,hl:r1c3r2c3r3c3r4c3r5c3r6c3r7c3,hl:r1c3r2c3r3c1r3c2r3c3r4c3r5c3r6c3r7c3,hl:r9c2r9c3r9c4r9c5r9c6r9c7r9c8r9c9,hl:r5c3,hl:r4c2r5c3,cd:4,cd:8,hl:r6c5,hl:r9c3,cd:4,cd:8,hl:r1c3r2c3r3c3r4c3r5c3r6c3r7c3r8c3r9c3,hl:r2c3,hl:r9c3,cl,pm:4,hl:r2c3r9c3,cd:1,cd:4,cd:8,hl:r5c1,hl:r9c3,hl:r2c3,hl:r7c4,cd:1,cd:9,hl:r8c7,hl:r7c8,cd:1,cd:9,hl:r6c9,hl:r4c7,hl:r3c6,cd:1,cd:3,hl:r2c5,hl:r1c4,hl:r2c3,hl:r3c3,hl:r2c3,vl:1,hl:r9c3,cd:1,hl:r2c3,hl:r3c2,cd:3,cd:5,hl:r2c3r3c3r4c3r5c3r6c2r6c3r7c2r8c2,hl:r7c2r8c2,pm:1,hl:r7c1,hl:r7c2,pm:1,hl:r8c2,vl:1,hl:r8c2r8c3r8c4r8c5r8c6r8c7r8c8r8c9,hl:r7c4r7c5r7c6r7c7r7c8r7c9r8c2r8c3r8c4r8c5r8c6r8c7r8c8r8c9,hl:r8c6,hl:r9c4,hl:r8c5r8c6r8c7,hl:r8c5r8c6r8c7r8c9,cd:3,cd:7,cd:8,cd:9,hl:r8c5,cd:8,hl:r8c7,cd:8,hl:r8c9,cd:8,hl:r8c6,vl:8,hl:r8c7,cd:7,hl:r8c9,hl:r8c5,hl:r7c8,hl:r8c7,hl:r8c6,hl:r9c6,cd:1,cd:3,hl:r4c6r5c6,hl:r1c6r4c6r5c6,cd:2,cd:4,cd:7,hl:r1c7,hl:r1c6,vl:7,hl:r2c5,pm:7,hl:r4c6r5c6,cd:7,hl:r1c1,pm:7,hl:r2c1,vl:7,hl:r3c4r4c4r5c4r6c4r7c4r8c4r9c4,hl:r7c5,hl:r7c5r8c5,pm:7,hl:r7c1r7c2,hl:r7c2,hl:r2c2r7c2,hl:r3c2,hl:r2c5,hl:r7c8,vl:1,hl:r7c4,vl:9,hl:r8c5,cd:9,hl:r5c5r6c5,hl:r6c5,hl:r4c5r6c5,pm:9,hl:r7c5,hl:r7c5r9c4,hl:r8c5,hl:r9c6,hl:r8c2,hl:r9c1,hl:r8c2,hl:r9c1,vl:9,hl:r9c3,vl:4,hl:r5c3,vl:8,hl:r4c2,vl:4,hl:r7c1r7c2,cd:5,cd:8,hl:r4c1,vl:3,hl:r5c2,vl:9,hl:r5c4,hl:r5c4r5c7,cd:2,cd:3,cd:4,hl:r6c5,hl:r5c4,cd:4,hl:r5c7,cd:4,hl:r5c6,vl:4,hl:r4c6,vl:2,hl:r5c7,hl:r9c6,hl:r5c6,hl:r5c7,hl:r4c9,hl:r6c8,vl:4,hl:r3c9,vl:4,hl:r2c2,vl:4,cl,hl:r2c1,hl:r1c1,hl:r1c6,cl,hl:r2c5,vl:7,hl:r2c1,cl,hl:r1c1,vl:7,hl:r2c1,vl:4,hl:r1c6,cd:7,pm:7,vl:2,cl,cl,hl:r4c6,cl,cl,hl:r9c6,cl,hl:r3c6,cl,hl:r9c6,hl:r4c6r9c6,hl:r3c6r4c6r9c6,hl:r1c6r3c6r4c6r9c6,cd:1,cd:2,cd:3,cd:7,hl,hl:r1c6,cd:7,hl:r3c6,cd:7,hl:r4c6,cd:7,hl:r9c6,cd:7,hl:r8c6,cl,vl:7,hl:r9c6,cl,hl:r4c6,cl,hl:r3c6,cl,hl:r1c6,cl,hl:r8c6,hl:r8c5,cl,hl:r7c5,cl,hl:r8c9,hl:r7c9,vl:7,hl:r8c9,cl,hl:r8c7,cl,hl:r8c5,hl:r8c5r8c7,hl:r8c5r8c7r8c9,cd:3,cd:8,cd:9,hl:r8c5,cd:9,hl:r8c7,hl:r8c8,hl:r8c9,hl:r9c6,hl:r3c6r4c6r9c6,hl:r1c6r3c6r4c6r9c6,cd:1,cd:2,cd:3,cd:8,hl:r1c7,hl:r1c6,cd:2,hl:r3c6,hl:r4c6,cd:3,hl:r9c6,hl:r2c2,hl:r2c2r3c1,cd:3,cd:5,cd:8,hl:r3c1,cd:3,hl:r2c2,hl:r7c5,hl:r9c7,hl:r9c6,hl:r9c8r9c9,cd:2,cd:3,cd:8,cd:9,pm:2,hl:r7c5,vl:2,hl:r9c4,hl:r9c6,cd:2,hl:r9c4,cd:1,cd:3,cd:8,hl:r9c8r9c9,cd:9,hl:r8c9,hl:r8c7r8c9,pm:9,hl:r9c9,hl:r9c8r9c9,hl:r9c8,hl:r2c8r3c8,cd:2,cd:3,cd:8,hl:r2c9,hl:r3c9,hl:r6c9,hl:r4c7r6c9,cd:1,cd:3,cd:9,hl:r4c7,cd:3,hl:r6c9,hl:r3c6,cd:2,cd:8,hl:r9c6,cd:8,hl:r8c5,cd:8,vl:3,hl:r9c6,vl:1,hl:r9c4,vl:8,hl:r8c7,cd:3,hl:r8c9,cd:3,hl:r9c8r9c9,cd:8,hl:r8c7r8c8r8c9,pm:9,hl:r9c8r9c9,pm:2,hl:r8c9,hl:r9c9,hl:r2c8r3c8,pm:8,hl:r3c2,hl:r3c1,hl:r2c2r3c1,pm:8,hl:r1c4,hl:r1c6,vl:8,hl:r4c6,cd:8,hl:r1c4,cd:1,cd:3,cd:5,hl:r6c7,hl:r4c9r6c7,cd:1,cd:2,cd:3,cd:8,cd:9,hl:r4c9,cd:3,hl:r6c7,cd:2,hl:r1c7,hl:r1c7r1c9,cd:1,cd:3,cd:5,hl,hl:r1c9,cd:5,hl:r3c5,hl:r2c4r3c5,hl:r6c4r6c5,hl:r4c5,hl:r6c4r6c5,cd:1,cd:3,cd:8,cd:9,hl:r8c6,hl:r6c4,cd:8,cd:9,hl:r6c5,cd:3,hl:r1c5r1c6r2c5r2c6r3c6r4c6r5c6r6c6r7c6r8c6r9c6,hl:r1c6r2c6r3c6r4c6r5c6r6c6r7c6r8c6r9c6,hl:r3c6,hl:r4c6,vl:2,hl:r3c6,vl:3,hl:r1c4,cd:3,hl:r4c6,hl:r4c9,cd:2,hl:r4c5,cd:1,cd:8,cd:9,hl:r4c7,hl:r4c6,hl:r5c4,vl:3,hl:r6c4,vl:1,hl:r6c5,cd:1,hl:r4c5,cd:1,hl:r6c5,hl:r3c5,pm:2,hl:r2c4,vl:2,hl:r3c5,vl:1,hl:r1c4,vl:5,hl:r1c7,cd:4,cd:4,cd:5,pm:5,hl:r2c7,vl:5,hl:r2c8r3c8,cd:3,hl:r2c7r3c7,hl:r2c8r3c8,hl:r9c8,vl:3,hl:r9c9,vl:2,hl:r3c1r3c2r3c3r3c4r3c5r3c6r3c7r3c8r3c9,hl:r3c1,hl:r3c2,vl:4,vl:5,hl:r3c1,vl:8,hl:r2c2,vl:3,hl:r3c8,vl:1,vl:2,hl:r2c8,vl:8,hl:r7c1,vl:5,hl:r7c2,vl:8,hl:r6c5,hl:r6c7,cd:1,hl:r6c9,cd:1,hl:r6c7,hl:r4c9,hl:r5c7,vl:2,hl:r8c7,vl:9,hl:r8c9,vl:8,hl:r4c7,vl:1,hl:r4c9,cd:1,hl:r6c7,cd:9,hl:r1c7,vl:3,hl:r1c9,vl:1,hl:r6c7,vl:8,hl:r6c9,hl:r4c9,vl:9,hl:r6c9,vl:3,hl:r6c5,vl:0,hl:r4c5,hl:r6c5,vl:9,hl:r4c5,vl:8',
			replay2: 'hl:r8c7r9c7,pm:6,hl:r1c7r2c7,pm:5,hl:r9c1,hl:r9c1r9c3,pm:4,hl:r1c1r2c1r3c1r4c1r5c1r6c1r7c1r8c1r9c1,hl:r1c3r2c3,pm:2,hl:r4c2r4c3,pm:5,hl:r3c4,hl:r2c4r3c4,pm:5,hl:r4c4r5c4r6c4r7c4r7c7r8c4r8c7r9c4r9c5r9c6r9c7r9c8r9c9,hl:r3c7r3c8r4c4r4c5r4c6r4c7r4c8r4c9r5c7r6c7r7c7,hl:r6c8,vl:7,hl:r7c9r8c9,pm:7,hl:r5c3,vl:7,hl:r1c1r2c1,pm:7,hl:r3c3r4c3r5c3r6c3r7c3r8c3r9c3,hl:r1c8r2c8r3c8r4c8r5c8r6c8r7c8r8c8r9c8,hl:r1c5,hl:r3c6,hl:r2c5r3c6,hl:r1c4r2c5r3c6,cd:2,cd:6,cd:8,hl:r6c3,hl:r5c2r6c3,hl:r4c1r5c2r6c3,cd:4,cd:6,cd:8,hl:r6c9,hl:r5c8r6c9,hl:r4c7r5c8r6c9,cd:2,cd:4,cd:8,hl:r5c7,hl:r4c7,cd:4,hl:r6c9,cd:2,hl:r8c5,hl:r7c4r8c5,hl:r7c4r8c5r9c6,cd:2,cd:6,cd:8,hl:r6c3,vl:6,hl:r5c2,cd:6,hl:r4c1,cd:6,hl:r8c5,hl:r7c4,hl:r8c5,cd:2,vl:8,hl:r9c6,cd:8,hl:r7c4,cd:8,hl:r4c6,hl:r4c6r5c6,pm:4,hl:r2c5,cd:8,hl:r6c3r6c4r6c5r6c6r6c7r6c8r6c9,hl:r6c3,hl:r1c3r2c3r3c3r4c3r5c3r6c3,hl:r2c3,hl:r4c3,hl:r4c2,hl:r4c2r6c1,pm:9,hl:r4c3,vl:5,hl:r4c2,hl:r4c2r6c1,cl,cd:5,cd:5,cd:3,cd:9,hl:r7c6r8c6,hl:r7c5,hl:r7c5r9c4,hl:r6c3,hl:r8c3,hl:r9c3,hl:r2c3,hl:r5c7r6c7,hl:r4c9r5c7r6c7,cd:1,cd:3,cd:9,hl:r5c7,cd:1,hl:r6c7,hl:r4c9,hl:r8c7,vl:6,hl:r9c7,pm:6,hl:r8c7,hl:r7c8,cd:2,cd:8,hl:r7c7,hl:r7c8,hl:r5c2r5c3r5c4r5c5r5c6r5c7r5c8r5c9,hl:r4c6r5c6,hl:r4c1r5c2,hl:r4c6r5c6,hl:r5c8,cd:4,hl:r6c9,vl:4,hl:r1c9r2c9r3c9r4c9r5c9r6c9,hl:r1c6r1c7r1c8r1c9r2c9r3c9r4c9r5c9r6c9,hl:r1c6r1c7r1c8r1c9r2c9r3c9r4c9r5c9r6c9r7c9r8c9r9c9,hl:r1c6r1c7r1c8r1c9r2c7r2c9r3c7r3c9r4c7r4c9r5c7r5c9r6c7r6c9r7c7r7c9r8c7r8c9r9c7r9c9,hl:r2c8r3c8,pm:4,hl:r5c4,hl:r6c4r6c5,hl:r6c4,vl:8,hl:r3c6,hl:r1c6r3c6,pm:8,hl:r1c4,cd:8,hl:r3c6,vl:8,hl:r1c6,pm:8,hl:r2c5,vl:2,hl:r1c4,vl:6,hl:r1c3,vl:2,hl:r2c3,pm:2,hl:r7c4,vl:2,hl:r9c6,vl:6,hl:r7c1r7c2,pm:6,hl:r7c4r7c5r7c6r7c7r7c8r7c9r8c6r8c7r8c8r8c9,hl:r3c8r3c9,pm:2,hl:r4c7r5c7r6c7r7c7r8c7r9c7,hl:r3c1r3c2,hl:r3c1,hl:r3c2,hl:r3c1r3c2,pm:6,hl:r7c5r7c6r8c6,hl:r7c5r7c6r8c6r9c4,cd:1,cd:3,cd:7,cd:9,hl:r7c6r8c6,cd:0,hl:r9c4,cd:7,hl:r7c5,hl:r7c5r7c6,cd:3,hl:r7c6r8c6,cd:0,cd:9,hl:r7c5,hl:r9c4,hl:r6c5,cd:1,cd:3,cd:9,hl:r5c4,hl:r5c4r5c6,hl:r3c4,hl:r4c4,hl:r5c4,cd:3,cd:9,hl:r5c6,cd:2,cd:3,cd:4,hl:r2c4r3c4,hl:r3c2r3c3r3c4r3c5r3c6r3c7r3c8,hl:r2c4,hl:r1c5r2c4,hl:r1c5r1c6r2c4,hl:r2c4,hl:r1c6r2c4,hl:r1c7,hl:r1c6,vl:7,hl:r7c6r8c6,hl:r7c6,vl:1,hl:r8c6,vl:3,hl:r5c6,cd:3,hl:r9c4,cd:3,vl:1,vl:9,hl:r7c5,vl:7,hl:r5c4,vl:3,hl:r6c5,cd:3,hl:r5c7,vl:9,hl:r6c7,cd:9,hl:r4c9,cd:9,hl:r2c4r3c4,cd:1,cd:5,hl:r3c5,vl:3,hl:r4c5,cd:1,cd:3,cd:9,cd:3,hl:r4c6,cd:2,cd:4,hl:r4c6r5c6,pm:4,hl:r2c4r3c4,pm:5,hl:r8c3r9c3,hl:r2c3r8c3r9c3,cd:1,cd:4,cd:8,hl:r2c3,hl:r3c3,hl:r2c3,cd:1,hl:r8c3r9c3,pm:1,hl:r9c1,hl:r9c1r9c3,hl:r9c3,hl:r8c3,cd:8,hl:r7c9,hl:r7c8,vl:8,hl:r5c8,vl:2,hl:r5c6,vl:4,hl:r4c6,vl:2,hl:r4c7,vl:8,hl:r4c1,vl:4,hl:r5c2,vl:8,hl:r5c7r6c7r7c7r8c7,hl:r6c8,hl:r1c7r1c8r2c7r2c8r3c7r3c8r4c7r4c8r5c8r6c8r7c8,hl:r1c9,vl:8,hl:r3c8r4c8r5c8r6c8,hl:r3c8,pm:2,hl:r3c9,vl:2,hl:r1c1r1c2r1c3r1c4r1c5r1c6r1c7r1c8r1c9,hl:r2c3,hl:r2c1r2c3,pm:8,hl,hl:r1c1,pm:7,hl:r2c1,vl:7,hl:r2c3,vl:8,hl:r9c3,cd:8,hl:r8c3r9c3,pm:1,hl:r9c3,pm:4,hl:r1c2r1c3r1c4r1c5r1c6r1c7r1c8r1c9,hl:r1c2r1c3r1c4r1c5r1c6r1c7r1c8r1c9r2c7r3c7,hl:r2c8r3c8,cd:4,cd:6,pm:4,hl:r1c7r2c7,cd:3,cd:5,cd:5,cd:4,ud/11405,ud/7,ud/8,ud/7,ud/8,ud/9,ud/7,ud/9,hl:r4c8,hl:r2c8r3c8,cd:1,cd:3,cd:4,hl:r3c8,cd:3,hl:r2c8,hl:r9c8,cd:1,cd:3,cd:4,hl:r8c8,hl:r1c7r2c7,cd:1,cd:3,cd:4,cd:5,hl:r1c7,cd:4,hl:r2c7,cd:4,hl:r2c8r3c8,hl:r1c7r2c7,hl:r3c8,hl:r2c2,cd:1,cd:3,cd:5,hl:r1c1r1c2,cd:1,cd:3,cd:5,hl:r3c1r3c2,cd:4,cd:6,hl:r3c1,vl:6,hl:r3c2,vl:4,hl:r7c2,vl:6,hl:r7c1,pm:6,hl:r7c1r7c9,hl:r8c9,vl:7,hl:r7c9,pm:7,hl:r7c1r7c9,cd:5,cd:9,hl:r7c9,vl:9,hl:r7c1,vl:5,hl:r1c1,cd:1,vl:3,hl:r1c2r2c2,cd:3,hl:r1c7,cd:3,hl:r2c7r2c8,pm:3,hl:r2c7,hl:r2c7r2c8,cd:1,hl:r2c7,vl:3,hl:r2c8,vl:4,hl:r3c8,vl:1,hl:r1c7,vl:5,hl:r1c2,vl:1,hl:r2c2,vl:5,hl:r2c4,vl:1,hl:r3c4,vl:5,hl:r5c5r6c5r7c5,hl:r4c5,hl:r6c7,vl:1,hl:r4c9,vl:3,hl:r6c5,vl:9,hl:r4c5,vl:1,hl:r6c1,vl:3,hl:r4c2,vl:9,hl:r9c1,ud/2487,ud/3,ud/6,ud/21,ud/20,ud/4,ud/3,ud/3,ud/11,ud/3,ud/3,ud/29,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,hl:r5c3,hl:r6c1,hl:r8c2,hl:r8c2r9c1,hl:r9c1,pm:3,pm:3,pm:4,hl:r8c2r9c1,cd:8,cd:9,hl:r9c1,vl:8,hl:r8c2,vl:9,hl:r3c2r4c2,hl:r4c2,vl:3,hl:r1c2r2c2,cd:3,hl:r1c1,vl:3,hl:r6c1,vl:9,hl:r8c3,vl:1,hl:r9c3,vl:4,hl:r2c7,cd:1,cd:5,hl:r2c8,cd:1,hl:r3c8,vl:1,hl:r3c4,vl:5,hl:r2c4,vl:1,hl:r2c2,vl:5,hl:r1c2,vl:1,hl:r1c7,cd:1,cd:3,vl:5,hl:r2c7,vl:3,hl:r2c8,vl:4,hl:r6c7,vl:1,hl:r4c9,vl:3,hl:r6c5,vl:9,hl:r4c5,vl:1,hl:r9c8,cd:1,vl:3,hl:r9c9,vl:1,hl:r9c7,vl:2,hl:r5c2,hl:r4c9,hl,hl:r4c2,cl,hl:r6c1,cl,hl:r1c1r1c2,cl,ud/12042,ud/5,ud/3,ud/16,ud/3,ud/4,ud/4,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/2,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/2,ud/31,ud/3,ud/3,ud/3,ud/3,ud/2,ud/3,ud/2,ud/3,ud/2,ud/2,ud/3,ud/2,ud/3,ud/3,ud/3,ud/3,ud/2,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/2,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/3,ud/4,ud/14,ud/5,ud/5,ud/4,ud/4,ud/3,ud/4,ud/3,ud/3,ud/4,ud/4,ud/4,ud/4,ud/26,ud/8,hl:r8c8,hl:r8c2r8c3,hl:r8c7,hl:r8c3,vl:1,hl:r8c2,vl:9,hl:r9c3,vl:4,hl:r6c1,vl:9,hl:r4c2,vl:3,hl:r6c5,vl:1,hl:r4c5,vl:9,hl:r6c6,hl:r6c7,vl:3,hl:r4c9,vl:1,hl:r7c9r8c9r9c9,cd:3,cd:7,cd:9,hl:r7c9,hl:r8c9,hl:r7c9,vl:9,hl:r8c9r9c9,cd:9,hl:r8c9,vl:7,hl:r9c9,vl:3,hl:r9c7r9c8,hl:r9c8,vl:1,hl:r9c7,vl:2,hl:r9c8,hl:r9c1,pm:4,hl:r1c3r2c3r3c3r4c3r5c3r6c3r7c3r8c3r9c3,hl:r7c2,vl:4,hl:r7c1,vl:6,hl:r9c1,vl:5,cl,hl:r7c2,cl,hl:r7c1,cl,hl:r7c1r7c2,cd:5,cd:6,hl:r9c1,vl:8,hl:r1c7,hl:r1c7r2c7,cd:1,cd:5,hl:r3c8,hl:r2c8r3c8,cd:1,hl:r3c8,vl:4,hl:r2c8,vl:3,hl:r1c1r1c2,cd:1,cd:3,cd:5,hl:r2c2,hl:r1c1,cd:1,hl:r1c2,cd:3,hl:r1c1,vl:3,hl:r2c2,vl:4,hl:r3c1r3c2,hl:r3c1,cd:5,cd:6,hl:r3c2,cd:1,cd:5,cd:6,hl:r4c2,hl:r3c2,vl:6,hl:r3c1,vl:4,vl:5,hl:r1c2,vl:1,hl:r1c7,vl:5,hl:r2c7,vl:1,hl:r2c4,vl:5,hl:r3c4,vl:1,hl:r7c1,vl:6,hl:r7c2,vl:5',
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
	};
	app.testPuzzles = testPuzzles;
	
	//app.loadRemotePuzzle('HPqJQH822F');
	
	//app.savedReplay = '{"puzzleId": "jpQPjrm7H4", "actions": [{"cells":"r6c4,r6c5,r6c6","type":"highlight","time":12347},{"cells":"highlighted","type":"colour","value":4,"time":15329},{"cells":"r4c6,r5c6,r6c6","type":"highlight","time":16734},{"cells":"highlighted","type":"colour","value":4,"time":17612},{"cells":"none","type":"highlight","time":18636},{"cells":"r4c7,r5c7,r6c7","type":"highlight","time":22090},{"cells":"highlighted","type":"colour","value":4,"time":22856},{"cells":"none","type":"highlight","time":23282},{"cells":"r4c8,r5c8,r6c8","type":"highlight","time":40945},{"cells":"r5c7","type":"highlight","time":43734},{"cells":"r5c8","type":"highlight","time":44083},{"cells":"highlighted","type":"colour","value":4,"time":46986},{"cells":"r5c9","type":"highlight","time":48009},{"cells":"r7c8","type":"highlight","time":107859},{"cells":"r7c2,r7c3,r7c4,r7c5","type":"highlight","time":116026},{"cells":"highlighted","type":"colour","value":4,"time":116825},{"cells":"r8c5","type":"highlight","time":117466},{"cells":"r7c1","type":"highlight","time":118344},{"cells":"highlighted","type":"colour","value":7,"time":118906},{"cells":"r8c6","type":"highlight","time":119525},{"cells":"r7c8,r7c9","type":"highlight","time":166335},{"cells":"highlighted","type":"colour","value":4,"time":167078},{"cells":"r8c1","type":"highlight","time":178689},{"cells":"highlighted","type":"colour","value":4,"time":179565},{"cells":"r6c1","type":"highlight","time":180376},{"cells":"highlighted","type":"colour","value":4,"time":181174},{"cells":"r5c1","type":"highlight","time":183233},{"cells":"r1c1,r1c2,r2c1,r3c1,r4c1","type":"highlight","time":185977},{"cells":"r1c1,r2c1,r3c1,r4c1,r5c1","type":"highlight","time":187306},{"cells":"r1c1,r2c1,r3c1,r4c1","type":"highlight","time":188194},{"cells":"highlighted","type":"colour","value":4,"time":188925},{"cells":"r5c3","type":"highlight","time":189612},{"cells":"r6c1","type":"highlight","time":212663},{"cells":"highlighted","type":"value","value":4,"time":214261},{"cells":"r6c2","type":"highlight","time":215970},{"cells":"highlighted","type":"candidates","value":1,"time":218558},{"cells":"highlighted","type":"candidates","value":9,"time":218974},{"cells":"r6c9","type":"highlight","time":219728},{"cells":"highlighted","type":"candidates","value":1,"time":220303},{"cells":"highlighted","type":"candidates","value":9,"time":220773},{"cells":"r6c8","type":"highlight","time":221371},{"cells":"highlighted","type":"colour","value":4,"time":222338},{"cells":"r6c3","type":"highlight","time":223114},{"cells":"highlighted","type":"colour","value":4,"time":223924},{"cells":"r6c9","type":"highlight","time":224634},{"cells":"highlighted","type":"colour","value":7,"time":225398},{"cells":"r6c2","type":"highlight","time":226387},{"cells":"highlighted","type":"colour","value":7,"time":227087},{"cells":"r8c1","type":"highlight","time":228480},{"cells":"highlighted","type":"value","value":2,"time":229718},{"cells":"r9c1","type":"highlight","time":230483},{"cells":"highlighted","type":"value","value":9,"time":231495},{"cells":"highlighted","type":"colour","value":7,"time":232688},{"cells":"r8c2,r8c3,r9c2,r9c3","type":"highlight","time":234118},{"cells":"highlighted","type":"colour","value":4,"time":234848},{"cells":"r4c7","type":"highlight","time":238110},{"cells":"r9c4,r9c5,r9c6","type":"highlight","time":247594},{"cells":"highlighted","type":"colour","value":4,"time":248517},{"cells":"r8c6","type":"highlight","time":249146},{"cells":"r9c9","type":"highlight","time":270364},{"cells":"highlighted","type":"colour","value":4,"time":271320},{"cells":"none","type":"highlight","time":271972},{"cells":"r7c6","type":"highlight","time":305127},{"cells":"highlighted","type":"value","value":9,"time":307489},{"cells":"r8c6","type":"highlight","time":308512},{"cells":"highlighted","type":"colour","value":4,"time":309615},{"cells":"r7c7","type":"highlight","time":326163},{"cells":"highlighted","type":"colour","value":4,"time":327064},{"cells":"r7c6","type":"highlight","time":327795},{"cells":"highlighted","type":"colour","value":7,"time":328403},{"cells":"r7c7,r7c8,r7c9","type":"highlight","time":329763},{"cells":"highlighted","type":"candidates","value":"2","time":330120},{"cells":"highlighted","type":"candidates","value":"3","time":330248},{"cells":"highlighted","type":"candidates","value":"4","time":330456},{"cells":"r9c8","type":"highlight","time":340766},{"cells":"highlighted","type":"value","value":"1","time":341344},{"cells":"r9c7","type":"highlight","time":342161},{"cells":"highlighted","type":"colour","value":4,"time":343658},{"cells":"r9c8","type":"highlight","time":344502},{"cells":"highlighted","type":"colour","value":7,"time":345199},{"cells":"r9c9","type":"highlight","time":345963},{"cells":"highlighted","type":"value","value":6,"time":349474},{"cells":"none","type":"highlight","time":350655},{"cells":"r8c8","type":"highlight","time":360982},{"cells":"highlighted","type":"colour","value":4,"time":362490},{"cells":"r6c9","type":"highlight","time":365774},{"cells":"r8c9","type":"highlight","time":369286},{"cells":"highlighted","type":"colour","value":4,"time":369982},{"cells":"r8c7","type":"highlight","time":370814},{"cells":"highlighted","type":"colour","value":7,"time":371523},{"cells":"r8c4,r8c5","type":"highlight","time":372468},{"cells":"highlighted","type":"colour","value":4,"time":373615},{"cells":"r1c9,r2c9,r3c9,r4c9","type":"highlight","time":375416},{"cells":"highlighted","type":"colour","value":4,"time":375900},{"cells":"r5c9","type":"highlight","time":376405},{"cells":"highlighted","type":"colour","value":7,"time":376958},{"cells":"r4c8","type":"highlight","time":377868},{"cells":"highlighted","type":"colour","value":4,"time":378375},{"cells":"r5c9","type":"highlight","time":379849},{"cells":"highlighted","type":"candidates","value":"1","time":380519},{"cells":"highlighted","type":"candidates","value":"9","time":381071},{"cells":"r8c7","type":"highlight","time":382525},{"cells":"highlighted","type":"value","value":"9","time":385631},{"cells":"r8c4","type":"highlight","time":388049},{"cells":"highlighted","type":"value","value":"1","time":389151},{"cells":"highlighted","type":"colour","value":7,"time":390694},{"cells":"r9c6","type":"highlight","time":392279},{"cells":"r5c1","type":"highlight","time":398637},{"cells":"highlighted","type":"colour","value":4,"time":399243},{"cells":"r1c7,r2c7,r3c7","type":"highlight","time":412574},{"cells":"r1c7,r2c7,r2c8,r3c7","type":"highlight","time":412990},{"cells":"r3c8","type":"highlight","time":417107},{"cells":"highlighted","type":"colour","value":7,"time":417670},{"cells":"r1c8,r2c8","type":"highlight","time":418289},{"cells":"highlighted","type":"colour","value":4,"time":418773},{"cells":"r3c8","type":"highlight","time":419876},{"cells":"highlighted","type":"value","value":"9","time":420472},{"cells":"r1c8,r2c8","type":"highlight","time":427840},{"cells":"r3c7","type":"highlight","time":448697},{"cells":"highlighted","type":"colour","value":4,"time":449756},{"cells":"r5c8","type":"highlight","time":450374},{"cells":"r1c7,r2c7","type":"highlight","time":454502},{"cells":"highlighted","type":"pencilmarks","value":"1","time":454695},{"cells":"r5c5","type":"highlight","time":474100},{"cells":"r4c6","type":"highlight","time":475180},{"cells":"r5c6","type":"highlight","time":479623},{"cells":"r4c6","type":"highlight","time":480141},{"cells":"highlighted","type":"colour","value":3,"time":481041},{"cells":"r4c8","type":"highlight","time":481569},{"cells":"r1c6","type":"highlight","time":484787},{"cells":"highlighted","type":"value","value":"1","time":485271},{"cells":"r2c7","type":"highlight","time":486453},{"cells":"highlighted","type":"value","value":"1","time":486639},{"cells":"r1c7","type":"highlight","time":486902},{"cells":"highlighted","type":"pencilmarks","value":"1","time":487439},{"cells":"r5c5","type":"highlight","time":489219},{"cells":"highlighted","type":"value","value":"1","time":489416},{"cells":"r5c6","type":"highlight","time":491290},{"cells":"r5c2,r5c3,r5c4,r5c5","type":"highlight","time":492414},{"cells":"r5c9","type":"highlight","time":492819},{"cells":"highlighted","type":"value","value":"9","time":493727},{"cells":"r6c9","type":"highlight","time":494091},{"cells":"highlighted","type":"value","value":"1","time":494352},{"cells":"r6c2","type":"highlight","time":494788},{"cells":"highlighted","type":"value","value":"9","time":495535},{"cells":"r4c4,r4c5,r4c6,r5c2,r5c3,r5c4","type":"highlight","time":497691},{"cells":"highlighted","type":"colour","value":7,"time":499323},{"cells":"highlighted","type":"colour","value":7,"time":499501},{"cells":"highlighted","type":"colour","value":4,"time":499963},{"cells":"r5c5","type":"highlight","time":500627},{"cells":"highlighted","type":"colour","value":7,"time":501246},{"cells":"r5c7","type":"highlight","time":501910},{"cells":"r3c2","type":"highlight","time":503811},{"cells":"highlighted","type":"value","value":"1","time":504151},{"cells":"highlighted","type":"colour","value":7,"time":506322},{"cells":"r3c3,r3c4,r3c5,r3c6,r3c7","type":"highlight","time":508580},{"cells":"highlighted","type":"colour","value":4,"time":509166},{"cells":"r4c2","type":"highlight","time":510201},{"cells":"highlighted","type":"colour","value":4,"time":512068},{"cells":"r4c3","type":"highlight","time":512856},{"cells":"highlighted","type":"colour","value":7,"time":513531},{"cells":"highlighted","type":"value","value":"1","time":513855},{"cells":"r4c4,r4c5,r4c6,r5c4,r5c6","type":"highlight","time":517930},{"cells":"highlighted","type":"colour","value":3,"time":518897},{"cells":"r5c7","type":"highlight","time":519471},{"cells":"r2c6,r3c6,r4c6,r5c6","type":"highlight","time":522993},{"cells":"highlighted","type":"colour","value":4,"time":523959},{"cells":"r2c7","type":"highlight","time":524624},{"cells":"r1c6,r2c7","type":"highlight","time":525007},{"cells":"highlighted","type":"colour","value":7,"time":525703},{"cells":"r1c7","type":"highlight","time":526344},{"cells":"highlighted","type":"colour","value":4,"time":526875},{"cells":"highlighted","type":"value","value":"2","time":531631},{"cells":"r3c7","type":"highlight","time":532487},{"cells":"r7c7","type":"highlight","time":534006},{"cells":"highlighted","type":"candidates","value":"2","time":534352},{"cells":"r1c3,r2c3","type":"highlight","time":544232},{"cells":"highlighted","type":"pencilmarks","value":"9","time":545232},{"cells":"r1c2,r2c2","type":"highlight","time":546663},{"cells":"highlighted","type":"colour","value":4,"time":547991},{"cells":"r8c5,r8c6","type":"highlight","time":549846},{"cells":"highlighted","type":"candidates","value":"5","time":551104},{"cells":"highlighted","type":"candidates","value":"6","time":551145},{"cells":"r7c2,r7c3","type":"highlight","time":553053},{"cells":"highlighted","type":"candidates","value":"5","time":555256},{"cells":"highlighted","type":"candidates","value":"6","time":555289},{"cells":"r9c7","type":"highlight","time":556326},{"cells":"highlighted","type":"colour","value":"5","time":556376},{"cells":"highlighted","type":"colour","value":4,"time":560241},{"cells":"highlighted","type":"value","value":"5","time":561512},{"cells":"r8c4","type":"highlight","time":562322},{"cells":"r9c2,r9c3","type":"highlight","time":563346},{"cells":"highlighted","type":"candidates","value":"7","time":564249},{"cells":"highlighted","type":"candidates","value":"8","time":564328},{"cells":"r8c8,r8c9","type":"highlight","time":565619},{"cells":"highlighted","type":"candidates","value":"7","time":565920},{"cells":"highlighted","type":"candidates","value":"8","time":565985},{"cells":"r8c2,r8c3","type":"highlight","time":567024},{"cells":"highlighted","type":"candidates","value":"3","time":567968},{"cells":"highlighted","type":"candidates","value":"4","time":568008},{"cells":"r9c4,r9c5,r9c6","type":"highlight","time":569444},{"cells":"highlighted","type":"candidates","value":"2","time":570392},{"cells":"highlighted","type":"candidates","value":"3","time":570457},{"cells":"highlighted","type":"candidates","value":"4","time":570503},{"cells":"r7c4,r7c5","type":"highlight","time":571795},{"cells":"highlighted","type":"candidates","value":"7","time":572535},{"cells":"highlighted","type":"candidates","value":"8","time":572584},{"cells":"r9c6","type":"highlight","time":573898},{"cells":"highlighted","type":"candidates","value":"4","time":577856},{"cells":"r5c4","type":"highlight","time":594025},{"cells":"highlighted","type":"colour","value":4,"time":595183},{"cells":"r6c6","type":"highlight","time":595779},{"cells":"r4c4,r4c5","type":"highlight","time":597770},{"cells":"highlighted","type":"pencilmarks","value":"9","time":599463},{"cells":"r6c6","type":"highlight","time":600009},{"cells":"r2c6","type":"highlight","time":614714},{"cells":"highlighted","type":"value","value":"2","time":615823},{"cells":"r2c5","type":"highlight","time":616637},{"cells":"highlighted","type":"value","value":"9","time":617351},{"cells":"r1c3","type":"highlight","time":618166},{"cells":"highlighted","type":"value","value":"9","time":619782},{"cells":"r2c3","type":"highlight","time":620259},{"cells":"highlighted","type":"pencilmarks","value":"9","time":621359},{"cells":"r2c5","type":"highlight","time":622857},{"cells":"r1c2,r1c3,r2c5","type":"highlight","time":623275},{"cells":"r1c3","type":"highlight","time":624028},{"cells":"r1c3,r2c5","type":"highlight","time":624466},{"cells":"highlighted","type":"colour","value":7,"time":625312},{"cells":"r1c4,r1c5,r2c3,r2c4","type":"highlight","time":626603},{"cells":"highlighted","type":"colour","value":4,"time":627178},{"cells":"r3c5","type":"highlight","time":627639},{"cells":"r4c5","type":"highlight","time":628483},{"cells":"highlighted","type":"colour","value":4,"time":629258},{"cells":"r4c4","type":"highlight","time":629934},{"cells":"highlighted","type":"value","value":"9","time":631191},{"cells":"highlighted","type":"colour","value":7,"time":632433},{"cells":"r4c5","type":"highlight","time":633117},{"cells":"highlighted","type":"pencilmarks","value":"9","time":634143},{"cells":"r5c6","type":"highlight","time":634726},{"cells":"r2c3","type":"highlight","time":639542},{"cells":"highlighted","type":"value","value":"3","time":639871},{"cells":"r3c3","type":"highlight","time":640093},{"cells":"highlighted","type":"value","value":"2","time":640161},{"cells":"r8c3","type":"highlight","time":644457},{"cells":"highlighted","type":"value","value":"4","time":644935},{"cells":"r8c2","type":"highlight","time":645256},{"cells":"highlighted","type":"value","value":"3","time":645318},{"cells":"r1c2,r2c2","type":"highlight","time":650522},{"cells":"highlighted","type":"pencilmarks","value":"4","time":651383},{"cells":"r4c2,r5c2","type":"highlight","time":652794},{"cells":"highlighted","type":"candidates","value":"2","time":654928},{"cells":"highlighted","type":"candidates","value":"6","time":655047},{"cells":"r7c2","type":"highlight","time":656203},{"cells":"highlighted","type":"value","value":"5","time":656664},{"cells":"r7c2,r7c3","type":"highlight","time":656924},{"cells":"r7c3","type":"highlight","time":657249},{"cells":"highlighted","type":"value","value":"6","time":657680},{"cells":"r1c8","type":"highlight","time":666643},{"cells":"highlighted","type":"value","value":"6","time":667672},{"cells":"r2c8","type":"highlight","time":672166},{"cells":"highlighted","type":"value","value":"5","time":673152},{"cells":"r4c9","type":"highlight","time":678568},{"cells":"highlighted","type":"value","value":"5","time":678663},{"cells":"r5c3,r6c3","type":"highlight","time":696782},{"cells":"highlighted","type":"candidates","value":"5","time":698792},{"cells":"highlighted","type":"candidates","value":"7","time":699344},{"cells":"highlighted","type":"candidates","value":"8","time":699392},{"cells":"r6c4","type":"highlight","time":701562},{"cells":"r9c6","type":"highlight","time":706064},{"cells":"highlighted","type":"value","value":"3","time":706407},{"cells":"r9c4,r9c5","type":"highlight","time":707154},{"cells":"highlighted","type":"candidates","value":"3","time":707527},{"cells":"r8c6","type":"highlight","time":708515},{"cells":"highlighted","type":"value","value":"5","time":709815},{"cells":"r8c5","type":"highlight","time":710203},{"cells":"highlighted","type":"value","value":"6","time":710297},{"cells":"r7c7","type":"highlight","time":737304},{"cells":"r4c6","type":"highlight","time":750881},{"cells":"r6c4","type":"highlight","time":752715},{"cells":"highlighted","type":"value","value":"2","time":755511},{"cells":"r9c4","type":"highlight","time":757486},{"cells":"highlighted","type":"value","value":"4","time":758654},{"cells":"r9c5","type":"highlight","time":758903},{"cells":"highlighted","type":"value","value":"2","time":758990},{"cells":"r6c6","type":"highlight","time":768285},{"cells":"r2c2,r6c6","type":"highlight","time":769106},{"cells":"r1c1,r2c2,r6c6","type":"highlight","time":769659},{"cells":"r5c4","type":"highlight","time":774743},{"cells":"highlighted","type":"candidates","value":"5","time":778071},{"cells":"highlighted","type":"candidates","value":"6","time":778111},{"cells":"r9c4","type":"highlight","time":785847},{"cells":"r1c4,r2c4,r3c4","type":"highlight","time":787073},{"cells":"r4c7","type":"highlight","time":788346},{"cells":"r4c6","type":"highlight","time":791280},{"cells":"r3c7,r4c6","type":"highlight","time":791854},{"cells":"r1c9,r3c7,r4c6","type":"highlight","time":792340},{"cells":"highlighted","type":"candidates","value":"4","time":794024},{"cells":"highlighted","type":"candidates","value":"7","time":796791},{"cells":"highlighted","type":"candidates","value":"8","time":797336},{"cells":"r5c7","type":"highlight","time":801732},{"cells":"r6c6","type":"highlight","time":808066},{"cells":"r6c5","type":"highlight","time":808335},{"cells":"r5c4,r6c5","type":"highlight","time":808753},{"cells":"highlighted","type":"pencilmarks","value":"5","time":809631},{"cells":"r2c2","type":"highlight","time":819237},{"cells":"r1c1","type":"highlight","time":819597},{"cells":"highlighted","type":"value","value":"5","time":819719},{"cells":"r2c2","type":"highlight","time":826437},{"cells":"r2c2,r6c6","type":"highlight","time":827516},{"cells":"highlighted","type":"candidates","value":"3","time":830256},{"cells":"highlighted","type":"candidates","value":"4","time":830535},{"cells":"highlighted","type":"candidates","value":"7","time":832335},{"cells":"highlighted","type":"candidates","value":"8","time":832376},{"cells":"r2c3","type":"highlight","time":833738},{"cells":"r2c2","type":"highlight","time":834190},{"cells":"highlighted","type":"candidates","value":"3","time":834455},{"cells":"r6c6","type":"highlight","time":836201},{"cells":"highlighted","type":"candidates","value":"4","time":837520},{"cells":"highlighted","type":"candidates","value":"3","time":839047},{"cells":"r2c2","type":"highlight","time":841387},{"cells":"highlighted","type":"value","value":"4","time":842294},{"cells":"r1c2","type":"highlight","time":842715},{"cells":"highlighted","type":"pencilmarks","value":"4","time":843023},{"cells":"r7c7","type":"highlight","time":843537},{"cells":"highlighted","type":"value","value":"3","time":843598},{"cells":"r7c8,r7c9","type":"highlight","time":844188},{"cells":"highlighted","type":"candidates","value":"3","time":844495},{"cells":"r2c9,r3c9","type":"highlight","time":850961},{"cells":"highlighted","type":"pencilmarks","value":"3","time":851631},{"cells":"r2c9","type":"highlight","time":852300},{"cells":"highlighted","type":"pencilmarks","value":"3","time":852743},{"cells":"r3c9","type":"highlight","time":853020},{"cells":"highlighted","type":"value","value":"3","time":853047},{"cells":"r1c4,r1c5","type":"highlight","time":856844},{"cells":"highlighted","type":"pencilmarks","value":"3","time":857095},{"cells":"r2c9","type":"highlight","time":862773},{"cells":"highlighted","type":"candidates","value":"4","time":865319},{"cells":"highlighted","type":"candidates","value":"7","time":865719},{"cells":"highlighted","type":"candidates","value":"8","time":865759},{"cells":"highlighted","type":"candidates","value":"4","time":877975},{"cells":"r2c4","type":"highlight","time":880222},{"cells":"r2c1,r2c4","type":"highlight","time":880818},{"cells":"highlighted","type":"candidates","value":"6","time":883151},{"cells":"highlighted","type":"candidates","value":"7","time":883215},{"cells":"highlighted","type":"candidates","value":"8","time":883303},{"cells":"r3c5","type":"highlight","time":885037},{"cells":"r2c5","type":"highlight","time":885442},{"cells":"r2c4","type":"highlight","time":885881},{"cells":"r2c1","type":"highlight","time":887299},{"cells":"r1c5,r2c5,r3c5,r4c5,r5c5,r6c5,r7c5,r8c5,r9c5","type":"highlight","time":897953},{"cells":"r1c3,r1c4,r1c5,r1c6,r1c7,r1c8,r2c5,r3c5,r4c5,r5c5,r6c5,r7c5,r8c5,r9c5","type":"highlight","time":898864},{"cells":"r1c2","type":"highlight","time":903352},{"cells":"r1c2,r3c1","type":"highlight","time":903926},{"cells":"highlighted","type":"candidates","value":"6","time":905304},{"cells":"highlighted","type":"candidates","value":"7","time":905360},{"cells":"highlighted","type":"candidates","value":"8","time":905456},{"cells":"r2c2","type":"highlight","time":908235},{"cells":"r1c2","type":"highlight","time":908529},{"cells":"highlighted","type":"candidates","value":"6","time":909279},{"cells":"r5c6","type":"highlight","time":927708},{"cells":"r3c6,r5c6","type":"highlight","time":928305},{"cells":"highlighted","type":"candidates","value":"4","time":929977},{"cells":"highlighted","type":"candidates","value":"6","time":931752},{"cells":"highlighted","type":"candidates","value":"7","time":931815},{"cells":"highlighted","type":"candidates","value":"8","time":931992},{"cells":"r6c6","type":"highlight","time":933559},{"cells":"r5c6","type":"highlight","time":933964},{"cells":"r5c6,r6c6","type":"highlight","time":936371},{"cells":"r7c7","type":"highlight","time":937654},{"cells":"r8c8","type":"highlight","time":937992},{"cells":"r8c9","type":"highlight","time":938666},{"cells":"r7c9","type":"highlight","time":941366},{"cells":"highlighted","type":"value","value":"2","time":944655},{"cells":"r7c8","type":"highlight","time":945213},{"cells":"highlighted","type":"value","value":"4","time":945600},{"cells":"r4c8,r5c8","type":"highlight","time":949781},{"cells":"highlighted","type":"pencilmarks","value":"2","time":950072},{"cells":"r7c8","type":"highlight","time":950748},{"cells":"r1c9","type":"highlight","time":955046},{"cells":"highlighted","type":"value","value":"4","time":955239},{"cells":"r3c7","type":"highlight","time":956002},{"cells":"highlighted","type":"candidates","value":"4","time":956391},{"cells":"r3c5,r3c6","type":"highlight","time":961526},{"cells":"highlighted","type":"pencilmarks","value":"4","time":961944},{"cells":"r1c4,r1c5","type":"highlight","time":964260},{"cells":"highlighted","type":"candidates","value":"3","time":965489},{"cells":"highlighted","type":"candidates","value":"7","time":965848},{"cells":"highlighted","type":"candidates","value":"8","time":965903},{"cells":"r4c7,r5c7","type":"highlight","time":984183},{"cells":"highlighted","type":"pencilmarks","value":"4","time":984888},{"cells":"r4c8,r5c8,r6c8","type":"highlight","time":992756},{"cells":"r6c8","type":"highlight","time":993253},{"cells":"r4c8,r5c8,r6c8","type":"highlight","time":994567},{"cells":"r4c6","type":"highlight","time":997594},{"cells":"highlighted","type":"candidates","value":"4","time":1000167},{"cells":"r5c6","type":"highlight","time":1000855},{"cells":"highlighted","type":"candidates","value":"7","time":1002098},{"cells":"highlighted","type":"candidates","value":"8","time":1002167},{"cells":"r3c6","type":"highlight","time":1003342},{"cells":"highlighted","type":"candidates","value":"7","time":1004128},{"cells":"highlighted","type":"candidates","value":"8","time":1004175},{"cells":"r6c5","type":"highlight","time":1010441},{"cells":"r4c5,r6c5","type":"highlight","time":1010823},{"cells":"highlighted","type":"candidates","value":"2","time":1011847},{"cells":"highlighted","type":"candidates","value":"2","time":1012504},{"cells":"highlighted","type":"candidates","value":"3","time":1012720},{"cells":"highlighted","type":"candidates","value":"4","time":1013159},{"cells":"highlighted","type":"candidates","value":"5","time":1014119},{"cells":"highlighted","type":"candidates","value":"6","time":1014359},{"cells":"r6c5","type":"highlight","time":1017449},{"cells":"r7c5","type":"highlight","time":1017945},{"cells":"r6c5","type":"highlight","time":1018180},{"cells":"highlighted","type":"candidates","value":"4","time":1019151},{"cells":"r4c5","type":"highlight","time":1020475},{"cells":"r6c3,r6c4,r6c5,r6c6","type":"highlight","time":1022714},{"cells":"r4c5","type":"highlight","time":1023108},{"cells":"r4c5,r5c6","type":"highlight","time":1023389},{"cells":"highlighted","type":"pencilmarks","value":"4","time":1023895},{"cells":"r5c4","type":"highlight","time":1033740},{"cells":"r4c1,r5c1","type":"highlight","time":1043729},{"cells":"highlighted","type":"candidates","value":"3","time":1045632},{"cells":"highlighted","type":"candidates","value":"4","time":1045863},{"cells":"highlighted","type":"candidates","value":"5","time":1046184},{"cells":"highlighted","type":"candidates","value":"7","time":1048239},{"cells":"highlighted","type":"candidates","value":"8","time":1048279},{"cells":"highlighted","type":"candidates","value":"4","time":1050223},{"cells":"r4c1","type":"highlight","time":1052008},{"cells":"highlighted","type":"candidates","value":"5","time":1052423},{"cells":"r5c1","type":"highlight","time":1053033},{"cells":"highlighted","type":"candidates","value":"5","time":1053208},{"cells":"r5c3,r6c3","type":"highlight","time":1055103},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1055623},{"cells":"r4c6,r5c6,r6c6,r7c6,r8c6,r9c6","type":"highlight","time":1067230},{"cells":"r4c5","type":"highlight","time":1067894},{"cells":"r4c5,r6c5","type":"highlight","time":1068480},{"cells":"highlighted","type":"pencilmarks","value":"4","time":1069270},{"cells":"highlighted","type":"pencilmarks","value":"4","time":1070048},{"cells":"highlighted","type":"pencilmarks","value":"3","time":1071095},{"cells":"r6c7","type":"highlight","time":1073789},{"cells":"r6c5","type":"highlight","time":1074261},{"cells":"r9c5","type":"highlight","time":1087154},{"cells":"r8c5","type":"highlight","time":1087446},{"cells":"r5c5","type":"highlight","time":1087851},{"cells":"r6c5","type":"highlight","time":1088155},{"cells":"highlighted","type":"candidates","value":"6","time":1088823},{"cells":"r4c5","type":"highlight","time":1089696},{"cells":"highlighted","type":"candidates","value":"6","time":1089888},{"cells":"r5c4","type":"highlight","time":1090641},{"cells":"r5c4,r5c6","type":"highlight","time":1092216},{"cells":"highlighted","type":"pencilmarks","value":"6","time":1092631},{"cells":"r5c2","type":"highlight","time":1094578},{"cells":"highlighted","type":"candidates","value":"6","time":1094879},{"cells":"highlighted","type":"value","value":"2","time":1095759},{"cells":"r4c2","type":"highlight","time":1096311},{"cells":"highlighted","type":"value","value":"6","time":1096935},{"cells":"r6c2","type":"highlight","time":1097537},{"cells":"r5c2,r5c3,r5c4,r5c5,r5c6,r5c7,r5c8","type":"highlight","time":1099495},{"cells":"r5c8","type":"highlight","time":1099765},{"cells":"highlighted","type":"pencilmarks","value":"2","time":1099927},{"cells":"r4c8","type":"highlight","time":1100361},{"cells":"highlighted","type":"value","value":"2","time":1100487},{"cells":"r5c8","type":"highlight","time":1100900},{"cells":"r6c7,r6c8","type":"highlight","time":1109912},{"cells":"r6c7","type":"highlight","time":1111329},{"cells":"highlighted","type":"value","value":"6","time":1111911},{"cells":"r6c8","type":"highlight","time":1112387},{"cells":"r4c7,r5c7","type":"highlight","time":1113254},{"cells":"highlighted","type":"candidates","value":"4","time":1114559},{"cells":"highlighted","type":"candidates","value":"7","time":1114671},{"cells":"highlighted","type":"candidates","value":"8","time":1114838},{"cells":"r5c8,r6c8","type":"highlight","time":1117933},{"cells":"highlighted","type":"candidates","value":"3","time":1119591},{"cells":"highlighted","type":"candidates","value":"4","time":1119959},{"cells":"highlighted","type":"candidates","value":"3","time":1122167},{"cells":"highlighted","type":"candidates","value":"3","time":1122695},{"cells":"highlighted","type":"candidates","value":"4","time":1122911},{"cells":"highlighted","type":"candidates","value":"7","time":1125983},{"cells":"highlighted","type":"candidates","value":"8","time":1126015},{"cells":"r6c9","type":"highlight","time":1128013},{"cells":"r5c8","type":"highlight","time":1128351},{"cells":"r6c8","type":"highlight","time":1128711},{"cells":"r4c6,r5c6,r6c6","type":"highlight","time":1152560},{"cells":"r5c4","type":"highlight","time":1156384},{"cells":"r4c5,r5c5,r6c5","type":"highlight","time":1162190},{"cells":"r1c5","type":"highlight","time":1162888},{"cells":"highlighted","type":"pencilmarks","value":"3","time":1163358},{"cells":"highlighted","type":"candidates","value":"3","time":1163887},{"cells":"r1c3","type":"highlight","time":1164305},{"cells":"r1c4","type":"highlight","time":1164643},{"cells":"highlighted","type":"value","value":"3","time":1165455},{"cells":"r3c5,r4c5,r5c5,r6c5","type":"highlight","time":1171966},{"cells":"r4c5","type":"highlight","time":1172450},{"cells":"r3c5","type":"highlight","time":1175645},{"cells":"highlighted","type":"candidates","value":"3","time":1176967},{"cells":"highlighted","type":"candidates","value":"4","time":1177000},{"cells":"highlighted","type":"candidates","value":"5","time":1177078},{"cells":"highlighted","type":"candidates","value":"3","time":1178047},{"cells":"r6c5","type":"highlight","time":1179289},{"cells":"r3c6","type":"highlight","time":1180673},{"cells":"r3c4","type":"highlight","time":1182003},{"cells":"r2c4","type":"highlight","time":1184116},{"cells":"r3c4","type":"highlight","time":1188222},{"cells":"r3c1","type":"highlight","time":1190518},{"cells":"r3c4","type":"highlight","time":1195851},{"cells":"r4c5","type":"highlight","time":1196558},{"cells":"highlighted","type":"candidates","value":"5","time":1197246},{"cells":"r3c4","type":"highlight","time":1201340},{"cells":"highlighted","type":"candidates","value":"4","time":1207126},{"cells":"highlighted","type":"candidates","value":"5","time":1207190},{"cells":"highlighted","type":"candidates","value":"6","time":1209199},{"cells":"highlighted","type":"candidates","value":"7","time":1212303},{"cells":"highlighted","type":"candidates","value":"8","time":1213000},{"cells":"highlighted","type":"candidates","value":"4","time":1217383},{"cells":"r7c5","type":"highlight","time":1223255},{"cells":"r1c5,r7c5","type":"highlight","time":1223862},{"cells":"r6c6","type":"highlight","time":1227260},{"cells":"r4c6,r6c6","type":"highlight","time":1227620},{"cells":"r5c8","type":"highlight","time":1229792},{"cells":"r5c8,r6c8","type":"highlight","time":1230725},{"cells":"r5c4","type":"highlight","time":1242627},{"cells":"r5c4,r6c5","type":"highlight","time":1243032},{"cells":"r5c3,r5c4,r6c5","type":"highlight","time":1243719},{"cells":"r5c3,r5c4,r6c3,r6c5","type":"highlight","time":1244045},{"cells":"r9c3","type":"highlight","time":1245541},{"cells":"r3c4","type":"highlight","time":1263867},{"cells":"r3c4,r3c5,r3c6","type":"highlight","time":1268131},{"cells":"r3c4,r3c5","type":"highlight","time":1272350},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1274542},{"cells":"r5c8","type":"highlight","time":1294738},{"cells":"r5c1,r5c8","type":"highlight","time":1295593},{"cells":"r4c1","type":"highlight","time":1296773},{"cells":"r4c1,r4c5","type":"highlight","time":1297359},{"cells":"r6c5","type":"highlight","time":1298427},{"cells":"r6c5,r6c8","type":"highlight","time":1299024},{"cells":"r6c8","type":"highlight","time":1300553},{"cells":"r4c5","type":"highlight","time":1301836},{"cells":"r5c1","type":"highlight","time":1302545},{"cells":"r5c8","type":"highlight","time":1303647},{"cells":"r6c8","type":"highlight","time":1303963},{"cells":"r5c7","type":"highlight","time":1305503},{"cells":"r4c7,r5c7","type":"highlight","time":1306449},{"cells":"r4c7,r5c6,r5c7","type":"highlight","time":1309025},{"cells":"r4c5,r4c7,r5c6,r5c7","type":"highlight","time":1309891},{"cells":"r3c5,r4c5,r4c7,r5c6,r5c7","type":"highlight","time":1312613},{"cells":"r3c5,r3c6,r4c5,r4c7,r5c6,r5c7","type":"highlight","time":1313412},{"cells":"r5c4","type":"highlight","time":1331176},{"cells":"r3c5","type":"highlight","time":1333213},{"cells":"r8c8","type":"highlight","time":1337701},{"cells":"r3c8,r4c8,r5c8,r6c8,r7c8,r8c8,r9c8","type":"highlight","time":1340975},{"cells":"r7c8","type":"highlight","time":1345182},{"cells":"r4c8,r7c8","type":"highlight","time":1345699},{"cells":"r8c8","type":"highlight","time":1355476},{"cells":"r2c5","type":"highlight","time":1370461},{"cells":"r1c3,r2c3,r3c3,r4c3","type":"highlight","time":1378673},{"cells":"r7c3","type":"highlight","time":1380011},{"cells":"r7c4,r7c5","type":"highlight","time":1395526},{"cells":"r2c8","type":"highlight","time":1407046},{"cells":"r2c4,r3c4","type":"highlight","time":1410477},{"cells":"r4c4","type":"highlight","time":1413346},{"cells":"r9c4","type":"highlight","time":1415550},{"cells":"r1c4","type":"highlight","time":1416158},{"cells":"r2c4,r3c4","type":"highlight","time":1416810},{"cells":"r3c4","type":"highlight","time":1422188},{"cells":"highlighted","type":"candidates","value":"8","time":1423143},{"cells":"r3c7","type":"highlight","time":1435789},{"cells":"r3c1,r3c7","type":"highlight","time":1436757},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1439582},{"cells":"r2c4","type":"highlight","time":1440210},{"cells":"r1c5,r2c4","type":"highlight","time":1440548},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1440846},{"cells":"r3c4","type":"highlight","time":1441931},{"cells":"r7c4","type":"highlight","time":1464960},{"cells":"r5c4","type":"highlight","time":1472317},{"cells":"r7c4","type":"highlight","time":1476784},{"cells":"r7c5","type":"highlight","time":1477818},{"cells":"r6c5","type":"highlight","time":1479304},{"cells":"r7c4","type":"highlight","time":1480496},{"cells":"r5c4","type":"highlight","time":1484074},{"cells":"r2c4","type":"highlight","time":1492263},{"cells":"r1c5","type":"highlight","time":1492589},{"cells":"r2c4","type":"highlight","time":1493005},{"cells":"r1c5","type":"highlight","time":1493309},{"cells":"r2c4","type":"highlight","time":1493669},{"cells":"r1c5","type":"highlight","time":1493939},{"cells":"r2c4","type":"highlight","time":1494300},{"cells":"r1c5","type":"highlight","time":1494592},{"cells":"r2c4","type":"highlight","time":1495031},{"cells":"r2c1","type":"highlight","time":1496054},{"cells":"r2c1,r2c9","type":"highlight","time":1497697},{"cells":"r2c4","type":"highlight","time":1498361},{"cells":"r1c5","type":"highlight","time":1499521},{"cells":"r2c4","type":"highlight","time":1500206},{"cells":"r2c4,r2c9","type":"highlight","time":1507372},{"cells":"r2c4,r2c9,r3c7","type":"highlight","time":1508509},{"cells":"r2c4","type":"highlight","time":1509442},{"cells":"r2c4,r2c9","type":"highlight","time":1510274},{"cells":"r2c4","type":"highlight","time":1511569},{"cells":"r2c4,r2c9","type":"highlight","time":1512773},{"cells":"r2c4,r2c9,r3c7","type":"highlight","time":1514044},{"cells":"r2c4,r2c9,r3c1,r3c7","type":"highlight","time":1517508},{"cells":"r5c6","type":"highlight","time":1531920},{"cells":"r4c2,r4c3,r4c4,r4c5,r4c6,r4c7","type":"highlight","time":1540548},{"cells":"r6c7","type":"highlight","time":1542449},{"cells":"r6c8","type":"highlight","time":1542945},{"cells":"r5c8,r6c8","type":"highlight","time":1552069},{"cells":"highlighted","type":"pencilmarks","value":"3","time":1553175},{"cells":"r7c8","type":"highlight","time":1553846},{"cells":"r4c5","type":"highlight","time":1562251},{"cells":"r4c5,r4c6,r4c7","type":"highlight","time":1564636},{"cells":"r4c5","type":"highlight","time":1564938},{"cells":"r4c1,r4c5","type":"highlight","time":1565523},{"cells":"r4c1,r5c1","type":"highlight","time":1566368},{"cells":"highlighted","type":"pencilmarks","value":"3","time":1566878},{"cells":"r2c1,r3c1","type":"highlight","time":1568809},{"cells":"highlighted","type":"pencilmarks","value":"6","time":1569863},{"cells":"r2c4,r3c4","type":"highlight","time":1579158},{"cells":"r5c4","type":"highlight","time":1579890},{"cells":"r5c4,r7c4","type":"highlight","time":1581161},{"cells":"r7c4","type":"highlight","time":1582769},{"cells":"r5c4,r7c4","type":"highlight","time":1583366},{"cells":"r7c4","type":"highlight","time":1584469},{"cells":"r5c4","type":"highlight","time":1585008},{"cells":"highlighted","type":"value","value":"5","time":1589535},{"cells":"r7c4","type":"highlight","time":1590060},{"cells":"highlighted","type":"value","value":"8","time":1590718},{"cells":"r7c5","type":"highlight","time":1591231},{"cells":"highlighted","type":"value","value":"7","time":1591822},{"cells":"r1c5","type":"highlight","time":1593649},{"cells":"highlighted","type":"value","value":"8","time":1593791},{"cells":"r1c2","type":"highlight","time":1595403},{"cells":"highlighted","type":"value","value":"7","time":1595448},{"cells":"r9c2","type":"highlight","time":1596843},{"cells":"highlighted","type":"value","value":"8","time":1596919},{"cells":"r9c3","type":"highlight","time":1597206},{"cells":"highlighted","type":"value","value":"7","time":1597327},{"cells":"r7c6","type":"highlight","time":1600028},{"cells":"r7c5","type":"highlight","time":1605540},{"cells":"highlighted","type":"clear","time":1606219},{"cells":"r7c4","type":"highlight","time":1606575},{"cells":"highlighted","type":"clear","time":1606734},{"cells":"r5c4","type":"highlight","time":1608206},{"cells":"highlighted","type":"clear","time":1608350},{"cells":"r1c5","type":"highlight","time":1609275},{"cells":"highlighted","type":"clear","time":1609376},{"cells":"r1c2","type":"highlight","time":1610198},{"cells":"highlighted","type":"clear","time":1610287},{"cells":"r9c2","type":"highlight","time":1611221},{"cells":"highlighted","type":"clear","time":1611295},{"cells":"r9c3","type":"highlight","time":1611501},{"cells":"highlighted","type":"clear","time":1611519},{"cells":"r5c7","type":"highlight","time":1613561},{"cells":"r6c6","type":"highlight","time":1617206},{"cells":"r4c7","type":"highlight","time":1618411},{"cells":"r6c8","type":"highlight","time":1619017},{"cells":"r4c7","type":"highlight","time":1619423},{"cells":"r6c8","type":"highlight","time":1620299},{"cells":"r4c7","type":"highlight","time":1620963},{"cells":"r4c5","type":"highlight","time":1627027},{"cells":"r6c5","type":"highlight","time":1631662},{"cells":"r4c5","type":"highlight","time":1633810},{"cells":"r5c1","type":"highlight","time":1634440},{"cells":"r4c7","type":"highlight","time":1636139},{"cells":"r4c5","type":"highlight","time":1638760},{"cells":"r5c1","type":"highlight","time":1640223},{"cells":"r6c8","type":"highlight","time":1642732},{"cells":"r6c5","type":"highlight","time":1644059},{"cells":"r4c7","type":"highlight","time":1646286},{"cells":"r4c5","type":"highlight","time":1646759},{"cells":"r6c5","type":"highlight","time":1647479},{"cells":"r5c4","type":"highlight","time":1648435},{"cells":"r5c6","type":"highlight","time":1649605},{"cells":"r6c8","type":"highlight","time":1658470},{"cells":"r6c7","type":"highlight","time":1658876},{"cells":"r6c6","type":"highlight","time":1659235},{"cells":"r6c8","type":"highlight","time":1659843},{"cells":"highlighted","type":"candidates","value":"7","time":1661758},{"cells":"highlighted","type":"candidates","value":"8","time":1661784},{"cells":"highlighted","type":"value","value":"3","time":1662727},{"cells":"r5c8","type":"highlight","time":1663274},{"cells":"highlighted","type":"pencilmarks","value":"3","time":1663703},{"cells":"highlighted","type":"candidates","value":"3","time":1664063},{"cells":"r6c6,r6c7,r6c8,r7c8,r8c8","type":"highlight","time":1665942},{"cells":"r6c5","type":"highlight","time":1671003},{"cells":"highlighted","type":"value","value":"4","time":1671407},{"cells":"highlighted","type":"value","value":"5","time":1671694},{"cells":"r6c3","type":"highlight","time":1672815},{"cells":"highlighted","type":"candidates","value":"5","time":1673463},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1673838},{"cells":"r5c3","type":"highlight","time":1674142},{"cells":"highlighted","type":"value","value":"5","time":1674247},{"cells":"r5c4","type":"highlight","time":1675448},{"cells":"highlighted","type":"value","value":"6","time":1676150},{"cells":"r5c6","type":"highlight","time":1677427},{"cells":"highlighted","type":"value","value":"4","time":1677695},{"cells":"r4c5","type":"highlight","time":1678427},{"cells":"highlighted","type":"value","value":"3","time":1678751},{"cells":"r5c7","type":"highlight","time":1679609},{"cells":"highlighted","type":"pencilmarks","value":"4","time":1680630},{"cells":"highlighted","type":"candidates","value":"4","time":1681055},{"cells":"r4c7","type":"highlight","time":1682039},{"cells":"highlighted","type":"value","value":"4","time":1683191},{"cells":"r4c1","type":"highlight","time":1685132},{"cells":"highlighted","type":"value","value":"3","time":1685677},{"cells":"highlighted","type":"clear","time":1687790},{"cells":"highlighted","type":"pencilmarks","value":"3","time":1688894},{"cells":"highlighted","type":"candidates","value":"3","time":1689230},{"cells":"r5c1","type":"highlight","time":1689564},{"cells":"highlighted","type":"value","value":"3","time":1689726},{"cells":"r5c4,r6c4,r7c4","type":"highlight","time":1698395},{"cells":"r7c4","type":"highlight","time":1700938},{"cells":"highlighted","type":"value","value":"7","time":1701966},{"cells":"r7c5","type":"highlight","time":1702333},{"cells":"highlighted","type":"value","value":"8","time":1702430},{"cells":"r1c5","type":"highlight","time":1703638},{"cells":"highlighted","type":"value","value":"7","time":1703742},{"cells":"r1c2","type":"highlight","time":1704741},{"cells":"highlighted","type":"value","value":"8","time":1704846},{"cells":"r9c2","type":"highlight","time":1705652},{"cells":"highlighted","type":"value","value":"7","time":1705710},{"cells":"r9c3","type":"highlight","time":1705979},{"cells":"highlighted","type":"value","value":"8","time":1706125},{"cells":"r6c3","type":"highlight","time":1706552},{"cells":"highlighted","type":"value","value":"7","time":1706766},{"cells":"r4c1","type":"highlight","time":1707048},{"cells":"highlighted","type":"value","value":"8","time":1707550},{"cells":"r4c6","type":"highlight","time":1708004},{"cells":"highlighted","type":"value","value":"7","time":1708150},{"cells":"r6c6","type":"highlight","time":1708476},{"cells":"highlighted","type":"value","value":"8","time":1708662},{"cells":"r8c8","type":"highlight","time":1709544},{"cells":"highlighted","type":"value","value":"7","time":1709639},{"cells":"none","type":"highlight","time":1709905},{"cells":"r8c9","type":"highlight","time":1710231},{"cells":"highlighted","type":"value","value":"8","time":1710678},{"cells":"r5c8","type":"highlight","time":1711165},{"cells":"highlighted","type":"value","value":"8","time":1711246},{"cells":"r5c7","type":"highlight","time":1711536},{"cells":"highlighted","type":"value","value":"7","time":1711623},{"cells":"r3c7","type":"highlight","time":1712053},{"cells":"highlighted","type":"value","value":"8","time":1712143},{"cells":"r3c1","type":"highlight","time":1713899},{"cells":"highlighted","type":"candidates","value":"8","time":1716638},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1716981},{"cells":"r1c2,r2c2,r3c2,r4c2,r5c2,r7c2,r8c2,r9c2","type":"highlight","time":1721234},{"cells":"r2c4","type":"highlight","time":1722213},{"cells":"highlighted","type":"candidates","value":"7","time":1723294},{"cells":"r3c4","type":"highlight","time":1723686},{"cells":"highlighted","type":"candidates","value":"7","time":1723782},{"cells":"r2c4","type":"highlight","time":1724833},{"cells":"highlighted","type":"value","value":"8","time":1725734},{"cells":"r2c1","type":"highlight","time":1726408},{"cells":"highlighted","type":"candidates","value":"8","time":1726838},{"cells":"r2c9","type":"highlight","time":1729647},{"cells":"highlighted","type":"value","value":"7","time":1730246},{"cells":"none","type":"highlight","time":1733237},{"cells":"r3c1","type":"highlight","time":1734294},{"cells":"r2c1","type":"highlight","time":1734688},{"cells":"highlighted","type":"value","value":"6","time":1734862},{"cells":"r3c1","type":"highlight","time":1735116},{"cells":"highlighted","type":"value","value":"7","time":1735190},{"cells":"r3c5","type":"highlight","time":1738468},{"cells":"r3c4","type":"highlight","time":1739357},{"cells":"highlighted","type":"value","value":"5","time":1740806},{"cells":"r3c5","type":"highlight","time":1741629},{"cells":"highlighted","type":"value","value":"4","time":1741870},{"cells":"r3c6","type":"highlight","time":1742597},{"cells":"highlighted","type":"value","value":"7","time":1742838},{"cells":"highlighted","type":"value","value":"6","time":1743343},{"cells":"none","type":"highlight","time":2516415}]}';
	//app.savedReplay = '{"puzzleId":"HBMQr6HjJH","actions":[{"cells":"r2c1,r2c2","type":"highlight","time":56809},{"cells":"highlighted","type":"pencilmarks","value":"1","time":57197},{"type":"undo","time":58493,"cells":""},{"cells":"r2c1,r2c2","type":"highlight","time":58495},{"cells":"highlighted","type":"pencilmarks","value":"1","time":59405},{"cells":"r4c4","type":"highlight","time":60071},{"cells":"r5c4","type":"highlight","time":63813},{"cells":"r5c4,r5c6","type":"highlight","time":64713},{"cells":"highlighted","type":"pencilmarks","value":"2","time":65221},{"cells":"r6c4","type":"highlight","time":67497},{"cells":"r6c4,r4c4","type":"highlight","time":68561},{"cells":"highlighted","type":"pencilmarks","value":"3","time":69109},{"cells":"r8c7","type":"highlight","time":70099},{"cells":"r1c8,r2c8","type":"highlight","time":72026},{"cells":"highlighted","type":"pencilmarks","value":"5","time":73006},{"cells":"r1c2,r2c2","type":"highlight","time":76826},{"cells":"highlighted","type":"pencilmarks","value":"9","time":77886},{"cells":"r9c7,r9c8","type":"highlight","time":80928},{"cells":"highlighted","type":"pencilmarks","value":"9","time":81093},{"cells":"r7c3","type":"highlight","time":96033},{"cells":"highlighted","type":"value","value":"3","time":97308},{"cells":"r8c8,r8c9","type":"highlight","time":99190},{"cells":"highlighted","type":"pencilmarks","value":"3","time":99382},{"cells":"r7c1","type":"highlight","time":104163},{"cells":"highlighted","type":"value","value":"5","time":104734},{"cells":"r3c3","type":"highlight","time":110853},{"cells":"r3c3,r3c1","type":"highlight","time":111468},{"cells":"highlighted","type":"pencilmarks","value":"4","time":112677},{"cells":"r7c9","type":"highlight","time":147265},{"cells":"r7c9,r7c7","type":"highlight","time":147895},{"cells":"highlighted","type":"pencilmarks","value":"8","time":149965},{"cells":"r8c1,r8c2","type":"highlight","time":151255},{"cells":"highlighted","type":"pencilmarks","value":"8","time":151501},{"cells":"r4c2,r5c2,r6c2","type":"highlight","time":154360},{"cells":"r8c1","type":"highlight","time":157128},{"cells":"highlighted","type":"value","value":"8","time":157310},{"cells":"r8c2","type":"highlight","time":157782},{"cells":"highlighted","type":"pencilmarks","value":"8","time":158030},{"cells":"r9c3","type":"highlight","time":162221},{"cells":"r8c2","type":"highlight","time":162941},{"cells":"r9c2","type":"highlight","time":163564},{"cells":"r9c1","type":"highlight","time":163915},{"cells":"r9c2","type":"highlight","time":184480},{"cells":"r9c3","type":"highlight","time":185448},{"cells":"r8c9","type":"highlight","time":203342},{"cells":"r2c8,r2c9","type":"highlight","time":218883},{"cells":"highlighted","type":"pencilmarks","value":"3","time":219533},{"cells":"r8c8,r8c9","type":"highlight","time":226802},{"cells":"r8c2","type":"highlight","time":227492},{"cells":"r7c8,r7c7,r7c6,r7c5,r7c4","type":"highlight","time":249407},{"cells":"r7c8,r6c8,r5c8,r4c8,r3c8","type":"highlight","time":250066},{"cells":"r7c8,r6c8,r5c8,r4c8,r3c8,r5c7","type":"highlight","time":252204},{"cells":"r4c7","type":"highlight","time":252490},{"cells":"r4c7,r6c7","type":"highlight","time":252872},{"cells":"highlighted","type":"pencilmarks","value":"6","time":253758},{"cells":"highlighted","type":"candidates","value":"3","time":260973},{"cells":"highlighted","type":"candidates","value":"6","time":261006},{"cells":"highlighted","type":"pencilmarks","value":"6","time":261661},{"cells":"r5c7","type":"highlight","time":269709},{"cells":"highlighted","type":"value","value":"1","time":270020},{"cells":"r4c8,r5c8,r6c8","type":"highlight","time":271292},{"cells":"highlighted","type":"candidates","value":"4","time":273229},{"cells":"highlighted","type":"candidates","value":"7","time":274741},{"cells":"highlighted","type":"candidates","value":"8","time":274782},{"cells":"r1c7,r1c8,r1c9","type":"highlight","time":286119},{"cells":"r1c7,r1c8,r1c9,r2c9,r3c9","type":"highlight","time":287169},{"cells":"r1c7,r1c8,r1c9,r2c9,r3c9,r3c7","type":"highlight","time":287980},{"cells":"r3c8,r2c8,r1c8","type":"highlight","time":295361},{"cells":"r3c8,r2c8,r1c8,r2c7,r2c9","type":"highlight","time":295877},{"cells":"r4c8,r5c8,r6c8,r7c8,r8c8,r9c8","type":"highlight","time":298621},{"cells":"r4c8,r5c8,r6c8,r7c8,r8c8,r9c8,r9c7,r9c9","type":"highlight","time":299524},{"cells":"r4c8,r5c8,r6c8,r7c8,r8c8,r9c8,r9c7,r9c9,r8c7,r8c9","type":"highlight","time":304681},{"cells":"r7c7,r7c8,r7c9","type":"highlight","time":311275},{"cells":"r7c7,r7c8,r7c9,r8c8,r9c8","type":"highlight","time":311784},{"cells":"r4c6,r5c6,r6c6,r5c5,r5c4,r5c3","type":"highlight","time":324376},{"cells":"r5c8,r5c7,r5c6,r5c5,r5c4,r5c3,r5c2","type":"highlight","time":327392},{"cells":"r6c7","type":"highlight","time":332649},{"cells":"highlighted","type":"value","value":"3","time":334317},{"cells":"r4c7","type":"highlight","time":334682},{"cells":"highlighted","type":"value","value":"6","time":334821},{"cells":"r6c2,r6c3","type":"highlight","time":350641},{"cells":"highlighted","type":"pencilmarks","value":"6","time":351909},{"cells":"r6c7","type":"highlight","time":353754},{"cells":"r6c4,r6c5,r6c6,r6c7,r6c8","type":"highlight","time":354633},{"cells":"r6c4","type":"highlight","time":355051},{"cells":"highlighted","type":"pencilmarks","value":"3","time":355917},{"cells":"r4c4","type":"highlight","time":356290},{"cells":"highlighted","type":"value","value":"3","time":356390},{"cells":"r5c7","type":"highlight","time":357909},{"cells":"r6c7,r6c6,r6c5,r6c4,r6c3","type":"highlight","time":359387},{"cells":"r6c7,r5c7,r4c7,r3c7,r2c7,r1c7,r1c8,r1c9","type":"highlight","time":363751},{"cells":"r6c7,r5c7,r4c7,r3c7,r2c7,r1c7,r1c8,r1c9,r3c8,r3c9","type":"highlight","time":364381},{"cells":"r6c8","type":"highlight","time":370606},{"cells":"r5c7,r5c6,r5c5,r5c4,r5c3","type":"highlight","time":378692},{"cells":"r9c7,r9c8","type":"highlight","time":384991},{"cells":"r3c7","type":"highlight","time":390008},{"cells":"r3c7,r1c7","type":"highlight","time":393676},{"cells":"r7c7","type":"highlight","time":397479},{"cells":"r7c7,r9c7","type":"highlight","time":398027},{"cells":"r9c7","type":"highlight","time":400014},{"cells":"r7c7","type":"highlight","time":400720},{"cells":"r8c8","type":"highlight","time":406118},{"cells":"highlighted","type":"candidates","value":"2","time":407526},{"cells":"highlighted","type":"candidates","value":"3","time":407613},{"cells":"r9c8","type":"highlight","time":408149},{"cells":"highlighted","type":"candidates","value":"2","time":411692},{"cells":"highlighted","type":"candidates","value":"9","time":413028},{"cells":"r1c8,r2c8","type":"highlight","time":417082},{"cells":"highlighted","type":"candidates","value":"2","time":418980},{"cells":"highlighted","type":"candidates","value":"3","time":419676},{"cells":"highlighted","type":"candidates","value":"5","time":422085},{"cells":"highlighted","type":"candidates","value":"9","time":424037},{"cells":"r1c8","type":"highlight","time":425536},{"cells":"highlighted","type":"candidates","value":"3","time":425876},{"cells":"r8c2","type":"highlight","time":433965},{"cells":"r7c4,r7c5,r7c6","type":"highlight","time":436492},{"cells":"r7c4,r7c5","type":"highlight","time":441285},{"cells":"r7c4,r7c5,r7c6","type":"highlight","time":443408},{"cells":"r9c3,r9c2,r9c1","type":"highlight","time":461602},{"cells":"r9c1","type":"highlight","time":468412},{"cells":"r9c1,r1c1,r2c1,r3c1","type":"highlight","time":469327},{"cells":"highlighted","type":"candidates","value":"1","time":470212},{"cells":"highlighted","type":"candidates","value":"4","time":470788},{"cells":"highlighted","type":"candidates","value":"6","time":472420},{"cells":"highlighted","type":"candidates","value":"7","time":472452},{"cells":"r4c2","type":"highlight","time":473820},{"cells":"r1c1","type":"highlight","time":475591},{"cells":"highlighted","type":"candidates","value":"1","time":475997},{"cells":"r3c1","type":"highlight","time":476257},{"cells":"highlighted","type":"candidates","value":"1","time":476427},{"cells":"r1c1","type":"highlight","time":476828},{"cells":"highlighted","type":"candidates","value":"4","time":477372},{"cells":"r2c1","type":"highlight","time":477728},{"cells":"highlighted","type":"candidates","value":"4","time":478005},{"cells":"r9c1","type":"highlight","time":479557},{"cells":"highlighted","type":"candidates","value":"7","time":480540},{"cells":"r6c8","type":"highlight","time":486210},{"cells":"highlighted","type":"candidates","value":"8","time":486876},{"cells":"r7c9,r7c8,r7c7","type":"highlight","time":489825},{"cells":"r8c8","type":"highlight","time":490230},{"cells":"r6c6,r6c5,r6c4","type":"highlight","time":494939},{"cells":"r6c4,r5c4,r4c4,r3c4","type":"highlight","time":496591},{"cells":"r6c4","type":"highlight","time":496944},{"cells":"r6c2,r5c2,r4c2","type":"highlight","time":498053},{"cells":"r4c3,r5c3,r6c3","type":"highlight","time":498607},{"cells":"r6c6,r6c5,r6c4,r6c3,r6c2","type":"highlight","time":504329},{"cells":"r6c2","type":"highlight","time":504690},{"cells":"r6c2,r6c4,r6c5,r6c6","type":"highlight","time":505447},{"cells":"r9c2","type":"highlight","time":506077},{"cells":"r8c2,r9c2,r9c3","type":"highlight","time":506767},{"cells":"highlighted","type":"candidates","value":"1","time":507404},{"cells":"highlighted","type":"candidates","value":"2","time":507509},{"cells":"highlighted","type":"candidates","value":"4","time":507988},{"cells":"highlighted","type":"candidates","value":"6","time":509694},{"cells":"r8c3","type":"highlight","time":510915},{"cells":"r9c3,r9c2,r8c2","type":"highlight","time":513652},{"cells":"highlighted","type":"clear","time":513980},{"cells":"r8c4","type":"highlight","time":514733},{"cells":"r4c2,r5c2,r6c2","type":"highlight","time":515909},{"cells":"highlighted","type":"pencilmarks","value":"8","time":516579},{"cells":"r4c3,r5c3,r6c3","type":"highlight","time":519517},{"cells":"highlighted","type":"pencilmarks","value":"7","time":520252},{"cells":"r6c3","type":"highlight","time":520679},{"cells":"highlighted","type":"pencilmarks","value":"7","time":521164},{"cells":"r1c1,r2c1,r3c1","type":"highlight","time":523920},{"cells":"r1c9,r2c9,r3c9","type":"highlight","time":528562},{"cells":"highlighted","type":"pencilmarks","value":"6","time":529333},{"cells":"r7c9,r8c9,r9c9","type":"highlight","time":532327},{"cells":"highlighted","type":"pencilmarks","value":"4","time":533924},{"cells":"r4c2,r4c3","type":"highlight","time":539752},{"cells":"r4c4,r4c5,r4c6","type":"highlight","time":541589},{"cells":"r8c3,r8c4,r8c5,r8c6,r8c7","type":"highlight","time":546922},{"cells":"r7c5,r7c6","type":"highlight","time":547942},{"cells":"highlighted","type":"pencilmarks","value":"9","time":549420},{"cells":"r8c5","type":"highlight","time":550102},{"cells":"r6c4","type":"highlight","time":557939},{"cells":"r3c6","type":"highlight","time":560339},{"cells":"r4c6","type":"highlight","time":565109},{"cells":"r6c6,r5c6,r4c6","type":"highlight","time":567405},{"cells":"r4c5","type":"highlight","time":567840},{"cells":"r4c5,r6c5,r6c4","type":"highlight","time":568515},{"cells":"highlighted","type":"pencilmarks","value":"1","time":568900},{"cells":"r6c6","type":"highlight","time":569452},{"cells":"r7c5","type":"highlight","time":584646},{"cells":"r6c6,r7c6,r8c6","type":"highlight","time":586671},{"cells":"r6c6,r7c6,r8c6,r7c5","type":"highlight","time":587001},{"cells":"r7c4,r8c4,r8c5,r8c6","type":"highlight","time":587865},{"cells":"r8c5,r8c4,r7c4","type":"highlight","time":588629},{"cells":"highlighted","type":"pencilmarks","value":"1","time":588916},{"cells":"r8c6","type":"highlight","time":589597},{"cells":"r9c6","type":"highlight","time":592874},{"cells":"r8c4,r8c5,r7c4","type":"highlight","time":594127},{"cells":"r6c4","type":"highlight","time":605414},{"cells":"r6c3","type":"highlight","time":606359},{"cells":"r3c4","type":"highlight","time":608174},{"cells":"r3c6","type":"highlight","time":613071},{"cells":"r3c7","type":"highlight","time":621396},{"cells":"r4c6","type":"highlight","time":622312},{"cells":"r2c4,r3c4","type":"highlight","time":631215},{"cells":"r3c5,r3c6","type":"highlight","time":631844},{"cells":"highlighted","type":"pencilmarks","value":"8","time":633100},{"cells":"r1c7","type":"highlight","time":634687},{"cells":"r1c7,r1c9","type":"highlight","time":635241},{"cells":"highlighted","type":"pencilmarks","value":"8","time":635676},{"cells":"r4c4,r5c4,r6c4","type":"highlight","time":644999},{"cells":"r4c4,r5c4,r6c4,r4c5,r4c6","type":"highlight","time":645389},{"cells":"r5c6,r6c6,r6c5","type":"highlight","time":645959},{"cells":"highlighted","type":"pencilmarks","value":"8","time":646133},{"cells":"r7c7","type":"highlight","time":661289},{"cells":"r6c6,r6c5,r6c4","type":"highlight","time":669036},{"cells":"r6c9,r7c9,r8c9,r9c9","type":"highlight","time":675516},{"cells":"r6c7,r7c7,r8c7,r8c8,r9c8,r9c7","type":"highlight","time":677631},{"cells":"r7c7","type":"highlight","time":678283},{"cells":"r6c7","type":"highlight","time":680070},{"cells":"r4c8","type":"highlight","time":681561},{"cells":"r4c9,r4c8,r4c7,r4c6,r4c5,r4c4,r4c3,r4c2,r4c1","type":"highlight","time":682963},{"cells":"r4c9,r4c8,r4c7,r4c6,r4c5,r4c4,r4c3,r4c2,r4c1,r6c2","type":"highlight","time":686054},{"cells":"r5c2,r5c3,r6c3","type":"highlight","time":687111},{"cells":"highlighted","type":"pencilmarks","value":"5","time":688852},{"cells":"r4c9,r4c8,r4c7,r4c6,r4c5,r4c4","type":"highlight","time":701075},{"cells":"r4c9,r4c8,r4c7,r4c6,r4c5,r4c4,r6c5","type":"highlight","time":701916},{"cells":"r4c9,r4c8,r4c7,r4c6,r4c5,r4c4,r6c5,r5c4","type":"highlight","time":703572},{"cells":"r6c4","type":"highlight","time":704728},{"cells":"r6c4,r5c6,r6c6","type":"highlight","time":705261},{"cells":"highlighted","type":"pencilmarks","value":"5","time":706531},{"cells":"r5c6","type":"highlight","time":719503},{"cells":"r6c6","type":"highlight","time":719863},{"cells":"r6c4,r6c5,r6c6","type":"highlight","time":729231},{"cells":"r2c4,r3c4,r4c4,r5c4,r6c4,r7c4,r8c4,r9c4","type":"highlight","time":738336},{"cells":"r7c6,r7c5","type":"highlight","time":746181},{"cells":"r6c4,r6c5,r6c6,r6c7","type":"highlight","time":748851},{"cells":"r5c4","type":"highlight","time":750194},{"cells":"r5c4","type":"highlight","time":791368},{"cells":"highlighted","type":"value","value":"2","time":792052},{"cells":"r5c6","type":"highlight","time":793034},{"cells":"highlighted","type":"pencilmarks","value":"2","time":793277},{"cells":"r5c4","type":"highlight","time":794638},{"cells":"r9c4,r8c4,r7c4,r6c4,r5c4,r4c4,r3c4,r2c4,r1c4","type":"highlight","time":800398},{"cells":"r6c3","type":"highlight","time":804298},{"cells":"r8c3","type":"highlight","time":811507},{"cells":"r7c5","type":"highlight","time":811941},{"cells":"r6c9,r6c8,r6c7,r6c6,r6c5,r6c4,r6c3,r6c2,r6c1","type":"highlight","time":813268},{"cells":"r5c4","type":"highlight","time":814378},{"cells":"r7c5","type":"highlight","time":816673},{"cells":"r4c5","type":"highlight","time":820372},{"cells":"r6c5","type":"highlight","time":836263},{"cells":"r6c4,r6c5,r6c6,r6c7,r6c8,r5c5,r5c6,r5c4","type":"highlight","time":840613},{"cells":"r4c5,r4c6","type":"highlight","time":842008},{"cells":"highlighted","type":"pencilmarks","value":"9","time":843901},{"cells":"r6c4","type":"highlight","time":844851},{"cells":"r7c4","type":"highlight","time":847147},{"cells":"highlighted","type":"value","value":"1","time":852654},{"cells":"r6c4","type":"highlight","time":853198},{"cells":"highlighted","type":"pencilmarks","value":"1","time":853420},{"cells":"r6c5","type":"highlight","time":853805},{"cells":"highlighted","type":"pencilmarks","value":"1","time":854011},{"cells":"r8c4","type":"highlight","time":854435},{"cells":"highlighted","type":"pencilmarks","value":"1","time":854852},{"cells":"r8c5","type":"highlight","time":855231},{"cells":"highlighted","type":"pencilmarks","value":"1","time":855341},{"cells":"r4c5","type":"highlight","time":855943},{"cells":"highlighted","type":"value","value":"1","time":856356},{"cells":"r6c2,r6c3","type":"highlight","time":865212},{"cells":"r6c2","type":"highlight","time":865482},{"cells":"highlighted","type":"value","value":"1","time":865853},{"cells":"r7c2","type":"highlight","time":866698},{"cells":"r6c2,r5c2,r4c2,r3c2,r3c1,r2c1,r1c1","type":"highlight","time":869637},{"cells":"r2c2","type":"highlight","time":869870},{"cells":"highlighted","type":"pencilmarks","value":"1","time":870060},{"cells":"r2c1","type":"highlight","time":870500},{"cells":"highlighted","type":"value","value":"1","time":870676},{"cells":"r9c1","type":"highlight","time":871145},{"cells":"highlighted","type":"candidates","value":"1","time":871684},{"cells":"r7c1,r8c1,r9c1,r9c2","type":"highlight","time":875949},{"cells":"r9c3","type":"highlight","time":876867},{"cells":"highlighted","type":"value","value":"1","time":877068},{"cells":"r9c5","type":"highlight","time":879170},{"cells":"r8c5","type":"highlight","time":882290},{"cells":"r8c6","type":"highlight","time":882823},{"cells":"r7c7","type":"highlight","time":883221},{"cells":"r8c2,r9c2","type":"highlight","time":884128},{"cells":"highlighted","type":"candidates","value":"2","time":885373},{"cells":"highlighted","type":"candidates","value":"4","time":886261},{"cells":"highlighted","type":"candidates","value":"6","time":886748},{"cells":"r8c4","type":"highlight","time":889617},{"cells":"r8c5","type":"highlight","time":904204},{"cells":"r6c2,r6c3,r6c4,r6c5,r6c6,r6c7,r6c8,r6c9,r5c9","type":"highlight","time":909791},{"cells":"r4c6","type":"highlight","time":910212},{"cells":"highlighted","type":"value","value":"9","time":910852},{"cells":"r7c6,r8c6","type":"highlight","time":914802},{"cells":"r7c6","type":"highlight","time":916032},{"cells":"highlighted","type":"pencilmarks","value":"9","time":917060},{"cells":"r7c5","type":"highlight","time":917450},{"cells":"highlighted","type":"value","value":"9","time":917484},{"cells":"r2c4,r3c4","type":"highlight","time":924320},{"cells":"highlighted","type":"pencilmarks","value":"9","time":924620},{"cells":"r6c4,r6c5,r6c6,r5c6","type":"highlight","time":932675},{"cells":"highlighted","type":"candidates","value":"4","time":934251},{"cells":"highlighted","type":"candidates","value":"5","time":934276},{"cells":"highlighted","type":"candidates","value":"6","time":934532},{"cells":"highlighted","type":"candidates","value":"6","time":934971},{"cells":"highlighted","type":"candidates","value":"7","time":935636},{"cells":"highlighted","type":"candidates","value":"8","time":935668},{"cells":"r6c5","type":"highlight","time":939139},{"cells":"r6c4","type":"highlight","time":939499},{"cells":"highlighted","type":"candidates","value":"4","time":941091},{"cells":"r6c5","type":"highlight","time":941622},{"cells":"highlighted","type":"candidates","value":"5","time":941997},{"cells":"r6c6","type":"highlight","time":943145},{"cells":"r5c6","type":"highlight","time":946857},{"cells":"r6c4","type":"highlight","time":949054},{"cells":"r8c5,r7c5,r6c5,r5c5,r4c5,r3c5,r2c5,r1c5","type":"highlight","time":959017},{"cells":"r8c5,r7c5,r6c5,r5c5,r4c5,r3c5,r2c5,r1c5,r4c9,r4c8,r4c7,r4c6,r4c4,r4c3,r4c2","type":"highlight","time":960634},{"cells":"r6c4","type":"highlight","time":967744},{"cells":"highlighted","type":"candidates","value":"8","time":968547},{"cells":"r9c4,r8c4,r7c4,r6c4,r5c4,r4c4,r3c4,r2c4,r1c4","type":"highlight","time":970347},{"cells":"r2c3,r2c4,r2c5,r2c6,r2c7,r2c8,r2c9","type":"highlight","time":976527},{"cells":"r7c6","type":"highlight","time":977921},{"cells":"r7c6,r7c7","type":"highlight","time":978237},{"cells":"r7c6,r7c7,r7c9","type":"highlight","time":978582},{"cells":"highlighted","type":"candidates","value":"2","time":979868},{"cells":"highlighted","type":"candidates","value":"4","time":980436},{"cells":"highlighted","type":"candidates","value":"8","time":981996},{"cells":"r7c9","type":"highlight","time":983411},{"cells":"highlighted","type":"candidates","value":"2","time":983757},{"cells":"r7c7","type":"highlight","time":985954},{"cells":"highlighted","type":"candidates","value":"4","time":986924},{"cells":"r7c9","type":"highlight","time":990664},{"cells":"r7c5","type":"highlight","time":991076},{"cells":"r7c6","type":"highlight","time":991489},{"cells":"r8c5,r8c6,r8c4","type":"highlight","time":992726},{"cells":"highlighted","type":"candidates","value":"2","time":993635},{"cells":"highlighted","type":"candidates","value":"3","time":993772},{"cells":"highlighted","type":"candidates","value":"3","time":994116},{"cells":"highlighted","type":"candidates","value":"4","time":994435},{"cells":"highlighted","type":"candidates","value":"6","time":995708},{"cells":"highlighted","type":"candidates","value":"7","time":995804},{"cells":"r9c4","type":"highlight","time":997287},{"cells":"r8c4","type":"highlight","time":997594},{"cells":"highlighted","type":"candidates","value":"4","time":998628},{"cells":"highlighted","type":"candidates","value":"2","time":999668},{"cells":"r8c5","type":"highlight","time":1000691},{"cells":"highlighted","type":"candidates","value":"6","time":1001595},{"cells":"r8c6","type":"highlight","time":1002274},{"cells":"r8c4","type":"highlight","time":1008049},{"cells":"r2c4,r3c4","type":"highlight","time":1009211},{"cells":"highlighted","type":"candidates","value":"5","time":1011428},{"cells":"highlighted","type":"candidates","value":"6","time":1011492},{"cells":"highlighted","type":"candidates","value":"7","time":1011676},{"cells":"highlighted","type":"candidates","value":"9","time":1011924},{"cells":"r4c2,r4c3","type":"highlight","time":1020462},{"cells":"highlighted","type":"candidates","value":"4","time":1022315},{"cells":"highlighted","type":"candidates","value":"7","time":1023132},{"cells":"highlighted","type":"candidates","value":"8","time":1023148},{"cells":"r5c3","type":"highlight","time":1024722},{"cells":"r4c2","type":"highlight","time":1025089},{"cells":"r4c3","type":"highlight","time":1025419},{"cells":"highlighted","type":"candidates","value":"8","time":1026540},{"cells":"r4c2","type":"highlight","time":1026919},{"cells":"highlighted","type":"candidates","value":"7","time":1027147},{"cells":"r4c3","type":"highlight","time":1032462},{"cells":"r4c2","type":"highlight","time":1032934},{"cells":"r4c3,r4c2","type":"highlight","time":1033497},{"cells":"r7c2,r6c2,r5c2,r4c2","type":"highlight","time":1039842},{"cells":"r1c2,r2c2","type":"highlight","time":1046449},{"cells":"r7c4","type":"highlight","time":1046878},{"cells":"r6c3","type":"highlight","time":1050537},{"cells":"r5c5,r5c4,r5c3,r5c2,r5c1","type":"highlight","time":1056620},{"cells":"r6c3","type":"highlight","time":1059889},{"cells":"highlighted","type":"value","value":"6","time":1059965},{"cells":"r9c3,r8c3,r7c3,r6c3,r5c3,r4c3,r3c3,r2c3,r1c3","type":"highlight","time":1068006},{"cells":"r8c3","type":"highlight","time":1072212},{"cells":"r5c3,r5c2","type":"highlight","time":1078978},{"cells":"r5c3","type":"highlight","time":1079405},{"cells":"r6c3,r5c3,r4c3,r3c3,r2c3,r1c3","type":"highlight","time":1087714},{"cells":"r6c4","type":"highlight","time":1092236},{"cells":"r5c2,r5c3","type":"highlight","time":1093804},{"cells":"r4c3,r4c2,r5c2,r5c3","type":"highlight","time":1096070},{"cells":"highlighted","type":"pencilmarks","value":"4","time":1097045},{"cells":"r6c2","type":"highlight","time":1098454},{"cells":"r5c2,r5c3","type":"highlight","time":1099107},{"cells":"highlighted","type":"candidates","value":"4","time":1102124},{"cells":"highlighted","type":"candidates","value":"5","time":1102756},{"cells":"highlighted","type":"candidates","value":"7","time":1104420},{"cells":"highlighted","type":"candidates","value":"8","time":1104700},{"cells":"r6c3","type":"highlight","time":1106217},{"cells":"r5c3","type":"highlight","time":1106516},{"cells":"highlighted","type":"candidates","value":"8","time":1108132},{"cells":"r5c2","type":"highlight","time":1111145},{"cells":"highlighted","type":"candidates","value":"7","time":1112148},{"cells":"r4c2,r4c3","type":"highlight","time":1115966},{"cells":"r5c2,r5c3,r5c4,r5c5,r5c6,r5c7,r5c8,r5c9","type":"highlight","time":1119754},{"cells":"r5c2,r5c3","type":"highlight","time":1120991},{"cells":"r5c6","type":"highlight","time":1121524},{"cells":"highlighted","type":"candidates","value":"5","time":1124596},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1125140},{"cells":"r6c4","type":"highlight","time":1129384},{"cells":"r6c4,r6c6","type":"highlight","time":1130291},{"cells":"r4c2","type":"highlight","time":1141736},{"cells":"highlighted","type":"value","value":"8","time":1144133},{"cells":"r5c2","type":"highlight","time":1145329},{"cells":"highlighted","type":"candidates","value":"8","time":1146116},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1146492},{"cells":"r4c8","type":"highlight","time":1148276},{"cells":"highlighted","type":"candidates","value":"8","time":1148445},{"cells":"r5c8","type":"highlight","time":1150219},{"cells":"highlighted","type":"value","value":"8","time":1150491},{"cells":"r5c6","type":"highlight","time":1155086},{"cells":"highlighted","type":"candidates","value":"8","time":1155220},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1155581},{"cells":"r6c6,r6c5","type":"highlight","time":1157247},{"cells":"r7c6","type":"highlight","time":1160074},{"cells":"highlighted","type":"candidates","value":"8","time":1161436},{"cells":"r7c5","type":"highlight","time":1177826},{"cells":"r8c8,r8c9","type":"highlight","time":1188573},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1189036},{"cells":"r8c8","type":"highlight","time":1191049},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1191291},{"cells":"r8c9","type":"highlight","time":1191756},{"cells":"highlighted","type":"value","value":"1","time":1193115},{"cells":"r8c8","type":"highlight","time":1195548},{"cells":"highlighted","type":"value","value":"3","time":1195812},{"cells":"r2c8","type":"highlight","time":1198129},{"cells":"highlighted","type":"candidates","value":"3","time":1198964},{"cells":"highlighted","type":"pencilmarks","value":"3","time":1199564},{"cells":"r2c9","type":"highlight","time":1199981},{"cells":"highlighted","type":"value","value":"3","time":1200068},{"cells":"r9c9","type":"highlight","time":1208906},{"cells":"highlighted","type":"candidates","value":"4","time":1225259},{"cells":"highlighted","type":"candidates","value":"7","time":1229427},{"cells":"r8c6,r7c6,r7c7","type":"highlight","time":1235838},{"cells":"r7c6","type":"highlight","time":1236161},{"cells":"r7c6,r7c7","type":"highlight","time":1236648},{"cells":"r7c9","type":"highlight","time":1237225},{"cells":"r7c6","type":"highlight","time":1239596},{"cells":"r8c6","type":"highlight","time":1245558},{"cells":"r7c6","type":"highlight","time":1245776},{"cells":"highlighted","type":"value","value":"2","time":1245933},{"cells":"r7c7","type":"highlight","time":1246286},{"cells":"highlighted","type":"value","value":"8","time":1246835},{"cells":"r7c9","type":"highlight","time":1247344},{"cells":"highlighted","type":"value","value":"4","time":1248012},{"cells":"r7c7","type":"highlight","time":1249863},{"cells":"r6c6","type":"highlight","time":1250170},{"cells":"highlighted","type":"candidates","value":"8","time":1251132},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1251507},{"cells":"r6c8","type":"highlight","time":1252166},{"cells":"highlighted","type":"value","value":"7","time":1252933},{"cells":"r4c8","type":"highlight","time":1253411},{"cells":"highlighted","type":"value","value":"3","time":1253596},{"cells":"highlighted","type":"value","value":"4","time":1254059},{"cells":"r4c3","type":"highlight","time":1254970},{"cells":"highlighted","type":"value","value":"7","time":1255580},{"cells":"r5c3","type":"highlight","time":1256110},{"cells":"highlighted","type":"candidates","value":"7","time":1257108},{"cells":"highlighted","type":"pencilmarks","value":"7","time":1257452},{"cells":"r5c2,r5c3","type":"highlight","time":1259365},{"cells":"r5c6","type":"highlight","time":1259958},{"cells":"highlighted","type":"value","value":"7","time":1260844},{"cells":"r6c6","type":"highlight","time":1261165},{"cells":"highlighted","type":"candidates","value":"7","time":1261595},{"cells":"r6c5","type":"highlight","time":1261930},{"cells":"highlighted","type":"candidates","value":"7","time":1262084},{"cells":"r6c4","type":"highlight","time":1262785},{"cells":"highlighted","type":"value","value":"5","time":1264203},{"cells":"r6c6","type":"highlight","time":1264593},{"cells":"highlighted","type":"value","value":"4","time":1265075},{"cells":"r6c5","type":"highlight","time":1265553},{"cells":"highlighted","type":"value","value":"8","time":1266283},{"cells":"r8c6","type":"highlight","time":1267315},{"cells":"highlighted","type":"candidates","value":"4","time":1268251},{"cells":"highlighted","type":"candidates","value":"7","time":1268620},{"cells":"r8c5","type":"highlight","time":1269708},{"cells":"r8c4","type":"highlight","time":1271575},{"cells":"r8c6","type":"highlight","time":1272303},{"cells":"r2c6,r3c6","type":"highlight","time":1273451},{"cells":"highlighted","type":"candidates","value":"2","time":1274868},{"cells":"highlighted","type":"candidates","value":"2","time":1276092},{"cells":"highlighted","type":"candidates","value":"5","time":1278645},{"cells":"highlighted","type":"candidates","value":"6","time":1279228},{"cells":"highlighted","type":"candidates","value":"7","time":1280028},{"cells":"r8c6","type":"highlight","time":1282884},{"cells":"highlighted","type":"value","value":"6","time":1283867},{"cells":"r8c4","type":"highlight","time":1284429},{"cells":"highlighted","type":"value","value":"7","time":1285131},{"cells":"r8c5","type":"highlight","time":1285412},{"cells":"highlighted","type":"value","value":"5","time":1285788},{"cells":"highlighted","type":"value","value":"4","time":1286339},{"cells":"r8c2","type":"highlight","time":1287677},{"cells":"highlighted","type":"value","value":"2","time":1288035},{"cells":"r9c2","type":"highlight","time":1288990},{"cells":"highlighted","type":"candidates","value":"2","time":1289150},{"cells":"r9c9","type":"highlight","time":1292582},{"cells":"highlighted","type":"value","value":"7","time":1293451},{"cells":"r9c7","type":"highlight","time":1295006},{"cells":"highlighted","type":"candidates","value":"2","time":1297708},{"cells":"highlighted","type":"candidates","value":"9","time":1297796},{"cells":"r2c6,r3c6","type":"highlight","time":1301417},{"cells":"highlighted","type":"candidates","value":"7","time":1302259},{"cells":"r2c5,r3c5","type":"highlight","time":1305242},{"cells":"r3c6","type":"highlight","time":1307635},{"cells":"r3c5,r3c6","type":"highlight","time":1309668},{"cells":"r2c6,r3c6","type":"highlight","time":1314519},{"cells":"highlighted","type":"clear","time":1314579},{"cells":"r2c5,r3c5","type":"highlight","time":1317437},{"cells":"highlighted","type":"clear","time":1317523},{"cells":"r2c4,r3c4,r3c5","type":"highlight","time":1318060},{"cells":"highlighted","type":"clear","time":1318219},{"cells":"r2c6,r3c6","type":"highlight","time":1318862},{"cells":"highlighted","type":"candidates","value":"4","time":1320362},{"cells":"highlighted","type":"candidates","value":"4","time":1320827},{"cells":"highlighted","type":"candidates","value":"5","time":1321235},{"cells":"highlighted","type":"candidates","value":"8","time":1322996},{"cells":"r2c5,r3c5","type":"highlight","time":1324239},{"cells":"highlighted","type":"candidates","value":"2","time":1325923},{"cells":"highlighted","type":"candidates","value":"7","time":1328853},{"cells":"r2c4,r3c4","type":"highlight","time":1330382},{"cells":"highlighted","type":"candidates","value":"6","time":1333187},{"cells":"highlighted","type":"candidates","value":"9","time":1334331},{"cells":"r4c5","type":"highlight","time":1336450},{"cells":"r2c6","type":"highlight","time":1337382},{"cells":"highlighted","type":"value","value":"5","time":1338683},{"cells":"r3c6","type":"highlight","time":1338970},{"cells":"highlighted","type":"value","value":"8","time":1339020},{"cells":"r5c2,r5c3","type":"highlight","time":1344714},{"cells":"highlighted","type":"pencilmarks","value":"4","time":1345483},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1345532},{"cells":"r3c3","type":"highlight","time":1363186},{"cells":"r3c3,r1c3","type":"highlight","time":1363719},{"cells":"highlighted","type":"candidates","value":"2","time":1365027},{"cells":"highlighted","type":"candidates","value":"4","time":1366276},{"cells":"highlighted","type":"candidates","value":"5","time":1366323},{"cells":"r2c3","type":"highlight","time":1368282},{"cells":"r1c3","type":"highlight","time":1368609},{"cells":"highlighted","type":"candidates","value":"4","time":1369092},{"cells":"r3c3","type":"highlight","time":1370244},{"cells":"r9c7,r9c8","type":"highlight","time":1378689},{"cells":"highlighted","type":"pencilmarks","value":"9","time":1379868},{"cells":"r3c9,r2c9,r1c9","type":"highlight","time":1384367},{"cells":"r2c8,r1c8","type":"highlight","time":1385611},{"cells":"r2c8","type":"highlight","time":1389505},{"cells":"highlighted","type":"candidates","value":"5","time":1390699},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1391051},{"cells":"r1c8","type":"highlight","time":1393660},{"cells":"highlighted","type":"value","value":"5","time":1394755},{"cells":"r1c4","type":"highlight","time":1398106},{"cells":"r1c3","type":"highlight","time":1398415},{"cells":"highlighted","type":"value","value":"2","time":1398708},{"cells":"r3c3","type":"highlight","time":1399149},{"cells":"highlighted","type":"candidates","value":"2","time":1399332},{"cells":"r1c6,r1c7,r1c8,r1c9","type":"highlight","time":1413024},{"cells":"r1c6,r1c7,r1c8,r1c9,r7c9,r6c9,r5c9,r4c9,r3c9,r2c9","type":"highlight","time":1414666},{"cells":"r2c8","type":"highlight","time":1415109},{"cells":"r2c8,r3c7","type":"highlight","time":1415409},{"cells":"highlighted","type":"pencilmarks","value":"2","time":1415723},{"cells":"r3c7","type":"highlight","time":1416519},{"cells":"r8c2,r7c2,r6c2,r5c2,r4c2,r3c2,r2c2,r2c1,r1c1,r3c1,r1c2","type":"highlight","time":1419098},{"cells":"r1c3,r1c4,r1c5,r1c6,r1c7,r1c8,r1c9","type":"highlight","time":1422901},{"cells":"r3c1","type":"highlight","time":1424821},{"cells":"r2c2,r1c2","type":"highlight","time":1428017},{"cells":"highlighted","type":"candidates","value":"4","time":1431739},{"cells":"highlighted","type":"candidates","value":"5","time":1432668},{"cells":"highlighted","type":"candidates","value":"6","time":1433915},{"cells":"highlighted","type":"candidates","value":"9","time":1435772},{"cells":"r1c3","type":"highlight","time":1437346},{"cells":"r1c3,r2c3","type":"highlight","time":1438508},{"cells":"r1c2,r2c2","type":"highlight","time":1439020},{"cells":"highlighted","type":"candidates","value":"5","time":1439732},{"cells":"r1c2","type":"highlight","time":1440181},{"cells":"highlighted","type":"candidates","value":"4","time":1440483},{"cells":"r2c2","type":"highlight","time":1445596},{"cells":"r3c9","type":"highlight","time":1452908},{"cells":"r3c9,r1c9","type":"highlight","time":1453478},{"cells":"r3c5,r3c6,r3c7,r3c8,r2c7,r2c8,r2c9,r3c9","type":"highlight","time":1459149},{"cells":"r1c9","type":"highlight","time":1459966},{"cells":"highlighted","type":"value","value":"8","time":1460642},{"cells":"r2c9","type":"highlight","time":1461016},{"cells":"r3c9","type":"highlight","time":1461841},{"cells":"highlighted","type":"value","value":"6","time":1462027},{"cells":"r1c7","type":"highlight","time":1463033},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1464259},{"cells":"r3c7","type":"highlight","time":1469903},{"cells":"r3c7,r1c7","type":"highlight","time":1472244},{"cells":"highlighted","type":"candidates","value":"2","time":1473339},{"cells":"highlighted","type":"candidates","value":"7","time":1475843},{"cells":"highlighted","type":"candidates","value":"9","time":1475907},{"cells":"r4c7","type":"highlight","time":1477097},{"cells":"r1c7","type":"highlight","time":1477456},{"cells":"highlighted","type":"candidates","value":"2","time":1477604},{"cells":"r3c7","type":"highlight","time":1478378},{"cells":"highlighted","type":"candidates","value":"9","time":1481236},{"cells":"r1c7","type":"highlight","time":1482970},{"cells":"r1c7,r2c8","type":"highlight","time":1483337},{"cells":"highlighted","type":"pencilmarks","value":"9","time":1484315},{"cells":"r3c7,r2c7,r1c7","type":"highlight","time":1502508},{"cells":"r2c2","type":"highlight","time":1517438},{"cells":"highlighted","type":"candidates","value":"4","time":1518563},{"cells":"r5c3","type":"highlight","time":1525066},{"cells":"highlighted","type":"value","value":"4","time":1525667},{"cells":"r5c2","type":"highlight","time":1525988},{"cells":"highlighted","type":"value","value":"5","time":1526099},{"cells":"r3c3","type":"highlight","time":1526760},{"cells":"highlighted","type":"value","value":"5","time":1526892},{"cells":"r3c1","type":"highlight","time":1528613},{"cells":"highlighted","type":"value","value":"4","time":1529115},{"cells":"r9c1","type":"highlight","time":1531636},{"cells":"highlighted","type":"value","value":"6","time":1532211},{"cells":"r9c2","type":"highlight","time":1532498},{"cells":"highlighted","type":"value","value":"4","time":1532563},{"cells":"r1c1","type":"highlight","time":1533879},{"cells":"highlighted","type":"value","value":"7","time":1534435},{"cells":"r1c7","type":"highlight","time":1536923},{"cells":"highlighted","type":"value","value":"9","time":1537371},{"cells":"r2c8","type":"highlight","time":1538131},{"cells":"highlighted","type":"value","value":"2","time":1539148},{"cells":"r3c7","type":"highlight","time":1539751},{"cells":"highlighted","type":"value","value":"7","time":1540355},{"cells":"r9c7","type":"highlight","time":1541266},{"cells":"highlighted","type":"value","value":"2","time":1541891},{"cells":"r9c8","type":"highlight","time":1542301},{"cells":"highlighted","type":"value","value":"8","time":1542411},{"cells":"highlighted","type":"value","value":"9","time":1543139},{"cells":"r2c5","type":"highlight","time":1544686},{"cells":"highlighted","type":"value","value":"7","time":1545275},{"cells":"r3c5","type":"highlight","time":1545608},{"cells":"highlighted","type":"value","value":"2","time":1545835},{"cells":"r3c4","type":"highlight","time":1547881},{"cells":"highlighted","type":"value","value":"9","time":1549323},{"cells":"r2c4","type":"highlight","time":1549733},{"cells":"highlighted","type":"value","value":"6","time":1549811},{"cells":"r2c2","type":"highlight","time":1550963},{"cells":"highlighted","type":"value","value":"9","time":1551003},{"cells":"r1c2","type":"highlight","time":1551323},{"cells":"highlighted","type":"value","value":"6","time":1551444}]}';
	/*
	https://ctc.svenneumann.com/sudoku/2gNGNPdtHP
	https://ctc.svenneumann.com/sudoku/BjDnndmJF7
	https://ctc.svenneumann.com/sudoku/T43rMR8FGj
	https://ctc.svenneumann.com/sudoku/jpQPjrm7H4
	https://ctc.svenneumann.com/sudoku/2JPFBJQTJ4
	https://ctc.svenneumann.com/sudoku/TmMBJj8jbr
	https://ctc.svenneumann.com/sudoku/5uH7kmNDQhY
	*/
		
	//app.playReplay({"puzzleId": "T43rMR8FGj", "actions": [{"cells":"r5c9","type":"highlight","time":21093},{"cells":"highlighted","type":"value","value":"9","time":23680},{"cells":"r7c6","type":"highlight","time":24141},{"cells":"highlighted","type":"value","value":"9","time":24240},{"cells":"highlighted","type":"clear","time":25270},{"cells":"r7c7","type":"highlight","time":25749},{"cells":"highlighted","type":"value","value":"9","time":26567},{"cells":"r9c5","type":"highlight","time":28968},{"cells":"highlighted","type":"value","value":"9","time":30024},{"cells":"r6c8","type":"highlight","time":36931},{"cells":"highlighted","type":"value","value":"8","time":40079},{"cells":"highlighted","type":"clear","time":42350},{"cells":"r8c6","type":"highlight","time":42771},{"cells":"highlighted","type":"value","value":"8","time":43535},{"cells":"r6c8","type":"highlight","time":47270},{"cells":"r7c7","type":"highlight","time":51828},{"cells":"highlighted","type":"clear","time":52128},{"cells":"r8c6","type":"highlight","time":52401},{"cells":"highlighted","type":"clear","time":52678},{"cells":"r9c5","type":"highlight","time":52873},{"cells":"highlighted","type":"clear","time":52975},{"cells":"r5c9","type":"highlight","time":53491},{"cells":"highlighted","type":"clear","time":53559},{"cells":"highlighted","type":"value","value":"8","time":54832},{"cells":"r7c7","type":"highlight","time":55202},{"cells":"highlighted","type":"value","value":"8","time":55319},{"cells":"r9c5","type":"highlight","time":55674},{"cells":"highlighted","type":"value","value":"8","time":55751},{"cells":"r7c7","type":"highlight","time":63335},{"cells":"highlighted","type":"clear","time":63727},{"cells":"r5c9","type":"highlight","time":63998},{"cells":"highlighted","type":"clear","time":64063},{"cells":"r9c5","type":"highlight","time":64607},{"cells":"highlighted","type":"clear","time":64695},{"cells":"r6c7","type":"highlight","time":73955},{"cells":"r5c8,r6c7","type":"highlight","time":74698},{"cells":"r4c9,r5c8,r6c7","type":"highlight","time":75091},{"cells":"r5c1","type":"highlight","time":81830},{"cells":"r6c2","type":"highlight","time":82370},{"cells":"r3c7","type":"highlight","time":84586},{"cells":"r2c8,r3c7","type":"highlight","time":85015},{"cells":"r1c9,r2c8,r3c7","type":"highlight","time":85340},{"cells":"r5c9","type":"highlight","time":97075},{"cells":"highlighted","type":"value","value":"9","time":97360},{"cells":"r7c7","type":"highlight","time":97715},{"cells":"highlighted","type":"value","value":"9","time":97783},{"cells":"r9c5","type":"highlight","time":98154},{"cells":"highlighted","type":"value","value":"9","time":98231},{"cells":"r6c8","type":"highlight","time":103982},{"cells":"r8c6","type":"highlight","time":104634},{"cells":"r6c8","type":"highlight","time":105455},{"cells":"r8c6","type":"highlight","time":105882},{"cells":"r6c8","type":"highlight","time":106399},{"cells":"r8c6","type":"highlight","time":106839},{"cells":"r6c8","type":"highlight","time":107412},{"cells":"r5c9","type":"highlight","time":111665},{"cells":"highlighted","type":"clear","time":111950},{"cells":"r7c7","type":"highlight","time":112215},{"cells":"highlighted","type":"clear","time":112295},{"cells":"r9c5","type":"highlight","time":112621},{"cells":"highlighted","type":"clear","time":112959},{"cells":"r6c8","type":"highlight","time":144076},{"cells":"highlighted","type":"value","value":7,"time":146056},{"cells":"r6c7","type":"highlight","time":146742},{"cells":"highlighted","type":"value","value":8,"time":147541},{"cells":"r5c9","type":"highlight","time":148081},{"cells":"highlighted","type":"value","value":9,"time":148779},{"cells":"r6c8","type":"highlight","time":149802},{"cells":"r5c9","type":"highlight","time":150095},{"cells":"r5c8,r5c9,r6c7,r6c8","type":"highlight","time":261570},{"cells":"highlighted","type":"clear","time":261910},{"cells":"r7c6","type":"highlight","time":262527},{"cells":"r6c4","type":"highlight","time":396772},{"cells":"r5c5","type":"highlight","time":434830},{"cells":"r4c7,r5c5","type":"highlight","time":435989},{"cells":"r5c5","type":"highlight","time":436708},{"cells":"r4c6,r5c5","type":"highlight","time":437023},{"cells":"highlighted","type":"pencilmarks","value":"9","time":437349},{"cells":"highlighted","type":"candidates","value":"7","time":439446},{"cells":"highlighted","type":"candidates","value":"8","time":439478},{"cells":"highlighted","type":"candidates","value":"9","time":439566},{"cells":"r3c7","type":"highlight","time":441512},{"cells":"r2c8,r3c7","type":"highlight","time":441883},{"cells":"r1c9,r2c8,r3c7","type":"highlight","time":442164},{"cells":"highlighted","type":"candidates","value":"6","time":445390},{"cells":"highlighted","type":"candidates","value":"7","time":445487},{"cells":"highlighted","type":"candidates","value":"8","time":445646},{"cells":"highlighted","type":"candidates","value":"9","time":445943},{"cells":"r7c3","type":"highlight","time":447137},{"cells":"r7c3,r8c2","type":"highlight","time":447440},{"cells":"r7c3,r8c2,r9c1","type":"highlight","time":447747},{"cells":"highlighted","type":"candidates","value":"6","time":448583},{"cells":"highlighted","type":"candidates","value":"7","time":448630},{"cells":"highlighted","type":"candidates","value":"8","time":448734},{"cells":"highlighted","type":"candidates","value":"9","time":448934},{"cells":"r2c7","type":"highlight","time":453033},{"cells":"r3c7","type":"highlight","time":453302},{"cells":"r2c8,r3c7","type":"highlight","time":453640},{"cells":"r1c9,r2c8,r3c7","type":"highlight","time":454000},{"cells":"highlighted","type":"pencilmarks","value":"8","time":454726},{"cells":"highlighted","type":"pencilmarks","value":"9","time":454991},{"cells":"r9c1","type":"highlight","time":455845},{"cells":"r8c2,r9c1","type":"highlight","time":456441},{"cells":"r7c3,r8c2,r9c1","type":"highlight","time":456666},{"cells":"highlighted","type":"pencilmarks","value":"8","time":457374},{"cells":"highlighted","type":"pencilmarks","value":"9","time":457606},{"cells":"r7c5","type":"highlight","time":458050},{"cells":"r6c4","type":"highlight","time":466195},{"cells":"highlighted","type":"candidates","value":"4","time":467454},{"cells":"highlighted","type":"candidates","value":"5","time":467486},{"cells":"r6c7","type":"highlight","time":512995},{"cells":"highlighted","type":"candidates","value":"6","time":535182},{"cells":"r6c8","type":"highlight","time":535721},{"cells":"highlighted","type":"candidates","value":"4","time":535942},{"cells":"r4c9","type":"highlight","time":537800},{"cells":"r4c9,r5c8","type":"highlight","time":538420},{"cells":"r4c9,r5c8,r7c6","type":"highlight","time":538791},{"cells":"r4c9,r5c8,r7c6,r8c5","type":"highlight","time":539083},{"cells":"r4c9,r5c8,r7c6,r8c5,r9c4","type":"highlight","time":539411},{"cells":"none","type":"highlight","time":627520},{"cells":"r3c1","type":"highlight","time":630153},{"cells":"r3c1,r4c2","type":"highlight","time":630872},{"cells":"r3c1,r4c2,r5c3","type":"highlight","time":631614},{"cells":"r3c1,r4c2,r5c3,r6c4","type":"highlight","time":632502},{"cells":"r3c1,r4c2,r5c3,r6c4,r7c5","type":"highlight","time":632863},{"cells":"r3c1,r4c2,r5c3,r6c4,r7c5,r8c6","type":"highlight","time":633583},{"cells":"r3c1,r4c2,r5c3,r6c4,r7c5,r8c6,r9c7","type":"highlight","time":634202},{"cells":"r3c1,r4c2,r5c3,r6c4,r7c5,r8c6,r9c5,r9c7","type":"highlight","time":635270},{"cells":"r3c1,r4c2,r5c3,r6c4,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":635676},{"cells":"r3c1,r4c2,r5c3,r6c4,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":635979},{"cells":"r3c1,r4c2,r5c3,r6c2,r6c4,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":636329},{"cells":"r3c1,r4c2,r5c1,r5c3,r6c2,r6c4,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":636789},{"cells":"r3c1,r4c2,r4c9,r5c1,r5c3,r6c2,r6c4,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":645046},{"cells":"r3c1,r4c2,r4c9,r5c1,r5c3,r5c8,r6c2,r6c4,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":645620},{"cells":"r3c1,r4c2,r4c9,r5c1,r5c3,r5c8,r6c2,r6c4,r6c7,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":645980},{"cells":"r3c1,r4c2,r4c9,r5c1,r5c3,r5c8,r6c2,r6c4,r6c7,r7c3,r7c5,r7c6,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":646308},{"cells":"r3c1,r4c2,r4c9,r5c1,r5c3,r5c8,r6c2,r6c4,r6c7,r7c3,r7c5,r7c6,r8c4,r8c5,r8c6,r9c5,r9c7","type":"highlight","time":646666},{"cells":"r3c1,r4c2,r4c9,r5c1,r5c3,r5c8,r6c2,r6c4,r6c7,r7c3,r7c5,r7c6,r8c4,r8c5,r8c6,r9c4,r9c5,r9c7","type":"highlight","time":647150},{"cells":"none","type":"highlight","time":801016},{"cells":"r5c1","type":"highlight","time":802455},{"cells":"r5c1,r6c2","type":"highlight","time":803096},{"cells":"r5c1,r6c2,r7c3","type":"highlight","time":803401},{"cells":"r5c1,r6c2,r7c3,r8c4","type":"highlight","time":803772},{"cells":"r5c1,r6c2,r7c3,r8c4,r9c5","type":"highlight","time":805482},{"cells":"r5c1,r6c2,r7c3,r8c4,r9c5,r9c7","type":"highlight","time":806393},{"cells":"r5c1,r6c2,r7c3,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":806720},{"cells":"r5c1,r6c2,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":807046},{"cells":"r5c1,r6c2,r6c4,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":807383},{"cells":"r5c1,r5c3,r6c2,r6c4,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":807687},{"cells":"r4c2,r5c1,r5c3,r6c2,r6c4,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":808025},{"cells":"r3c1,r4c2,r5c1,r5c3,r6c2,r6c4,r7c3,r7c5,r8c4,r8c6,r9c5,r9c7","type":"highlight","time":808350},{"cells":"r3c1,r4c2,r5c1,r5c3,r6c2,r6c4,r7c3,r7c5,r8c4,r8c6,r9c4,r9c5,r9c7","type":"highlight","time":810060},{"cells":"r3c1,r4c2,r5c1,r5c3,r6c2,r6c4,r7c3,r7c5,r8c4,r8c5,r8c6,r9c4,r9c5,r9c7","type":"highlight","time":810387},{"cells":"r3c1,r4c2,r5c1,r5c3,r6c2,r6c4,r7c3,r7c5,r7c6,r8c4,r8c5,r8c6,r9c4,r9c5,r9c7","type":"highlight","time":810715},{"cells":"r3c1,r4c2,r5c1,r5c3,r6c2,r6c4,r6c7,r7c3,r7c5,r7c6,r8c4,r8c5,r8c6,r9c4,r9c5,r9c7","type":"highlight","time":811039},{"cells":"r3c1,r4c2,r5c1,r5c3,r5c8,r6c2,r6c4,r6c7,r7c3,r7c5,r7c6,r8c4,r8c5,r8c6,r9c4,r9c5,r9c7","type":"highlight","time":811388},{"cells":"r3c1,r4c2,r4c9,r5c1,r5c3,r5c8,r6c2,r6c4,r6c7,r7c3,r7c5,r7c6,r8c4,r8c5,r8c6,r9c4,r9c5,r9c7","type":"highlight","time":811839},{"cells":"highlighted","type":"colour","value":4,"time":900128},{"cells":"none","type":"highlight","time":901388},{"cells":"r6c4,r7c4,r7c5,r7c6,r8c4,r8c5,r8c6,r8c7,r9c4,r9c5,r9c6,r9c7","type":"highlight","time":950033},{"cells":"r6c4,r7c4,r7c5,r7c6,r8c4,r8c5,r8c6,r9c4,r9c5,r9c6,r9c7","type":"highlight","time":952474},{"cells":"r4c9","type":"highlight","time":1014551},{"cells":"r4c9,r5c8","type":"highlight","time":1014981},{"cells":"r4c9,r5c8,r6c7","type":"highlight","time":1015326},{"cells":"r4c9,r5c8,r6c7,r7c3","type":"highlight","time":1016194},{"cells":"r4c9,r5c3,r5c8,r6c7,r7c3","type":"highlight","time":1016812},{"cells":"r4c9,r5c3,r5c8,r6c2,r6c7,r7c3","type":"highlight","time":1017161},{"cells":"r4c9,r5c1,r5c3,r5c8,r6c2,r6c7,r7c3","type":"highlight","time":1017509},{"cells":"r4c2,r4c9,r5c1,r5c3,r5c8,r6c2,r6c7,r7c3","type":"highlight","time":1017881},{"cells":"r3c1,r4c2,r4c9,r5c1,r5c3,r5c8,r6c2,r6c7,r7c3","type":"highlight","time":1018196},{"cells":"r7c8","type":"highlight","time":1078619},{"cells":"r4c2","type":"highlight","time":1082190},{"cells":"r4c2,r5c1","type":"highlight","time":1082499},{"cells":"r4c2,r5c1,r6c2","type":"highlight","time":1082884},{"cells":"r4c2,r5c1,r5c3,r6c2","type":"highlight","time":1083208},{"cells":"highlighted","type":"candidates","value":"1","time":1084469},{"cells":"highlighted","type":"candidates","value":"2","time":1084493},{"cells":"highlighted","type":"candidates","value":"3","time":1084622},{"cells":"highlighted","type":"candidates","value":"4","time":1084855},{"cells":"none","type":"highlight","time":1086292},{"cells":"r3c1","type":"highlight","time":1086696},{"cells":"highlighted","type":"colour","value":"1","time":1086902},{"cells":"r5c1","type":"highlight","time":1087214},{"cells":"r3c1","type":"highlight","time":1090612},{"cells":"highlighted","type":"colour","value":3,"time":1091241},{"cells":"highlighted","type":"value","value":"1","time":1093246},{"cells":"highlighted","type":"clear","time":1096483},{"cells":"highlighted","type":"clear","time":1096631},{"cells":"highlighted","type":"clear","time":1096744},{"cells":"highlighted","type":"value","value":1,"time":1097429},{"cells":"r4c2","type":"highlight","time":1097924},{"cells":"r5c1","type":"highlight","time":1098779},{"cells":"highlighted","type":"candidates","value":"1","time":1099839},{"cells":"r4c9","type":"highlight","time":1102558},{"cells":"r4c9,r5c8","type":"highlight","time":1102873},{"cells":"highlighted","type":"candidates","value":"1","time":1103472},{"cells":"highlighted","type":"candidates","value":"2","time":1103527},{"cells":"r6c7","type":"highlight","time":1104414},{"cells":"highlighted","type":"value","value":"6","time":1105623},{"cells":"r4c6","type":"highlight","time":1106136},{"cells":"r7c5","type":"highlight","time":1107384},{"cells":"r8c5","type":"highlight","time":1112852},{"cells":"r7c3","type":"highlight","time":1119658},{"cells":"highlighted","type":"value","value":"6","time":1121390},{"cells":"r8c3","type":"highlight","time":1122155},{"cells":"r8c2","type":"highlight","time":1130515},{"cells":"highlighted","type":"candidates","value":"6","time":1131398},{"cells":"r9c1","type":"highlight","time":1131966},{"cells":"highlighted","type":"candidates","value":"6","time":1132388},{"cells":"highlighted","type":"candidates","value":"7","time":1136510},{"cells":"r8c1,r8c2","type":"highlight","time":1137039},{"cells":"r8c2","type":"highlight","time":1137398},{"cells":"highlighted","type":"candidates","value":"7","time":1137557},{"cells":"r8c2,r9c1","type":"highlight","time":1138276},{"cells":"highlighted","type":"pencilmarks","value":"7","time":1138733},{"cells":"highlighted","type":"pencilmarks","value":"7","time":1139144},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1139862},{"cells":"highlighted","type":"pencilmarks","value":"9","time":1140101},{"cells":"r3c7","type":"highlight","time":1190656},{"cells":"r2c8,r3c7","type":"highlight","time":1191038},{"cells":"r1c9,r2c8,r3c7","type":"highlight","time":1191297},{"cells":"none","type":"highlight","time":1191526},{"cells":"r1c9","type":"highlight","time":1193176},{"cells":"r1c9,r2c8","type":"highlight","time":1194087},{"cells":"r1c9,r2c8,r3c7","type":"highlight","time":1194515},{"cells":"highlighted","type":"candidates","value":"6","time":1195094},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1197157},{"cells":"highlighted","type":"pencilmarks","value":"9","time":1197429},{"cells":"r6c4","type":"highlight","time":1203244},{"cells":"r5c4","type":"highlight","time":1220075},{"cells":"r6c4","type":"highlight","time":1220391},{"cells":"highlighted","type":"value","value":"5","time":1221349},{"cells":"r5c5","type":"highlight","time":1222043},{"cells":"r4c6,r5c5","type":"highlight","time":1222752},{"cells":"highlighted","type":"candidates","value":"7","time":1223223},{"cells":"highlighted","type":"pencilmarks","value":"9","time":1224797},{"cells":"r5c6","type":"highlight","time":1225610},{"cells":"r6c6","type":"highlight","time":1226081},{"cells":"r7c4","type":"highlight","time":1231673},{"cells":"highlighted","type":"value","value":"4","time":1234061},{"cells":"r5c5","type":"highlight","time":1234575},{"cells":"r6c5","type":"highlight","time":1235198},{"cells":"r6c8","type":"highlight","time":1244814},{"cells":"r6c9","type":"highlight","time":1246456},{"cells":"r7c8","type":"highlight","time":1256829},{"cells":"r6c8","type":"highlight","time":1257188},{"cells":"highlighted","type":"value","value":"4","time":1258232},{"cells":"r7c8","type":"highlight","time":1258809},{"cells":"r6c2","type":"highlight","time":1261531},{"cells":"r7c2","type":"highlight","time":1262285},{"cells":"r6c2","type":"highlight","time":1262498},{"cells":"highlighted","type":"candidates","value":"4","time":1262792},{"cells":"r6c5","type":"highlight","time":1268000},{"cells":"r8c5","type":"highlight","time":1270834},{"cells":"r8c7","type":"highlight","time":1271611},{"cells":"r5c4","type":"highlight","time":1290523},{"cells":"highlighted","type":"value","value":"6","time":1291397},{"cells":"r4c4","type":"highlight","time":1291950},{"cells":"highlighted","type":"value","value":"7","time":1292013},{"cells":"r6c5","type":"highlight","time":1292884},{"cells":"r4c1","type":"highlight","time":1295471},{"cells":"highlighted","type":"value","value":"6","time":1296766},{"cells":"r6c5,r6c6","type":"highlight","time":1308893},{"cells":"highlighted","type":"candidates","value":"1","time":1310133},{"cells":"highlighted","type":"candidates","value":"2","time":1310245},{"cells":"highlighted","type":"candidates","value":"3","time":1310318},{"cells":"r7c8","type":"highlight","time":1311842},{"cells":"r6c9","type":"highlight","time":1314642},{"cells":"r6c3,r6c9","type":"highlight","time":1315260},{"cells":"r6c1,r6c3,r6c9","type":"highlight","time":1315766},{"cells":"highlighted","type":"candidates","value":"7","time":1316816},{"cells":"highlighted","type":"candidates","value":"8","time":1316869},{"cells":"highlighted","type":"candidates","value":"9","time":1316934},{"cells":"r7c3","type":"highlight","time":1318287},{"cells":"r5c9","type":"highlight","time":1330268},{"cells":"r5c9,r7c7","type":"highlight","time":1334891},{"cells":"r5c9,r7c7,r8c6","type":"highlight","time":1335195},{"cells":"r5c9,r7c7,r8c6,r9c5","type":"highlight","time":1335454},{"cells":"r5c9","type":"highlight","time":1346379},{"cells":"r7c8","type":"highlight","time":1348549},{"cells":"r5c9","type":"highlight","time":1348864},{"cells":"highlighted","type":"value","value":"9","time":1349317},{"cells":"r7c7","type":"highlight","time":1350003},{"cells":"highlighted","type":"value","value":"9","time":1350221},{"cells":"r9c5","type":"highlight","time":1350968},{"cells":"r8c6,r9c5","type":"highlight","time":1351485},{"cells":"highlighted","type":"candidates","value":"9","time":1352781},{"cells":"highlighted","type":"candidates","value":"8","time":1352829},{"cells":"r7c7","type":"highlight","time":1359394},{"cells":"r5c9","type":"highlight","time":1361666},{"cells":"r6c8","type":"highlight","time":1364164},{"cells":"r7c7","type":"highlight","time":1366087},{"cells":"r6c9","type":"highlight","time":1366594},{"cells":"highlighted","type":"candidates","value":"9","time":1367622},{"cells":"r5c5","type":"highlight","time":1368630},{"cells":"highlighted","type":"value","value":"9","time":1369382},{"cells":"highlighted","type":"value","value":"8","time":1369741},{"cells":"r4c6","type":"highlight","time":1370071},{"cells":"highlighted","type":"value","value":"9","time":1370206},{"cells":"r1c9","type":"highlight","time":1371015},{"cells":"highlighted","type":"candidates","value":"9","time":1371686},{"cells":"r7c7","type":"highlight","time":1374739},{"cells":"r3c7","type":"highlight","time":1375830},{"cells":"highlighted","type":"candidates","value":"9","time":1376173},{"cells":"r2c8","type":"highlight","time":1376673},{"cells":"highlighted","type":"value","value":"9","time":1376837},{"cells":"r8c6","type":"highlight","time":1379430},{"cells":"r9c5","type":"highlight","time":1379814},{"cells":"r8c6","type":"highlight","time":1380387},{"cells":"highlighted","type":"value","value":"8","time":1380662},{"cells":"r9c5","type":"highlight","time":1381106},{"cells":"highlighted","type":"value","value":"9","time":1381142},{"cells":"r9c1","type":"highlight","time":1382975},{"cells":"highlighted","type":"value","value":"9","time":1383054},{"cells":"highlighted","type":"value","value":"8","time":1383445},{"cells":"r8c2","type":"highlight","time":1383750},{"cells":"highlighted","type":"value","value":"9","time":1383814},{"cells":"r6c9","type":"highlight","time":1388565},{"cells":"r9c5","type":"highlight","time":1393684},{"cells":"r7c3","type":"highlight","time":1394057},{"cells":"r6c2","type":"highlight","time":1402009},{"cells":"r5c1","type":"highlight","time":1402492},{"cells":"r6c2","type":"highlight","time":1402953},{"cells":"r8c4","type":"highlight","time":1404124},{"cells":"r6c3","type":"highlight","time":1439201},{"cells":"r6c1,r6c3","type":"highlight","time":1440158},{"cells":"highlighted","type":"pencilmarks","value":"9","time":1442093},{"cells":"r4c5","type":"highlight","time":1462579},{"cells":"r4c5,r5c6","type":"highlight","time":1462984},{"cells":"highlighted","type":"candidates","value":"1","time":1464484},{"cells":"highlighted","type":"candidates","value":"2","time":1464540},{"cells":"highlighted","type":"candidates","value":"3","time":1464886},{"cells":"highlighted","type":"candidates","value":"4","time":1465693},{"cells":"r6c7","type":"highlight","time":1469227},{"cells":"r1c4,r2c4,r3c4","type":"highlight","time":1472231},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1473374},{"cells":"highlighted","type":"pencilmarks","value":"9","time":1473430},{"cells":"r2c4","type":"highlight","time":1477406},{"cells":"highlighted","type":"candidates","value":"9","time":1478286},{"cells":"highlighted","type":"candidates","value":"9","time":1478894},{"cells":"highlighted","type":"pencilmarks","value":"9","time":1479286},{"cells":"r8c4,r9c4","type":"highlight","time":1486508},{"cells":"highlighted","type":"candidates","value":"1","time":1488125},{"cells":"highlighted","type":"candidates","value":"2","time":1488165},{"cells":"highlighted","type":"candidates","value":"3","time":1488278},{"cells":"r6c1","type":"highlight","time":1498443},{"cells":"highlighted","type":"candidates","value":"8","time":1499310},{"cells":"r5c1,r5c2,r5c3","type":"highlight","time":1502797},{"cells":"r6c3","type":"highlight","time":1503146},{"cells":"r4c3,r6c3","type":"highlight","time":1503550},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1503941},{"cells":"r9c8","type":"highlight","time":1518985},{"cells":"r9c7","type":"highlight","time":1519324},{"cells":"r9c6","type":"highlight","time":1520572},{"cells":"r9c9","type":"highlight","time":1521169},{"cells":"r9c8","type":"highlight","time":1522586},{"cells":"r9c7","type":"highlight","time":1522981},{"cells":"r9c6","type":"highlight","time":1523543},{"cells":"r9c9","type":"highlight","time":1528694},{"cells":"highlighted","type":"value","value":"6","time":1529991},{"cells":"highlighted","type":"clear","time":1532070},{"cells":"r9c6","type":"highlight","time":1535209},{"cells":"highlighted","type":"candidates","value":"1","time":1535782},{"cells":"highlighted","type":"candidates","value":"2","time":1535869},{"cells":"highlighted","type":"candidates","value":"3","time":1536295},{"cells":"r7c5,r7c6,r8c5","type":"highlight","time":1537446},{"cells":"highlighted","type":"candidates","value":"5","time":1539390},{"cells":"highlighted","type":"candidates","value":"6","time":1539494},{"cells":"highlighted","type":"candidates","value":"7","time":1539725},{"cells":"r7c5,r7c6","type":"highlight","time":1543635},{"cells":"r8c5","type":"highlight","time":1543994},{"cells":"highlighted","type":"value","value":"6","time":1544550},{"cells":"r7c5,r7c6","type":"highlight","time":1545096},{"cells":"highlighted","type":"candidates","value":"6","time":1546094},{"cells":"r9c8","type":"highlight","time":1560588},{"cells":"r9c9","type":"highlight","time":1560891},{"cells":"highlighted","type":"value","value":"6","time":1563358},{"cells":"r8c8","type":"highlight","time":1564593},{"cells":"r2c8","type":"highlight","time":1565561},{"cells":"r3c8","type":"highlight","time":1565898},{"cells":"r1c8,r3c8","type":"highlight","time":1566507},{"cells":"highlighted","type":"pencilmarks","value":"6","time":1566853},{"cells":"r7c8","type":"highlight","time":1567450},{"cells":"r9c7","type":"highlight","time":1569523},{"cells":"r9c8","type":"highlight","time":1569880},{"cells":"highlighted","type":"candidates","value":"3","time":1581557},{"cells":"highlighted","type":"candidates","value":"5","time":1581645},{"cells":"r9c7","type":"highlight","time":1583560},{"cells":"highlighted","type":"candidates","value":"2","time":1584941},{"cells":"highlighted","type":"candidates","value":"3","time":1586894},{"cells":"highlighted","type":"candidates","value":"4","time":1588222},{"cells":"r7c6","type":"highlight","time":1596825},{"cells":"highlighted","type":"value","value":"7","time":1597518},{"cells":"r7c5","type":"highlight","time":1598287},{"cells":"highlighted","type":"value","value":"5","time":1598374},{"cells":"r9c4","type":"highlight","time":1607030},{"cells":"highlighted","type":"value","value":"2","time":1607342},{"cells":"r8c4","type":"highlight","time":1607871},{"cells":"highlighted","type":"candidates","value":"2","time":1608070},{"cells":"r9c6","type":"highlight","time":1608423},{"cells":"highlighted","type":"candidates","value":"2","time":1608606},{"cells":"r9c7","type":"highlight","time":1611967},{"cells":"highlighted","type":"candidates","value":"2","time":1612206},{"cells":"r3c4","type":"highlight","time":1630900},{"cells":"r9c7","type":"highlight","time":1637661},{"cells":"r9c6","type":"highlight","time":1638336},{"cells":"r9c7","type":"highlight","time":1638823},{"cells":"highlighted","type":"value","value":"4","time":1641046},{"cells":"r9c6","type":"highlight","time":1641757},{"cells":"highlighted","type":"value","value":"3","time":1642213},{"cells":"r9c8","type":"highlight","time":1645176},{"cells":"highlighted","type":"value","value":"5","time":1646062},{"cells":"r8c4","type":"highlight","time":1649361},{"cells":"highlighted","type":"value","value":"1","time":1649966},{"cells":"r5c6,r6c6","type":"highlight","time":1651273},{"cells":"highlighted","type":"candidates","value":"3","time":1651647},{"cells":"r9c7","type":"highlight","time":1656415},{"cells":"r1c4,r2c4,r3c4","type":"highlight","time":1660589},{"cells":"highlighted","type":"candidates","value":"3","time":1662238},{"cells":"highlighted","type":"candidates","value":"8","time":1662702},{"cells":"highlighted","type":"candidates","value":"9","time":1662757},{"cells":"r2c4","type":"highlight","time":1664075},{"cells":"highlighted","type":"candidates","value":"9","time":1664901},{"cells":"r5c3","type":"highlight","time":1670680},{"cells":"r4c2,r5c3","type":"highlight","time":1671950},{"cells":"r4c2","type":"highlight","time":1674482},{"cells":"r4c2,r5c3","type":"highlight","time":1674954},{"cells":"r6c2","type":"highlight","time":1683785},{"cells":"r9c6","type":"highlight","time":1688918},{"cells":"r4c7,r5c7","type":"highlight","time":1700559},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1702030},{"cells":"r2c9,r3c9","type":"highlight","time":1702978},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1703270},{"cells":"r6c6","type":"highlight","time":1727492},{"cells":"r6c2,r6c6","type":"highlight","time":1728121},{"cells":"r5c7","type":"highlight","time":1729471},{"cells":"r4c7","type":"highlight","time":1732610},{"cells":"r5c7","type":"highlight","time":1733365},{"cells":"r5c7,r6c9","type":"highlight","time":1735018},{"cells":"highlighted","type":"pencilmarks","value":"7","time":1735302},{"cells":"r7c8,r7c9","type":"highlight","time":1743928},{"cells":"highlighted","type":"pencilmarks","value":"7","time":1744213},{"cells":"highlighted","type":"pencilmarks","value":"7","time":1745021},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1745589},{"cells":"highlighted","type":"candidates","value":"1","time":1750838},{"cells":"highlighted","type":"candidates","value":"8","time":1751278},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1752781},{"cells":"r7c9","type":"highlight","time":1756292},{"cells":"highlighted","type":"value","value":"1","time":1757725},{"cells":"highlighted","type":"value","value":"8","time":1758189},{"cells":"r7c8","type":"highlight","time":1758193},{"cells":"r4c9","type":"highlight","time":1759902},{"cells":"highlighted","type":"value","value":"2","time":1760053},{"cells":"r5c8","type":"highlight","time":1760307},{"cells":"highlighted","type":"value","value":"1","time":1760357},{"cells":"r1c7,r2c7","type":"highlight","time":1762805},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1763269},{"cells":"r5c3","type":"highlight","time":1765055},{"cells":"highlighted","type":"candidates","value":"1","time":1765428},{"cells":"r5c6","type":"highlight","time":1765787},{"cells":"highlighted","type":"candidates","value":"1","time":1765911},{"cells":"r4c2","type":"highlight","time":1770455},{"cells":"highlighted","type":"candidates","value":"2","time":1770646},{"cells":"r4c2,r6c2","type":"highlight","time":1772773},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1773349},{"cells":"r9c3","type":"highlight","time":1775810},{"cells":"highlighted","type":"value","value":"1","time":1777005},{"cells":"r9c2","type":"highlight","time":1778149},{"cells":"highlighted","type":"value","value":"7","time":1780103},{"cells":"r7c1,r7c2","type":"highlight","time":1784011},{"cells":"highlighted","type":"candidates","value":"2","time":1785213},{"cells":"highlighted","type":"candidates","value":"3","time":1785645},{"cells":"r8c2","type":"highlight","time":1786925},{"cells":"r8c3","type":"highlight","time":1787183},{"cells":"r8c1,r8c3","type":"highlight","time":1787633},{"cells":"highlighted","type":"candidates","value":"4","time":1788511},{"cells":"highlighted","type":"candidates","value":"5","time":1788533},{"cells":"r8c7,r8c8,r8c9","type":"highlight","time":1790648},{"cells":"highlighted","type":"candidates","value":"2","time":1791318},{"cells":"highlighted","type":"candidates","value":"3","time":1791389},{"cells":"highlighted","type":"candidates","value":"7","time":1792158},{"cells":"r8c9","type":"highlight","time":1793675},{"cells":"highlighted","type":"candidates","value":"2","time":1793925},{"cells":"highlighted","type":"value","value":"3","time":1796285},{"cells":"r8c7,r8c8","type":"highlight","time":1797275},{"cells":"highlighted","type":"candidates","value":"3","time":1797509},{"cells":"r6c3","type":"highlight","time":1811746},{"cells":"r4c1,r5c1,r6c1,r7c1,r8c1,r9c1","type":"highlight","time":1817210},{"cells":"r4c1,r4c2,r4c3,r4c4,r4c5,r4c6,r4c7,r5c2,r6c2,r7c2,r8c2,r9c2","type":"highlight","time":1823341},{"cells":"r5c3","type":"highlight","time":1823702},{"cells":"r6c3","type":"highlight","time":1824060},{"cells":"highlighted","type":"candidates","value":"8","time":1825278},{"cells":"highlighted","type":"pencilmarks","value":"8","time":1825677},{"cells":"r6c9","type":"highlight","time":1827458},{"cells":"highlighted","type":"value","value":"8","time":1828613},{"cells":"r1c9","type":"highlight","time":1829382},{"cells":"highlighted","type":"value","value":"7","time":1830085},{"cells":"r3c7","type":"highlight","time":1830575},{"cells":"highlighted","type":"value","value":"8","time":1830653},{"cells":"r4c7,r4c8,r5c7","type":"highlight","time":1837965},{"cells":"highlighted","type":"candidates","value":"3","time":1838892},{"cells":"highlighted","type":"candidates","value":"5","time":1839629},{"cells":"highlighted","type":"candidates","value":"7","time":1840140},{"cells":"r4c7,r4c8","type":"highlight","time":1842386},{"cells":"highlighted","type":"candidates","value":"7","time":1843165},{"cells":"r5c7","type":"highlight","time":1843569},{"cells":"highlighted","type":"value","value":"7","time":1843677},{"cells":"r8c7","type":"highlight","time":1844625},{"cells":"highlighted","type":"value","value":"2","time":1845251},{"cells":"r8c8","type":"highlight","time":1846021},{"cells":"highlighted","type":"value","value":"7","time":1846093},{"cells":"r4c8","type":"highlight","time":1848248},{"cells":"highlighted","type":"value","value":"3","time":1848444},{"cells":"r4c7","type":"highlight","time":1848710},{"cells":"highlighted","type":"value","value":"5","time":1848949},{"cells":"r1c7,r2c7","type":"highlight","time":1850756},{"cells":"highlighted","type":"candidates","value":"1","time":1851877},{"cells":"highlighted","type":"candidates","value":"3","time":1853925},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1854965},{"cells":"r2c4","type":"highlight","time":1859306},{"cells":"highlighted","type":"value","value":"3","time":1859485},{"cells":"r1c4","type":"highlight","time":1859835},{"cells":"highlighted","type":"candidates","value":"3","time":1860157},{"cells":"r3c4","type":"highlight","time":1860476},{"cells":"highlighted","type":"candidates","value":"3","time":1860606},{"cells":"r2c7","type":"highlight","time":1861163},{"cells":"highlighted","type":"value","value":"1","time":1861245},{"cells":"r1c7","type":"highlight","time":1861501},{"cells":"highlighted","type":"value","value":"3","time":1861564},{"cells":"r3c8","type":"highlight","time":1863064},{"cells":"r1c8,r3c8","type":"highlight","time":1863457},{"cells":"highlighted","type":"candidates","value":"2","time":1865037},{"cells":"highlighted","type":"candidates","value":"6","time":1865886},{"cells":"r2c9,r3c9","type":"highlight","time":1867350},{"cells":"highlighted","type":"candidates","value":"4","time":1868956},{"cells":"highlighted","type":"candidates","value":"5","time":1869013},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1871381},{"cells":"r3c8","type":"highlight","time":1871659},{"cells":"r1c8,r3c8","type":"highlight","time":1872076},{"cells":"highlighted","type":"pencilmarks","value":"6","time":1872603},{"cells":"r4c2","type":"highlight","time":1878296},{"cells":"highlighted","type":"candidates","value":"3","time":1878693},{"cells":"r4c5","type":"highlight","time":1878994},{"cells":"highlighted","type":"candidates","value":"3","time":1879277},{"cells":"highlighted","type":"candidates","value":"2","time":1879877},{"cells":"r4c2","type":"highlight","time":1881222},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1881573},{"cells":"r4c3","type":"highlight","time":1881930},{"cells":"highlighted","type":"value","value":"8","time":1883356},{"cells":"r6c3","type":"highlight","time":1885068},{"cells":"r6c1,r6c3","type":"highlight","time":1885575},{"cells":"highlighted","type":"pencilmarks","value":"9","time":1886341},{"cells":"r5c2","type":"highlight","time":1888962},{"cells":"r4c5,r5c5,r6c5","type":"highlight","time":1895194},{"cells":"r6c5","type":"highlight","time":1895677},{"cells":"r4c5,r6c5","type":"highlight","time":1896128},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1897117},{"cells":"r3c6","type":"highlight","time":1897950},{"cells":"r1c6","type":"highlight","time":1898445},{"cells":"highlighted","type":"value","value":"1","time":1898670},{"cells":"highlighted","type":"clear","time":1904045},{"cells":"r4c5","type":"highlight","time":1904689},{"cells":"r4c5,r6c5","type":"highlight","time":1906039},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1906261},{"cells":"r6c1","type":"highlight","time":1923188},{"cells":"r6c2","type":"highlight","time":1923779},{"cells":"r5c3","type":"highlight","time":1924423},{"cells":"r4c2","type":"highlight","time":1935266},{"cells":"r5c3","type":"highlight","time":1935738},{"cells":"r4c2","type":"highlight","time":1938382},{"cells":"highlighted","type":"value","value":"1","time":1938965},{"cells":"r6c2","type":"highlight","time":1939664},{"cells":"highlighted","type":"candidates","value":"1","time":1939964},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1940325},{"cells":"r4c5","type":"highlight","time":1941308},{"cells":"highlighted","type":"value","value":"4","time":1941525},{"cells":"r6c6","type":"highlight","time":1942095},{"cells":"highlighted","type":"value","value":"1","time":1942405},{"cells":"highlighted","type":"clear","time":1945875},{"cells":"r4c5","type":"highlight","time":1947463},{"cells":"r5c6","type":"highlight","time":1947967},{"cells":"highlighted","type":"value","value":"2","time":1948452},{"cells":"r6c6","type":"highlight","time":1948743},{"cells":"highlighted","type":"value","value":"1","time":1948869},{"cells":"r6c5","type":"highlight","time":1949868},{"cells":"highlighted","type":"value","value":"3","time":1949997},{"cells":"r6c2","type":"highlight","time":1951016},{"cells":"highlighted","type":"value","value":"2","time":1951109},{"cells":"r5c1","type":"highlight","time":1952051},{"cells":"highlighted","type":"candidates","value":"2","time":1952885},{"cells":"r5c3","type":"highlight","time":1953378},{"cells":"highlighted","type":"candidates","value":"2","time":1953493},{"cells":"r5c2","type":"highlight","time":1956944},{"cells":"highlighted","type":"value","value":"5","time":1958196},{"cells":"r7c2","type":"highlight","time":1959881},{"cells":"highlighted","type":"value","value":"3","time":1960253},{"cells":"r7c1","type":"highlight","time":1960612},{"cells":"highlighted","type":"value","value":"2","time":1960653},{"cells":"r5c3","type":"highlight","time":1972649},{"cells":"highlighted","type":"value","value":"4","time":1972837},{"cells":"r5c1","type":"highlight","time":1973460},{"cells":"highlighted","type":"value","value":"3","time":1973533},{"cells":"r9c5","type":"highlight","time":1977870},{"cells":"r8c3","type":"highlight","time":1982549},{"cells":"highlighted","type":"value","value":"5","time":1982853},{"cells":"r8c1","type":"highlight","time":1983438},{"cells":"highlighted","type":"value","value":"4","time":1983661},{"cells":"r3c2,r3c3","type":"highlight","time":1992753},{"cells":"r3c3","type":"highlight","time":1993428},{"cells":"highlighted","type":"value","value":"3","time":1993548},{"cells":"r1c5,r1c6","type":"highlight","time":1996252},{"cells":"r1c5","type":"highlight","time":1996522},{"cells":"highlighted","type":"value","value":"1","time":1996798},{"cells":"r2c1,r2c2,r2c3,r3c2","type":"highlight","time":2003260},{"cells":"r2c2,r3c2","type":"highlight","time":2003723},{"cells":"r2c1","type":"highlight","time":2004048},{"cells":"r2c1,r2c3","type":"highlight","time":2004408},{"cells":"highlighted","type":"pencilmarks","value":"7","time":2005413},{"cells":"r3c5,r3c6","type":"highlight","time":2006747},{"cells":"r3c5","type":"highlight","time":2006995},{"cells":"highlighted","type":"value","value":"7","time":2007221},{"cells":"r1c2,r2c2","type":"highlight","time":2012002},{"cells":"highlighted","type":"pencilmarks","value":"8","time":2013477},{"cells":"r1c6,r2c1,r2c2,r2c3,r2c4,r2c5,r2c6,r2c7,r2c8,r3c6","type":"highlight","time":2019697},{"cells":"r1c2,r1c6,r2c1,r2c2,r2c3,r2c4,r2c5,r2c6,r2c7,r2c8,r3c2,r3c6","type":"highlight","time":2020790},{"cells":"r1c1","type":"highlight","time":2022848},{"cells":"r1c1,r1c3","type":"highlight","time":2023184},{"cells":"highlighted","type":"pencilmarks","value":"9","time":2024149},{"cells":"r1c4","type":"highlight","time":2024523},{"cells":"highlighted","type":"value","value":"8","time":2024605},{"cells":"r3c4","type":"highlight","time":2024929},{"cells":"highlighted","type":"value","value":"9","time":2024980},{"cells":"r1c2","type":"highlight","time":2027325},{"cells":"r2c2","type":"highlight","time":2027786},{"cells":"highlighted","type":"value","value":"8","time":2028133},{"cells":"none","type":"highlight","time":2028463},{"cells":"r1c2","type":"highlight","time":2028822},{"cells":"highlighted","type":"pencilmarks","value":"8","time":2028967},{"cells":"r3c2","type":"highlight","time":2033783},{"cells":"r3c2,r3c6","type":"highlight","time":2037461},{"cells":"highlighted","type":"candidates","value":"2","time":2040237},{"cells":"highlighted","type":"candidates","value":"4","time":2040772},{"cells":"highlighted","type":"candidates","value":"5","time":2041421},{"cells":"highlighted","type":"candidates","value":"6","time":2041718},{"cells":"r4c6","type":"highlight","time":2043704},{"cells":"r3c6","type":"highlight","time":2044087},{"cells":"highlighted","type":"candidates","value":"2","time":2044430},{"cells":"none","type":"highlight","time":2045157},{"cells":"r4c6","type":"highlight","time":2046012},{"cells":"r3c6","type":"highlight","time":2046483},{"cells":"r3c2","type":"highlight","time":2048294},{"cells":"highlighted","type":"candidates","value":"5","time":2049925},{"cells":"highlighted","type":"candidates","value":"2","time":2051949},{"cells":"r1c2","type":"highlight","time":2057914},{"cells":"highlighted","type":"candidates","value":"4","time":2060365},{"cells":"highlighted","type":"candidates","value":"6","time":2060421},{"cells":"r2c5","type":"highlight","time":2064045},{"cells":"highlighted","type":"value","value":"2","time":2065333},{"cells":"r1c6,r2c6","type":"highlight","time":2069084},{"cells":"highlighted","type":"candidates","value":"4","time":2070142},{"cells":"highlighted","type":"candidates","value":"5","time":2070197},{"cells":"highlighted","type":"candidates","value":"6","time":2070269},{"cells":"r3c6","type":"highlight","time":2071841},{"cells":"r2c6","type":"highlight","time":2075722},{"cells":"r2c3","type":"highlight","time":2076465},{"cells":"r1c3,r2c3","type":"highlight","time":2080143},{"cells":"highlighted","type":"candidates","value":"2","time":2081166},{"cells":"highlighted","type":"candidates","value":"7","time":2082901},{"cells":"highlighted","type":"candidates","value":"9","time":2083118},{"cells":"r1c3","type":"highlight","time":2084587},{"cells":"r2c3","type":"highlight","time":2085048},{"cells":"highlighted","type":"candidates","value":"2","time":2085253},{"cells":"r1c3","type":"highlight","time":2085532},{"cells":"highlighted","type":"candidates","value":"7","time":2086501},{"cells":"r2c3","type":"highlight","time":2086860},{"cells":"highlighted","type":"candidates","value":"9","time":2087509},{"cells":"r3c3","type":"highlight","time":2088615},{"cells":"r2c3","type":"highlight","time":2088817},{"cells":"highlighted","type":"value","value":"7","time":2089014},{"cells":"r2c1","type":"highlight","time":2089368},{"cells":"highlighted","type":"pencilmarks","value":"7","time":2089918},{"cells":"r1c3","type":"highlight","time":2090448},{"cells":"r1c1,r2c1","type":"highlight","time":2095635},{"cells":"highlighted","type":"candidates","value":"5","time":2099301},{"cells":"highlighted","type":"candidates","value":"7","time":2100710},{"cells":"highlighted","type":"candidates","value":"9","time":2100782},{"cells":"r3c1","type":"highlight","time":2102510},{"cells":"r2c1","type":"highlight","time":2102834},{"cells":"r1c1,r2c1","type":"highlight","time":2103306},{"cells":"highlighted","type":"candidates","value":"7","time":2104278},{"cells":"r2c1","type":"highlight","time":2104994},{"cells":"highlighted","type":"value","value":"9","time":2105678},{"cells":"highlighted","type":"value","value":"5","time":2107310},{"cells":"r1c1","type":"highlight","time":2108234},{"cells":"highlighted","type":"value","value":"9","time":2108733},{"cells":"r1c3","type":"highlight","time":2110214},{"cells":"highlighted","type":"value","value":"2","time":2110805},{"cells":"r1c8","type":"highlight","time":2111474},{"cells":"highlighted","type":"value","value":"6","time":2111933},{"cells":"r3c8","type":"highlight","time":2112421},{"cells":"highlighted","type":"value","value":"2","time":2112445},{"cells":"r1c6","type":"highlight","time":2113937},{"cells":"highlighted","type":"candidates","value":"6","time":2114845},{"cells":"r1c2","type":"highlight","time":2115907},{"cells":"highlighted","type":"candidates","value":"6","time":2116166},{"cells":"highlighted","type":"value","value":"4","time":2116990},{"cells":"r3c2","type":"highlight","time":2117628},{"cells":"highlighted","type":"value","value":"6","time":2118237},{"cells":"r3c6","type":"highlight","time":2119169},{"cells":"highlighted","type":"candidates","value":"6","time":2119990},{"cells":"r1c6","type":"highlight","time":2120451},{"cells":"highlighted","type":"value","value":"5","time":2121398},{"cells":"r2c6,r3c6","type":"highlight","time":2122893},{"cells":"r3c6","type":"highlight","time":2123118},{"cells":"highlighted","type":"value","value":"4","time":2123581},{"cells":"r2c6","type":"highlight","time":2123894},{"cells":"highlighted","type":"value","value":"6","time":2124078},{"cells":"r3c9","type":"highlight","time":2125086},{"cells":"highlighted","type":"value","value":"5","time":2125572},{"cells":"r2c9","type":"highlight","time":2125806},{"cells":"highlighted","type":"value","value":"4","time":2126029},{"cells":"r6c3","type":"highlight","time":2127628},{"cells":"highlighted","type":"value","value":"9","time":2128605},{"cells":"r6c1","type":"highlight","time":2129924},{"cells":"highlighted","type":"value","value":"7","time":2130007},{"cells":"none","type":"highlight","time":2224503}]},{speed: 100});
	//app.playReplay({"puzzleId": "qN6bJ3ThRp", "actions": [{"cells":"r4c3,r4c4,r4c5,r4c6,r4c7,r5c6,r6c6,r7c6","type":"highlight","time":2302},{"cells":"r4c3,r4c4,r4c5,r4c6,r4c7,r5c6,r6c4,r6c6,r7c6","type":"highlight","time":3441},{"cells":"r4c3,r4c4,r4c5,r4c6,r4c7,r5c5,r5c6,r6c4,r6c6,r7c6","type":"highlight","time":3938},{"cells":"r6c5","type":"highlight","time":5557},{"cells":"r5c4,r6c5","type":"highlight","time":5917},{"cells":"highlighted","type":"pencilmarks","value":"5","time":6682},{"cells":"r6c3,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":8969},{"cells":"r3c4,r4c4,r5c4,r6c3,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":9734},{"cells":"r3c4,r4c4,r4c6,r5c4,r6c3,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":10604},{"cells":"r3c4,r4c4,r4c6,r5c4,r5c5,r6c3,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":10882},{"cells":"r4c5","type":"highlight","time":11197},{"cells":"r4c5,r5c6","type":"highlight","time":11587},{"cells":"highlighted","type":"pencilmarks","value":"4","time":12553},{"cells":"r6c5","type":"highlight","time":13642},{"cells":"r6c3,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":19919},{"cells":"r4c6,r6c3,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":21704},{"cells":"r4c6,r5c5,r6c3,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":21989},{"cells":"r5c5","type":"highlight","time":38924},{"cells":"r6c4,r6c5,r6c6,r6c7","type":"highlight","time":42766},{"cells":"r5c5,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":43207},{"cells":"r4c6,r5c5,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":43447},{"cells":"r5c5","type":"highlight","time":57764},{"cells":"r3c4,r4c4,r5c4,r6c4,r7c4,r8c4,r9c4","type":"highlight","time":71941},{"cells":"r3c4,r4c4,r5c4,r6c4,r7c4,r7c5,r8c4,r9c4","type":"highlight","time":72862},{"cells":"r3c4,r4c4,r5c4,r6c4,r7c4,r7c5,r7c6,r8c4,r9c4","type":"highlight","time":73867},{"cells":"r8c6","type":"highlight","time":75194},{"cells":"r4c3,r4c4,r4c5,r4c6","type":"highlight","time":77384},{"cells":"r4c3,r4c4,r4c5,r4c6,r5c5","type":"highlight","time":78548},{"cells":"r4c3,r4c4,r4c5,r4c6,r5c5,r6c4","type":"highlight","time":78832},{"cells":"r7c4","type":"highlight","time":99435},{"cells":"r6c4","type":"highlight","time":99756},{"cells":"highlighted","type":"candidates","value":"1","time":102457},{"cells":"highlighted","type":"candidates","value":"7","time":106386},{"cells":"highlighted","type":"candidates","value":"8","time":106712},{"cells":"highlighted","type":"candidates","value":"9","time":107137},{"cells":"r4c4","type":"highlight","time":107991},{"cells":"highlighted","type":"candidates","value":"1","time":109409},{"cells":"highlighted","type":"candidates","value":"8","time":120850},{"cells":"highlighted","type":"candidates","value":"9","time":121233},{"cells":"r4c6","type":"highlight","time":122098},{"cells":"highlighted","type":"candidates","value":"1","time":123473},{"cells":"highlighted","type":"candidates","value":"2","time":127298},{"cells":"highlighted","type":"candidates","value":"9","time":136706},{"cells":"r6c6","type":"highlight","time":137376},{"cells":"highlighted","type":"candidates","value":"1","time":139033},{"cells":"highlighted","type":"candidates","value":"9","time":145337},{"cells":"highlighted","type":"candidates","value":"8","time":145641},{"cells":"r6c4","type":"highlight","time":148949},{"cells":"r4c5","type":"highlight","time":164804},{"cells":"r5c5","type":"highlight","time":165108},{"cells":"highlighted","type":"value","value":"1","time":165857},{"cells":"r6c4","type":"highlight","time":166326},{"cells":"r5c5","type":"highlight","time":167210},{"cells":"highlighted","type":"clear","time":168345},{"cells":"highlighted","type":"candidates","value":"1","time":169177},{"cells":"highlighted","type":"candidates","value":"8","time":169569},{"cells":"highlighted","type":"candidates","value":"9","time":169602},{"cells":"r6c4","type":"highlight","time":173368},{"cells":"highlighted","type":"candidates","value":"1","time":174328},{"cells":"highlighted","type":"value","value":"7","time":178962},{"cells":"r4c6","type":"highlight","time":179623},{"cells":"highlighted","type":"candidates","value":"9","time":180417},{"cells":"r4c5","type":"highlight","time":183178},{"cells":"r4c7","type":"highlight","time":189897},{"cells":"r4c6","type":"highlight","time":190221},{"cells":"highlighted","type":"value","value":"2","time":190617},{"cells":"r6c6","type":"highlight","time":191428},{"cells":"r3c5","type":"highlight","time":194661},{"cells":"r1c5,r3c5","type":"highlight","time":195801},{"cells":"highlighted","type":"pencilmarks","value":"2","time":196137},{"cells":"r6c7","type":"highlight","time":200653},{"cells":"r6c4,r6c5,r6c6,r6c7","type":"highlight","time":203421},{"cells":"r5c5,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":204095},{"cells":"r4c4,r5c5,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":204493},{"cells":"r4c4,r4c6,r5c5,r6c4,r6c5,r6c6,r6c7","type":"highlight","time":204950},{"cells":"r6c5","type":"highlight","time":209105},{"cells":"r4c3,r4c4,r4c5,r4c6","type":"highlight","time":210808},{"cells":"r4c3,r4c4,r4c5,r4c6,r5c5","type":"highlight","time":211287},{"cells":"r4c3,r4c4,r4c5,r4c6,r5c5,r6c4","type":"highlight","time":211626},{"cells":"r4c3,r4c4,r4c5,r4c6,r5c5,r6c4,r6c6","type":"highlight","time":212526},{"cells":"r6c6","type":"highlight","time":215909},{"cells":"none","type":"highlight","time":224682},{"cells":"r7c5","type":"highlight","time":224774},{"cells":"r7c5,r9c5","type":"highlight","time":226430},{"cells":"highlighted","type":"pencilmarks","value":"7","time":227681},{"cells":"r5c7","type":"highlight","time":229348},{"cells":"r5c8,r5c9","type":"highlight","time":230908},{"cells":"highlighted","type":"pencilmarks","value":"7","time":231626},{"cells":"r5c1,r5c2","type":"highlight","time":241092},{"cells":"highlighted","type":"pencilmarks","value":"2","time":242113},{"cells":"r4c4,r4c5,r4c6,r4c7","type":"highlight","time":245022},{"cells":"r4c4,r4c5,r4c6,r4c7,r5c5","type":"highlight","time":245368},{"cells":"r4c4,r4c5,r4c6,r4c7,r5c5,r6c6,r6c7","type":"highlight","time":245751},{"cells":"r4c4,r4c5,r4c6,r4c7,r5c5,r6c5,r6c6,r6c7","type":"highlight","time":246306},{"cells":"r4c4,r4c5,r4c6,r4c7,r5c4,r5c5,r6c5,r6c6,r6c7","type":"highlight","time":246530},{"cells":"r5c6","type":"highlight","time":246995},{"cells":"highlighted","type":"value","value":"6","time":247786},{"cells":"r4c5","type":"highlight","time":248428},{"cells":"highlighted","type":"value","value":"4","time":248929},{"cells":"r6c4,r6c5,r6c6,r6c7","type":"highlight","time":250521},{"cells":"r5c4","type":"highlight","time":250798},{"cells":"highlighted","type":"value","value":"3","time":251162},{"cells":"r6c5","type":"highlight","time":251414},{"cells":"highlighted","type":"value","value":"5","time":252209},{"cells":"r4c1","type":"highlight","time":255297},{"cells":"highlighted","type":"value","value":"3","time":255465},{"cells":"r6c5","type":"highlight","time":256107},{"cells":"r6c9","type":"highlight","time":258943},{"cells":"highlighted","type":"value","value":"6","time":261457},{"cells":"r8c6","type":"highlight","time":286550},{"cells":"r9c6","type":"highlight","time":286940},{"cells":"highlighted","type":"value","value":"5","time":287265},{"cells":"highlighted","type":"value","value":"4","time":287866},{"cells":"r5c9","type":"highlight","time":288816},{"cells":"highlighted","type":"pencilmarks","value":"7","time":290594},{"cells":"r5c8","type":"highlight","time":291005},{"cells":"highlighted","type":"value","value":"7","time":291058},{"cells":"r5c1","type":"highlight","time":292019},{"cells":"highlighted","type":"pencilmarks","value":"2","time":292866},{"cells":"r5c2","type":"highlight","time":293315},{"cells":"highlighted","type":"value","value":"2","time":293458},{"cells":"r5c7","type":"highlight","time":296121},{"cells":"r5c9","type":"highlight","time":296728},{"cells":"highlighted","type":"value","value":"4","time":298946},{"cells":"r6c9","type":"highlight","time":299653},{"cells":"r5c7","type":"highlight","time":307528},{"cells":"r5c3","type":"highlight","time":308855},{"cells":"r5c1","type":"highlight","time":309298},{"cells":"highlighted","type":"value","value":"5","time":309953},{"cells":"r6c3","type":"highlight","time":310387},{"cells":"r5c3","type":"highlight","time":311157},{"cells":"r5c3,r5c7","type":"highlight","time":311833},{"cells":"highlighted","type":"candidates","value":"1","time":312569},{"cells":"highlighted","type":"candidates","value":"8","time":313089},{"cells":"highlighted","type":"candidates","value":"9","time":313122},{"cells":"r5c8","type":"highlight","time":314225},{"cells":"r5c7","type":"highlight","time":315103},{"cells":"highlighted","type":"candidates","value":"8","time":316707},{"cells":"r5c3","type":"highlight","time":317548},{"cells":"highlighted","type":"candidates","value":"1","time":318353},{"cells":"r6c6","type":"highlight","time":319339},{"cells":"r1c4","type":"highlight","time":325888},{"cells":"highlighted","type":"value","value":"5","time":326489},{"cells":"r1c1,r1c2,r1c3,r1c4,r2c1,r3c1,r4c1,r5c1","type":"highlight","time":337933},{"cells":"r1c1,r1c2,r1c3,r1c4,r2c1,r3c1,r3c2,r4c1,r5c1","type":"highlight","time":339545},{"cells":"r1c1,r1c2,r1c3,r1c4,r2c1,r3c1,r3c2,r3c3,r4c1,r5c1","type":"highlight","time":341900},{"cells":"r1c1,r1c2,r1c3,r1c4,r2c1,r2c2,r3c1,r3c2,r3c3,r4c1,r5c1","type":"highlight","time":342237},{"cells":"r2c3","type":"highlight","time":345103},{"cells":"highlighted","type":"value","value":"5","time":345434},{"cells":"r3c7","type":"highlight","time":346932},{"cells":"r3c8","type":"highlight","time":347300},{"cells":"highlighted","type":"value","value":"5","time":348186},{"cells":"r8c9,r9c9","type":"highlight","time":352475},{"cells":"highlighted","type":"pencilmarks","value":"5","time":353426},{"cells":"r8c2,r9c2","type":"highlight","time":357964},{"cells":"highlighted","type":"pencilmarks","value":"5","time":358449},{"cells":"r6c8","type":"highlight","time":374337},{"cells":"r5c2","type":"highlight","time":391414},{"cells":"highlighted","type":"clear","time":392538},{"cells":"r5c1","type":"highlight","time":393732},{"cells":"highlighted","type":"clear","time":393922},{"cells":"r5c2","type":"highlight","time":394768},{"cells":"highlighted","type":"pencilmarks","value":"2","time":395705},{"cells":"r5c1,r5c2","type":"highlight","time":400459},{"cells":"highlighted","type":"candidates","value":"2","time":402026},{"cells":"highlighted","type":"candidates","value":"5","time":402107},{"cells":"r5c1","type":"highlight","time":406490},{"cells":"highlighted","type":"value","value":"5","time":408729},{"cells":"r5c2","type":"highlight","time":409092},{"cells":"highlighted","type":"value","value":"2","time":409274},{"cells":"highlighted","type":"clear","time":414073},{"cells":"r5c1","type":"highlight","time":414567},{"cells":"highlighted","type":"clear","time":414762},{"cells":"highlighted","type":"clear","time":415353},{"cells":"r5c2","type":"highlight","time":415618},{"cells":"highlighted","type":"clear","time":415698},{"cells":"r5c8,r5c9","type":"highlight","time":417215},{"cells":"highlighted","type":"clear","time":417490},{"cells":"r6c8","type":"highlight","time":418129},{"cells":"r5c8","type":"highlight","time":418512},{"cells":"highlighted","type":"clear","time":418858},{"cells":"r5c8,r5c9","type":"highlight","time":419419},{"cells":"highlighted","type":"pencilmarks","value":"4","time":425738},{"cells":"r5c1,r5c2","type":"highlight","time":426755},{"cells":"highlighted","type":"pencilmarks","value":"5","time":427458},{"cells":"r8c4,r9c4","type":"highlight","time":433197},{"cells":"highlighted","type":"pencilmarks","value":"6","time":434393},{"cells":"r1c5","type":"highlight","time":442016},{"cells":"r2c5","type":"highlight","time":442452},{"cells":"highlighted","type":"value","value":"6","time":442673},{"cells":"r1c7,r1c8","type":"highlight","time":455704},{"cells":"r1c8","type":"highlight","time":456506},{"cells":"highlighted","type":"value","value":"6","time":456689},{"cells":"r8c7,r9c7","type":"highlight","time":484399},{"cells":"highlighted","type":"candidates","value":"6","time":484809},{"cells":"highlighted","type":"candidates","value":"6","time":487057},{"cells":"highlighted","type":"pencilmarks","value":"6","time":487433},{"cells":"none","type":"highlight","time":488417},{"cells":"r7c1,r7c2","type":"highlight","time":492177},{"cells":"highlighted","type":"pencilmarks","value":"6","time":494513},{"cells":"r3c2","type":"highlight","time":500636},{"cells":"highlighted","type":"value","value":"6","time":501793},{"cells":"r5c3","type":"highlight","time":502557},{"cells":"r8c6","type":"highlight","time":506780},{"cells":"r1c6,r2c6","type":"highlight","time":508196},{"cells":"highlighted","type":"pencilmarks","value":"3","time":508625},{"cells":"r8c5,r9c5","type":"highlight","time":511061},{"cells":"r8c5","type":"highlight","time":511729},{"cells":"highlighted","type":"value","value":"3","time":511889},{"cells":"r8c6","type":"highlight","time":512419},{"cells":"r9c6","type":"highlight","time":520092},{"cells":"r8c6","type":"highlight","time":520353},{"cells":"highlighted","type":"candidates","value":"1","time":520961},{"cells":"highlighted","type":"candidates","value":"8","time":521409},{"cells":"highlighted","type":"candidates","value":"9","time":521441},{"cells":"r9c5","type":"highlight","time":531543},{"cells":"r4c1,r5c1,r6c1,r7c1,r8c1,r9c1","type":"highlight","time":544210},{"cells":"r4c1,r5c1,r6c1,r7c1,r8c1,r8c2,r8c3,r8c4,r9c1","type":"highlight","time":544893},{"cells":"r4c1,r5c1,r6c1,r7c1,r7c3,r8c1,r8c2,r8c3,r8c4,r9c1,r9c3","type":"highlight","time":545457},{"cells":"r9c2","type":"highlight","time":546874},{"cells":"r7c2,r9c2","type":"highlight","time":547428},{"cells":"highlighted","type":"pencilmarks","value":"3","time":548648},{"cells":"r7c1,r7c2","type":"highlight","time":551800},{"cells":"r1c3","type":"highlight","time":556309},{"cells":"highlighted","type":"value","value":"3","time":559217},{"cells":"r3c7","type":"highlight","time":567379},{"cells":"r3c7,r3c9","type":"highlight","time":568257},{"cells":"r3c9","type":"highlight","time":568602},{"cells":"highlighted","type":"value","value":"3","time":568769},{"cells":"r7c1,r7c2","type":"highlight","time":575658},{"cells":"r4c8","type":"highlight","time":587456},{"cells":"r4c9","type":"highlight","time":591490},{"cells":"highlighted","type":"value","value":"7","time":593513},{"cells":"r4c8","type":"highlight","time":593988},{"cells":"r4c2,r4c8","type":"highlight","time":594745},{"cells":"highlighted","type":"candidates","value":"1","time":595386},{"cells":"highlighted","type":"candidates","value":"8","time":595721},{"cells":"highlighted","type":"candidates","value":"9","time":595770},{"cells":"r5c7","type":"highlight","time":597641},{"cells":"r4c8","type":"highlight","time":598106},{"cells":"highlighted","type":"candidates","value":"8","time":599050},{"cells":"r6c8","type":"highlight","time":605494},{"cells":"r5c2","type":"highlight","time":614239},{"cells":"highlighted","type":"value","value":"7","time":615146},{"cells":"r5c1","type":"highlight","time":615536},{"cells":"highlighted","type":"value","value":"5","time":615842},{"cells":"r6c1,r6c2","type":"highlight","time":630815},{"cells":"highlighted","type":"pencilmarks","value":"2","time":631490},{"cells":"r7c2","type":"highlight","time":632831},{"cells":"r5c3","type":"highlight","time":634984},{"cells":"highlighted","type":"value","value":"9","time":635690},{"cells":"r4c2","type":"highlight","time":636257},{"cells":"highlighted","type":"value","value":"1","time":636882},{"cells":"r4c8","type":"highlight","time":637705},{"cells":"highlighted","type":"value","value":"9","time":638401},{"cells":"r4c4","type":"highlight","time":638980},{"cells":"highlighted","type":"value","value":"8","time":639761},{"cells":"r5c5","type":"highlight","time":640331},{"cells":"highlighted","type":"candidates","value":"8","time":641137},{"cells":"r6c6","type":"highlight","time":641538},{"cells":"highlighted","type":"candidates","value":"8","time":641626},{"cells":"r6c1,r6c2","type":"highlight","time":644410},{"cells":"highlighted","type":"candidates","value":"2","time":647001},{"cells":"highlighted","type":"candidates","value":"8","time":647097},{"cells":"r6c3","type":"highlight","time":648280},{"cells":"r6c2","type":"highlight","time":648551},{"cells":"highlighted","type":"value","value":"2","time":648705},{"cells":"r6c1","type":"highlight","time":648970},{"cells":"highlighted","type":"value","value":"8","time":649737},{"cells":"r6c8","type":"highlight","time":652534},{"cells":"highlighted","type":"value","value":"1","time":654257},{"cells":"r6c6","type":"highlight","time":655173},{"cells":"highlighted","type":"value","value":"9","time":655650},{"cells":"r5c5","type":"highlight","time":655998},{"cells":"highlighted","type":"value","value":"1","time":656266},{"cells":"r5c7","type":"highlight","time":657145},{"cells":"r4c8","type":"highlight","time":660454},{"cells":"highlighted","type":"clear","time":661178},{"cells":"r5c7","type":"highlight","time":661668},{"cells":"highlighted","type":"clear","time":662490},{"cells":"r5c5","type":"highlight","time":664105},{"cells":"highlighted","type":"clear","time":664273},{"cells":"r6c6","type":"highlight","time":664570},{"cells":"highlighted","type":"clear","time":664648},{"cells":"r4c4","type":"highlight","time":665327},{"cells":"highlighted","type":"clear","time":665426},{"cells":"r6c8","type":"highlight","time":666572},{"cells":"highlighted","type":"clear","time":666657},{"cells":"r4c8","type":"highlight","time":678843},{"cells":"highlighted","type":"clear","time":678930},{"cells":"r4c9","type":"highlight","time":680193},{"cells":"highlighted","type":"clear","time":680299},{"cells":"r4c2","type":"highlight","time":682144},{"cells":"highlighted","type":"clear","time":682282},{"cells":"highlighted","type":"clear","time":682921},{"cells":"r4c3","type":"highlight","time":685046},{"cells":"r4c2,r4c3,r4c4,r4c5,r4c6,r4c7,r4c8,r4c9","type":"highlight","time":686327},{"cells":"r4c8,r4c9","type":"highlight","time":687677},{"cells":"highlighted","type":"pencilmarks","value":"7","time":688577},{"cells":"r5c9","type":"highlight","time":689290},{"cells":"r5c2","type":"highlight","time":692448},{"cells":"highlighted","type":"clear","time":693096},{"cells":"r5c1","type":"highlight","time":695208},{"cells":"highlighted","type":"clear","time":695952},{"cells":"highlighted","type":"value","value":"7","time":697152},{"cells":"r5c2","type":"highlight","time":697449},{"cells":"highlighted","type":"value","value":"5","time":697544},{"cells":"r6c1,r6c2","type":"highlight","time":698237},{"cells":"highlighted","type":"clear","time":698353},{"cells":"r6c1","type":"highlight","time":699362},{"cells":"r6c1,r6c2","type":"highlight","time":704965},{"cells":"highlighted","type":"clear","time":705146},{"cells":"r5c3","type":"highlight","time":705685},{"cells":"highlighted","type":"clear","time":705768},{"cells":"highlighted","type":"clear","time":706225},{"cells":"r6c2","type":"highlight","time":706914},{"cells":"r6c1,r6c2","type":"highlight","time":709015},{"cells":"r4c2","type":"highlight","time":710709},{"cells":"r5c3","type":"highlight","time":712705},{"cells":"r7c1","type":"highlight","time":714804},{"cells":"highlighted","type":"value","value":"6","time":715897},{"cells":"r7c3","type":"highlight","time":716522},{"cells":"r7c2","type":"highlight","time":716889},{"cells":"highlighted","type":"pencilmarks","value":"6","time":718066},{"cells":"r6c8","type":"highlight","time":724899},{"cells":"r6c1,r6c2","type":"highlight","time":726009},{"cells":"highlighted","type":"pencilmarks","value":"2","time":726288},{"cells":"r4c6,r4c7,r5c7,r5c8","type":"highlight","time":729639},{"cells":"r5c8","type":"highlight","time":729916},{"cells":"r5c7","type":"highlight","time":730945},{"cells":"r5c9","type":"highlight","time":731337},{"cells":"highlighted","type":"value","value":"2","time":732146},{"cells":"r5c8","type":"highlight","time":733187},{"cells":"highlighted","type":"value","value":"4","time":733617},{"cells":"r6c8","type":"highlight","time":734386},{"cells":"r5c7","type":"highlight","time":735587},{"cells":"r5c3,r5c7","type":"highlight","time":736158},{"cells":"highlighted","type":"candidates","value":"1","time":736881},{"cells":"highlighted","type":"candidates","value":"8","time":737264},{"cells":"highlighted","type":"candidates","value":"9","time":737288},{"cells":"r5c5","type":"highlight","time":738737},{"cells":"highlighted","type":"candidates","value":"8","time":739400},{"cells":"r6c6","type":"highlight","time":742008},{"cells":"highlighted","type":"candidates","value":"8","time":742664},{"cells":"r6c8","type":"highlight","time":743792},{"cells":"r6c1","type":"highlight","time":746319},{"cells":"r4c8,r5c8,r6c8,r7c8,r8c8,r9c8","type":"highlight","time":757674},{"cells":"r4c8,r5c8,r6c8,r7c8,r8c8,r9c7,r9c8,r9c9","type":"highlight","time":758387},{"cells":"r4c8,r5c8,r6c8,r7c7,r7c8,r7c9,r8c8,r9c7,r9c8,r9c9","type":"highlight","time":759759},{"cells":"r8c7","type":"highlight","time":762190},{"cells":"r8c7,r8c9","type":"highlight","time":762572},{"cells":"highlighted","type":"pencilmarks","value":"4","time":763393},{"cells":"r7c2,r7c3","type":"highlight","time":764748},{"cells":"r7c3","type":"highlight","time":765264},{"cells":"r7c2","type":"highlight","time":765527},{"cells":"highlighted","type":"value","value":"4","time":765713},{"cells":"r1c1,r2c1,r3c1","type":"highlight","time":768572},{"cells":"r3c1","type":"highlight","time":768796},{"cells":"r1c1,r2c1","type":"highlight","time":769291},{"cells":"highlighted","type":"pencilmarks","value":"4","time":770553},{"cells":"r9c2","type":"highlight","time":777145},{"cells":"highlighted","type":"value","value":"3","time":777672},{"cells":"r8c2","type":"highlight","time":778441},{"cells":"highlighted","type":"value","value":"5","time":779041},{"cells":"r8c9","type":"highlight","time":782612},{"cells":"highlighted","type":"pencilmarks","value":"5","time":783672},{"cells":"r9c9","type":"highlight","time":784044},{"cells":"highlighted","type":"value","value":"5","time":784148},{"cells":"r7c7,r7c8,r7c9","type":"highlight","time":787503},{"cells":"r7c8,r7c9","type":"highlight","time":789482},{"cells":"r7c8","type":"highlight","time":789782},{"cells":"highlighted","type":"value","value":"3","time":790653},{"cells":"r2c7","type":"highlight","time":794935},{"cells":"r2c7,r2c9","type":"highlight","time":795324},{"cells":"highlighted","type":"pencilmarks","value":"7","time":796305},{"cells":"none","type":"highlight","time":808456},{"cells":"r8c1","type":"highlight","time":808973},{"cells":"r8c1,r8c2","type":"highlight","time":809318},{"cells":"r8c3","type":"highlight","time":809882},{"cells":"r8c1,r8c3","type":"highlight","time":810272},{"cells":"highlighted","type":"pencilmarks","value":"2","time":810618},{"cells":"r9c7,r9c8","type":"highlight","time":811352},{"cells":"highlighted","type":"pencilmarks","value":"2","time":812169},{"cells":"r6c2","type":"highlight","time":817203},{"cells":"r6c1,r6c2","type":"highlight","time":821304},{"cells":"r4c2","type":"highlight","time":821716},{"cells":"r6c2","type":"highlight","time":822647},{"cells":"r4c2","type":"highlight","time":830080},{"cells":"r1c2","type":"highlight","time":831452},{"cells":"r2c2","type":"highlight","time":832517},{"cells":"r2c2,r6c2","type":"highlight","time":833162},{"cells":"r2c2","type":"highlight","time":836139},{"cells":"r2c2,r4c2","type":"highlight","time":836613},{"cells":"r2c2,r4c2,r6c2","type":"highlight","time":837513},{"cells":"r1c2","type":"highlight","time":838284},{"cells":"highlighted","type":"value","value":"7","time":838865},{"cells":"r7c3,r8c3,r9c3","type":"highlight","time":841015},{"cells":"r9c3","type":"highlight","time":844855},{"cells":"r3c3","type":"highlight","time":847292},{"cells":"r3c1,r3c3","type":"highlight","time":847667},{"cells":"highlighted","type":"pencilmarks","value":"8","time":848658},{"cells":"r7c7","type":"highlight","time":861976},{"cells":"r7c7,r7c9","type":"highlight","time":862329},{"cells":"highlighted","type":"pencilmarks","value":"1","time":863018},{"cells":"r9c9","type":"highlight","time":864211},{"cells":"r7c5","type":"highlight","time":868713},{"cells":"r7c3","type":"highlight","time":870648},{"cells":"r8c7","type":"highlight","time":873249},{"cells":"r7c1,r7c2,r7c3,r7c4,r7c5,r7c6,r7c7,r7c8,r7c9","type":"highlight","time":875199},{"cells":"r7c5","type":"highlight","time":878282},{"cells":"r7c4","type":"highlight","time":878559},{"cells":"r6c2","type":"highlight","time":878935},{"cells":"highlighted","type":"pencilmarks","value":"2","time":879275},{"cells":"r6c1","type":"highlight","time":879819},{"cells":"highlighted","type":"value","value":"2","time":880112},{"cells":"r3c6","type":"highlight","time":880831},{"cells":"r4c8","type":"highlight","time":881199},{"cells":"highlighted","type":"pencilmarks","value":"7","time":882001},{"cells":"r4c9","type":"highlight","time":882466},{"cells":"highlighted","type":"value","value":"7","time":882569},{"cells":"r2c9","type":"highlight","time":885983},{"cells":"highlighted","type":"pencilmarks","value":"7","time":886210},{"cells":"r2c7","type":"highlight","time":886591},{"cells":"highlighted","type":"value","value":"7","time":886649},{"cells":"r8c1","type":"highlight","time":888189},{"cells":"highlighted","type":"pencilmarks","value":"2","time":889058},{"cells":"r8c3","type":"highlight","time":889329},{"cells":"highlighted","type":"value","value":"2","time":889409},{"cells":"r2c2","type":"highlight","time":894542},{"cells":"highlighted","type":"value","value":"2","time":894745},{"cells":"r8c8","type":"highlight","time":896776},{"cells":"r8c8,r9c8","type":"highlight","time":897466},{"cells":"highlighted","type":"pencilmarks","value":"7","time":898705},{"cells":"r7c8","type":"highlight","time":902356},{"cells":"r8c8","type":"highlight","time":902866},{"cells":"r9c7,r9c8","type":"highlight","time":903631},{"cells":"r7c9","type":"highlight","time":906309},{"cells":"r8c9","type":"highlight","time":912152},{"cells":"highlighted","type":"pencilmarks","value":"4","time":913906},{"cells":"r8c7","type":"highlight","time":914357},{"cells":"highlighted","type":"value","value":"4","time":914713},{"cells":"r1c9,r2c9","type":"highlight","time":917768},{"cells":"r2c9","type":"highlight","time":918016},{"cells":"r1c9","type":"highlight","time":918242},{"cells":"highlighted","type":"value","value":"4","time":918713},{"cells":"r2c1","type":"highlight","time":921016},{"cells":"highlighted","type":"value","value":"4","time":921402},{"cells":"r1c1","type":"highlight","time":921616},{"cells":"highlighted","type":"pencilmarks","value":"4","time":921857},{"cells":"r6c2","type":"highlight","time":924158},{"cells":"r4c2","type":"highlight","time":924428},{"cells":"r4c2,r6c2","type":"highlight","time":925261},{"cells":"r6c3","type":"highlight","time":928531},{"cells":"r8c2","type":"highlight","time":934291},{"cells":"highlighted","type":"clear","time":935577},{"cells":"highlighted","type":"clear","time":936938},{"cells":"r9c3","type":"highlight","time":937613},{"cells":"r9c1,r9c3","type":"highlight","time":938468},{"cells":"highlighted","type":"pencilmarks","value":"5","time":942896},{"cells":"r9c9","type":"highlight","time":943650},{"cells":"highlighted","type":"clear","time":943770},{"cells":"highlighted","type":"clear","time":945345},{"cells":"r8c9","type":"highlight","time":945706},{"cells":"highlighted","type":"value","value":"5","time":947105},{"cells":"r9c7","type":"highlight","time":947761},{"cells":"highlighted","type":"value","value":"6","time":948136},{"cells":"r9c8","type":"highlight","time":948443},{"cells":"highlighted","type":"value","value":"2","time":948784},{"cells":"r8c8","type":"highlight","time":949074},{"cells":"highlighted","type":"value","value":"7","time":949944},{"cells":"r9c9","type":"highlight","time":950805},{"cells":"r7c9,r9c9","type":"highlight","time":953236},{"cells":"r7c7,r7c9,r9c9","type":"highlight","time":953655},{"cells":"highlighted","type":"candidates","value":"1","time":954401},{"cells":"highlighted","type":"candidates","value":"8","time":954800},{"cells":"highlighted","type":"candidates","value":"9","time":954848},{"cells":"r8c8","type":"highlight","time":956025},{"cells":"r7c9","type":"highlight","time":956431},{"cells":"r9c9","type":"highlight","time":956955},{"cells":"highlighted","type":"candidates","value":"1","time":957537},{"cells":"r3c4,r3c5,r3c6,r3c7,r3c8,r3c9","type":"highlight","time":960577},{"cells":"r1c9,r3c4,r3c5,r3c6,r3c7,r3c8,r3c9","type":"highlight","time":960968},{"cells":"r1c8,r1c9,r2c8,r3c4,r3c5,r3c6,r3c7,r3c8,r3c9,r4c8,r5c8","type":"highlight","time":962002},{"cells":"r1c8,r1c9,r2c8,r2c9,r3c4,r3c5,r3c6,r3c7,r3c8,r3c9,r4c8,r5c8","type":"highlight","time":962409},{"cells":"r1c9","type":"highlight","time":964140},{"cells":"highlighted","type":"clear","time":966801},{"cells":"r1c7,r1c9","type":"highlight","time":967673},{"cells":"highlighted","type":"pencilmarks","value":"4","time":968545},{"cells":"r3c3","type":"highlight","time":974041},{"cells":"r3c1,r3c3","type":"highlight","time":974460},{"cells":"r1c1,r3c1,r3c3","type":"highlight","time":974724},{"cells":"highlighted","type":"candidates","value":"1","time":975417},{"cells":"highlighted","type":"candidates","value":"8","time":975729},{"cells":"highlighted","type":"candidates","value":"9","time":975785},{"cells":"r3c1","type":"highlight","time":976621},{"cells":"r1c1","type":"highlight","time":976912},{"cells":"highlighted","type":"candidates","value":"8","time":978169},{"cells":"r3c3","type":"highlight","time":979297},{"cells":"r8c4","type":"highlight","time":987796},{"cells":"r9c4","type":"highlight","time":990736},{"cells":"highlighted","type":"pencilmarks","value":"6","time":991737},{"cells":"r8c4","type":"highlight","time":992070},{"cells":"highlighted","type":"value","value":"6","time":992362},{"cells":"r8c1,r8c2","type":"highlight","time":993097},{"cells":"highlighted","type":"candidates","value":"1","time":993833},{"cells":"highlighted","type":"candidates","value":"8","time":994217},{"cells":"highlighted","type":"candidates","value":"9","time":994265},{"cells":"r9c2","type":"highlight","time":995108},{"cells":"r8c2","type":"highlight","time":995438},{"cells":"highlighted","type":"candidates","value":"1","time":995593},{"cells":"r9c5","type":"highlight","time":997509},{"cells":"r7c5,r9c5","type":"highlight","time":998168},{"cells":"r9c4","type":"highlight","time":1002908},{"cells":"r5c1,r6c1,r7c1,r8c1,r9c1","type":"highlight","time":1008886},{"cells":"r9c3","type":"highlight","time":1011736},{"cells":"r7c3,r9c3","type":"highlight","time":1012133},{"cells":"highlighted","type":"pencilmarks","value":"7","time":1014921},{"cells":"r8c1,r9c1","type":"highlight","time":1020848},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1021049},{"cells":"r3c1","type":"highlight","time":1022445},{"cells":"highlighted","type":"candidates","value":"1","time":1022994},{"cells":"r1c1","type":"highlight","time":1023797},{"cells":"highlighted","type":"candidates","value":"1","time":1023929},{"cells":"highlighted","type":"value","value":"9","time":1025041},{"cells":"r3c1","type":"highlight","time":1025498},{"cells":"highlighted","type":"value","value":"8","time":1026241},{"cells":"r3c3","type":"highlight","time":1026675},{"cells":"highlighted","type":"value","value":"1","time":1026920},{"cells":"r8c1","type":"highlight","time":1028835},{"cells":"highlighted","type":"value","value":"1","time":1029361},{"cells":"r9c1","type":"highlight","time":1029646},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1029792},{"cells":"r5c3","type":"highlight","time":1032031},{"cells":"highlighted","type":"candidates","value":"1","time":1032297},{"cells":"r6c2","type":"highlight","time":1033193},{"cells":"r4c2,r6c2","type":"highlight","time":1033492},{"cells":"r6c2","type":"highlight","time":1034146},{"cells":"r4c2","type":"highlight","time":1034393},{"cells":"highlighted","type":"value","value":"1","time":1034521},{"cells":"r6c2","type":"highlight","time":1034820},{"cells":"highlighted","type":"candidates","value":"8","time":1035985},{"cells":"highlighted","type":"candidates","value":"9","time":1036018},{"cells":"r1c9","type":"highlight","time":1046430},{"cells":"r2c9","type":"highlight","time":1048207},{"cells":"r2c7,r2c8,r2c9","type":"highlight","time":1049573},{"cells":"r1c8,r1c9","type":"highlight","time":1050106},{"cells":"r1c9","type":"highlight","time":1050435},{"cells":"highlighted","type":"value","value":"4","time":1051128},{"cells":"r1c6","type":"highlight","time":1051485},{"cells":"r1c7","type":"highlight","time":1051840},{"cells":"highlighted","type":"pencilmarks","value":"4","time":1052208},{"cells":"r2c9","type":"highlight","time":1053203},{"cells":"highlighted","type":"candidates","value":"1","time":1054200},{"cells":"highlighted","type":"candidates","value":"8","time":1054528},{"cells":"highlighted","type":"candidates","value":"9","time":1054584},{"cells":"r3c9","type":"highlight","time":1056247},{"cells":"r1c5","type":"highlight","time":1057681},{"cells":"r1c6","type":"highlight","time":1059009},{"cells":"highlighted","type":"pencilmarks","value":"3","time":1059449},{"cells":"r2c6","type":"highlight","time":1059683},{"cells":"highlighted","type":"value","value":"3","time":1059770},{"cells":"r1c5","type":"highlight","time":1060590},{"cells":"r3c5","type":"highlight","time":1061325},{"cells":"r1c5,r1c6,r1c7","type":"highlight","time":1062818},{"cells":"highlighted","type":"candidates","value":"1","time":1063577},{"cells":"highlighted","type":"candidates","value":"2","time":1063691},{"cells":"highlighted","type":"candidates","value":"8","time":1066753},{"cells":"r2c5","type":"highlight","time":1067865},{"cells":"r1c5","type":"highlight","time":1068195},{"cells":"r1c6","type":"highlight","time":1069335},{"cells":"highlighted","type":"candidates","value":"2","time":1069729},{"cells":"r1c7","type":"highlight","time":1070850},{"cells":"highlighted","type":"candidates","value":"8","time":1073833},{"cells":"r1c5","type":"highlight","time":1075823},{"cells":"r2c4","type":"highlight","time":1078793},{"cells":"r3c5","type":"highlight","time":1081883},{"cells":"r2c4","type":"highlight","time":1083278},{"cells":"r2c4,r2c8","type":"highlight","time":1084178},{"cells":"highlighted","type":"candidates","value":"1","time":1084802},{"cells":"highlighted","type":"candidates","value":"8","time":1085129},{"cells":"highlighted","type":"candidates","value":"9","time":1085176},{"cells":"r3c8","type":"highlight","time":1086601},{"cells":"r2c8","type":"highlight","time":1087035},{"cells":"r2c4","type":"highlight","time":1089338},{"cells":"r9c4","type":"highlight","time":1090283},{"cells":"highlighted","type":"candidates","value":"1","time":1090905},{"cells":"highlighted","type":"candidates","value":"8","time":1091266},{"cells":"highlighted","type":"candidates","value":"9","time":1091361},{"cells":"r4c4","type":"highlight","time":1093861},{"cells":"r9c1","type":"highlight","time":1104676},{"cells":"highlighted","type":"value","value":"5","time":1107305},{"cells":"r9c3","type":"highlight","time":1111477},{"cells":"r7c3","type":"highlight","time":1115211},{"cells":"r9c3","type":"highlight","time":1118076},{"cells":"r7c3,r9c3","type":"highlight","time":1119367},{"cells":"highlighted","type":"candidates","value":"7","time":1123129},{"cells":"highlighted","type":"candidates","value":"8","time":1123144},{"cells":"highlighted","type":"candidates","value":"9","time":1123200},{"cells":"none","type":"highlight","time":1124227},{"cells":"r9c3","type":"highlight","time":1124557},{"cells":"highlighted","type":"pencilmarks","value":"5","time":1125984},{"cells":"r7c3,r9c3","type":"highlight","time":1127976},{"cells":"highlighted","type":"pencilmarks","value":"7","time":1129176},{"cells":"r7c5","type":"highlight","time":1143053},{"cells":"r7c5,r9c5","type":"highlight","time":1146726},{"cells":"r6c8","type":"highlight","time":1150402},{"cells":"r4c8,r6c8","type":"highlight","time":1151098},{"cells":"highlighted","type":"candidates","value":"1","time":1151712},{"cells":"highlighted","type":"candidates","value":"8","time":1152144},{"cells":"highlighted","type":"candidates","value":"9","time":1152184},{"cells":"r5c9","type":"highlight","time":1153176},{"cells":"r4c8","type":"highlight","time":1153476},{"cells":"highlighted","type":"candidates","value":"8","time":1154289},{"cells":"r6c8","type":"highlight","time":1154775},{"cells":"r4c8","type":"highlight","time":1156529},{"cells":"highlighted","type":"candidates","value":"1","time":1158145},{"cells":"highlighted","type":"value","value":"9","time":1159081},{"cells":"r5c7","type":"highlight","time":1159679},{"cells":"highlighted","type":"candidates","value":"9","time":1160002},{"cells":"r6c8","type":"highlight","time":1160631},{"cells":"highlighted","type":"candidates","value":"9","time":1160897},{"cells":"r2c8","type":"highlight","time":1161591},{"cells":"highlighted","type":"candidates","value":"9","time":1161777},{"cells":"r3c7","type":"highlight","time":1164261},{"cells":"highlighted","type":"candidates","value":"1","time":1165073},{"cells":"highlighted","type":"candidates","value":"2","time":1165120},{"cells":"highlighted","type":"candidates","value":"1","time":1166704},{"cells":"highlighted","type":"candidates","value":"9","time":1168313},{"cells":"r5c7","type":"highlight","time":1169721},{"cells":"r3c7","type":"highlight","time":1170036},{"cells":"r6c8","type":"highlight","time":1179644},{"cells":"r3c5","type":"highlight","time":1184422},{"cells":"highlighted","type":"candidates","value":"2","time":1188489},{"cells":"highlighted","type":"candidates","value":"9","time":1189072},{"cells":"r1c5,r3c5","type":"highlight","time":1191239},{"cells":"highlighted","type":"pencilmarks","value":"2","time":1191496},{"cells":"r7c5","type":"highlight","time":1196841},{"cells":"highlighted","type":"candidates","value":"1","time":1198361},{"cells":"highlighted","type":"candidates","value":"7","time":1201897},{"cells":"highlighted","type":"candidates","value":"8","time":1201993},{"cells":"highlighted","type":"candidates","value":"9","time":1202008},{"cells":"r9c5","type":"highlight","time":1203164},{"cells":"highlighted","type":"candidates","value":"1","time":1204313},{"cells":"highlighted","type":"candidates","value":"7","time":1205105},{"cells":"highlighted","type":"candidates","value":"8","time":1205153},{"cells":"highlighted","type":"candidates","value":"9","time":1205192},{"cells":"none","type":"highlight","time":1206607},{"cells":"r9c5","type":"highlight","time":1206951},{"cells":"r7c5","type":"highlight","time":1207844},{"cells":"highlighted","type":"candidates","value":"1","time":1208640},{"cells":"r9c5","type":"highlight","time":1211706},{"cells":"r7c6","type":"highlight","time":1215322},{"cells":"r7c5","type":"highlight","time":1215794},{"cells":"r7c3","type":"highlight","time":1216476},{"cells":"r7c5","type":"highlight","time":1218269},{"cells":"r7c9","type":"highlight","time":1220632},{"cells":"r8c8","type":"highlight","time":1221824},{"cells":"r9c3,r9c4,r9c5,r9c6","type":"highlight","time":1224396},{"cells":"r9c3","type":"highlight","time":1224877},{"cells":"r9c4","type":"highlight","time":1226864},{"cells":"r9c3","type":"highlight","time":1227861},{"cells":"r8c6","type":"highlight","time":1230217},{"cells":"highlighted","type":"candidates","value":"1","time":1230393},{"cells":"r6c6","type":"highlight","time":1232790},{"cells":"r8c6","type":"highlight","time":1233433},{"cells":"r6c6","type":"highlight","time":1233847},{"cells":"r6c6,r8c6","type":"highlight","time":1234289},{"cells":"r8c7","type":"highlight","time":1235400},{"cells":"r1c1,r1c2,r1c3,r1c4,r1c5,r1c6,r1c7,r1c8,r1c9","type":"highlight","time":1238841},{"cells":"r3c3","type":"highlight","time":1239997},{"cells":"r4c6","type":"highlight","time":1244309},{"cells":"r7c7,r7c8,r7c9","type":"highlight","time":1258041},{"cells":"r7c7","type":"highlight","time":1258664},{"cells":"r7c7,r7c9","type":"highlight","time":1259016},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1259320},{"cells":"r9c5","type":"highlight","time":1261761},{"cells":"r9c4,r9c5","type":"highlight","time":1263516},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1264336},{"cells":"r1c6,r2c6,r3c6,r4c6,r5c6,r6c6","type":"highlight","time":1266981},{"cells":"r2c9","type":"highlight","time":1270544},{"cells":"r2c8","type":"highlight","time":1273363},{"cells":"highlighted","type":"value","value":"1","time":1273889},{"cells":"r2c9","type":"highlight","time":1274406},{"cells":"highlighted","type":"candidates","value":"1","time":1274578},{"cells":"r6c8","type":"highlight","time":1275344},{"cells":"highlighted","type":"value","value":"8","time":1276144},{"cells":"r5c7","type":"highlight","time":1276513},{"cells":"highlighted","type":"value","value":"1","time":1276929},{"cells":"r1c7","type":"highlight","time":1279409},{"cells":"highlighted","type":"candidates","value":"1","time":1279600},{"cells":"highlighted","type":"value","value":"2","time":1280008},{"cells":"r3c7","type":"highlight","time":1280721},{"cells":"highlighted","type":"value","value":"9","time":1281641},{"cells":"r2c9","type":"highlight","time":1281876},{"cells":"highlighted","type":"value","value":"8","time":1281961},{"cells":"r7c9","type":"highlight","time":1282701},{"cells":"r9c9","type":"highlight","time":1283833},{"cells":"highlighted","type":"value","value":"9","time":1284393},{"cells":"r7c9","type":"highlight","time":1284674},{"cells":"highlighted","type":"value","value":"1","time":1284937},{"cells":"r7c7","type":"highlight","time":1285409},{"cells":"highlighted","type":"value","value":"8","time":1286241},{"cells":"r7c5","type":"highlight","time":1287531},{"cells":"highlighted","type":"candidates","value":"8","time":1288489},{"cells":"r7c3","type":"highlight","time":1288978},{"cells":"highlighted","type":"candidates","value":"8","time":1289193},{"cells":"r9c5","type":"highlight","time":1290493},{"cells":"highlighted","type":"candidates","value":"9","time":1291001},{"cells":"r9c4","type":"highlight","time":1291408},{"cells":"highlighted","type":"candidates","value":"9","time":1291505},{"cells":"r9c3","type":"highlight","time":1291933},{"cells":"highlighted","type":"candidates","value":"9","time":1292009},{"cells":"r5c5","type":"highlight","time":1300431},{"cells":"highlighted","type":"candidates","value":"1","time":1301185},{"cells":"r1c5","type":"highlight","time":1305201},{"cells":"r1c6","type":"highlight","time":1305493},{"cells":"highlighted","type":"value","value":"8","time":1306144},{"cells":"r1c5","type":"highlight","time":1306484},{"cells":"highlighted","type":"value","value":"1","time":1307369},{"cells":"r2c4","type":"highlight","time":1308320},{"cells":"highlighted","type":"candidates","value":"1","time":1308401},{"cells":"r3c5","type":"highlight","time":1310398},{"cells":"highlighted","type":"value","value":"2","time":1310713},{"cells":"r2c4","type":"highlight","time":1311155},{"cells":"highlighted","type":"value","value":"9","time":1312833},{"cells":"r4c4","type":"highlight","time":1314313},{"cells":"highlighted","type":"candidates","value":"9","time":1315065},{"cells":"r9c5","type":"highlight","time":1317051},{"cells":"highlighted","type":"candidates","value":"1","time":1317665},{"cells":"highlighted","type":"pencilmarks","value":"1","time":1318400},{"cells":"r9c4","type":"highlight","time":1318664},{"cells":"highlighted","type":"value","value":"1","time":1318754},{"cells":"r4c4","type":"highlight","time":1323531},{"cells":"highlighted","type":"value","value":"8","time":1324769},{"cells":"r5c5","type":"highlight","time":1325023},{"cells":"highlighted","type":"value","value":"9","time":1325304},{"cells":"r6c6","type":"highlight","time":1325541},{"cells":"highlighted","type":"value","value":"1","time":1325937},{"cells":"r7c5","type":"highlight","time":1327423},{"cells":"highlighted","type":"value","value":"7","time":1328224},{"cells":"r9c5","type":"highlight","time":1328541},{"cells":"highlighted","type":"value","value":"8","time":1328673},{"cells":"r8c6","type":"highlight","time":1329127},{"cells":"highlighted","type":"value","value":"9","time":1329241},{"cells":"r8c2","type":"highlight","time":1331090},{"cells":"highlighted","type":"value","value":"7","time":1331144},{"cells":"highlighted","type":"value","value":"8","time":1331608},{"cells":"r9c3","type":"highlight","time":1332689},{"cells":"highlighted","type":"value","value":"7","time":1332761},{"cells":"r7c3","type":"highlight","time":1333858},{"cells":"highlighted","type":"value","value":"9","time":1333921},{"cells":"r5c3","type":"highlight","time":1334780},{"cells":"highlighted","type":"value","value":"8","time":1334889},{"cells":"r6c2","type":"highlight","time":1335253},{"cells":"highlighted","type":"value","value":"9","time":1335393},{"cells":"none","type":"highlight","time":1344238}]},{speed: 100});
	//app.playReplay({"puzzleId": "fRftpGmpdT", "actions": [{"cells":"r5c4","type":"highlight","time":5742},{"cells":"highlighted","type":"value","value":"3","time":6074},{"cells":"r6c5","type":"highlight","time":6386},{"cells":"highlighted","type":"value","value":"2","time":6914},{"cells":"r4c5","type":"highlight","time":7503},{"cells":"highlighted","type":"value","value":"7","time":8395},{"cells":"r8c3,r8c2","type":"highlight","time":9326},{"cells":"r8c2","type":"highlight","time":9641},{"cells":"highlighted","type":"value","value":"5","time":9970},{"cells":"r8c3","type":"highlight","time":10167},{"cells":"highlighted","type":"value","value":"7","time":10250},{"cells":"r7c1","type":"highlight","time":10991},{"cells":"highlighted","type":"value","value":"6","time":11995},{"cells":"r8c1","type":"highlight","time":12282},{"cells":"highlighted","type":"value","value":"4","time":12362},{"cells":"r9c4","type":"highlight","time":13511},{"cells":"highlighted","type":"value","value":"9","time":14219},{"cells":"r9c5","type":"highlight","time":14510},{"cells":"highlighted","type":"value","value":"4","time":15155},{"cells":"r5c2","type":"highlight","time":16204},{"cells":"r5c7","type":"highlight","time":17396},{"cells":"highlighted","type":"candidates","value":"1","time":17698},{"cells":"highlighted","type":"candidates","value":"2","time":17843},{"cells":"r5c9","type":"highlight","time":18259},{"cells":"highlighted","type":"candidates","value":"1","time":18546},{"cells":"highlighted","type":"candidates","value":"2","time":18595},{"cells":"r5c2,r5c3","type":"highlight","time":20254},{"cells":"highlighted","type":"value","value":"4","time":21250},{"cells":"r5c1","type":"highlight","time":21596},{"cells":"highlighted","type":"value","value":"7","time":21747},{"cells":"r3c2","type":"highlight","time":24941},{"cells":"highlighted","type":"value","value":"9","time":25682},{"cells":"r1c2","type":"highlight","time":26666},{"cells":"highlighted","type":"value","value":"6","time":26977},{"cells":"r2c5","type":"highlight","time":27491},{"cells":"r2c4","type":"highlight","time":28001},{"cells":"highlighted","type":"value","value":"4","time":28610},{"cells":"r2c5","type":"highlight","time":28931},{"cells":"highlighted","type":"value","value":"6","time":29018},{"cells":"r3c8","type":"highlight","time":30432},{"cells":"highlighted","type":"value","value":"5","time":31682},{"cells":"r6c8","type":"highlight","time":32066},{"cells":"highlighted","type":"value","value":"7","time":32202},{"cells":"r8c8","type":"highlight","time":33327},{"cells":"highlighted","type":"value","value":"9","time":33794},{"cells":"r9c8","type":"highlight","time":34466},{"cells":"highlighted","type":"value","value":"6","time":34738},{"cells":"r9c7","type":"highlight","time":35058},{"cells":"r9c7,r9c9","type":"highlight","time":35523},{"cells":"highlighted","type":"candidates","value":"2","time":36450},{"cells":"highlighted","type":"candidates","value":"5","time":37955},{"cells":"r4c4","type":"highlight","time":42814},{"cells":"r4c4,r7c4,r8c4","type":"highlight","time":43473},{"cells":"highlighted","type":"candidates","value":"2","time":44314},{"cells":"highlighted","type":"candidates","value":"6","time":47107},{"cells":"highlighted","type":"candidates","value":"8","time":48250},{"cells":"r8c5","type":"highlight","time":49571},{"cells":"r7c4","type":"highlight","time":49901},{"cells":"highlighted","type":"candidates","value":"2","time":50091},{"cells":"highlighted","type":"value","value":"8","time":51011},{"cells":"r8c4","type":"highlight","time":51461},{"cells":"highlighted","type":"candidates","value":"8","time":52099},{"cells":"r4c4","type":"highlight","time":52676},{"cells":"highlighted","type":"candidates","value":"8","time":52811},{"cells":"highlighted","type":"value","value":"6","time":53802},{"cells":"r8c4","type":"highlight","time":54251},{"cells":"highlighted","type":"value","value":"2","time":54347},{"cells":"r7c5,r8c5","type":"highlight","time":55534},{"cells":"r9c6","type":"highlight","time":56952},{"cells":"r8c5","type":"highlight","time":57393},{"cells":"r8c5,r7c5,r7c6,r8c6","type":"highlight","time":59374},{"cells":"highlighted","type":"candidates","value":"1","time":60665},{"cells":"highlighted","type":"candidates","value":"3","time":61051},{"cells":"highlighted","type":"candidates","value":"5","time":62162},{"cells":"highlighted","type":"candidates","value":"6","time":62491},{"cells":"r8c5","type":"highlight","time":63776},{"cells":"r7c5,r7c6","type":"highlight","time":64324},{"cells":"highlighted","type":"candidates","value":"6","time":65660},{"cells":"r7c6,r8c6","type":"highlight","time":68149},{"cells":"highlighted","type":"candidates","value":"5","time":68890},{"cells":"r8c5","type":"highlight","time":70271},{"cells":"highlighted","type":"candidates","value":"5","time":70761},{"cells":"r7c5","type":"highlight","time":71103},{"cells":"highlighted","type":"value","value":"5","time":71137},{"cells":"r8c5","type":"highlight","time":73961},{"cells":"highlighted","type":"candidates","value":"6","time":74746},{"cells":"r8c6","type":"highlight","time":76752},{"cells":"highlighted","type":"value","value":"6","time":77514},{"cells":"r7c7","type":"highlight","time":79930},{"cells":"r7c7,r7c8","type":"highlight","time":80418},{"cells":"r7c9,r7c8,r7c7","type":"highlight","time":81341},{"cells":"highlighted","type":"candidates","value":"1","time":82299},{"cells":"highlighted","type":"candidates","value":"3","time":82962},{"cells":"highlighted","type":"candidates","value":"4","time":83395},{"cells":"highlighted","type":"candidates","value":"4","time":84698},{"cells":"highlighted","type":"candidates","value":"7","time":86338},{"cells":"r8c7,r8c8,r8c9","type":"highlight","time":87926},{"cells":"highlighted","type":"candidates","value":"1","time":89674},{"cells":"highlighted","type":"candidates","value":"3","time":89834},{"cells":"highlighted","type":"candidates","value":"8","time":93226},{"cells":"r9c8","type":"highlight","time":94856},{"cells":"r4c6","type":"highlight","time":96708},{"cells":"highlighted","type":"value","value":"8","time":99443},{"cells":"r6c7","type":"highlight","time":100429},{"cells":"r3c5","type":"highlight","time":103376},{"cells":"r3c5,r1c5","type":"highlight","time":103728},{"cells":"highlighted","type":"pencilmarks","value":"8","time":104915},{"cells":"r3c6","type":"highlight","time":105326},{"cells":"r3c6,r1c6","type":"highlight","time":105746},{"cells":"highlighted","type":"candidates","value":"1","time":107211},{"cells":"highlighted","type":"candidates","value":"2","time":109253},{"cells":"highlighted","type":"candidates","value":"3","time":109387},{"cells":"r3c5","type":"highlight","time":112077},{"cells":"r3c5,r1c5","type":"highlight","time":112474},{"cells":"highlighted","type":"candidates","value":"1","time":115203},{"cells":"highlighted","type":"candidates","value":"3","time":116034},{"cells":"highlighted","type":"candidates","value":"8","time":118859},{"cells":"r2c6","type":"highlight","time":119959},{"cells":"r1c6","type":"highlight","time":120288},{"cells":"r1c5","type":"highlight","time":120604},{"cells":"highlighted","type":"candidates","value":"1","time":120770},{"cells":"r3c5","type":"highlight","time":121376},{"cells":"r1c6","type":"highlight","time":122554},{"cells":"highlighted","type":"candidates","value":"1","time":122795},{"cells":"r3c6,r3c5","type":"highlight","time":123942},{"cells":"highlighted","type":"pencilmarks","value":"1","time":124827},{"cells":"r5c6","type":"highlight","time":125404},{"cells":"r1c6","type":"highlight","time":130977},{"cells":"highlighted","type":"candidates","value":"2","time":131163},{"cells":"highlighted","type":"value","value":"3","time":131682},{"cells":"r1c5","type":"highlight","time":132184},{"cells":"highlighted","type":"value","value":"8","time":132827},{"cells":"r3c5","type":"highlight","time":133782},{"cells":"highlighted","type":"value","value":"1","time":133883},{"cells":"r3c6","type":"highlight","time":134441},{"cells":"highlighted","type":"value","value":"2","time":134930},{"cells":"r1c3","type":"highlight","time":136519},{"cells":"r1c3,r1c7","type":"highlight","time":137051},{"cells":"r1c3,r1c7,r1c9","type":"highlight","time":137418},{"cells":"highlighted","type":"candidates","value":"4","time":139483},{"cells":"highlighted","type":"candidates","value":"7","time":141307},{"cells":"highlighted","type":"candidates","value":"9","time":141507},{"cells":"r2c3","type":"highlight","time":144177},{"cells":"r1c3","type":"highlight","time":144581},{"cells":"highlighted","type":"value","value":"4","time":144971},{"cells":"r1c7,r1c8,r1c9","type":"highlight","time":145737},{"cells":"highlighted","type":"candidates","value":"4","time":145971},{"cells":"r3c9","type":"highlight","time":146658},{"cells":"r3c9,r3c1,r3c2","type":"highlight","time":147559},{"cells":"r3c9,r3c1,r3c2,r3c3","type":"highlight","time":148024},{"cells":"highlighted","type":"candidates","value":"3","time":149483},{"cells":"highlighted","type":"candidates","value":"4","time":149683},{"cells":"highlighted","type":"candidates","value":"8","time":151395},{"cells":"r3c1","type":"highlight","time":153191},{"cells":"highlighted","type":"candidates","value":"4","time":154019},{"cells":"r3c3","type":"highlight","time":155021},{"cells":"highlighted","type":"candidates","value":"3","time":155300},{"cells":"r3c9","type":"highlight","time":156904},{"cells":"r2c3","type":"highlight","time":159011},{"cells":"r3c3","type":"highlight","time":159266},{"cells":"highlighted","type":"value","value":"8","time":160058},{"cells":"r3c1","type":"highlight","time":160564},{"cells":"highlighted","type":"value","value":"3","time":161066},{"cells":"r3c9","type":"highlight","time":161448},{"cells":"highlighted","type":"value","value":"4","time":161570},{"cells":"r2c1,r2c2,r2c3","type":"highlight","time":163496},{"cells":"r3c3","type":"highlight","time":166098},{"cells":"r2c3","type":"highlight","time":166346},{"cells":"highlighted","type":"value","value":"1","time":166426},{"cells":"r2c1","type":"highlight","time":166893},{"cells":"r3c1","type":"highlight","time":169586},{"cells":"r2c1","type":"highlight","time":169796},{"cells":"highlighted","type":"value","value":"5","time":170506},{"cells":"r6c3","type":"highlight","time":171416},{"cells":"highlighted","type":"value","value":"5","time":175410},{"cells":"r6c1","type":"highlight","time":175991},{"cells":"r4c1","type":"highlight","time":179800},{"cells":"highlighted","type":"value","value":"9","time":179962},{"cells":"r6c1","type":"highlight","time":180228},{"cells":"highlighted","type":"value","value":"8","time":180347},{"cells":"r2c7","type":"highlight","time":182050},{"cells":"r2c7,r2c9","type":"highlight","time":182553},{"cells":"highlighted","type":"candidates","value":"3","time":185939},{"cells":"highlighted","type":"candidates","value":"8","time":187547},{"cells":"r4c7","type":"highlight","time":189048},{"cells":"r4c7,r4c9","type":"highlight","time":189408},{"cells":"highlighted","type":"candidates","value":"4","time":191539},{"cells":"highlighted","type":"candidates","value":"5","time":191627},{"cells":"r6c9","type":"highlight","time":193030},{"cells":"r6c9,r6c7","type":"highlight","time":193579},{"cells":"highlighted","type":"candidates","value":"6","time":195179},{"cells":"highlighted","type":"candidates","value":"9","time":195570},{"cells":"r6c7","type":"highlight","time":197156},{"cells":"r7c7","type":"highlight","time":197501},{"cells":"r6c7","type":"highlight","time":197711},{"cells":"highlighted","type":"value","value":"9","time":197899},{"cells":"r6c9","type":"highlight","time":198348},{"cells":"highlighted","type":"value","value":"6","time":198394},{"cells":"r7c6","type":"highlight","time":202375},{"cells":"highlighted","type":"value","value":"1","time":203106},{"cells":"r8c5","type":"highlight","time":203419},{"cells":"highlighted","type":"value","value":"3","time":203474},{"cells":"r7c7","type":"highlight","time":204168},{"cells":"highlighted","type":"candidates","value":"1","time":204475},{"cells":"r7c9","type":"highlight","time":204769},{"cells":"highlighted","type":"candidates","value":"1","time":204890},{"cells":"r8c7","type":"highlight","time":205443},{"cells":"highlighted","type":"candidates","value":"3","time":205651},{"cells":"r8c9","type":"highlight","time":206020},{"cells":"highlighted","type":"candidates","value":"3","time":206114},{"cells":"r1c7","type":"highlight","time":209500},{"cells":"highlighted","type":"value","value":"7","time":210154},{"cells":"r1c9","type":"highlight","time":210595},{"cells":"highlighted","type":"value","value":"9","time":210730},{"cells":"r7c7","type":"highlight","time":212171},{"cells":"highlighted","type":"value","value":"3","time":212779},{"cells":"r7c9","type":"highlight","time":213430},{"cells":"highlighted","type":"value","value":"7","time":213458},{"cells":"r2c7","type":"highlight","time":216543},{"cells":"highlighted","type":"value","value":"8","time":216955},{"cells":"r2c9","type":"highlight","time":217548},{"cells":"highlighted","type":"value","value":"3","time":217770},{"cells":"r8c7","type":"highlight","time":219468},{"cells":"highlighted","type":"value","value":"1","time":220202},{"cells":"r8c9","type":"highlight","time":220811},{"cells":"highlighted","type":"value","value":"8","time":220826},{"cells":"r5c7","type":"highlight","time":221725},{"cells":"highlighted","type":"value","value":"2","time":222074},{"cells":"r5c9","type":"highlight","time":222333},{"cells":"highlighted","type":"value","value":"1","time":222418},{"cells":"r9c7","type":"highlight","time":223803},{"cells":"highlighted","type":"value","value":"5","time":224331},{"cells":"r9c9","type":"highlight","time":224643},{"cells":"highlighted","type":"value","value":"2","time":224730},{"cells":"r4c9","type":"highlight","time":225941},{"cells":"highlighted","type":"value","value":"4","time":226099},{"cells":"r4c7","type":"highlight","time":226533},{"cells":"highlighted","type":"value","value":"5","time":226722},{"cells":"r4c9","type":"highlight","time":231588},{"cells":"highlighted","type":"value","value":"5","time":232322},{"cells":"r4c7","type":"highlight","time":232833},{"cells":"highlighted","type":"value","value":"4","time":232962}]});

	// Fetch filled values
	// [...document.querySelectorAll('div[class="cell"]')].map(cell => `r${cell.getAttribute('row')}c${cell.getAttribute('col')}=${(cell.querySelector('.cell-value') || {}).textContent}`).join(',');
	/*
	puzzle: btjTmJ64d4
	'r0c0=7,r0c1=1,r0c2=3,r0c3=8,r0c4=9,r0c5=6,r0c6=4,r0c7=2,r0c8=5,r1c0=2,r1c1=8,r1c2=5,r1c3=7,r1c4=4,r1c5=3,r1c6=9,r1c7=6,r1c8=1,r2c0=6,r2c1=4,r2c2=9,r2c3=1,r2c4=5,r2c5=2,r2c6=3,r2c7=8,r2c8=7,r3c0=4,r3c1=6,r3c2=7,r3c3=9,r3c4=3,r3c5=8,r3c6=1,r3c7=5,r3c8=2,r4c0=5,r4c1=2,r4c2=8,r4c3=4,r4c4=6,r4c5=1,r4c6=7,r4c7=3,r4c8=9,r5c0=9,r5c1=3,r5c2=1,r5c3=5,r5c4=2,r5c5=7,r5c6=6,r5c7=4,r5c8=8,r6c0=8,r6c1=7,r6c2=2,r6c3=3,r6c4=1,r6c5=4,r6c6=5,r6c7=9,r6c8=6,r7c0=3,r7c1=5,r7c2=6,r7c3=2,r7c4=7,r7c5=9,r7c6=8,r7c7=1,r7c8=4,r8c0=1,r8c1=9,r8c2=4,r8c3=6,r8c4=8,r8c5=5,r8c6=2,r8c7=7,r8c8=3'
		.split(',')
		.forEach(cellVal => {
			var [_, r, c, val] = App.reRCVal.exec(cellVal);
			app.grid.getCell(r, c).setValue(val);
		});
		
		
	Diagonals: rNLJPPB9d3
	*/
});




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
