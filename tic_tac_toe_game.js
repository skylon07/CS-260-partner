/**
 * An awaitable timeout returning a `Promise`
 * that resolves after the given time passes
 * @param {number} ms - the length of time to wait for before resolving
 */
async function sleep(ms) {
    return await new Promise((res) => {
        setTimeout(res, ms)
    })
}


// an interface for needed functionality with the Google Sheets API
// (this ended up being smaller than I originally planned)
class Sheets {
    constructor() {
        throw new TypeError("Cannot create instance of `Sheet`")
    }

    /**
     * @returns the title for the leaderboard table (async)
     */
    static async fetchTitle() {
        const response = await this._requestRange("A1")
        return await response.json()
    }

    /**
     * @returns a 2D list of scores with names/scores in the first/second columns (async)
     */
    static async fetchScores() {
        const response = await this._requestRange("A2:B")
        return await response.json()
    }

    static _baseUrl = "https://sheets.googleapis.com/v4/spreadsheets/1m2oEGcGJA6uO1kMEG1gbs9RT6FHJBZyzdzQq11ND2GM/values/tictactoe!"
    static _apiKey = "key=AIzaSyBit_WBCH6ltHI0eLBF2PMC9USOGTbIilw"

    static async _requestRange(rangeStr) {
        return await fetch(
            `${this._baseUrl}${rangeStr}?${this._apiKey}`,
            {
                method: "GET",
                headers: { 'Content-Type': "application/json" }
            }
        )
    }
}


/**
 * The base organization class for interacting with special HTML elements
 */
class _Element {
    constructor(elemType, classes) {
        this.__element = this._createElement(elemType, classes)
    }

    get element() {
        return this.__element
    }

    _createElement(elemType, classes=[], forParent=null) {
        const elem = document.createElement(elemType)
        if (classes.length > 0) {
            elem.classList.add(...classes)
        }

        if (forParent !== null) {
            forParent.appendChild(elem)
        }

        return elem
    }
}

/**
 * An organization class for the board HTML element
 */
class Board extends _Element{
    static PLAYER_EX = "Player1"
    static PLAYER_OH = "Player2"

    static TURN_NONE = "TURN_NONE"
    static TURN_EX = "TURN_EX"
    static TURN_OH = "TURN_OH"

    constructor() {
        super("div", ["ttt-board"])

        this._tiles = []
        this._currTurn = null
        this._exScoreElem = new Score()
        this._ohScoreElem = new Score()
        this._initializeScores()
        this._generateTiles()
    }

    /**
     * Returns a 2D list of this board's `Tile` elements
     */
    get tiles() {
        return this._tiles
    }

    /**
     * Returns a flat list of this board's `Tile` elements
     */
    get allTiles() {
        if (!this._cached_allTiles) {
            this._cached_allTiles = []
            for (const tileRow of this._tiles) {
                for (const tile of tileRow) {
                    this._cached_allTiles.push(tile)
                }
            }
        }
        return this._cached_allTiles
    }

    /**
     * Clears the state of all `Tile`s in this `Board`
     */
    resetTiles() {
        for (const tile of this.allTiles) {
            tile.shape = Tile.SHAPE_NONE
        }
    }

    /**
     * The source of truth for stateful UI regarding
     * the currently active player
     * 
     * One of:
     * Board.TURN_NONE
     * Board.TURN_EX
     * Board.TURN_OH
     */
    get currTurn() {
        return this._currTurn
    }
    set currTurn(currTurn) {
        this._currTurn = currTurn
        this.element.classList.remove("turn-ex", "turn-oh")
        if (currTurn === Board.TURN_EX) {
            this.element.classList.add("turn-ex")
        } else if (currTurn === Board.TURN_OH) {
            this.element.classList.add("turn-oh")
        }
    }

    /**
     * The UI state representing the number of Player Ex's wins
     */
    get exScore() {
        return this._exScoreElem.value
    }
    set exScore(newScore) {
        this._exScoreElem.value = newScore
    }

    /**
     * The UI state representing the number of Player Oh's wins
     */
    get ohScore() {
        return this._ohScoreElem.value
    }
    set ohScore(newScore) {
        this._ohScoreElem.value = newScore
    }

    /**
     * A settable callback property called every time
     * a `Tile` is clicked inside this `Board`.
     * 
     * Callback signature:
     * (tileClicked: Tile, tileRowIdx: number, tileColIdx: number) => null
     */
    get onTileClick() {
        return this._onTileClick
    }
    set onTileClick(onTileClick) {
        this._onTileClick = onTileClick
    }

    _initializeScores() {
        this._exScoreElem.name = Board.PLAYER_EX
        this._exScoreElem.value = 0
        this._exScoreElem.element.classList.add("ex")
        this._ohScoreElem.name = Board.PLAYER_OH
        this._ohScoreElem.value = 0
        this._ohScoreElem.element.classList.add("oh")

        const scoreRow = this._createElement("div", ["ttt-score-container", "flexrow"], this.element)
        scoreRow.appendChild(this._exScoreElem.element)
        scoreRow.appendChild(this._ohScoreElem.element)
    }

    _generateTiles() {
        const tilesContainer = this._createElement("div", ["ttt-board-bg", "flexcolumn"], this.element)
        for (let tileRowIdx = 0; tileRowIdx < 3; tileRowIdx += 1) {
            if (tileRowIdx !== 0) {
                this._createElement("div", ["ttt-spacer"], tilesContainer)
            }
            const tileRowElem = this._createElement("div", ["ttt-board-row", "flexrow"], tilesContainer)
            
            const tileRow = []
            this._tiles.push(tileRow)

            for (let tileColIdx = 0; tileColIdx < 3; tileColIdx += 1) {
                if (tileColIdx !== 0) {
                    this._createElement("div", ["ttt-spacer"], tileRowElem)
                }

                const tile = new Tile()
                tile.onClick = () => this._onTileClick(tile, tileRowIdx, tileColIdx)
                tileRowElem.appendChild(tile.element)
                tileRow.push(tile)
            }
        }
    }
}

/**
 * An organization class for each clickable square in the board
 */
class Tile extends _Element {
    static SHAPE_NONE = "SHAPE_NONE"
    static SHAPE_EX = "SHAPE_EX"
    static SHAPE_OH = "SHAPE_OH"

    constructor() {
        super("button", ["ttt-tile"])

        this._shape = Tile.SHAPE_NONE
        this._onClick = null
        this._generateSvgs()
    }

    /**
     * The state of the currently drawn shape in the `Tile`
     * 
     * One of:
     * Tile.SHAPE_NONE
     * Tile.SHAPE_EX
     * Tile.SHAPE_OH
     */
    get shape() {
        return this._shape
    }
    set shape(newShape) {
        this._shape = newShape
        this.element.classList.remove("ex", "oh")
        if (newShape === Tile.SHAPE_EX) {
            this.element.classList.add("ex")
        } else if (newShape === Tile.SHAPE_OH) {
            this.element.classList.add("oh")
        }
    }

    /**
     * A settable callback property called every time
     * this Tile is clicked
     * 
     * Callback signature:
     * () => null
     */
    get onClick() {
        return this._onClick
    }
    set onClick(onClick) {
        this.element.removeEventListener("click", this._onClick)
        this._onClick = () => onClick()
        this.element.addEventListener("click", this._onClick)
    }

    _generateSvgs() {
        const crossSvg = this._createElement("div", ["svg-container"], this.element)
        crossSvg.innerHTML = `
            <svg viewBox="0 0 100 100" class="cross">
                <line x1="20" y1="20" x2="80" y2="80"></line>
                <line x1="80" y1="20" x2="20" y2="80"></line>
            </svg>
        `
        
        const circleSvg = this._createElement("div", ["svg-container"], this.element)
        circleSvg.innerHTML = `
            <svg viewBox="0 0 100 100" class="circle">
                <circle cx="50" cy="50" r="35"></circle>
            </svg>
        `
    }
}

/**
 * An organization class for a score on the board
 */
class Score extends _Element {
    constructor() {
        super("div", ["ttt-score", "flexcolumn"])

        this._name = "Unnamed"
        this._nameElem = this._createElement("p", [], this.element)
        this._nameElem.contentEditable = true
        this._value = -1
        this._valueElem = this._createElement("h3", [], this.element)
    }

    /**
     * The UI state for a player's name
     */
    get name() {
        return this._name
    }
    set name(newName) {
        this._name = newName
        this._nameElem.textContent = this._name
    }

    /**
     * The UI state for the associated player's score
     */
    get value() {
        return this._value
    }
    set value(newValue) {
        this._value = newValue
        this._valueElem.textContent = this._value
    }
}


/**
 * The main game manager for Tic Tac Toe.
 * 
 * After an instance is created, use the `run()` method to start tracking a game
 */
class GameManager {
    static FIRST_PLAYER = Board.PLAYER_EX

    /**
     * Creates a new GameManager tied to a certain Board element
     * 
     * @param {Board} board is the board to bind to
     */
    constructor(board) {
        /** @type {Board} */
        this._board = board
    }

    get board() {
        return this._board
    }

    /**
     * The main entry to start a Tic Tac Toe game.
     * This function should only be called once per `Board`
     * to start a game.
     */
    run() {
        this._board.resetTiles()

        if (GameManager.FIRST_PLAYER === Board.PLAYER_EX) {
            this._board.currTurn = Board.TURN_EX
        } else {
            this._board.currTurn = Board.TURN_OH
        }

        this._board.onTileClick = (tile, tileRow, tileCol) => {
            // only clicking empty spaces should change the board
            const boardShouldChange = tile.shape === Tile.SHAPE_NONE
            if (boardShouldChange) {
                let nextTurn = null
                if (this._board.currTurn === Board.TURN_EX) {
                    tile.shape = Tile.SHAPE_EX
                    nextTurn = Board.TURN_OH
                } else {
                    tile.shape = Tile.SHAPE_OH
                    nextTurn = Board.TURN_EX
                }
    
                const winner = this._getBoardWinner()
                const winnerExists = winner !== null
                
                this._board.currTurn = nextTurn
                
                // allow drawing before displaying winning alert
                setTimeout(() => {
                    if (winnerExists) {
                        const isDraw = winner === true
                        if (isDraw) {
                            alert(`It's a draw!`)
                        } else {
                            alert(`${winner} won!`)
                        }
    
                        this._board.resetTiles()
                        
                        if (winner === Board.PLAYER_EX) {
                            this._board.exScore += 1
                        } else if (winner === Board.PLAYER_OH) {
                            this._board.ohScore += 1
                        }
                    }
                })
            }
        }
    }

    /**
     * Gets the winner of the current Board, according to
     * "three-in-a-row" rules.
     * 
     * Note that this function assumes a single turn was taken,
     * ie the first "three-in-a-row" occurrence is considered the "winner"
     * 
     * @returns the winning player, `true` for a draw, or `null` for non-finished game
     */
    _getBoardWinner() {
        let rowCounts = [
            new GameManager._Count(),
            new GameManager._Count(),
            new GameManager._Count(),
        ]
        let colCounts = [
            new GameManager._Count(),
            new GameManager._Count(),
            new GameManager._Count(),
        ]
        let diagCounts = [
            new GameManager._Count(), // "left" diagonal (top-left/bottom-right)
            new GameManager._Count(), // "right" diagonal (top-right/bottom-left)
        ]
        let isDraw = true

        for (const [tileRowIdx, tileRow] of this._board.tiles.entries()) {
            for (const [tileColIdx, tile] of tileRow.entries()) {
                this._countTileFor(tile, rowCounts[tileRowIdx])
                this._countTileFor(tile, colCounts[tileColIdx])
                const isLeftDiag = tileRowIdx === tileColIdx
                if (isLeftDiag) {
                    this._countTileFor(tile, diagCounts[0])
                }
                const isRightDiag = tileRowIdx + tileColIdx === 2
                if (isRightDiag) {
                    this._countTileFor(tile, diagCounts[1])
                }

                if (tile.shape === Tile.SHAPE_NONE) {
                    isDraw = false
                }
            }
        }

        if (isDraw) {
            return true
        }

        const allCounts = [
            ...rowCounts,
            ...colCounts,
            ...diagCounts,
        ]
        for (const count of allCounts) {
            if (count.exCounts === 3) {
                return Board.PLAYER_EX
            } else if (count.ohCounts === 3) {
                return Board.PLAYER_OH
            }
        }
        return null
    }

    _countTileFor(tile, count) {
        if (tile.shape === Tile.SHAPE_EX) {
            count.exCounts += 1
        } else if (tile.shape === Tile.SHAPE_OH) {
            count.ohCounts += 1
        }
    }

    static _Count = class {
        constructor(exCounts=0, ohCounts=0) {
            this.exCounts = exCounts
            this.ohCounts = ohCounts
        }

        resetCounts() {
            this.exCounts = 0
            this.ohCounts = 0
        }
    }
}


function setupGame(underParentElem) {
    const boardContainer = document.getElementById("ttt-board-container")
    const board = new Board()
    boardContainer.appendChild(board.element)

    const gameManager = new GameManager(board)
    gameManager.run()

    const root = document.getElementById("ttt-root")
    underParentElem.appendChild(root)
}


async function setupScoreBoard(underParentElem) {
    const scoreContainer = document.getElementById("score-board")
    const title = await Sheets.fetchTitle();
    const scores = await Sheets.fetchScores();
    let leaderboardTable = "";
    leaderboardTable += '<table id=leaderboard>';
    leaderboardTable += '<th colspan="2">'+title.values[0][0]+'</th> ';
    for (let i = 0; i < scores.values.length; i++) {
        leaderboardTable += '<tr>';
        for (let j = 0; j < scores.values[i].length; j++) {
            leaderboardTable += '<td>'+scores.values[i][j]+'</td>';
        }
        leaderboardTable += '</tr>';
    }
    leaderboardTable += '</table>';
    scoreContainer.innerHTML = leaderboardTable;
    const root = document.getElementById("tts-root");
    underParentElem.appendChild(root)
}