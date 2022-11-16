export default class FillArray {
    static fromArray(array) {
        const numRows = array.length
        const numCols = array[0].length
        const shouldFill = (row, col) => array[row][col]
        return new FillArray(numRows, numCols, shouldFill)
    }

    constructor(numRows, numCols, shouldFill=((row, col) => true)) {
        this._shape = []
        for (let rowCount = 0; rowCount < numRows; rowCount += 1) {
            const row = []
            for (let colCount = 0; colCount < numCols; colCount += 1) {
                const shouldFillHere = !!shouldFill(rowCount, colCount)
                row.push(shouldFillHere)
            }
            this._shape.push(row)
        }
    }

    get numRows() {
        return this._shape.length
    }

    get numCols() {
        if (this.numRows === 0) {
            return 0
        }
        return this._shape[0].length
    }

    isFilledAt(row, col) {
        if (row < 0 || row >= this.numRows) {
            throw new Error(`Row ${row} out of range 0..${this.numRows}`)
        }
        
        if (col < 0 || col >= this.numCols) {
            throw new Error(`Column ${col} out of range 0..${this.numCols}`)
        }
        
        return this._shape[row][col]
    }

    setFill(row, col, fill) {
        if (row < 0 || row >= this.numRows) {
            throw new Error(`Row ${row} out of range 0..${this.numRows}`)
        }
        
        if (col < 0 || col >= this.numCols) {
            throw new Error(`Column ${col} out of range 0..${this.numCols}`)
        }

        this._shape[row][col] = !!fill
    }

    /**
     * Fills a range from startRow/Col to endRow/Col (non-inclusive);
     * Here is an example of filling the center of a 4x5 rectangle
     * 
     * ```
     * const fillArray = 
     * .  .  .  .  .
     * .  .  .  .  .
     * .  .  .  .  .
     * .  .  .  .  .
     * 
     * fillArray.setFillRange(1, 3, 1, 4, () => true)
     * .  .  .  .  .
     * .  X  X  X  .
     * .  X  X  X  .
     * .  .  .  .  .
     * ```
     * 
     * @param {*} startRow is the row to start filling from (aka inclusive)
     * @param {*} endRow is the row to stop filling before (aka non-inclusive)
     * @param {*} startCol is the column to start filling from (aka inclusive)
     * @param {*} endCol is the column to stop filling before (aka non-inclusive)
     * @param {(row: number, col: number) => boolean} shouldFill determines if a particular element should be filled
     */
    setFillRange(startRow, endRow, startCol, endCol, shouldFill) {
        if (startRow < 0 || startRow >= this.numRows) {
            throw new Error(`Start row ${startRow} out of range 0..${this.numRows}`)
        }
        if (endRow < 0 || endRow >= this.numRows) {
            throw new Error(`End row ${endRow} out of range 0..${this.numRows}`)
        }
        if (startRow > endRow) {
            const origStartRow = startRow
            startRow = endRow
            endRow = origStartRow
        }

        if (startCol < 0 || startCol >= this.numCols) {
            throw new Error(`Start column ${startCol} out of range 0..${this.numRows}`)
        }
        if (endCol < 0 || endCol >= this.numCols) {
            throw new Error(`End column ${endCol} out of range 0..${this.numRows}`)
        }
        if (startCol > endCol) {
            const origStartCol = startCol
            startCol = endCol
            endCol = origStartCol
        }

        for (let currRow = startRow; currRow < endRow; currRow += 1) {
            for (let currCol = startCol; currCol < endCol; currCol += 1) {
                const shouldFillHere = shouldFill(currRow, currCol)
                this._shape[currRow][currCol] = shouldFillHere
            }
        }
    }

    
    /**
     * Maps the fill array to values given by `mapFn()`.
     * This works similarly to the regular `map()` used on
     * 1 dimensional arrays.
     * @param {(isFilled: boolean, row: number, col: number) => *} mapFn
     */
    map(mapFn) {
        return this._shape.map((row, rowIdx) => {
            return row.map((isFilled, colIdx) => {
                return mapFn(isFilled, rowIdx, colIdx)
            })
        })
    }

    /**
     * Maps the fill array's rows to values given by `mapFn()`.
     * This is identical to calling `map()` directly on the fill array.
     * @param {(row: boolean[], rowIdx: number) => *} mapFn 
     */
    mapRows(mapFn) {
        return this._shape.map(mapFn)
    }
}
