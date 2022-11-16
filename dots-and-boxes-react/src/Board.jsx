import { BoxBoard, DotsAndBoxesGame, Orientation, Player } from "./gamestate"

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

    const numRowSquares = boardShape.numRows - 1
    const numColSquares = boardShape.numCols - 1
    const [{currPlayerTurn, getLineDrawnBy, getBoxFilledBy}, {takePlayerTurn}] = useDotsAndBoxesGameState(numRowSquares, numColSquares)

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
                    getLineDrawnBy(rowIdx, colIdx, BoxBoard.SIDE_TOP) :
                    getLineDrawnBy(rowIdx - 1, colIdx, BoxBoard.SIDE_BOTTOM)
                const takeTurnUsingLine = !isLastRow ? 
                    () => takePlayerTurn(rowIdx, colIdx, BoxBoard.SIDE_TOP) :
                    () => takePlayerTurn(rowIdx - 1, colIdx, BoxBoard.SIDE_BOTTOM)

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
                    getLineDrawnBy(rowIdx, colIdx, BoxBoard.SIDE_LEFT) : 
                    getLineDrawnBy(rowIdx, colIdx - 1, BoxBoard.SIDE_RIGHT)
                const takeTurnUsingLine = !isLastCol ?
                    () => takePlayerTurn(rowIdx, colIdx, BoxBoard.SIDE_LEFT) :
                    () => takePlayerTurn(rowIdx, colIdx - 1, BoxBoard.SIDE_RIGHT)

                
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
                const player = getBoxFilledBy(rowIdx, colIdx)
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
            .Board {
                --Board-line-size: ${boardLineSize}vw;
            }
        `}</DynamicStyle>
        {interlace(dotAndHorizontalLineElems, verticalLineAndSquareElems)}
    </div>
}

function useDotsAndBoxesGameState(initNumRows, initNumCols) {
    const [game] = useState(() => {
        const game = new DotsAndBoxesGame(initNumRows, initNumCols)
        game.getLineDrawnBy = game.getLineDrawnBy.bind(game)
        game.getBoxFilledBy = game.getBoxFilledBy.bind(game)
        game.takeTurnDrawing = game.takeTurnDrawing.bind(game)
        return game
    })
    
    const currPlayerTurn = game.currPlayer
    // TODO: what is the react-y way of not depending on game state like this?
    const {getLineDrawnBy, getBoxFilledBy} = game

    const [takeTurnDrawingArgs, setTakeTurnDrawingArgs] = useState(null)
    useEffect(() => {
        if (takeTurnDrawingArgs !== null) {
            const [row, col, side] = takeTurnDrawingArgs
            game.takeTurnDrawing(row, col, side)
            setTakeTurnDrawingArgs(null)
        }
    }, [takeTurnDrawingArgs, game])
    const takePlayerTurn = (...args) => setTakeTurnDrawingArgs(args)

    return [{currPlayerTurn, getLineDrawnBy, getBoxFilledBy}, {takePlayerTurn}]
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
