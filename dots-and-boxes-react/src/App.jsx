import { useEffect, useState } from "react"

import { DotsAndBoxesGame } from "./gamestate"

import Board from './Board'
import FillArray from './FillArray'

import './App.css'

export default function App() {
    const [resetCount, setResetCount] = useState(0)
    const resetGame = () => {
        setResetCount((resetCount) => resetCount + 1)
    }

    return <div className="App">
        <ResettableApp
            key={resetCount}
            resetGame={resetGame}
        />
    </div>
}

function ResettableApp() {
    const boardShape = useBoardShape()

    const [initNumRows] = useState(boardShape.numRows)
    const [initNumCols] = useState(boardShape.numCols)
    if (boardShape.numRows !== initNumRows || boardShape.numCols !== initNumCols) {
        throw new Error("BoardShape cannot change size across renders")
    }

    const numRowSquares = boardShape.numRows - 1
    const numColSquares = boardShape.numCols - 1
    const [{currPlayerTurn, getLineDrawnBy, getBoxFilledBy}, {takePlayerTurn}] = useDotsAndBoxesGameState(numRowSquares, numColSquares)

    return <div className="ResettableApp">
        <Board
            boardShape={boardShape}
            currPlayerTurn={currPlayerTurn}
            getLineOwner={getLineDrawnBy}
            getBoxOwner={getBoxFilledBy}
            onLineClick={takePlayerTurn}
        />
    </div>
}

function useBoardShape() {
    const [fillArray] = useState(() => new FillArray(4, 7,
        (row, col) => (row !== 1 && row !== 3) ||
            (col !== 2 && col !== 6))
    )
    return fillArray
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
