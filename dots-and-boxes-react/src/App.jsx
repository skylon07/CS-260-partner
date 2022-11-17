import { useEffect, useState } from "react"

import { DotsAndBoxesGame, Player } from "./gamestate"
import FillArray from './FillArray'

import Board from './Board'
import InfoBar from "./InfoBar"

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

function ResettableApp({resetGame}) {
    const boardShape = useBoardShape()

    const [initNumRows] = useState(boardShape.numRows)
    const [initNumCols] = useState(boardShape.numCols)
    if (boardShape.numRows !== initNumRows || boardShape.numCols !== initNumCols) {
        throw new Error("BoardShape cannot change size across renders")
    }

    const [
        {
            currPlayerTurn,
            getLineDrawnBy,
            getBoxFilledBy,
            gameFinished,
            playerPoints,
        },
        {takePlayerTurn}
    ] = useDotsAndBoxesGameState(boardShape)
    
    const {
        [Player.PLAYER_BLUE]: playerBluePoints,
        [Player.PLAYER_RED]: playerRedPoints,
    } = playerPoints
    const winningPlayer = playerBluePoints > playerRedPoints ?
        Player.PLAYER_BLUE : playerRedPoints > playerBluePoints ?
        Player.PLAYER_RED : null

    const showPlayerTurn = !gameFinished
    
    return <div className="ResettableApp">
        {renderGameOver(gameFinished, winningPlayer, resetGame)}
        <InfoBar
            currPlayer={showPlayerTurn && currPlayerTurn}
            playerBlueScore={playerBluePoints}
            playerRedScore={playerRedPoints}
        />
        <Board
            boardShape={boardShape}
            currPlayerTurn={currPlayerTurn}
            getLineOwner={getLineDrawnBy}
            getBoxOwner={getBoxFilledBy}
            onLineClick={takePlayerTurn}
        />
    </div>
}

function renderGameOver(gameFinished, winningPlayer, resetGame) {
    if (gameFinished) {
        const winningPlayerMessage = winningPlayer === Player.PLAYER_BLUE ?
        "Player Blue won!" : winningPlayer === Player.PLAYER_RED ?
        "Player Red won!" : "It's a tie!"
        return <div className="ResettableApp-GameOver">
            {`${winningPlayerMessage}`}
            <button onClick={resetGame}>Play again?</button>
        </div>
    } else {
        return null
    }
}

function useBoardShape() {
    const [fillArray] = useState(() => new FillArray(3, 5,
        (row, col) => (row !== 1 && row !== 3) ||
            (col !== 2 && col !== 6))
    )
    return fillArray
}

function useDotsAndBoxesGameState(boardShape) {
    const [game] = useState(() => {
        const game = new DotsAndBoxesGame(boardShape)
        game.getLineDrawnBy = game.getLineDrawnBy.bind(game)
        game.getBoxFilledBy = game.getBoxFilledBy.bind(game)
        game.takeTurnDrawing = game.takeTurnDrawing.bind(game)
        return game
    })
    
    const currPlayerTurn = game.currPlayer
    const gameFinished = game.getGameFinished()
    const playerPoints = game.getPlayerPoints()
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

    return [{currPlayerTurn, getLineDrawnBy, getBoxFilledBy, gameFinished, playerPoints}, {takePlayerTurn}]
}
