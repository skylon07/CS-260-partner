import { BoxBoard, Orientation, Player } from "./gamestate"

import Dot from "./Dot"
import SelectableLine from "./SelectableLine"
import FillableBox from "./FillableBox"
import DynamicStyle from "./DynamicStyle"

import './Board.css'
import { useEffect, useState } from "react"

/**
 * @param {{
 *      boardShape: FillArray
 * }} props
 * 
 * @typedef {import('./FillArray').default} FillArray
 */
export default function Board({boardShape}) {
    const [initNumRows] = useState(boardShape.numRows)
    const [initNumCols] = useState(boardShape.numCols)
    if (boardShape.numRows !== initNumRows || boardShape.numCols !== initNumCols) {
        throw new Error("BoardShape cannot change size across renders")
    }

    const numSquaresInACol = boardShape.numRows - 1
    const numSquaresInARow = boardShape.numCols - 1
    const [getBoxDrawn, getLineDrawn, drawLine] = useBoxBoard(numSquaresInACol, numSquaresInARow)

    const dotAndHorizontalLineElems = boardShape.mapRows((row, rowIdx) => {
        const dotElems = row.map((fill, colIdx) => {
            return <Dot
                key={`Dot${rowIdx},${colIdx}`}
                filled={fill}
            />
        })
        const lineElems = row.map((fill, colIdx) => {
            const isHangingLine = colIdx === numSquaresInARow
            if (!isHangingLine) {
                const leftDotIdx = colIdx 
                const leftDotFilled = boardShape.isFilledAt(rowIdx, leftDotIdx)
                const rightDotIdx = colIdx + 1
                const rightDotFilled = boardShape.isFilledAt(rowIdx, rightDotIdx)
                const isSelectable = leftDotFilled && rightDotFilled
                
                const isLastRow = rowIdx === numSquaresInACol
                const isSelected = !isLastRow ?
                    getLineDrawn(rowIdx, colIdx, BoxBoard.SIDE_TOP) :
                    getLineDrawn(rowIdx - 1, colIdx, BoxBoard.SIDE_BOTTOM)
                const setSelected = !isLastRow ? 
                    () => drawLine(rowIdx, colIdx, BoxBoard.SIDE_TOP) :
                    () => drawLine(rowIdx - 1, colIdx, BoxBoard.SIDE_BOTTOM)
    
                return <SelectableLine
                    key={`SelectableLine${rowIdx},${colIdx}`}
                    orientation={Orientation.HORIZONTAL}
                    disabled={!isSelectable}
                    selectedByPlayer={isSelected ? Player.PLAYER_BLUE : null}
                    onClick={setSelected}
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
            const isHangingLine = rowIdx === numSquaresInACol
            if (!isHangingLine) {
                const topDotIdx = rowIdx
                const topDotFilled = boardShape.isFilledAt(topDotIdx, colIdx)
                const bottomDotIdx = rowIdx + 1
                const bottomDotFilled = boardShape.isFilledAt(bottomDotIdx, colIdx)
                const isSelectable = topDotFilled && bottomDotFilled

                const isLastCol = colIdx === numSquaresInARow
                const isSelected = !isLastCol ? 
                    getLineDrawn(rowIdx, colIdx, BoxBoard.SIDE_LEFT) : 
                    getLineDrawn(rowIdx, colIdx - 1, BoxBoard.SIDE_RIGHT)
                const setSelected = !isLastCol ?
                    () => drawLine(rowIdx, colIdx, BoxBoard.SIDE_LEFT) :
                    () => drawLine(rowIdx, colIdx - 1, BoxBoard.SIDE_RIGHT)
                
                return <SelectableLine
                    key={`SelectableLine${rowIdx},${colIdx}`}
                    orientation={Orientation.VERTICAL}
                    disabled={!isSelectable}
                    selectedByPlayer={isSelected ? Player.PLAYER_BLUE : null}
                    onClick={setSelected}
                />
            } else {
                return null
            }
        })
        const squareElems = row.map((fill, colIdx) => {
            const isHangingSquare = rowIdx === numSquaresInACol || colIdx === numSquaresInARow
            if (!isHangingSquare) {
                const player = getBoxDrawn(rowIdx, colIdx) ? Player.PLAYER_BLUE : null
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
    
    const boardLineSize = 30 / boardShape.numCols
    
    return <div className="Board">
        <DynamicStyle>{`
            .Board {
                --Board-line-size: ${boardLineSize}vw;
            }
        `}</DynamicStyle>
        {interlace(dotAndHorizontalLineElems, verticalLineAndSquareElems)}
    </div>
}

function useBoxBoard(initNumRows, initNumCols) {
    const [boxBoard] = useState(() => {
        const boxBoard = new BoxBoard(initNumRows, initNumCols)
        boxBoard.isBoxDrawn = boxBoard.isBoxDrawn.bind(boxBoard)
        boxBoard.isLineDrawn = boxBoard.isLineDrawn.bind(boxBoard)
        return boxBoard
    })

    const [lineToDraw, setLineToDraw] = useState(null)

    useEffect(() => {
        if (lineToDraw !== null) {
            const [row, col, side] = lineToDraw
            boxBoard.drawLine(row, col, side, !boxBoard.isLineDrawn(row, col, side))
            setLineToDraw(null)
        }
    }, [boxBoard, lineToDraw])

    const getBoxDrawn = boxBoard.isBoxDrawn
    const getLineDrawn = boxBoard.isLineDrawn
    const drawLine = (...args) => setLineToDraw(args)
    return [getBoxDrawn, getLineDrawn, drawLine]
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
