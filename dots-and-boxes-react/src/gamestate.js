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
        this._horizontalLines = new FillArray(numRows + 1, numCols, () => false)
        this._verticalLines = new FillArray(numRows, numCols + 1, () => false)
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
        const maxRows = this._verticalLines.numRows - 1
        const maxCols = this._horizontalLines.numCols - 1
        if (row < 0 || row > maxRows || col < 0 || col > maxCols) {
            throw new Error(`Box coordinates out of bounds: (${row}, ${col}) not between (0, 0) -- (${maxRows}, ${maxCols})`)
        }
    }
}
