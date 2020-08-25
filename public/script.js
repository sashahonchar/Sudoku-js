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
	Cell.Props = ['value', 'candidates', 'pencilmarks', 'colour'];
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
	P.hasValue = function() { return this.value !== undefined; };
	P.clearValue = function() {
		if(this.value === undefined) return false;
		this.clearChildElem('cell-value');
		this.value = undefined;
		this.showCandidates();
		this.showPencilMarks();
		return true;
	};
	P.hasCandidates = function() { return this.candidates.length > 0; };
	P.clearCandidates = function() {
		if(this.candidates.length === 0) return false;
		this.hideCandidates();
		this.candidates.length = 0;
		return true;
	};
	P.hasPencilMarks = function() { return this.pencilMarks.length > 0; };
	P.clearPencilMarks = function() {
		if(this.pencilMarks.length === 0) return false;
		this.hidePencilMarks();
		this.pencilMarks.length = 0;
		return true;
	};
	P.hasColour = function() { return this.colour !== undefined; };
	P.clearColour = function() {
		if(this.colour === undefined) return false;
		this.colour = undefined;
		this.hideColour();
		return true;
	};
	P.hasProp = function(prop) {
		switch(prop) {
			case 'value': return this.hasValue();
			case 'candidates': return this.hasCandidates();
			case 'pencilmarks': return this.hasPencilMarks();
			case 'colour': return this.hasColour();
		}
	};
	P.clearProp = function(prop) {
		switch(prop) {
			case 'value': return this.clearValue();
			case 'candidates': return this.clearCandidates();
			case 'pencilmarks': return this.clearPencilMarks();
			case 'colour': return this.clearColour();
		}
	};
	P.clear = function({levels = 0, mode = 'normal'} = {}) {
		//console.info('Cell.clear({levels = %s, mode = %s});', levels, mode);
		switch(mode) {
			case 'normal': this.clearValue() || this.clearCandidates() || this.clearPencilMarks() || this.clearColour(); break;
			case 'corner': this.clearValue() || this.clearPencilMarks() || this.clearCandidates() || this.clearColour(); break;
			case 'centre': this.clearValue() || this.clearCandidates() || this.clearPencilMarks() || this.clearColour(); break;
			case 'colour': this.clearColour() || this.clearValue() || this.clearCandidates() || this.clearPencilMarks(); break;
			case 'all': this.clearValue() && this.clearPencilMarks() && this.clearCandidates() && this.clearColour(); break;
			default: console.error('Cell.clear > Invalid mode:', mode);
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
		P.setColour = function(colour) {
			//console.info('Cell.setColour(%s);', colour);
			if(colour == 0) return this.clearColour();
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
			if(json.cl !== undefined) this.setColour(json.cl);
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
		if(!elem || typeof elem.getAttribute !== 'function') return undefined;
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
		/*
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
		*/
		//console.log('"%s" > fontSize: %s -> %s', text, fontSize, (Number(fontSize) + 4));
		/*
		switch(fontSize) {
			case 12: fontSize = 16; break;
			case 16: fontSize = 20; break;
			case 28: fontSize = 34; break;
			case 30: fontSize = 34; break;
		}
		*/
		this.renderPart({
			target, type: 'text',
			attr: {
				x: (center[1] + 0.015 * width) * 64,
				y: (center[0] + 0.05 * height) * 64,
				'text-anchor': 'middle',
				'dominant-baseline': 'middle',
				//style: 'font-size: ' + (fontSize === 28 ? 34 : 24) + 'px;',
				style: `font-size: ${(Number(fontSize) + 4)}px;`,
				stroke: '#fff',
				'stroke-width': '2px',
				'stroke-linecap': 'butt',
				'stroke-linejoin': 'miter',
				'paint-order': 'stroke fill',
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
				//throw err;
				res = '';
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
				//throw err;
				res = '';
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
				console.error('Error in Replay.actA2C for act:', act);
				//throw err;
				res = '';
			}
			return res;
		};
	};
	const actC2A = Replay.actC2A = w => {
		var convertRc = listNumToRcv(w);
		return (act, idx) => {
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
				console.error('Error in Replay.actC2A for act:', act, idx);
				//throw err;
				res = '';
			}
			return res;
		};
	};
	const replayA2B = Replay.replayA2B = (replay, w = 9) => (replay.match(reActA) || []).map(actA2B(w)).join('');
	const replayB2A = Replay.replayB2A = (replay, w = 9) => (replay.match(reActB) || []).map(actB2A(w)).join(',');
	const replayA2C = Replay.replayA2C = (replay, w = 9) => (replay.match(reActA) || []).map(actA2C(w)).join('');
	const replayC2A = Replay.replayC2A = (replay, w = 9) => (replay.match(reActC) || []).map(actC2A(w)).join(',');
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
	Puzzle.reIsSelection = /^(sl|ds|hl|select|deselect|highlight)$/i;
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
	Puzzle.isSelection = actType => Puzzle.reIsSelection.test(actType);
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
			console.info('Puzzle.loadRemoteCTCPuzzle("%s");', puzzleId);
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
		P.findHighestCellProp = function(cells, mode) {
			var props = [];
			switch(mode) {
				case 'normal': props = ['value', 'candidates', 'pencilmarks', 'colour']; break;
				case 'corner': props = ['pencilmarks', 'candidates', 'colour', 'value']; break;
				case 'centre': props = ['candidates', 'pencilmarks', 'colour', 'value']; break;
				case 'colour': props = ['colour', 'value', 'candidates', 'pencilmarks']; break;
			}
			//console.log('props:', props);
			var firstProp = props.length;
			cells.forEach(cell => {
				var idx = props.findIndex(prop => cell.hasProp(prop));
				if(idx > -1) firstProp = Math.min(firstProp, idx);
				//console.log('cells[%s]:', this.cellsToString(cell), props.map(prop => prop+': '+cell.hasProp(prop)).join(', '), idx);
			});
			var clearProp = props[firstProp];
			console.log('clearProp:', clearProp);
			cells.forEach(cell => cell.clearProp(clearProp));
		};
		P.clearCells = function({mode = 'normal', cells = this.selectedCells}) {
			console.info('Puzzle.clearCells(%s, %s);', mode, this.cellsToString(cells));
			
			/*
			case 'normal': this.clearValue() || this.clearCandidates() || this.clearPencilMarks() || this.clearColour(); break;
			case 'corner': this.clearValue() || this.clearPencilMarks() || this.clearCandidates() || this.clearColour(); break;
			case 'centre': this.clearValue() || this.clearCandidates() || this.clearPencilMarks() || this.clearColour(); break;
			case 'colour': this.clearColour() || this.clearValue() || this.clearCandidates() || this.clearPencilMarks(); break;
			case 'all': this.clearValue() && this.clearPencilMarks() && this.clearCandidates() && this.clearColour(); break;
			*/
			/*
			var props = [];
			switch(mode) {
				case 'normal': props = ['value', 'candidates', 'pencilmarks', 'colour']; break;
				case 'corner': props = ['value', 'pencilmarks', 'candidates', 'colour']; break;
				case 'centre': props = ['value', 'candidates', 'pencilmarks', 'colour']; break;
				case 'colour': props = ['colour', 'value', 'candidates', 'pencilmarks']; break;
			}
			console.log('props:', props);
			cells.forEach(cell => {
				console.log('cells[%s]:', this.cellsToString(cell), props,
										props.map(prop => cell.hasProp(prop)),
										props.findIndex(prop => cell.hasProp(prop))
									 );
			});
			*/
			console.log('findHighestCellProp:', this.findHighestCellProp(cells, mode));
			
			//cells.forEach(cell => cell.clear({mode}));
			
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
				case 'clear': this.clearCells({mode: arg, cells: selectedCells}); return true;
				case 'value': selectedCells.forEach(cell => cell.setValue(arg)); return true;
				case 'candidates': selectedCells.forEach(cell => cell.toggleCandidates(arg)); return true;
				case 'pencilmarks': selectedCells.forEach(cell => cell.togglePencilMark(arg)); return true;
				case 'colour': selectedCells.forEach(cell => cell.setColour(arg)); return true;
				default: console.error('Puzzle.act: unkown action type:', type, action); return false;
			}
			throw new Error('Invalid type!');
		};
		P.act = function(action) {
			action = this.parseAction(action);
			var act = this.actionToString(action);
			console.info('Puzzle.act("%s");', act, action);
			if(this.errorsVisible && !Puzzle.isSelection(action.type)) {
				this.cells.forEach(cell => cell.error(false));
			}
			if(action.type === 'undo') {
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
			else if(action.type === 'redo') {
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
					this.errorsVisible = true;
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
		this.selecting = undefined;
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
	App.VERSION = '0.15.0';
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
	App.DefaultReplayType = 'clzw';
	// Puzzle
		P.createPuzzle = function(opts) { return this.puzzle.createPuzzle(opts); };
		P.clearPuzzle = function() { return this.puzzle.clearPuzzle(); };
		P.restartPuzzle = function() { return this.puzzle.restartPuzzle(); };
		P.getCells = function(query) { return this.puzzle.getCells(query); };
		P.loadPuzzle = function(puzzle) {
			this.puzzle.loadPuzzle(puzzle);
			this.resize();
		};
		P.loadCTCPuzzle = function(ctcPuzzle) {
			return this.puzzle.loadCTCPuzzle(ctcPuzzle)
				.then(() => this.resize());
		};
		P.loadRemoteCTCPuzzle = function(puzzleId) {
			return this.puzzle.loadRemoteCTCPuzzle(puzzleId)
				.then(() => this.resize());
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
			console.warn('Puzzle.convertPuzzle(puzzle);', puzzle);
			var svgRenderer = this.svgRenderer;
			var underlaySvg = document.querySelector('svg#underlay'),
					overlaySvg = document.querySelector('svg#overlay');
			try {
			var rows = puzzle.cells.length, cols = Math.max.apply(Math, puzzle.cells.map(row => row.length));
			this.createPuzzle({rows, cols});
			[...underlaySvg.children].forEach(child => (child.nodeName !== 'defs') ? child.remove() : null);
			[...overlaySvg.children].forEach(child => (child.nodeName !== 'defs') ? child.remove() : null);
			puzzle.lines.forEach(svgRenderer.renderLine.bind(svgRenderer));
			puzzle.arrows.forEach(svgRenderer.renderArrow.bind(svgRenderer));
			[].concat(puzzle.underlays, puzzle.overlays).forEach(part => {
				var target = puzzle.underlays.indexOf(part) !== -1 ? 'underlay' : 'overlay';
				//if(typeof part.text === 'string' && part.text.length > 0) {
					//svgRenderer.renderText(Object.assign({}, part, {target}));
				//}
				//else { // rect
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
				//}
				if(typeof part.text === 'string' && part.text.length > 0) {
					svgRenderer.renderText(Object.assign({}, part, {target}));
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
					var headerElem = document.querySelector('.puzzle-header');
					var titleElem = document.querySelector('.puzzle-title');
					var authorElem = document.querySelector('.puzzle-author');
					var rulesElem = document.querySelector('.puzzle-rules');
					var reTitle = /^title:\s*(.*)/;
					var reAuthor = /^author:\s*(.*)/;
					var reRules = /^rules:\s*(.*)/;
					if(cage.value.match(reTitle)) {
						console.info('Title found in cage: "%s"', cage.value.replace(reTitle, '$1'));
						titleElem.textContent = cage.value.replace(reTitle, '$1');
						headerElem.style.display = "block";
					}
					else if(cage.value.match(reAuthor)) {
						console.info('Author found in cage: "%s"', cage.value.replace(reAuthor, '$1'));
						authorElem.textContent = cage.value.replace(reAuthor, '$1');
						headerElem.style.display = "block";
					}
					else if(cage.value.match(reRules)) {
						console.info('Rules found in cage:\n', cage.value.replace(reRules, '$1'));
						rulesElem.innerHTML = cage.value.replace(reRules, '$1').replace('\\n', '<br />');
						rulesElem.style.display = "block";
					}
					else {
						console.warn('Cage without cells:', cage);
					}
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
				if(cage.value !== undefined && !/^\s*$/.test(cage.value)) {
					outCage.cageValue = `r${1 + labelCell[0]}c${1 + labelCell[1]}: ${cage.value}`;
					if(!isNaN(cage.value)) outCage.sum = parseInt(cage.value);
				}
				cages.push(outCage);
			});
			}
			catch(err) {
				console.error('Error in Puzzle.convertPuzzle:', err);
				console.log('  puzzle:', puzzle);
				throw err;
			}
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
		P.smartSelectCell = function(cell, skipDeselect = false) {
			console.warn('App.smartSelectCell(cell, skipDeselect = %s);', cell, this.mode, skipDeselect === true);
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
				if(!skipDeselect) this.deselect();
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
	// Replay
		P.getReplay = function(opts = {}) {
			var type = opts.type || App.DefaultReplayType;
			var res = {puzzleId: this.puzzle.puzzleId, type, version: App.VERSION};
			switch(type) {
				case 'clzw': res.data = LZipper.compact64(Replay.replayA2C(this.puzzle.replayStack.join(','))); break;
				default: res.data = Replay.replayA2C(this.puzzle.replayStack.join(','));
			}
			return JSON.stringify(res);
		};
		P.loadReplay = function(replay, opts) {
			if(typeof replay === 'string') replay = JSON.parse(replay);
			var type = replay.type || 'c';
			var actions = [];
			switch(type) {
				case 'clzw': actions = Replay.replayC2A(LZipper.expand64(replay.data)).split(','); break;
				default: actions = Replay.replayC2A(replay.data).split(',');
			}
			return Promise.resolve()
				.then(() => replay.puzzleId !== this.puzzle.puzzleId ? this.loadRemoteCTCPuzzle(replay.puzzleId) : null)
				.then(() => this.puzzle.replayPlay({actions}, opts));
		};
	// Rendering
		P.resize = function() {
			//console.info('App.resize();');
			var gameElem = document.querySelector('.game'),
				boardElem = document.querySelector('.board'),
				gridElem = document.querySelector('.grid'),
				svgElem = document.querySelector('svg#underlay');
			var gameSize = Math.max(svgElem.clientWidth, svgElem.clientHeight) - 64;
			var gameSpace = Math.min(gameElem.clientHeight, Math.max(boardElem.clientWidth, boardElem.clientHeight));
			//console.log('gameSize max(%s, %s) = %s', svgElem.clientWidth, svgElem.clientHeight, gameSize);
			//console.log('gameSpace min(%s, max(%s, %s)) = %s', gameElem.clientHeight, boardElem.clientWidth, boardElem.clientHeight, gameSpace);
			var scale = gameSpace / gameSize;
			gridElem.style.transform = `scale(${scale})`;
		};
	// Event Handlers
		P.attachHandlers = function() {
			//window.addEventListener('focus', event => console.warn('window.on(focus)'), {useCapture: true});
			
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
				//window.addEventListener('blur', this.handleCancel);
				document.addEventListener('touchcancel', this.handleCancel);
			// Buttons
				document.querySelectorAll('button')
					.forEach(btn => {
						btn.addEventListener('keydown', this.handleButton);
						btn.addEventListener('click', this.handleButton);
					});
			window.addEventListener('resize', this.handleResize, {passive: false});
		};
		P.getEventTarget = function(event) {
			//console.info('App.getEventTarget(event);');
			var point = (event.touches && event.touches[0]) || event;
			return document.elementFromPoint(point.clientX, point.clientY);
		};
		P.handleResize = function() {
			//console.info('App.handleResize();');
			this.resize();
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
			console.warn('App.handleSpecialInput(event);', event);
			if(event.target.classList.contains('cell')) {
				var cell = this.grid.elemToCell(event.target);
				if(cell) this.smartSelectCell(cell, event.ctrlKey);
			}
		};
		
		P.handleCancel = function(event) {
			console.info('App.handleCancel:', event.type, event, event.target);
			if(this.isDragging === false) this.deselect();
		};
		P.handleDragStart = function(event) {
			if(event.target.nodeName === 'BUTTON') return;
			console.info('App.handleDragStart(event);');
			this.isDragging = true;
			this.handleCancelRestartPuzzle();
			// If clicking button, don't drag
			if(event.target.nodeName === 'BUTTON') return;
			// If holding CTRL, don't deselect
			if(!event.ctrlKey) this.deselect();
			this.selecting = true;
			var cell = this.grid.elemToCell(event.target);
			if(cell) {
				if(event.ctrlKey && cell.hasState('highlight')) this.selecting = false;
				//cell.highlight(this.selecting);
				if(this.selecting) {
					this.select(cell);
				}
				else {
					this.deselect(cell);
				}
			}
		};
		P.handleDragEnd = function(event) {
			//console.info('App.handleDragEnd(event);', event);
			this.isDragging = false;
			if(this.selecting !== undefined) {
				//var nextSelectedCells = this.grid.getCellList().filter(cell => cell.hasState('highlight'));
				//this.act({type: 'select', arg: nextSelectedCells});
				this.selecting = undefined;
			}
			//event.preventDefault();
		};
		P.handleDragMove = function(event) {
			if(this.isDragging !== true) return;
			//console.info('App.handleDragMove(event);', this.selecting);
			var eventTarget = this.getEventTarget(event);
			if(this.selecting !== undefined) {
				var cell = this.grid.elemToCell(eventTarget);
				if(cell) {
					//cell.highlight(this.selecting);
					this.select(cell);
				}
			}
		};
		P.doPressDigit = function(digit) {
			//console.log('App.doPressDigit(%s); mode: %s', digit, this.mode);
			/*
			if(this.mode === 'colour' && digit === '1') {
				//console.log('Pressed colour 1!');
				this.act({type: 'clear', arg: this.mode});
			}
			else {
				this.act({type: App.ModeToAction[this.mode], arg: digit});
			}
			*/
			this.act({type: App.ModeToAction[this.mode], arg: digit});
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
			else if(event.code === 'KeyZ') {
				this.changeMode(Puzzle.Modes[0]);
			}
			else if(event.code === 'KeyX') {
				this.changeMode(Puzzle.Modes[1]);
			}
			else if(event.code === 'KeyC') {
				this.changeMode(Puzzle.Modes[2]);
			}
			else if(event.code === 'KeyV') {
				this.changeMode(Puzzle.Modes[3]);
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
		},
		'7FTq4BpLhf': {
			ctcId: '7FTq4BpLhf',
		},
		'J6Ln72n7JP': {
			ctcId: 'J6Ln72n7JP',
		},
		'npM6B443HL': {
			ctcId: 'npM6B443HL',
		},
		'RRf6bgb9GG': {
			ctcId: 'RRf6bgb9GG',
			videoId: 'qs0soH_UFNE',
			notes: 'First use of legacy web app'
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
	//puzzleId = 'bjg7pJqn9L';
	
	var urlQueryPuzzleId = new URLSearchParams(document.location.search).get('puzzleid');
	var urlPathPuzzleId = (document.location.pathname.match(/^\/sudoku\/([^/]+)$/) || [])[1];
	if(typeof urlQueryPuzzleId === 'string') {
		puzzleId = urlQueryPuzzleId;
		console.log('Reading puzzleId from url query string: "?puzzleid=%s"', puzzleId);
	}
	else if(typeof urlPathPuzzleId === 'string') {
		puzzleId = urlPathPuzzleId;
		console.log('Reading puzzleId from url path: "/sudoku/%s"', puzzleId);
	}
	else if(typeof puzzleId === 'string' && puzzleId !== '') {
		console.log('Reading puzzleId from pre-set variable: "puzzleid = %s"', puzzleId);
	}

	if(typeof puzzleId === 'string' && puzzleId !== '') {
		console.log('Loading puzzle: "%s"', puzzleId);
		app.loadRemoteCTCPuzzle(puzzleId);
	}
	
	//https://cdpn.io/killroy/debug/oNbEjjJ/xnMabZPbWdvr?puzzleid=7FTq4BpLhf
	//app.loadReplay('{"puzzleId":"QbGnr6P2h3","type":"clzw","data":"JIBhH0EYBZUrQCYEgMzhKaHQFYcgBsBA7AQBxQBC8kiAUmCJCImiNCLkSCSJYWCR4mFuESgAZigCmBACYoAxigBGBAIYoAnOFwBhWg2EsQkkDJDyQSkKpAaQu2HRyR0EmAkj5RxUWSilKK6ologACLwbPR07jA+kISQJJDkkNqQWtrAiOiYiMgSiLS5EKLSonKiipBCKp7quACi0ZD0eYUlbJCSkDKQ8pBKkOrCudggHdiFQuqiDUK1QtVClWU4JZvIBeiQzTNTo8OD/b1s3YV7qBOb+DeI/rlkdYjBuaG54bnzuSoghnA2lwUSghGmiFwj0QJDeiG0iA0iFUiBUqAkqF8wFQ2DqqD22J22JE2PKuWkrzkr0UiAO4FQhCo2HI+mwhEBIJmqFBiAAYhAGfRMTj8ejUO5WJJEDJELUctBfPQFeIcgycKgXtjKHjPqhvqhfqh/tjlqg5NBmmRuPp7oQImQ8lRiIKGRrUORUNo9Qajah5GaoCRsetOOJgNBStBkHVoPlw5Nw/gY09oC9WeASCQbWD9HsAcQ6ELJJwI1HY9AK7hoIRUxnw2R0eHiBJlTHceG41GcBGEKGMdJoDzB8gQehCM18BGqJR4UqSNWFRXy4hS2hpHkgAAA="}', {speed: -1});
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

var LZipper = (function () {
	var fcc = String.fromCharCode;
	function data16to8Bit(str) {
		var i, res, len, c;
		res = '';
		len = str.length;
		for(i = 0; i < len; i++) {
			c = str.charCodeAt(i);
			res += String.fromCharCode((c >> 8) & 0xff);
			res += String.fromCharCode(c & 0xff);
		}
		return res;
	}
	function data8to16Bit(str) {
		var i, res, len, c;
		res = '';
		len = str.length;
		for(i = 0; i < len; i++){
			c = (str.charCodeAt(i) & 0xff) << 8;
			i++;
			if(i < len) c += str.charCodeAt(i) & 0xff;
			res += fcc(c);
		}
		return res;
	}
	function compress(data) {
		function dec(numBits, v, noShift) {
			var i, m = noShift ? 0xffffffffff : 1;
			for (i = 0; i < numBits; i++) {
				val = (val << 1) | (v & m);
				if(pos === 15) {
					pos = 0;
					str += fcc(val);
					val = 0;
				} else pos++;
				if(noShift) v = 0;
				else v >>= 1;
			}
		}
		if(data === null || data === undefined || data === '') return '';
		var i, ii, f,c,w,wc,enlargeIn,dictSize,numBits,str,val,pos,len,dic;
		len = data.length;
		dic = {};
		c = w = wc = '';
		w = '';
		enlargeIn = numBits = 2;
		dictSize = 3;
		str = '';
		val = pos = 0;
		for (ii = 0; ii < len; ii += 1) {
			c = data.charAt(ii);
			if(dic[c] === undefined) dic[c] = {size: dictSize++, create: true};
			wc = w + c;
			if(dic[wc] !== undefined) {
				w = wc;
			}
			else {
				if(dic[w].create) {
					if(w.charCodeAt(0) < 256) {
						dec(numBits, 0);
						dec(8, w.charCodeAt(0));
					}
					else {
						dec(numBits, 1, true)
						dec(16, w.charCodeAt(0));
					}
					enlargeIn--;
					if(enlargeIn === 0) {
						enlargeIn = Math.pow(2, numBits);
						numBits++;
					}
					dic[w].create = false;
				}
				else dec(numBits, dic[w].size);
				enlargeIn--;
				if(enlargeIn === 0) {
					enlargeIn = Math.pow(2, numBits);
					numBits++;
				}
				if(dic[wc] !== undefined) dic[wc].size = dictSize++;
				else dic[wc] = {size: dictSize++, create: false};
				w = String(c);
			}
		}
		if(w !== '') {
			if(dic[w].create) {
				if(w.charCodeAt(0) < 256) {
					dec(numBits, 0);
					dec(8, w.charCodeAt(0));
				}
				else {
					dec(numBits, 1, true)
					dec(16, w.charCodeAt(0));
				}
				enlargeIn--;
				if(enlargeIn === 0) {
					enlargeIn = Math.pow(2, numBits);
					numBits++;
				}
				dic[w].create = false;
			}
			else dec(numBits, dic[w].size);
			enlargeIn--;
			if(enlargeIn === 0) {
				enlargeIn = Math.pow(2, numBits);
				numBits++;
			}
		}
		dec(numBits, 2);
		while (true) {
			val <<= 1;
			if(pos == 15) {
				str += fcc(val);
				break;
			}
			else pos++;
		}
		return str;
	}
	function decompress(cp) {
		var dic,len,s,w,bits,c,enlargeIn,dicSize,numBits,entry,result,str,val,pos,index;
		function dec(maxP) {
			var p = 1,b = 0;
			while(p != maxP) {
				b |= ((val & pos) > 0 ? 1 : 0) * p;
				p <<= 1;
				pos >>= 1;
				if(pos === 0) {
					pos = 32768;
					val = str.charCodeAt(index++);
				}
			}
			return b;
		}
		if(cp === null || cp === '' || cp === undefined) return '';
		dic = [0, 1, 2];
		len = cp.length
		s = [256, 65536];
		enlargeIn = dicSize = 4;
		numBits = 3;
		entry = result = '';
		str = cp;
		val = cp.charCodeAt(0);
		pos = 32768;
		index = 1;
		bits = dec(4);
		if(bits === 2) return ''; 
		if(bits < 2) {
			bits = dec(s[bits]);
			c = fcc(bits);
		}
		dic[3] = w = result = c;
		while (true) {
			if(index > len) return '';
			c = bits = dec(Math.pow(2, numBits));
			if(bits === 2) return result;
			if(bits < 2) {
				bits = dec(s[bits]);
				dic[dicSize++] = fcc(bits);
				c = dicSize - 1;
				enlargeIn--;
			}
			if(enlargeIn === 0) {
				enlargeIn = Math.pow(2, numBits);
				numBits++;
			}
			if(dic[c]) {
				entry = dic[c];
			}
			else {
				if(c !== dicSize) return '';
				entry = w + w.charAt(0);
			}
			result += entry;
			dic[dicSize++] = w + entry.charAt(0);
			enlargeIn--;
			w = entry;
			if(enlargeIn === 0) {
				enlargeIn = Math.pow(2, numBits);
				numBits++;
			}
		}
	}
	return {
		compact64: str => btoa(data16to8Bit(compress(str))),
		expand64: str => decompress(data8to16Bit(atob(str))),
	};
})();