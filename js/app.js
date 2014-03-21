/**
 * Project: Battleboat
 * Author : Bill Mei, 2014
 * License: MIT
 *
 * This is one-player for now which means you don't get to place your own ships yet but I'm going to update that later.
 * Currently the computer just places ships at random and you have to guess where they are but eventually I want to implement an AI based on the DataGenetics algorithm: http://www.datagenetics.com/blog/december32011/
 *
 * I know this isn't the greatest OO code since I didn't know how to avoid using a few global variables but that's why I'm applying to Hacker School, so I can learn how to write better code!
 */
(function ()
{
    var availableShips = ['carrier', 'battleship', 'destroyer', 'submarine', 'speedboat'];

    /**
     * Game manager object
     *
     * @param size
     * @param numShips
     * @constructor
     */
    function Game(size, numShips)
    {
        this.size = size;
        this.numShips = numShips;
        this.gameWon = false;
        this.shotsTaken = 0;
        this.maxAllowedShots = 60; // You lose if you take more shots than this
        this.initialize();
    }

    /**
     * Update shots handles incrementing how many shots have been used and checks to see if you won the game or ran out of shots.
     *
     * TODO: Separate the logic for the updating of the shots from the win/lose logic
     */
    Game.prototype.updateShots = function ()
    {
        this.shotsTaken++;
        document.querySelector('.ammo-counter').textContent = (this.maxAllowedShots - this.shotsTaken).toString();

        // check if you've won or not
        if (this.shotsTaken >= this.maxAllowedShots)
        {
            alert('Yarr! You ran out of ammo. Try again.');
            this.resetFogOfWar();
            this.initialize();
        }
        else
        {
            if (this.player0fleet.allShipsSunk())
            {
                this.gameWon = true;
                alert('Congratulations, you win!');
                this.resetFogOfWar();
                this.initialize();
            }
        }
    };

    /**
     * Shoot is an event handler taking care of the shot as well as the logic when a shot is taken.
     *
     * @param event
     */
    Game.prototype.shoot = function (event)
    {
        // extract coordinates from event listener
        var x = parseInt(event.target.getAttribute('data-x'), 10);
        var y = parseInt(event.target.getAttribute('data-y'), 10);

        // fire!
        var playerGrid = mainGame.player0grid;
        var playerFleet = mainGame.player0fleet;
        if (playerGrid.containsDamagedShip(x, y))
        {
            // Do nothing
        }
        else if (playerGrid.containsCannonball(x, y))
        {
            // Do nothing
        }
        else if (playerGrid.containsUndamagedShip(x, y))
        {
            playerFleet.findShipByLocation(x, y).incrementDamage().checkIfSunk();
            // update the board/grid
            playerGrid.updateCell(x, y, 'hit');
            mainGame.updateShots();
        }
        else
        {
            playerGrid.updateCell(x, y, 'miss');
            mainGame.updateShots();
        }

    };

    /**
     * Resets the fog of war (covers the map?)
     */
    Game.prototype.resetFogOfWar = function ()
    {
        for (var i = 0; i < this.size; i++)
        {
            for (var j = 0; j < this.size; j++)
            {
                this.player0grid.updateCell(i, j, 'empty');
            }
        }
    };

    /**
     * Initializes the game
     */
    Game.prototype.initialize = function ()
    {
        // You are player 0 and the computer is player 1
        this.player0grid = new Grid(0, this.size);

        // this.player1grid = new Grid(1, this.size);

        this.player0fleet = new Fleet(0, this.numShips, this);
        // this.player1fleet = new Fleet(1, this.numShips, this);

        // Reset game variables
        this.shotsTaken = 0;
        this.gameWon = false;

        // add a click listener for the Grid.shoot() method for all cells
        var gridContainer = document.querySelector('.grid');
        var gridCells = gridContainer.childNodes;
        for (var i = 0; i < gridCells.length; i++)
        {
            gridCells[i].addEventListener('click', this.shoot, false);
        }
        this.player0fleet.placeShipsRandomly();

        document.querySelector('.ammo-counter').textContent = this.maxAllowedShots;
    };

    /**
     * Grid Object
     * @param player
     * @param size
     * @constructor
     */
    function Grid(player, size)
    {
        // Grid code:
        // 0 = water (empty)
        // 1 = undamaged ship
        // 2 = water with a cannonball in it (missed shot)
        // 3 = damaged ship (hit shot)
        // 4 = sunk ship
        this.size = size;
        this.cells = [];
        this.initialize();
    }

    /**
     * Grid initialization routine
     */
    Grid.prototype.initialize = function ()
    {
        for (var x = 0; x < this.size; x++)
        {
            var row = [];
            this.cells[x] = row;
            for (var y = 0; y < this.size; y++)
            {
                row.push(0)
            }
        }
    };

    Grid.prototype.TYPE_EMPTY = 'empty';
    Grid.prototype.TYPE_SHIP = 'ship';
    Grid.prototype.TYPE_MISS = 'miss';
    Grid.prototype.TYPE_SUNK = 'sunk';
    Grid.prototype.TYPE_HIT = 'hit';

    /**
     * Updates a cell class based on the type passed in
     *
     * @param x
     * @param y
     * @param type
     */
    Grid.prototype.updateCell = function (x, y, type)
    {
        switch (type)
        {
            case this.TYPE_EMPTY:
                this.cells[x][y] = 0;
                break;
            case this.TYPE_SHIP:
                this.cells[x][y] = 1;
                break;
            case this.TYPE_MISS:
                this.cells[x][y] = 2;
                break;
            case this.TYPE_HIT:
                this.cells[x][y] = 3;
                break;
            case this.TYPE_SUNK:
                this.cells[x][y] = 4;
                break;
            default:
                this.cells[x][y] = 0;
        }

        var classes = ['grid-cell', 'grid-cell-' + x + '-' + y, 'grid-' + type];
        document.querySelector('.grid-cell-' + x + '-' + y).setAttribute('class', classes.join(' '))
    };

    /**
     * Checks to see if a cell contains an undamaged ship
     *
     * @param x
     * @param y
     * @returns {boolean}
     */
    Grid.prototype.containsUndamagedShip = function (x, y)
    {
        return this.cells[x][y] === 1;
    };

    /**
     * Checks to see if a cell contains a cannonball
     *
     * @param x
     * @param y
     * @returns {boolean}
     */
    Grid.prototype.containsCannonball = function (x, y)
    {
        return this.cells[x][y] === 2;
    };

    /**
     * Checks to see if a cell contains a damaged ship
     * @param x
     * @param y
     * @returns {boolean}
     */
    Grid.prototype.containsDamagedShip = function (x, y)
    {
        return this.cells[x][y] === 3 || this.cells[x][y] === 4;
    };

    /**
     * Fleet object
     *
     * @param player
     * @param numShips
     * @param gameObject
     * @constructor
     */
    function Fleet(player, numShips, gameObject)
    {
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
    Fleet.prototype.populate = function ()
    {
        for (var i = 0; i < this.numShips; i++)
        {
            // loop over the ship types when numShips > availableShips.length
            var j = i % availableShips.length;
            this.fleetRoster.push(new Ship(availableShips[j], this.gameObject));
        }
    };

    /**
     * Handles placing ships randomly on the board.
     *
     * TODO: This should probably use some dependency injection
     */
    Fleet.prototype.placeShipsRandomly = function ()
    {
        for (var i = 0; i < this.fleetRoster.length; i++)
        {
            var illegalPlacement = true;
            while (illegalPlacement)
            {
                var randomX = Math.floor(10 * Math.random());
                var randomY = Math.floor(10 * Math.random());
                var randomDirection = Math.floor(2 * Math.random());
                if (this.fleetRoster[i].isLegal(randomX, randomY, randomDirection))
                {
                    this.fleetRoster[i].create(randomX, randomY, randomDirection);
                    illegalPlacement = false;
                }
            }
        }
    };

    /**
     * Finds a ship by location
     * @param x
     * @param y
     * @returns {*}
     */
    Fleet.prototype.findShipByLocation = function (x, y)
    {
        // Returns the ship object located at (x, y)
        // If no ship exists at (x, y), this returns null.
        for (var i = 0; i < this.fleetRoster.length; i++)
        {
            var currentShip = this.fleetRoster[i];
            if (currentShip.direction === 0)
            {
                if (y === currentShip.yPosition &&
                    x >= currentShip.xPosition &&
                    x <= currentShip.xPosition + currentShip.shipLength)
                {
                    return currentShip;
                }
            }
            else
            {
                if (x === currentShip.xPosition &&
                    y >= currentShip.yPosition &&
                    y <= currentShip.yPosition + currentShip.shipLength)
                {
                    return currentShip;
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
    Fleet.prototype.allShipsSunk = function ()
    {
        for (var i = 0; i < this.fleetRoster.length; i++)
        {
            // if any ship is not sunk, then the sentence "all ships are sunk" is false.
            if (this.fleetRoster[i].sunk === false)
            {
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
    function Ship(type, gameObject)
    {
        this.damage = 0;
        this.gameObject = gameObject;
        this.type = type;
        switch (this.type)
        {
            case availableShips[0]:
                this.shipLength = 5;
                break;
            case availableShips[1]:
                this.shipLength = 4;
                break;
            case availableShips[2]:
                this.shipLength = 3;
                break;
            case availableShips[3]:
                this.shipLength = 3;
                break;
            case availableShips[4]:
                this.shipLength = 2;
                break;
            default:
                this.shipLength = 1;
        }
        this.maxDamage = this.shipLength;
        this.sunk = false;
    }

    /**
     * Checks to see if the placement of a ship is legal?
     *
     * @param x
     * @param y
     * @param direction
     * @returns {boolean}
     */
    Ship.prototype.isLegal = function (x, y, direction)
    {
        // first, check if the ship is within the grid...
        if (this.withinBounds(x, y, direction))
        {
            // ...then check to make sure it doesn't collide with another ship
            if (direction === 0)
            {
                for (var i = 0; i < this.shipLength; i++)
                {
                    if (this.gameObject.player0grid.cells[x + i][y] === 1)
                    {
                        return false;
                    }
                }
                return true;
            }
            else
            {
                for (var i = 0; i < this.shipLength; i++)
                {
                    if (this.gameObject.player0grid.cells[x][y + i] === 1)
                    {
                        return false;
                    }
                }
                return true;
            }
        }
        else
        {
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
    Ship.prototype.withinBounds = function (x, y, direction)
    {
        if (direction === 0)
        {
            return x + this.shipLength <= this.gameObject.size;
        }
        else
        {
            return y + this.shipLength <= this.gameObject.size;
        }
    };

    /**
     * Increments the damage counter of a ship
     *
     * @returns {Ship}
     */
    Ship.prototype.incrementDamage = function ()
    {
        if (this.damage < this.maxDamage)
        {
            this.damage++;
        }

        if (this.damage >= this.maxDamage)
        {
            this.sunk = true;
        }

        return this; // Returns back the ship object so that I can chain the method calls in Game.shoot()
    };

    /**
     * Checks to see if the ship is sunk
     *
     * @returns {boolean}
     */
    Ship.prototype.checkIfSunk = function ()
    {
        return this.sunk;
    };

    /**
     * Gets all the ship cells
     *
     * @returns {Array}
     */
    Ship.prototype.getAllShipCells = function ()
    {
        // returns a nested array with all (x, y) coordinates of the ship:
        // e.g.: [[x1, y1], [x2, y2], ... , [xn, yn]]
        var resultArray = [];
        for (var i = 0; i < this.shipLength; i++)
        {
            if (this.direction === 0)
            {
                resultArray.push([this.xPosition + i, this.yPosition]);
            }
            else
            {
                resultArray.push([this.xPosition, this.yPosition + i]);
            }
        }
        return resultArray;
    };

    /**
     * Creates a ship
     *
     * @param x
     * @param y
     * @param direction
     */
    Ship.prototype.create = function (x, y, direction)
    {
        // This function assumes that you've already checked that the placement is legal
        this.xPosition = x;
        this.yPosition = y;
        this.direction = direction;
        // direction === 0 when the ship is facing north/south
        // direction === 1 when the ship is facing east/west
        if (this.direction === 0)
        {
            for (var i = 0; i < this.shipLength; i++)
            {
                this.gameObject.player0grid.cells[x + i][y] = 1;
            }
        }
        else
        {
            for (var i = 0; i < this.shipLength; i++)
            {
                this.gameObject.player0grid.cells[x][y + i] = 1;
            }
        }
    };

    var mainGame = new Game(10, 5);
})();