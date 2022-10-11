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

    static async fetchTitle() {
        return await this._requestRange("A1")
    }

    static async fetchScores() {
        return await this._requestRange("A2:B")
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

// base organization class for the HTML elements
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

// organization class for the board HTML element
class Board extends _Element{
    static TURN_EX = "TURN_EX"
    static TURN_OH = "TURN_OH"

    constructor() {
        super("div", ["ttt-board"])

        this._tiles = []
        this._currTurn = null
        this._generateTiles()
    }

    get tiles() {
        return this._tiles
    }

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

    get onTileClick() {
        return this._onTileClick
    }

    set onTileClick(onTileClick) {
        this._onTileClick = onTileClick
    }

    _generateTiles() {
        const tilesContainer = this._createElement("div", ["ttt-board-bg"], this.element)
        for (let tileRowIdx = 0; tileRowIdx < 3; tileRowIdx += 1) {
            if (tileRowIdx !== 0) {
                this._createElement("div", ["ttt-spacer"], tilesContainer)
            }
            const tileRowElem = this._createElement("div", ["ttt-board-row"], tilesContainer)
            
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

// organization class for each clickable square in the board
class Tile extends _Element {
    static MODE_NONE = "MODE_NONE"
    static MODE_EX = "MODE_EX"
    static MODE_OH = "MODE_OH"

    constructor() {
        super("button", ["ttt-tile"])

        this._mode = Tile.MODE_NONE
        this._onClick = null
        this._generateSvgs()
    }

    get mode() {
        return this._mode
    }

    set mode(newMode) {
        this._mode = newMode
        this.element.classList.remove("ex", "oh")
        if (newMode === Tile.MODE_EX) {
            this.element.classList.add("ex")
        } else if (newMode === Tile.MODE_OH) {
            this.element.classList.add("oh")
        }
    }

    get onClick() {
        return this._onClick
    }

    set onClick(onClick) {
        this.element.removeEventListener("click", this._onClick)
        this._onClick = onClick
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
                <circle cx="50" cy="50" r="40"></circle>
            </svg>
        `
    }
}

function setupGame(underParentElem) {
    const boardContainer = document.getElementById("ttt-board-container")
    const board = new Board()
    boardContainer.appendChild(board.element)

    let isOhsTurn = false
    board.onTileClick = alertOnFailCallback("DEBUG", (tile) => {
        if (isOhsTurn) {
            tile.mode = Tile.MODE_OH
            board.currTurn = Board.TURN_EX
        } else {
            tile.mode = Tile.MODE_EX
            board.currTurn = Board.TURN_OH
        }
        isOhsTurn = !isOhsTurn
    })

    const root = document.getElementById("ttt-root")
    underParentElem.appendChild(root)
}
