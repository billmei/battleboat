(function() {
	// Battleboat
	// Bill Mei, 2014
	// MIT License
	
	// TODO: Google Analytics to track win/loss rates against real human players
	// TODO: Use analytics to track average number of shots taken
	// TODO: If the player clicks on a cell they've already uncovered, the AI
	// should not immediately shoot because it's still the player's turn

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
	// Initialize first turn to the player
	Game.currentTurn = Game.HUMAN_PLAYER;
	// You are player 0 and the computer is player 1
	Game.HUMAN_PLAYER = 0;
	Game.COMPUTER_PLAYER = 1;
	// Used for generating temporary ships for calculating
	// the probability heatmap
	Game.VIRTUAL_PLAYER = 2;

	Game.prototype.incrementShots = function() {
		this.shotsTaken++;
	};
	Game.prototype.updateRoster = function(targetFleet) {
		targetFleet.fleetRoster.forEach(function(ithShip, index, array){
			if (ithShip.isSunk()) {
				document.getElementById(AVAILABLE_SHIPS[index]).setAttribute('class', 'sunk');
			}
		});
	};
	Game.prototype.checkIfWon = function() {
		if (this.computerFleet.allShipsSunk()) {
			alert('Congratulations, you win!');
			this.resetFogOfWar();
			this.initialize();
		} else if (this.humanFleet.allShipsSunk()) {
			alert('Yarr! The computer sank all your ships. Try again.');
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
			// this.updateRoster(targetFleet);
			this.checkIfWon();
			return Grid.TYPE_SHIP;
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
	Game.prototype.clickListener = function(e) {
		// extract coordinates from event listener
		var x = parseInt(e.target.getAttribute('data-x'), 10);
		var y = parseInt(e.target.getAttribute('data-y'), 10);
		// console.log(mainGame);
		// if (Game.currentTurn === Game.HUMAN_PLAYER) {
			// I couldn't figure out how to avoid referencing the global variable here
			mainGame.shoot(x, y, Game.COMPUTER_PLAYER);
			// Game.currentTurn = Game.COMPUTER_PLAYER;
			mainGame.robot.shoot();
			// Game.currentTurn = Game.HUMAN_PLAYER;
		// } else {
			
		// }
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

		// Reset fleet roster display
		var playerRoster = document.querySelector('.fleet-roster').querySelectorAll('li');
		for (var i = 0; i < playerRoster.length; i++) {
			playerRoster[i].setAttribute('class', '');
		}

		// Add a click listener for the Grid.shoot() method for all cells
		// Only add this listener to the computer's grid
		var gridCells = document.querySelector('.computer-player').childNodes;
		for (var j = 0; j < gridCells.length; j++) {
			gridCells[j].addEventListener('click', this.clickListener, false);
		}
		this.humanFleet.placeShips();
		this.computerFleet.placeShips();
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
	 * @param playerOwner
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
	Fleet.prototype.placeShips = function() {
		var shipCoords;
		if (this.player === Game.HUMAN_PLAYER) {
			this.placeShipsRandomly();
			for (var i = 0; i < this.fleetRoster.length; i++) {
				shipCoords = this.fleetRoster[i].getAllShipCells();
				for (var j = 0; j < shipCoords.length; j++) {
					this.playerGrid.updateCell(shipCoords[j].x, shipCoords[j].y, 'ship', this.player);
				}
			}

		} else if (this.player === Game.COMPUTER_PLAYER) {
			// TODO: Avoid placing ships too close to each other
			this.placeShipsRandomly();
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
						this.playerGrid.cells[x + i][y] === Grid.TYPE_MISS) {
						return false;
					}
				} else {
					if (this.playerGrid.cells[x][y + i] === Grid.TYPE_SHIP ||
						this.playerGrid.cells[x][y + i] === Grid.TYPE_MISS) {
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
			this.playerGrid.updateCell(allCells[i].x, allCells[i].y, 'sunk', this.player);
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
		this.currentStrategy = 'scout';
		this.virtualGrid = new Grid(Game.size);

		this.probabilityGrid = [];
		this.initializeProbabilities();
		this.updateProbabilities();

		this.unvisitedCells = [];
		for (var i = 0; i < Game.size; i++ ) {
			for (var j = 0; j < Game.size; j ++) {
				// mod(2) to give only cells in parity order.
				if ((i + j) % 2 === 0) {
					this.unvisitedCells.push({'x': i, 'y': j});
				}
			}
		}
	}
	AI.prototype.initializeProbabilities = function() {
		for (var x = 0; x < Game.size; x++) {
			var row = [];
			this.probabilityGrid[x] = row;
			for (var y = 0; y < Game.size; y++) {
				row.push(0);
			}
		}
	};
	AI.prototype.shoot = function() {
		if (this.currentStrategy === 'scout') {
			this.scout();
		} else if (this.currentStrategy === 'chase') {
			this.chase();
		}
		this.updateProbabilities();
	};
	AI.prototype.scout = function() {
		// Pick up here: Find the maximum in the probability array and target that cell

		// for (var x = 0; x < Game.size; x++) {
		// 	for (var y = 0; y < Game.size; y++) {
		// 		// do stuff
		// 	}
		// }


		// shoots randomly only in parity grid order for now
		var randomCoords = Math.floor(this.unvisitedCells.length * Math.random());
		var randomX = this.unvisitedCells[randomCoords].x;
		var randomY = this.unvisitedCells[randomCoords].y;

		var result = this.gameObject.shoot(randomX, randomY, Game.HUMAN_PLAYER);
		if (result === Grid.TYPE_SHIP) {
			this.currentStrategy = 'chase';
		} else if (result === Grid.TYPE_MISS) {
			this.currentStrategy = 'scout';
		}
		this.lastVisitedCell = this.unvisitedCells[randomCoords];
		this.lastVisitedCell.directionName = 'none';

		// Update the AI's visible grid with the result
		if (result === null || result === undefined) {
			// If the result doesn't exist it means we haven't visited the cell
			result = Grid.TYPE_EMPTY;
		}
		this.virtualGrid.cells[this.lastVisitedCell.x][this.lastVisitedCell.y] = result;

		this.unvisitedCells.splice(randomCoords, 1);
	};
	AI.prototype.chase = function() {
		var candidateCells = [];
		var targetedCell = this.lastVisitedCell;
		if (this.chaseDirection === null || 
			this.chaseDirection === undefined) {
			this.chaseDirection = 'none';
		}
		if (this.firstHitCell === null ||
			this.firstHitCell === undefined) {
			this.firstHitCell = this.lastVisitedCell;
		}
		var chosenDirection;
		var result;

		candidateCells = this.getLegalNeighbors();

		// Choose a random chase direction if one hasn't been established yet
		// Otherwise, keep chasing in the direction you were going in
		if (this.chaseDirection === 'none') {
			chosenDirection = Math.floor(candidateCells.length * Math.random());
		} else {
			// You also need to select a random chase direction if your desired
			// chase direction is out of bounds.
			chosenDirection = Math.floor(candidateCells.length * Math.random());
			for (var i = 0; i < candidateCells.length; i++) {
				if (candidateCells[i].directionName === this.chaseDirection) {
					chosenDirection = i;
				}
			}
		}

		// If there aren't any candidate cells, we need to jump to the next
		// unexplored cell in the last direction
		if (candidateCells.length === 0) {
			this.lastVisitedCell = this.firstHitCell;
			if (this.chaseDirection !== 'none') {
				switch (this.chaseDirection) {
					case 'north':
						this.chaseDirection = 'south';
						break;
					case 'east':
						this.chaseDirection = 'west';
						break;
					case 'south':
						this.chaseDirection = 'north';
						break;
					case 'west':
						this.chaseDirection = 'east';
						break;
					default:
						this.chaseDirection = 'none';
						break;
				}
			}
			candidateCells = this.getLegalNeighbors();
		}
		// Shoot and store the result
		result = this.gameObject.shoot(
			candidateCells[chosenDirection].x,
			candidateCells[chosenDirection].y,
			Game.HUMAN_PLAYER
			);


		// TODO: If there are any visible hit cells on the grid at any time we
		// have to go back and try to sink that ship

		// Set the next root cell to be in the current chase direction
		this.lastVisitedCell = candidateCells[chosenDirection];
		
		// Update the AI's visible grid with the result
		if (result === null || result === undefined) {
			result = Grid.TYPE_EMPTY;
		}
		this.virtualGrid.cells[this.lastVisitedCell.x][this.lastVisitedCell.y] = result;

		// If you hit a ship, keep chasing in the same direction
		if (result === Grid.TYPE_SHIP) {
			if (this.isShipSunk(this.lastVisitedCell.x, this.lastVisitedCell.y)) {
				// Reset your temporary variables before going back to scout strategy
				this.chaseDirection = null;
				this.firstHitCell = null;
				this.currentStrategy = 'scout';
			} else {
				this.chaseDirection = candidateCells[chosenDirection].directionName;
			}
		// If you don't hit a ship, keep trying cells around the same root node
		} else if (result === Grid.TYPE_MISS) {
			this.lastVisitedCell = targetedCell;
			this.chaseDirection = 'none';
		}

	};
	AI.prototype.isShipSunk = function(x, y) {
		return this.gameObject.humanFleet.findShipByCoords(x, y).isSunk();
	};

	AI.prototype.updateProbabilities = function() {
		var roster = new Fleet(this.virtualGrid, Game.VIRTUAL_PLAYER).fleetRoster;
		var coords;
		// Probabilities are not normalized to fit in the interval [0, 1]
		// because we're going to be dividing things out anyway
		this.resetProbabilities();
		// Try fitting each ship in each cell in every orientation
		// TODO: Think about a more efficient way of doing this
		for (var i = 0; i < roster.length; i++) {
			for (var x = 0; x < Game.size; x++) {
				for (var y = 0; y < Game.size; y++) {
					if (roster[i].isLegal(x, y, Ship.DIRECTION_VERTICAL)) {
						roster[i].create(x, y, Ship.DIRECTION_VERTICAL, true);
						coords = roster[i].getAllShipCells();
						for (var j = 0; j < coords.length; j++) {
							this.probabilityGrid[coords[j].x][coords[j].y]++;
						}
					}
					if (roster[i].isLegal(x, y, Ship.DIRECTION_HORIZONTAL)) {
						roster[i].create(x, y, Ship.DIRECTION_HORIZONTAL, true);
						coords = roster[i].getAllShipCells();
						for (var k = 0; k < coords.length; k++) {
							this.probabilityGrid[coords[k].x][coords[k].y]++;
						}
					}
				}
			}
		}

		console.log(this.probabilityGrid);

	};
	AI.prototype.resetProbabilities = function() {
		for (var x = 0; x < Game.size; x++) {
			for (var y = 0; y < Game.size; y++) {
				this.probabilityGrid[x][y] = 0;
			}
		}
	};
	AI.prototype.getLegalNeighbors = function() {
		var candidateCells = [];

		var north = {
			'x': this.lastVisitedCell.x - 1,
			'y': this.lastVisitedCell.y,
			'directionName': 'north'
		};
		var east = {
			'x': this.lastVisitedCell.x,
			'y': this.lastVisitedCell.y + 1,
			'directionName': 'east'
		};
		var south = {
			'x': this.lastVisitedCell.x + 1,
			'y': this.lastVisitedCell.y,
			'directionName': 'south'
		};
		var west = {
			'x': this.lastVisitedCell.x,
			'y': this.lastVisitedCell.y - 1,
			'directionName': 'west'
		};

		// Make sure the candidate cell is inside the grid, and unvisited
		if (north.x >= 0 &&
			this.virtualGrid.cells[north.x][north.y] === Grid.TYPE_EMPTY) {
			candidateCells.push(north);
		}
		if (east.y < Game.size &&
			this.virtualGrid.cells[east.x][east.y] === Grid.TYPE_EMPTY) {
			candidateCells.push(east);
		}
		if (south.x < Game.size &&
			this.virtualGrid.cells[south.x][south.y] === Grid.TYPE_EMPTY) {
			candidateCells.push(south);
		}
		if (west.y >= 0 &&
			this.virtualGrid.cells[west.x][west.y] === Grid.TYPE_EMPTY) {
			candidateCells.push(west);
		}

		return candidateCells;
	};

	var mainGame = new Game(10);
})();
