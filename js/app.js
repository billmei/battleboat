(function() {
// Battleboat
// Bill Mei, 2014
// MIT License

// Thanks to Nick Berry for the inspiration behind the AI
// http://www.datagenetics.com/blog/december32011/

// TODO: Reset player roster when the game ends
// TODO: Disable zoom on mobile

// TODO: Google Analytics to track win/loss rates against real human players
// TODO: Use analytics to track average number of shots taken
// TODO: Add a toggle that visualizes the probability grid via heatmap (scale a color via max and 0)
// TODO: Log and display the user's win percentage. Store via localstorage
// TODO: Use `Array.filter()` instead of for-loop checking each element
// TODO: Change the `alert()`s to CSS transition for a win screen

var AVAILABLE_SHIPS = ['carrier', 'battleship', 'destroyer', 'submarine', 'patrolboat'];

/**
 * Game manager object
 *
 * @param size
 * @param numShips
 * @constructor
 */
function Game(size) {
	Game.size = size;
	this.shotsTaken = 0;
	this.createGrid();
	this.initialize();
}
Game.size = 10; // Default grid size is 10x10
// You are player 0 and the computer is player 1
Game.HUMAN_PLAYER = 0;
Game.COMPUTER_PLAYER = 1;

Game.gameOver = false;
// Placement variables
Game.readyToPlay = false;
Game.stillPlacing = false;
Game.placingOnGrid = false;
// Used for generating temporary ships for calculating
// the probability heatmap
Game.VIRTUAL_PLAYER = 2;

Game.prototype.incrementShots = function() {
	this.shotsTaken++;
};
Game.prototype.checkIfWon = function() {
	if (this.computerFleet.allShipsSunk()) {
		alert('Congratulations, you win!');
		Game.gameOver = true;
		this.resetFogOfWar();
		this.initialize();
	} else if (this.humanFleet.allShipsSunk()) {
		alert('Yarr! The computer sank all your ships. Try again.');
		Game.gameOver = true;
		this.resetFogOfWar();
		this.initialize();
	}
};

// Shots at the target player on the grid. Returns what the shot uncovered
Game.prototype.shoot = function(x, y, targetPlayer) {
	var targetGrid;
	var targetFleet;
	if (targetPlayer === Game.HUMAN_PLAYER) {
		targetGrid = this.humanGrid;
		targetFleet = this.humanFleet;
	} else if (targetPlayer === Game.COMPUTER_PLAYER) {
		targetGrid = this.computerGrid;
		targetFleet = this.computerFleet;
	} else {
		// Should never be called
		console.log("There was an error trying to find the correct player to target");
		}

	if (targetGrid.containsDamagedShip(x, y)) {
		return null;
	} else if (targetGrid.containsCannonball(x, y)) {
		return null;
	} else if (targetGrid.containsUndamagedShip(x, y)) {
		// update the board/grid
		targetGrid.updateCell(x, y, 'hit', targetPlayer);
		// IMPORTANT: This function needs to be called _after_ updating the cell to a 'hit',
		// because it overrides the CSS class to 'sunk' if we find that the ship was sunk
		targetFleet.findShipByCoords(x, y).incrementDamage(); // increase the damage
		this.incrementShots();
		this.checkIfWon();
		return Grid.TYPE_HIT;
	} else {
		targetGrid.updateCell(x, y, 'miss', targetPlayer);
		this.incrementShots();
		this.checkIfWon();
		return Grid.TYPE_MISS;
	}

};
/**
 * Creates click event listeners on each one of the 100 grid cells, then passes the result to Game.shoot(x, y)
 * @param event
 */
Game.prototype.shootListener = function(e) {
	// Extract coordinates from event listener
	var x = parseInt(e.target.getAttribute('data-x'), 10);
	var y = parseInt(e.target.getAttribute('data-y'), 10);
	var result = null;
	if (Game.readyToPlay) {
		// I couldn't figure out how to avoid referencing the global variable here
		// TODO: Put all the listeners in a new controller object?
		result = mainGame.shoot(x, y, Game.COMPUTER_PLAYER);
	}

	if (result !== null && !Game.gameOver) {
		// The AI shoots iff the player clicks on a cell that he/she hasn't
		// already clicked on yet
		mainGame.robot.shoot();
	} else {
		Game.gameOver = false;
	}
};
// Creates click event listeners on each of the ships in the roster
Game.prototype.rosterListener = function(e) {
	// TODO: Allow the user to change their mind for the ship they want
	// to click instead of forcing to place the ship they've clicked
	// on before moving on to the next one
	if (!Game.stillPlacing) {
		Game.stillPlacing = true;
		Game.placeShipType = e.target.getAttribute('id');
		document.getElementById(Game.placeShipType).setAttribute('class', 'placing');
		Game.placeShipDirection = parseInt(document.getElementById('rotate-button').getAttribute('data-direction'), 10);
		Game.placingOnGrid = true;
	}
};
Game.prototype.placementListener = function(e) {
	if (Game.placingOnGrid) {
		// Extract coordinates from event listener
		var x = parseInt(e.target.getAttribute('data-x'), 10);
		var y = parseInt(e.target.getAttribute('data-y'), 10);
		
		// Don't screw up the direction if the user tries to place again.
		var successful = mainGame.humanFleet.placeShip(x, y, Game.placeShipDirection, Game.placeShipType);
		if (successful) {
			// Done placing this ship
			mainGame.endPlacing(Game.placeShipType);
			Game.stillPlacing = false;
			Game.placingOnGrid = false;
			if (mainGame.areAllShipsPlaced()) {
				var el = document.getElementById('rotate-button');
				el.addEventListener('transitionend',
					el.setAttribute('class', 'hidden'),
					false);
				el.setAttribute('class', 'invisible');
				document.getElementById('start-game').removeAttribute('class');
			}
		}
	}
};
Game.prototype.placementMouseover = function(e) {
	if (Game.placingOnGrid) {
		var x = parseInt(e.target.getAttribute('data-x'), 10);
		var y = parseInt(e.target.getAttribute('data-y'), 10);
		var classes;
		var fleetRoster = mainGame.humanFleet.fleetRoster;

		for (var i = 0; i < fleetRoster.length; i++) {
			var shipType = fleetRoster[i].type;

			if (Game.placeShipType === shipType &&
				fleetRoster[i].isLegal(x, y, Game.placeShipDirection)) {
				// Virtual ship
				fleetRoster[i].create(x, y, Game.placeShipDirection, true);
				Game.placeShipCoords = fleetRoster[i].getAllShipCells();

				for (var j = 0; j < Game.placeShipCoords.length; j++) {
					var el = document.querySelector('.grid-cell-' + Game.placeShipCoords[j].x + '-' + Game.placeShipCoords[j].y);
					classes = el.getAttribute('class');
					// Check if the substring ' grid-ship' already exists to avoid adding it twice
					if (classes.indexOf(' grid-ship') < 0) {
						classes += ' grid-ship';
						el.setAttribute('class', classes);
					}
				}
			}
		}
	}
};
Game.prototype.placementMouseout = function(e) {
	if (Game.placingOnGrid) {
		for (var j = 0; j < Game.placeShipCoords.length; j++) {
			var el = document.querySelector('.grid-cell-' + Game.placeShipCoords[j].x + '-' + Game.placeShipCoords[j].y);
			classes = el.getAttribute('class');
			// Check if the substring ' grid-ship' already exists to avoid adding it twice
			if (classes.indexOf(' grid-ship') > -1) {
				console.log(Game.placeShipType);
				console.log("(x, y) == (" + Game.placeShipCoords[j].x + ", " + Game.placeShipCoords[j].y + ")");
				classes = classes.replace(' grid-ship', '');
				console.log('newclasses == ' + classes);
				console.log('el === ' + el);
				el.setAttribute('class', classes);
			}
		}
	}
};
Game.prototype.toggleRotation = function(e) {
	// Toggle rotation direction
	var direction = parseInt(e.target.getAttribute('data-direction'), 10);
	if (direction === Ship.DIRECTION_VERTICAL) {
		e.target.setAttribute('data-direction', '1');
		Game.placeShipDirection = Ship.DIRECTION_HORIZONTAL;
	} else if (direction === Ship.DIRECTION_HORIZONTAL) {
		e.target.setAttribute('data-direction', '0');
		Game.placeShipDirection = Ship.DIRECTION_VERTICAL;
	}
};
Game.prototype.startGame = function(e) {
	var el = document.getElementById('sidebar-left');
	el.addEventListener('transitionend',
		el.setAttribute('class', 'hidden'),
		false);
	el.setAttribute('class', 'invisible');
	Game.readyToPlay = true;
};
Game.prototype.endPlacing = function(shipType) {
	document.getElementById(shipType).setAttribute('class', 'placed');
	// Wipe out the variable when you're done with it
	Game.placeShipDirection = null;
	Game.placeShipType = '';
	Game.placeShipCoords = [];
};
// Checks whether or not all ships are done
Game.prototype.areAllShipsPlaced = function() {
	var playerRoster = document.querySelector('.fleet-roster').querySelectorAll('li');
	for (var i = 0; i < playerRoster.length; i++) {
		if (playerRoster[i].getAttribute('class') === null) {
			return false;
		}
	}
	// Reset temporary variables
	Game.placeShipDirection = 0;
	Game.placeShipType = '';
	Game.placeShipCoords = [];
	return true;
};
/**
 * Resets the fog of war
 */
Game.prototype.resetFogOfWar = function() {
	for (var i = 0; i < Game.size; i++) {
		for (var j = 0; j < Game.size; j++) {
			this.humanGrid.updateCell(i, j, 'empty', Game.HUMAN_PLAYER);
			this.computerGrid.updateCell(i, j, 'empty', Game.COMPUTER_PLAYER);
		}
	}
};
// Resets CSS styling of the sidebar
Game.prototype.resetRosterSidebar = function() {
	var els = document.querySelector('.fleet-roster').querySelectorAll('li');
	for (var i = 0; i < els.length; i++) {
		els[i].removeAttribute('class');
	}
	document.getElementById('sidebar-left').removeAttribute('class');
	document.getElementById('rotate-button').removeAttribute('class');
	document.getElementById('start-game').setAttribute('class', 'hidden');
};
/**
 * Generates the HTML divs for the grid
 */
Game.prototype.createGrid = function() {
	// Generates the HTML grids for both players
	var gridDiv = document.querySelectorAll('.grid');
	for (var grid = 0; grid < gridDiv.length; grid++) {
		gridDiv[grid].removeChild(gridDiv[grid].querySelector('.no-js')); // Removes the no-js warning
		for (var i = 0; i < Game.size; i++) {
			for (var j = 0; j < Game.size; j++) {
				var el = document.createElement('div');
				el.setAttribute('data-x', i);
				el.setAttribute('data-y', j);
				el.setAttribute('class', 'grid-cell grid-cell-' + i + '-' + j);
				gridDiv[grid].appendChild(el);
			}
		}
	}
	
};
/**
 * Initializes the game
 */
Game.prototype.initialize = function() {
	this.humanGrid = new Grid(Game.size);
	this.computerGrid = new Grid(Game.size);
	this.humanFleet = new Fleet(this.humanGrid, Game.HUMAN_PLAYER);
	this.computerFleet = new Fleet(this.computerGrid, Game.COMPUTER_PLAYER);

	this.robot = new AI(this);

	// Reset game variables
	this.shotsTaken = 0;
	Game.gameOver = false;
	Game.readyToPlay = false;
	Game.stillPlacing = false;
	Game.placingOnGrid = false;
	Game.placeShipDirection = 0;
	Game.placeShipType = '';
	Game.placeShipCoords = [];

	this.resetRosterSidebar();

	// Add a click listener for the Grid.shoot() method for all cells
	// Only add this listener to the computer's grid
	var computerCells = document.querySelector('.computer-player').childNodes;
	for (var j = 0; j < computerCells.length; j++) {
		computerCells[j].addEventListener('click', this.shootListener, false);
	}

	// Add a click listener to the roster	
	var playerRoster = document.querySelector('.fleet-roster').querySelectorAll('li');
	for (var i = 0; i < playerRoster.length; i++) {
		playerRoster[i].addEventListener('click', this.rosterListener, false);
	}

	// Add a click listener to the human player's grid while placing
	var humanCells = document.querySelector('.human-player').childNodes;
	for (var k = 0; k < humanCells.length; k++) {
		humanCells[k].addEventListener('click', this.placementListener, false);
		humanCells[k].addEventListener('mouseover', this.placementMouseover, false);
		humanCells[k].addEventListener('mouseout', this.placementMouseout, false);
	}

	document.getElementById('rotate-button').addEventListener('click', this.toggleRotation, false);
	document.getElementById('start-game').addEventListener('click', this.startGame, false);

	this.computerFleet.placeShipsRandomly();
};

/**
 * Grid Object
 * @param size
 * @constructor
 */
function Grid(size) {
	this.size = size;
	this.cells = [];
	this.initialize();
}
// Possible values for the parameter `type` (string)
Grid.CSS_TYPE_EMPTY = 'empty';
Grid.CSS_TYPE_SHIP = 'ship';
Grid.CSS_TYPE_MISS = 'miss';
Grid.CSS_TYPE_HIT = 'hit';
Grid.CSS_TYPE_SUNK = 'sunk';
// Grid code:
Grid.TYPE_EMPTY = 0; // 0 = water (empty)
Grid.TYPE_SHIP = 1; // 1 = undamaged ship
Grid.TYPE_MISS = 2; // 2 = water with a cannonball in it (missed shot)
Grid.TYPE_HIT = 3; // 3 = damaged ship (hit shot)
Grid.TYPE_SUNK = 4; // 4 = sunk ship

/**
 * Grid initialization routine
 */
Grid.prototype.initialize = function() {
	for (var x = 0; x < this.size; x++) {
		var row = [];
		this.cells[x] = row;
		for (var y = 0; y < this.size; y++) {
			row.push(Grid.TYPE_EMPTY);
		}
	}
};

/**
 * Updates a cell class based on the type passed in
 *
 * @param x
 * @param y
 * @param type
 * @param targetPlayer
 */
Grid.prototype.updateCell = function(x, y, type, targetPlayer) {
	var player;
	if (targetPlayer === Game.HUMAN_PLAYER) {
		player = 'human-player';
	} else if (targetPlayer === Game.COMPUTER_PLAYER) {
		player = 'computer-player';
	} else {
		// Should never be called
		console.log("There was an error trying to find the correct player's grid");
	
	}

	switch (type) {
		case Grid.CSS_TYPE_EMPTY:
			this.cells[x][y] = Grid.TYPE_EMPTY;
			break;
		case Grid.CSS_TYPE_SHIP:
			this.cells[x][y] = Grid.TYPE_SHIP;
			break;
		case Grid.CSS_TYPE_MISS:
			this.cells[x][y] = Grid.TYPE_MISS;
			break;
		case Grid.CSS_TYPE_HIT:
			this.cells[x][y] = Grid.TYPE_HIT;
			break;
		case Grid.CSS_TYPE_SUNK:
			this.cells[x][y] = Grid.TYPE_SUNK;
			break;
		default:
			this.cells[x][y] = Grid.TYPE_EMPTY;
			break;
	}
	var classes = ['grid-cell', 'grid-cell-' + x + '-' + y, 'grid-' + type];
	document.querySelector('.' + player + ' .grid-cell-' + x + '-' + y).setAttribute('class', classes.join(' '));
};
/**
 * Checks to see if a cell contains an undamaged ship
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
Grid.prototype.containsUndamagedShip = function(x, y) {
	return this.cells[x][y] === Grid.TYPE_SHIP;
};
/**
 * Checks to see if a cell contains a cannonball
 *
 * @param x
 * @param y
 * @returns {boolean}
 */
Grid.prototype.containsCannonball = function(x, y) {
	return this.cells[x][y] === Grid.TYPE_MISS;
};
/**
 * Checks to see if a cell contains a damaged ship
 * @param x
 * @param y
 * @returns {boolean}
 */
Grid.prototype.containsDamagedShip = function(x, y) {
	return this.cells[x][y] === Grid.TYPE_HIT || this.cells[x][y] === Grid.TYPE_SUNK;
};

/**
 * Fleet object
 *
 * @param playerGrid
 * @param player
 * @constructor
 */
function Fleet(playerGrid, player) {
	this.numShips = AVAILABLE_SHIPS.length;
	this.playerGrid = playerGrid;
	this.player = player;
	this.fleetRoster = [];
	this.populate();
}
/**
 * Populates a fleet
 *
 * TODO: Remove the hardcoded dependency on available ships
 */
Fleet.prototype.populate = function() {
	for (var i = 0; i < this.numShips; i++) {
		// loop over the ship types when numShips > AVAILABLE_SHIPS.length
		var j = i % AVAILABLE_SHIPS.length;
		this.fleetRoster.push(new Ship(AVAILABLE_SHIPS[j], this.playerGrid, this.player));
	}
};
// Places the ship and returns whether or not the placement was successful
Fleet.prototype.placeShip = function(x, y, direction, shipType) {
	var shipCoords;
	for (var i = 0; i < this.fleetRoster.length; i++) {
		var shipTypes = this.fleetRoster[i].type;

		if (shipType === shipTypes &&
			this.fleetRoster[i].isLegal(x, y, direction)) {
			this.fleetRoster[i].create(x, y, direction, false);
			shipCoords = this.fleetRoster[i].getAllShipCells();

			for (var j = 0; j < shipCoords.length; j++) {
				this.playerGrid.updateCell(shipCoords[j].x, shipCoords[j].y, 'ship', this.player);
			}
			return true;
		}
	}
	return false;
};
/**
 * Handles placing ships randomly on the board.
 *
 * TODO: Avoid placing ships too close to each other
 * TODO: This should probably use some dependency injection
 */
Fleet.prototype.placeShipsRandomly = function() {
	for (var i = 0; i < this.fleetRoster.length; i++) {
		var illegalPlacement = true;
		while (illegalPlacement) {
			var randomX = Math.floor(10*Math.random());
			var randomY = Math.floor(10*Math.random());
			var randomDirection = Math.floor(2*Math.random());
			if (this.fleetRoster[i].isLegal(randomX, randomY, randomDirection)) {
				this.fleetRoster[i].create(randomX, randomY, randomDirection, false);
				illegalPlacement = false;
			} else {
				continue;
			}
		}
	}
};
/**
 * Finds a ship by location
 * Returns the ship object located at (x, y)
 * If no ship exists at (x, y), this returns null.
 * @param x
 * @param y
 * @returns {*}
 */
Fleet.prototype.findShipByCoords = function(x, y) {
	for (var i = 0; i < this.fleetRoster.length; i++) {
		var currentShip = this.fleetRoster[i];
		if (currentShip.direction === Ship.DIRECTION_VERTICAL) {
			if (y === currentShip.yPosition &&
				x >= currentShip.xPosition &&
				x < currentShip.xPosition + currentShip.shipLength) {
				return currentShip;
			} else {
				continue;
			}
		} else {
			if (x === currentShip.xPosition &&
				y >= currentShip.yPosition &&
				y < currentShip.yPosition + currentShip.shipLength) {
				return currentShip;
			} else {
				continue;
			}
		}
	}
	return null;
};
/**
 * Finds a ship by type
 * Returns the ship object that is of type 'type'
 * If no ship exists, this returns null.
 * @param type
 * @returns {*}
 */
Fleet.prototype.findShipByType = function(shipType) {
	for (var i = 0; i < this.fleetRoster.length; i++) {
		if (this.fleetRoster[i].type === shipType) {
			return this.fleetRoster[i];
		}
	}
	return null;
};
/**
 * Checks to see if all ships have been sunk
 *
 * @returns {boolean}
 */
Fleet.prototype.allShipsSunk = function() {
	for (var i = 0; i < this.fleetRoster.length; i++) {
		// If one or more ships are not sunk, then the sentence "all ships are sunk" is false.
		if (this.fleetRoster[i].sunk === false) {
			return false;
		}
	}
	return true;
};

/**
 * Ship object
 *
 * @param type
 * @param playerGrid
 * @constructor
 */
function Ship(type, playerGrid, player) {
	this.damage = 0;
	this.type = type;
	this.playerGrid = playerGrid;
	this.player = player;

	switch (this.type) {
		case AVAILABLE_SHIPS[0]:
			this.shipLength = 5;
			break;
		case AVAILABLE_SHIPS[1]:
			this.shipLength = 4;
			break;
		case AVAILABLE_SHIPS[2]:
			this.shipLength = 3;
			break;
		case AVAILABLE_SHIPS[3]:
			this.shipLength = 3;
			break;
		case AVAILABLE_SHIPS[4]:
			this.shipLength = 2;
			break;
		default:
			this.shipLength = 3;
			break;
	}
	this.maxDamage = this.shipLength;
	this.sunk = false;
}
/**
 * Checks to see if the placement of a ship is legal
 *
 * @param x
 * @param y
 * @param direction
 * @returns {boolean}
 */
Ship.prototype.isLegal = function(x, y, direction) {
	// first, check if the ship is within the grid...
	if (this.withinBounds(x, y, direction)) {
		// ...then check to make sure it doesn't collide with another ship
		for (var i = 0; i < this.shipLength; i++) {
			if (direction === Ship.DIRECTION_VERTICAL) {
				if (this.playerGrid.cells[x + i][y] === Grid.TYPE_SHIP ||
					this.playerGrid.cells[x + i][y] === Grid.TYPE_MISS ||
					this.playerGrid.cells[x + i][y] === Grid.TYPE_SUNK) {
					return false;
				}
			} else {
				if (this.playerGrid.cells[x][y + i] === Grid.TYPE_SHIP ||
					this.playerGrid.cells[x][y + i] === Grid.TYPE_MISS ||
					this.playerGrid.cells[x][y + i] === Grid.TYPE_SUNK) {
					return false;
				}
			}
		}
		return true;
	} else {
		return false;
	}
};
/**
 * Checks to see if the ship is within bounds
 * @param x
 * @param y
 * @param direction
 * @returns {boolean}
 */
Ship.prototype.withinBounds = function(x, y, direction) {
	if (direction === Ship.DIRECTION_VERTICAL) {
		return x + this.shipLength <= Game.size;
	} else {
		return y + this.shipLength <= Game.size;
	}
};
/**
 * Increments the damage counter of a ship
 *
 * @returns {Ship}
 */
Ship.prototype.incrementDamage = function() {
	this.damage++;
	if (this.isSunk()) {
		this.sinkShip(false); // Sinks the ship
	}
	return this; // Returns back the ship object so that I can chain the method calls in Game.shoot()
};
/**
 * Checks to see if the ship is sunk
 *
 * @returns {boolean}
 */
Ship.prototype.isSunk = function() {
	return this.damage >= this.maxDamage;
};
/**
 * Sinks the ship
 *
 */
Ship.prototype.sinkShip = function(virtual) {
	this.damage = this.maxDamage; // Force the damage to exceed max damage
	this.sunk = true;

	// Make the CSS class sunk, but only if the ship is not virtual
	if (!virtual) {
		var allCells = this.getAllShipCells();
		for (var i = 0; i < this.shipLength; i++) {
			this.playerGrid.updateCell(allCells[i].x, allCells[i].y, 'sunk', this.player);
		}
	}
};
/**
 * Gets all the ship cells
 *
 * returns an array with all (x, y) coordinates of the ship:
 * e.g.
 * [
 *	{'x':2, 'y':2},
 *	{'x':3, 'y':2},
 *	{'x':4, 'y':2}
 * ]
 */
Ship.prototype.getAllShipCells = function() {
	var resultObject = [];
	for (var i = 0; i < this.shipLength; i++) {
		if (this.direction === Ship.DIRECTION_VERTICAL) {
			resultObject[i] = {'x': this.xPosition + i, 'y': this.yPosition};
		} else {
			resultObject[i] = {'x': this.xPosition, 'y': this.yPosition + i};
		}
	}
	return resultObject;
};
/**
 * Creates a ship
 *
 * @param x
 * @param y
 * @param direction
 * @param virtual
 */
Ship.prototype.create = function(x, y, direction, virtual) {
	// This function assumes that you've already checked that the placement is legal
	this.xPosition = x;
	this.yPosition = y;
	this.direction = direction;

	// If the ship is virtual, don't add it to the grid.
	if (!virtual) {
		for (var i = 0; i < this.shipLength; i++) {
			if (this.direction === Ship.DIRECTION_VERTICAL) {
				this.playerGrid.cells[x + i][y] = Grid.TYPE_SHIP;
			} else {
				this.playerGrid.cells[x][y + i] = Grid.TYPE_SHIP;
			}
		}
	}
	
};
// direction === 0 when the ship is facing north/south
// direction === 1 when the ship is facing east/west
Ship.DIRECTION_VERTICAL = 0;
Ship.DIRECTION_HORIZONTAL = 1;

// Optimal battleship-playing AI
function AI(gameObject) {
	this.gameObject = gameObject;
	this.virtualGrid = new Grid(Game.size);
	this.virtualFleet = new Fleet(this.virtualGrid, Game.VIRTUAL_PLAYER);

	this.probabilityGrid = [];
	this.initializeProbabilities();
	this.updateProbabilities();
}
AI.PROB_WEIGHT = 50; // arbitrarily big number
AI.prototype.initializeProbabilities = function() {
	for (var x = 0; x < Game.size; x++) {
		var row = [];
		this.probabilityGrid[x] = row;
		for (var y = 0; y < Game.size; y++) {
			row.push(0);
		}
	}
};
// Scouts the grid based on max probability
AI.prototype.shoot = function() {
	var maxProbability = 0;
	var maxProbCoords = {};
	for (var x = 0; x < Game.size; x++) {
		for (var y = 0; y < Game.size; y++) {
			if (this.probabilityGrid[x][y] > maxProbability) {
				maxProbability = this.probabilityGrid[x][y];
				maxProbCoords.x = x;
				maxProbCoords.y = y;
			}
		}
	}

	var result = this.gameObject.shoot(maxProbCoords.x, maxProbCoords.y, Game.HUMAN_PLAYER);
	
	// If the game ends, the next lines need to be skipped.
	if (Game.gameOver) {
		Game.gameOver = false;
		return;
	}

	this.virtualGrid.cells[maxProbCoords.x][maxProbCoords.y] = result;

	// If you hit a ship, check to make sure if you've sunk it.
	if (result === Grid.TYPE_HIT) {
		var humanShip = this.findHumanShip(maxProbCoords.x, maxProbCoords.y);
		if (humanShip.isSunk()) {
			// Remove any ships from the roster that have been sunk
			var shipTypes = [];
			for (var k = 0; k < this.virtualFleet.fleetRoster.length; k++) {
				shipTypes.push(this.virtualFleet.fleetRoster[k].type);
			}
			var index = shipTypes.indexOf(humanShip.type);
			this.virtualFleet.fleetRoster.splice(index, 1);

			// Update the virtual grid with the sunk ship's cells
			var shipCells = humanShip.getAllShipCells();
			for (var _i = 0; _i < shipCells.length; _i++) {
				this.virtualGrid.cells[shipCells[_i].x][shipCells[_i].y] = Grid.TYPE_SUNK;
			}
		}
	}
	// Update probability grid after each shot
	this.updateProbabilities();
};
AI.prototype.findHumanShip = function(x, y) {
	return this.gameObject.humanFleet.findShipByCoords(x, y);
};

AI.prototype.updateProbabilities = function() {
	var roster = this.virtualFleet.fleetRoster;
	var coords;
	this.resetProbabilities();

	// Probabilities are not normalized to fit in the interval [0, 1]
	// because we're only interested in the maximum value
	// Try fitting each ship in each cell in every orientation
	// TODO: Think about a more efficient way of doing this
	for (var i = 0; i < roster.length; i++) {
		for (var x = 0; x < Game.size; x++) {
			for (var y = 0; y < Game.size; y++) {
				if (roster[i].isLegal(x, y, Ship.DIRECTION_VERTICAL)) {
					roster[i].create(x, y, Ship.DIRECTION_VERTICAL, true);
					coords = roster[i].getAllShipCells();
					if (this.passesThroughHitCell(coords)) {
						for (var j = 0; j < coords.length; j++) {
							this.probabilityGrid[coords[j].x][coords[j].y] += AI.PROB_WEIGHT * this.numHitCellsCovered(coords);
						}
					} else {
						for (var _j = 0; _j < coords.length; _j++) {
							this.probabilityGrid[coords[_j].x][coords[_j].y]++;
						}
					}
				}
				if (roster[i].isLegal(x, y, Ship.DIRECTION_HORIZONTAL)) {
					roster[i].create(x, y, Ship.DIRECTION_HORIZONTAL, true);
					coords = roster[i].getAllShipCells();
					if (this.passesThroughHitCell(coords)) {
						for (var k = 0; k < coords.length; k++) {
							this.probabilityGrid[coords[k].x][coords[k].y] += AI.PROB_WEIGHT * this.numHitCellsCovered(coords);
						}
					} else {
						for (var _k = 0; _k < coords.length; _k++) {
							this.probabilityGrid[coords[_k].x][coords[_k].y]++;
						}
					}
				}

				// Set hit cells to probability zero so the AI doesn't
				// target cells that are already hit
				if (this.virtualGrid.cells[x][y] === Grid.TYPE_HIT) {
					this.probabilityGrid[x][y] = 0;
				}
			}
		}
	}
	
};
AI.prototype.resetProbabilities = function() {
	for (var x = 0; x < Game.size; x++) {
		for (var y = 0; y < Game.size; y++) {
			this.probabilityGrid[x][y] = 0;
		}
	}
};
// Checks whether or not a given ship's cells passes through a cell
// that is hit
AI.prototype.passesThroughHitCell = function(shipCells) {
	for (var i = 0; i < shipCells.length; i++) {
		if (this.virtualGrid.cells[shipCells[i].x][shipCells[i].y] === Grid.TYPE_HIT) {
			return true;
		}
	}
	return false;
};
// Gives the number of hit cells the ships passes through. The more
// cells this is, the more probable the ship exists in those coordinates
AI.prototype.numHitCellsCovered = function(shipCells) {
	var cells = 0;
	for (var i = 0; i < shipCells.length; i++) {
		if (this.virtualGrid.cells[shipCells[i].x][shipCells[i].y] === Grid.TYPE_HIT) {
			cells++;
		}
	}
	return cells;
};

var mainGame = new Game(10);
})();

// IndexOf workaround for IE browsers that don't support it
// From MDN: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/indexOf
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function (searchElement, fromIndex) {

    var k;

    // 1. Let O be the result of calling ToObject passing
    //    the this value as the argument.
    if (this === null || this === undefined) {
      throw new TypeError('"this" is null or not defined');
    }

    var O = Object(this);

    // 2. Let lenValue be the result of calling the Get
    //    internal method of O with the argument "length".
    // 3. Let len be ToUint32(lenValue).
    var len = O.length >>> 0;

    // 4. If len is 0, return -1.
    if (len === 0) {
      return -1;
    }

    // 5. If argument fromIndex was passed let n be
    //    ToInteger(fromIndex); else let n be 0.
    var n = +fromIndex || 0;

    if (Math.abs(n) === Infinity) {
      n = 0;
    }

    // 6. If n >= len, return -1.
    if (n >= len) {
      return -1;
    }

    // 7. If n >= 0, then Let k be n.
    // 8. Else, n<0, Let k be len - abs(n).
    //    If k is less than 0, then let k be 0.
    k = Math.max(n >= 0 ? n : len - Math.abs(n), 0);

    // 9. Repeat, while k < len
    while (k < len) {
      var kValue;
      // a. Let Pk be ToString(k).
      //   This is implicit for LHS operands of the in operator
      // b. Let kPresent be the result of calling the
      //    HasProperty internal method of O with argument Pk.
      //   This step can be combined with c
      // c. If kPresent is true, then
      //    i.  Let elementK be the result of calling the Get
      //        internal method of O with the argument ToString(k).
      //   ii.  Let same be the result of applying the
      //        Strict Equality Comparison Algorithm to
      //        searchElement and elementK.
      //  iii.  If same is true, return k.
      if (k in O && O[k] === searchElement) {
        return k;
      }
      k++;
    }
    return -1;
  };
}

// console.log("Hi! Thanks for checking out this game. Please be nice and don't hack the ajax requests, I'm using Google Analytics to collect info about the AI's win/loss percentage in order to improve the bot, so if you do look around, I kindly ask that you don't give it bad data. Thanks.");
