import { BoxBoard, Orientation, Player } from "./gamestate"

import Dot from "./Dot"
import SelectableLine from "./SelectableLine"
import FillableBox from "./FillableBox"
import DynamicStyle from "./DynamicStyle"

import './Board.css'

/**
 * @param {{
 *      boardShape: FillArray,
 *      getLineOwner: (row: number, col: number, side: string) => string
 *      getBoxOwner: (row: number, col: number) => string,
 *      onLineClick: (row: number, col: number, side: string) => null,
 *      currPlayerTurn: string,
 * }} props
 * 
 * @typedef {import('./FillArray').default} FillArray
 */
export default function Board({boardShape, getLineOwner, getBoxOwner, onLineClick, currPlayerTurn}) {
    const numRowSquares = boardShape.numRows - 1
    const numColSquares = boardShape.numCols - 1

    const dotAndHorizontalLineElems = boardShape.mapRows((row, rowIdx) => {
        const dotElems = row.map((fill, colIdx) => {
            return <Dot
                key={`Dot${rowIdx},${colIdx}`}
                filled={fill}
            />
        })
        const lineElems = row.map((fill, colIdx) => {
            const isHangingLine = colIdx === numColSquares
            if (!isHangingLine) {
                const isLastRow = rowIdx === numRowSquares
                const selectedByPlayer = !isLastRow ?
                    getLineOwner(rowIdx, colIdx, BoxBoard.SIDE_TOP) :
                    getLineOwner(rowIdx - 1, colIdx, BoxBoard.SIDE_BOTTOM)
                const takeTurnUsingLine = !isLastRow ? 
                    () => onLineClick(rowIdx, colIdx, BoxBoard.SIDE_TOP) :
                    () => onLineClick(rowIdx - 1, colIdx, BoxBoard.SIDE_BOTTOM)

                const leftDotIdx = colIdx 
                const leftDotFilled = boardShape.isFilledAt(rowIdx, leftDotIdx)
                const rightDotIdx = colIdx + 1
                const rightDotFilled = boardShape.isFilledAt(rowIdx, rightDotIdx)
                const notSelectedByPlayer = selectedByPlayer === null
                const isSelectable = leftDotFilled && rightDotFilled && notSelectedByPlayer
    
                return <SelectableLine
                    key={`SelectableLine${rowIdx},${colIdx}`}
                    orientation={Orientation.HORIZONTAL}
                    disabled={!isSelectable}
                    selectedByPlayer={selectedByPlayer}
                    onClick={takeTurnUsingLine}
                />
            } else {
                return null
            }
        })
        lineElems.splice(lineElems.length - 1, 1)
        return <div
            className="Board-BoardRow horizontal"
            key={`${rowIdx}-horizontal`}
        >
            {interlace(dotElems, lineElems)}
        </div>
    })

    const verticalLineAndSquareElems = boardShape.mapRows((row, rowIdx) => {
        const lineElems = row.map((fill, colIdx) => {
            const isHangingLine = rowIdx === numRowSquares
            if (!isHangingLine) {
                const isLastCol = colIdx === numColSquares
                const selectedByPlayer = !isLastCol ? 
                    getLineOwner(rowIdx, colIdx, BoxBoard.SIDE_LEFT) : 
                    getLineOwner(rowIdx, colIdx - 1, BoxBoard.SIDE_RIGHT)
                const takeTurnUsingLine = !isLastCol ?
                    () => onLineClick(rowIdx, colIdx, BoxBoard.SIDE_LEFT) :
                    () => onLineClick(rowIdx, colIdx - 1, BoxBoard.SIDE_RIGHT)

                
                const topDotIdx = rowIdx
                const topDotFilled = boardShape.isFilledAt(topDotIdx, colIdx)
                const bottomDotIdx = rowIdx + 1
                const bottomDotFilled = boardShape.isFilledAt(bottomDotIdx, colIdx)
                const notSelectedByPlayer = selectedByPlayer === null
                const isSelectable = topDotFilled && bottomDotFilled && notSelectedByPlayer
                
                return <SelectableLine
                    key={`SelectableLine${rowIdx},${colIdx}`}
                    orientation={Orientation.VERTICAL}
                    disabled={!isSelectable}
                    selectedByPlayer={selectedByPlayer}
                    onClick={takeTurnUsingLine}
                />
            } else {
                return null
            }
        })
        const squareElems = row.map((fill, colIdx) => {
            const isHangingSquare = rowIdx === numRowSquares || colIdx === numColSquares
            if (!isHangingSquare) {
                const player = getBoxOwner(rowIdx, colIdx)
                return <FillableBox
                    key={`FillableBox${rowIdx},${colIdx}`}
                    filledByPlayer={player}
                />
            } else {
                return null
            }
        })
        squareElems.splice(squareElems.length - 1, 1)
        return <div
            className="Board-BoardRow vertical"
            key={`${rowIdx}-vertical`}
        >
            {interlace(lineElems, squareElems)}
        </div>
    })
    verticalLineAndSquareElems.splice(verticalLineAndSquareElems.length - 1, 1)
    
    const playerTurnClass = currPlayerTurn === Player.PLAYER_BLUE ?
        "turn-player-blue" : "turn-player-red"
    const boardLineSize = 30 / boardShape.numCols
    
    return <div className={`Board ${playerTurnClass}`}>
        <DynamicStyle>{`
            :root {
                --Board-line-size: ${boardLineSize}vw;
            }
        `}</DynamicStyle>
        {interlace(dotAndHorizontalLineElems, verticalLineAndSquareElems)}
    </div>
}

/**
 * This function returns a new array picking elements
 * from `array1` and `array2`, one at a time, alternating between
 * them after each element is picked
 * 
 * @param {*} array1 is the array to be picked from first
 * @param {*} array2 is the next array to pick from
 */
 function interlace(array1, array2) {
    const interlacedArray = []
    for (let idx = 0; idx < array1.length && idx < array2.length; idx += 1) {
        interlacedArray.push(array1[idx])
        interlacedArray.push(array2[idx])
    }
    if (array1.length > array2.length) {
        const lastIdx = interlacedArray.length / 2
        interlacedArray.push(array1[lastIdx])
    }
    return interlacedArray
}
