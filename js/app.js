(function() {
	// Battleboat
	// Bill Mei, 2014
	// MIT License
	
	// This is one-player for now which means you don't get to place
	// your own ships yet but I'm going to update that later.
	// Currently the computer just places ships at random and you
	// have to guess where they are but eventually I want to
	// implement an AI based on the DataGenetics algorithm:
	// http://www.datagenetics.com/blog/december32011/

	// TODO: Google Analytics to track win/loss rates against real human players

	var AVAILABLE_SHIPS = ['carrier', 'battleship', 'destroyer', 'submarine', 'patrolboat'];

	/**
	 * Game manager object
	 *
	 * @param size
	 * @param numShips
	 * @constructor
	 */
	function Game(size, numShips) {
		this.size = size;
		this.numShips = numShips;
		this.gameWon = false;
		this.currentTurn = this.PLAYER_0;
		this.shotsTaken = 0;
		this.maxAllowedShots = 60; // You lose if you take more shots than this
		this.createGrid();
		this.initialize();
	}
	// You are player 0 and the computer is player 1
	Game.prototype.PLAYER_0 = 0;
	Game.prototype.PLAYER_1 = 1;

	Game.prototype.updateShots = function() {
		this.shotsTaken++;
		var ammoRemaining = this.maxAllowedShots - this.shotsTaken;
		document.querySelector('.ammo-counter').textContent = ammoRemaining;
	};
	Game.prototype.updateRoster = function() {
		this.player0fleet.fleetRoster.forEach(function(ithShip, index, array){
			if (ithShip.isSunk()) {
				document.getElementById(AVAILABLE_SHIPS[index]).setAttribute('class', 'sunk');
			}
		});
	};
	Game.prototype.checkIfWon = function() {
		if (this.player0fleet.allShipsSunk()) {
			this.gameWon = true;
			alert('Congratulations, you win!');
			this.resetFogOfWar();
			this.initialize();
		} else if (this.shotsTaken >= this.maxAllowedShots) {
			alert('Yarr! You ran out of ammo. Try again.');
			this.resetFogOfWar();
			this.initialize();
		}
	};
	Game.prototype.shoot = function(x, y, targetPlayer) {
		var grid;
		var fleet;
		if (targetPlayer === this.PLAYER_1) {
			grid = this.player1grid;
			fleet = this.player1fleet;
		} else {
			grid = this.player0grid;
			fleet = this.player0fleet;
		}
		if (grid.containsDamagedShip(x, y)) {
			// Do nothing
		} else if (grid.containsCannonball(x, y)) {
			// Do nothing
		} else if (grid.containsUndamagedShip(x, y)) {
			// update the board/grid
			grid.updateCell(x, y, 'hit');
			// IMPORTANT: This function needs to be called _after_ updating the cell to a 'hit',
			// because it overrides the CSS class to 'sunk' if we find that the ship was sunk
			fleet.findShipByLocation(x, y).incrementDamage(); // increase the damage
			this.updateShots();
			this.updateRoster();
			this.checkIfWon();
		} else {
			grid.updateCell(x, y, 'miss');
			this.updateShots();
			this.checkIfWon();
		}

	};
	/**
	 * Creates click event listeners on each one of the 100 grid cells, then passes the result to Game.shoot(x, y)
	 * @param event
	 */
	Game.prototype.clickListener = function(e) {
		// extract coordinates from event listener
		var x = parseInt(e.target.getAttribute('data-x'), 10);
		var y = parseInt(e.target.getAttribute('data-y'), 10);

		// I couldn't figure out how to avoid referencing the global variable here
		mainGame.shoot(x, y, this.PLAYER_0);
	};
	/**
	 * Resets the fog of war
	 */
	Game.prototype.resetFogOfWar = function() {
		for (var i = 0; i < this.size; i++) {
			for (var j = 0; j < this.size; j++) {
				this.player0grid.updateCell(i, j, 'empty');
				this.player1grid.updateCell(i, j, 'empty');
			}
		}
	};
	/**
	 * Generates the HTML divs for the grid
	 */
	Game.prototype.createGrid = function() {
		// Generates the HTML grids for both players
		var gridDiv = document.querySelectorAll('.grid');
		for (var grid = 0; grid < gridDiv.length; grid++) {
			gridDiv[grid].removeChild(gridDiv[grid].querySelector('.no-js')); // Removes the no-js warning
			for (var i = 0; i < this.size; i++) {
				for (var j = 0; j < this.size; j++) {
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
		this.player0grid = new Grid(this.PLAYER_0, this.size);
		this.player1grid = new Grid(this.PLAYER_1, this.size);

		this.player0fleet = new Fleet(this.PLAYER_0, this.numShips, this);
		this.player1fleet = new Fleet(this.PLAYER_1, this.numShips, this);

		// Reset game variables
		this.shotsTaken = 0;
		this.gameWon = false;

		// Reset fleet roster display
		var playerRoster = document.querySelector('.fleet-roster').querySelectorAll('li');
		for (var i = 0; i < playerRoster.length; i++) {
			playerRoster[i].setAttribute('class', '');
		}

		// Add a click listener for the Grid.shoot() method for all cells
		// Only add this listener to the computer's grid
		var gridCells = document.querySelector('.player-1-grid').childNodes;
		for (var j = 0; j < gridCells.length; j++) {
			gridCells[j].addEventListener('click', this.clickListener, false);
		}
		this.player0fleet.placeShipsRandomly();
		this.player1fleet.placeShipsRandomly();
		document.querySelector('.ammo-counter').textContent = this.maxAllowedShots;
	};

	/**
	 * Grid Object
	 * @param player
	 * @param size
	 * @constructor
	 */
	function Grid(player, size) {
		this.size = size;
		this.cells = [];
		this.initialize();
	}
	// Possible values for the parameter `type` (string)
	Grid.prototype.CSS_TYPE_EMPTY = 'empty';
	Grid.prototype.CSS_TYPE_SHIP = 'ship';
	Grid.prototype.CSS_TYPE_MISS = 'miss';
	Grid.prototype.CSS_TYPE_HIT = 'hit';
	Grid.prototype.CSS_TYPE_SUNK = 'sunk';
	// Grid code:
	Grid.prototype.TYPE_EMPTY = 0; // 0 = water (empty)
	Grid.prototype.TYPE_SHIP = 1; // 1 = undamaged ship
	Grid.prototype.TYPE_MISS = 2; // 2 = water with a cannonball in it (missed shot)
	Grid.prototype.TYPE_HIT = 3; // 3 = damaged ship (hit shot)
	Grid.prototype.TYPE_SUNK = 4; // 4 = sunk ship

	/**
	 * Grid initialization routine
	 */
	Grid.prototype.initialize = function() {
		for (var x = 0; x < this.size; x++) {
			var row = [];
			this.cells[x] = row;
			for (var y = 0; y < this.size; y++) {
				row.push(0);
			}
		}
	};

	/**
	 * Updates a cell class based on the type passed in
	 *
	 * @param x
	 * @param y
	 * @param type
	 */
	Grid.prototype.updateCell = function(x, y, type) {
		switch (type) {
			case this.CSS_TYPE_EMPTY:
				this.cells[x][y] = this.TYPE_EMPTY;
				break;
			case this.CSS_TYPE_SHIP:
				this.cells[x][y] = this.TYPE_SHIP;
				break;
			case this.CSS_TYPE_MISS:
				this.cells[x][y] = this.TYPE_MISS;
				break;
			case this.CSS_TYPE_HIT:
				this.cells[x][y] = this.TYPE_HIT;
				break;
			case this.CSS_TYPE_SUNK:
				this.cells[x][y] = this.TYPE_SUNK;
				break;
			default:
				this.cells[x][y] = this.TYPE_EMPTY;
				break;
		}
		var classes = ['grid-cell', 'grid-cell-' + x + '-' + y, 'grid-' + type];
		document.querySelector('.grid-cell-' + x + '-' + y).setAttribute('class', classes.join(' '));
	};
	/**
	 * Checks to see if a cell contains an undamaged ship
	 *
	 * @param x
	 * @param y
	 * @returns {boolean}
	 */
	Grid.prototype.containsUndamagedShip = function(x, y) {
		return this.cells[x][y] === this.TYPE_SHIP;
	};
	/**
	 * Checks to see if a cell contains a cannonball
	 *
	 * @param x
	 * @param y
	 * @returns {boolean}
	 */
	Grid.prototype.containsCannonball = function(x, y) {
		return this.cells[x][y] === this.TYPE_MISS;
	};
	/**
	 * Checks to see if a cell contains a damaged ship
	 * @param x
	 * @param y
	 * @returns {boolean}
	 */
	Grid.prototype.containsDamagedShip = function(x, y) {
		return this.cells[x][y] === this.TYPE_HIT || this.cells[x][y] === this.TYPE_SUNK;
	};

	/**
	 * Fleet object
	 *
	 * @param player
	 * @param numShips
	 * @param gameObject
	 * @constructor
	 */
	function Fleet(player, numShips, gameObject) {
		this.player = player;
		this.numShips = numShips;
		this.gameObject = gameObject;
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
			this.fleetRoster.push(new Ship(AVAILABLE_SHIPS[j], this.gameObject));
		}
	};
	/**
	 * Handles placing ships randomly on the board.
	 *
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
					this.fleetRoster[i].create(randomX, randomY, randomDirection);
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
	Fleet.prototype.findShipByLocation = function(x, y) {
		for (var i = 0; i < this.fleetRoster.length; i++) {
			var currentShip = this.fleetRoster[i];
			if (currentShip.direction === 0) {
				if (y === currentShip.yPosition &&
					x >= currentShip.xPosition &&
					x <= currentShip.xPosition + currentShip.shipLength) {
					return currentShip;
				} else {
					continue;
				}
			} else {
				if (x === currentShip.xPosition &&
					y >= currentShip.yPosition &&
					y <= currentShip.yPosition + currentShip.shipLength) {
					return currentShip;
				} else {
					continue;
				}
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
	 * @param gameObject
	 * @constructor
	 */
	function Ship(type, gameObject) {
		this.damage = 0;
		this.gameObject = gameObject;
		this.type = type;
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
				this.shipLength = 1;
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
				if (direction === 0) {
					if (this.gameObject.player0grid.cells[x + i][y] === 1) {
						return false;
					}
				} else {
					if (this.gameObject.player0grid.cells[x][y + i] === 1) {
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
		if (direction === 0) {
			return x + this.shipLength <= this.gameObject.size;
		} else {
			return y + this.shipLength <= this.gameObject.size;
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
			this.sinkShip(); // Sinks the ship
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
	Ship.prototype.sinkShip = function() {
		this.sunk = true;
		// Make the CSS class sunk
		var allCells = this.getAllShipCells();
		for (var i = 0; i < this.shipLength; i++) {
			this.gameObject.player0grid.updateCell(allCells[i].x, allCells[i].y, 'sunk');
		}
	};
	/**
	 * Gets all the ship cells
	 *
	 * returns a zero-indexed JSON with all (x, y) coordinates of the ship:
	 * e.g.
	 * {
	 *	0:{'x':2, 'y':2},
	 *	1:{'x':3, 'y':2},
	 *	2:{'x':4, 'y':2}
	 * }
	 */
	Ship.prototype.getAllShipCells = function() {
		var resultObject = {};
		for (var i = 0; i < this.shipLength; i++) {
			if (this.direction === 0) {
				resultObject[i] = {'x':this.xPosition + i, 'y':this.yPosition};
			} else {
				resultObject[i] = {'x':this.xPosition, 'y':this.yPosition + i};
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
	 */
	Ship.prototype.create = function(x, y, direction) {
		// This function assumes that you've already checked that the placement is legal
		this.xPosition = x;
		this.yPosition = y;
		this.direction = direction;
		// direction === 0 when the ship is facing north/south
		// direction === 1 when the ship is facing east/west
		for (var i = 0; i < this.shipLength; i++) {
			if (this.direction === 0) {
				this.gameObject.player0grid.cells[x + i][y] = 1;
			} else {
				this.gameObject.player0grid.cells[x][y + i] = 1;
			}
		}
	};

	// Optimal battleship-playing AI
	function AI() {

	}
	AI.prototype.hunt = function() {
		// body...
	};
	AI.prototype.target = function() {
		// body...
	};

	var mainGame = new Game(10, 5);
})();
