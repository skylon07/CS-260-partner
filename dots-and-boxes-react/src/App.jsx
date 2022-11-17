import { useEffect, useState, useRef } from "react"

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

    const [activateEditor, editorElem] = useEditor()

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
        {editorElem}
        <button
            className="ResettableApp-EditorButton"
            onClick={activateEditor}
        >
            Editor
        </button>
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
        return <div className="ResettableApp-Modal gameover">
            {`${winningPlayerMessage}`}
            <div className="ResettableApp-Modal-Spacer" />
            <button onClick={resetGame}>Play again?</button>
        </div>
    } else {
        return null
    }
}

function useEditor() {
    const [editorNavState, setEditorNavState] = useState(0)
    const [editorDimensions, setEditorDimensions] = useState(null)
    const editorRowsRef = useRef(null)
    const editorColsRef = useRef(null)
    const editorBoardRef = useRef(null)
    
    const activateEditor = () => setEditorNavState(1)

    if (editorNavState === 0) {
        return [activateEditor, null]
    } else if (editorNavState === 1) {
        const submitDimensions = () => {
            const numRows = editorRowsRef.current.value
            const numCols = editorColsRef.current.value
            const numRowsValid = !isNaN(numRows) && numRows > 0 && numRows <= 25
            const numColsValid = !isNaN(numCols) && numCols > 0 && numCols <= 25
            if (numRowsValid && numColsValid) {
                setEditorDimensions({numRows, numCols})
                setEditorNavState(2)
            }
        }
        const cancelEditor = () => {
            setEditorDimensions(null)
            setEditorNavState(0)
        }

        return [
            activateEditor,
            <div className="ResettableApp-Modal">
                <div className="ResettableApp-Modal-Title">Customize your board!</div>
                <div className="ResettableApp-Modal-DimensionsInputs">
                    <input ref={editorRowsRef} placeholder="Rows" />
                    <span style={{margin: "5vw"}}>X</span>
                    <input ref={editorColsRef} placeholder="Cols" />
                </div>
                <div className="ResettableApp-Modal-BottomButtonGroup">
                    <button onClick={submitDimensions}>Submit</button>
                    <span style={{margin: "5vw"}} />
                    <button onClick={cancelEditor}>Cancel</button>
                </div>
            </div>
        ]
    } else if (editorNavState === 2) {
        const {numRows, numCols} = editorDimensions

        const editorBoardInputs = []
        for (let rowIdx = 0; rowIdx < numRows; rowIdx += 1) {
            const rowElems = []
            for (let colIdx = 0; colIdx < numCols; colIdx += 1) {
                const editorInput = <input
                    type="checkbox"
                    defaultChecked
                    key={`${rowIdx},${colIdx}`}
                    style={{
                        width: `calc(20vw / ${numRows})`,
                        height: `calc(20vw / ${numCols})`,
                    }}
                />
                rowElems.push(editorInput)
            }
            const row = <div className="ResettableApp-Modal-BoardInputs-Row" key={`${rowIdx}`}>
                {rowElems}
            </div>
            editorBoardInputs.push(row)
        }

        // TODO: implement database call here somehow
        const submitBoard = () => {
            const boardInputs = Array.from(editorBoardRef.current.children)
            const boardFills = boardInputs.map((row) => Array.from(row.children).map((input) => input.checked))
            const fillArray = FillArray.fromArray(boardFills)
            console.info("Submitted:", fillArray)
            alert(`Oops! Can't submit; no database yet (check logs for an array that would have been submitted)`)
            
            setEditorDimensions(null)
            setEditorNavState(0)
        }
        const cancelEditor = () => {
            setEditorDimensions(null)
            setEditorNavState(0)
        }

        return [
            activateEditor,
            <div className="ResettableApp-Modal">
                <div className="ResettableApp-Modal-Title">Customize your board!</div>
                <div className="ResettableApp-Modal-BoardInputs" ref={editorBoardRef}>
                    {editorBoardInputs}
                </div>
                <div className="ResettableApp-Modal-BottomButtonGroup">
                    <button onClick={submitBoard}>Submit</button>
                    <span style={{margin: "5vw"}} />
                    <button onClick={cancelEditor}>Cancel</button>
                </div>
            </div>
        ]
    } else {
        const cancelEditor = () => {
            setEditorDimensions(null)
            setEditorNavState(0)
        }

        return <div className="ResettableApp-Modal">
            INVALID EDITOR STATE
            <button onClick={cancelEditor}>Cancel</button>
        </div>
    }
}

function useBoardShape() {
    const [fillArray] = useState(() => new FillArray(5, 7,
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
