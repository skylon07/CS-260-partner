import FillArray from "./FillArray"

/**
 * A basic enum class that provides player turn states
 */
export class Player {
    static PLAYER_BLUE = "PLAYER_BLUE"
    static PLAYER_RED = "PLAYER_RED"
}

/**
 * A basic enum class that provides basic orientations
 */
export class Orientation {
    static HORIZONTAL = "HORIZONTAL"
    static VERTICAL = "VERTICAL"
}

/**
 * Conceptually this represents each of the boxes, by rows and columns,
 * on a dots-and-boxes board. Each box has an index and four lines
 * that can be drawn around it. Lines are shared between boxes
 * (ie there are multiple, usually two, ways to manipulate a single line).
 * 
 * @param {number} numRows is the number of rows that contain boxes
 * @param {number} numCols is the number of columns that contain boxes
 */
export class BoxBoard {
    static SIDE_TOP = "SIDE_TOP"
    static SIDE_BOTTOM = "SIDE_BOTTOM"
    static SIDE_LEFT = "SIDE_LEFT"
    static SIDE_RIGHT = "SIDE_RIGHT"

    constructor(numRows, numCols) {
        this._numRows = numRows
        this._numCols = numCols
        this._horizontalLines = new FillArray(numRows + 1, numCols)
        this._verticalLines = new FillArray(numRows, numCols + 1)
    }

    get numRows() {
        return this._numRows
    }

    get numCols() {
        return this._numCols
    }

    isBoxDrawn(row, col) {
        return this.isLineDrawn(row, col, BoxBoard.SIDE_TOP) &&
            this.isLineDrawn(row, col, BoxBoard.SIDE_BOTTOM) &&
            this.isLineDrawn(row, col, BoxBoard.SIDE_LEFT) &&
            this.isLineDrawn(row, col, BoxBoard.SIDE_RIGHT)
    }

    isLineDrawn(row, col, side) {
        this._checkBoxCoords(row, col)
        if (side === BoxBoard.SIDE_TOP) {
            return this._horizontalLines.isFilledAt(row, col)
        } else if (side === BoxBoard.SIDE_BOTTOM) {
            return this._horizontalLines.isFilledAt(row + 1, col)
        } else if (side === BoxBoard.SIDE_LEFT) {
            return this._verticalLines.isFilledAt(row, col)
        } else if (side === BoxBoard.SIDE_RIGHT) {
            return this._verticalLines.isFilledAt(row, col + 1)
        } else {
            throw new Error("Invalid side")
        }
        
    }

    drawLine(row, col, side, drawn=true) {
        this._checkBoxCoords(row, col)
        if (side === BoxBoard.SIDE_TOP) {
            this._horizontalLines.setFill(row, col, drawn)
        } else if (side === BoxBoard.SIDE_BOTTOM) {
            this._horizontalLines.setFill(row + 1, col, drawn)
        } else if (side === BoxBoard.SIDE_LEFT) {
            this._verticalLines.setFill(row, col, drawn)
        } else if (side === BoxBoard.SIDE_RIGHT) {
            this._verticalLines.setFill(row, col + 1, drawn)
        } else {
            throw new Error("Invalid side")
        }
    }

    _checkBoxCoords(row, col) {
        const maxRows = this._numRows - 1
        const maxCols = this._numCols - 1
        if (row < 0 || row > maxRows || col < 0 || col > maxCols) {
            throw new Error(`Box coordinates out of bounds: (${row}, ${col}) not between (0, 0) -- (${maxRows}, ${maxCols})`)
        }
    }
}

/**
 * Contains the functionality and logic of a dots and boxes game.
 * Turns can be taken by players and information can be retrieved
 * about the current state of the game.
 */
export class DotsAndBoxesGame {
    constructor(boardShape) {
        this._boardShape = boardShape
        const numBoxRows = boardShape.numRows - 1
        const numBoxCols = boardShape.numCols - 1
        this._board = new BoxBoard(numBoxRows, numBoxCols)
        this._boxOwnerMap = {}
        this._lineOwnerMap = {}
        this._currPlayer = Player.PLAYER_BLUE
    }

    get currPlayer() {
        return this._currPlayer
    }

    getBoxFilledBy(row, col) {
        if (this._board.isBoxDrawn(row, col)) {
            const player = this._getBoxOwner(row, col)
            console.assert(!!player, "Board square was filled, but no player was recorded")
            return player
        } else {
            return null
        }
    }

    getLineDrawnBy(row, col, side) {
        if (this._board.isLineDrawn(row, col, side)) {
            const player = this._getLineOwner(row, col, side)
            console.assert(!!player, "Line was drawn, but no player was recorded")
            return player
        } else {
            return null
        }
    }

    takeTurnDrawing(row, col, side) {
        const actuallyTookATurn = !this._board.isLineDrawn(row, col, side)
        if (actuallyTookATurn) {
            this._board.drawLine(row, col, side)
            this._setLineOwner(row, col, side, this._currPlayer)
            const anyBoxesMade = this._reconcileNewBoxes()
            if (!anyBoxesMade) {
                this._switchCurrPlayer()
            }
        }
    }

    getGameFinished() {
        for (let rowIdx = 0; rowIdx < this._board.numRows; rowIdx += 1){
            for (let colIdx = 0; colIdx < this._board.numCols; colIdx += 1) {
                // safe to add 1 to idxs;
                // this._board dimensions are 1 less than this._boardShape
                // (1 less set of squares than dots)
                const topLeftDotExists = this._boardShape.isFilledAt(rowIdx, colIdx)
                const topRightDotExists = this._boardShape.isFilledAt(rowIdx, colIdx + 1)
                const bottomLeftDotExists = this._boardShape.isFilledAt(rowIdx + 1, colIdx)
                const bottomRightDotExists = this._boardShape.isFilledAt(rowIdx + 1, colIdx + 1)
                const isValidSquare = topLeftDotExists && topRightDotExists && bottomLeftDotExists && bottomRightDotExists

                if (isValidSquare) {
                    const squareIsFilled = this._board.isBoxDrawn(rowIdx, colIdx)
                    if (!squareIsFilled) {
                        return false
                    }
                }
            }
        }
        return true
    }

    getPlayerPoints() {
        let playerBluePoints = 0
        let playerRedPoints = 0
        for (let rowIdx = 0; rowIdx < this._board.numRows; rowIdx += 1) {
            for (let colIdx = 0; colIdx < this._board.numCols; colIdx += 1) {
                const playerOwner = this._getBoxOwner(rowIdx, colIdx) || null
                if (playerOwner === Player.PLAYER_BLUE) {
                    playerBluePoints += 1
                } else if (playerOwner === Player.PLAYER_RED) {
                    playerRedPoints += 1
                }
            }
        }
        return {
            [Player.PLAYER_BLUE]: playerBluePoints,
            [Player.PLAYER_RED]: playerRedPoints
        }
    }

    _reconcileNewBoxes() {
        let anyBoxesAdded = false
        for (let rowIdx = 0; rowIdx < this._board.numRows; rowIdx += 1) {
            for (let colIdx = 0; colIdx < this._board.numCols; colIdx += 1) {
                const shouldCheckOwner = this._board.isBoxDrawn(rowIdx, colIdx)
                if (shouldCheckOwner) {
                    const hasOwner = !!this._getBoxOwner(rowIdx, colIdx)
                    if (!hasOwner) {
                        this._setBoxOwner(rowIdx, colIdx, this._currPlayer)
                        anyBoxesAdded = true
                    }
                }
            }
        }
        return anyBoxesAdded
    }

    _switchCurrPlayer() {
        if (this._currPlayer === Player.PLAYER_BLUE) {
            this._currPlayer = Player.PLAYER_RED
        } else {
            this._currPlayer = Player.PLAYER_BLUE
        }
    }

    _getBoxOwner(row, col) {
        return this._boxOwnerMap[this._boxOwnerKeyFrom(row, col)]
    }

    _setBoxOwner(row, col, player) {
        this._boxOwnerMap[this._boxOwnerKeyFrom(row, col)] = player
    }

    _boxOwnerKeyFrom(row, col) {
        return `${row},${col}`
    }

    _getLineOwner(row, col, side) {
        return this._lineOwnerMap[this._lineOwnerKeyFrom(row, col, side)]
    }

    _setLineOwner(row, col, side, player) {
        this._lineOwnerMap[this._lineOwnerKeyFrom(row, col, side)] = player
    }

    _lineOwnerKeyFrom(row, col, side) {
        let orientation
        if (side === BoxBoard.SIDE_BOTTOM) {
            row += 1
            orientation = Orientation.HORIZONTAL
        } else if (side === BoxBoard.SIDE_TOP) {
            orientation = Orientation.HORIZONTAL
        } else if (side === BoxBoard.SIDE_RIGHT) {
            col += 1
            orientation = Orientation.VERTICAL
        } else if (side === BoxBoard.SIDE_LEFT) {
            orientation = Orientation.VERTICAL
        } else {
            throw new Error("Invalid side")
        }
        return `${row},${col}:${orientation}`
    }
}
