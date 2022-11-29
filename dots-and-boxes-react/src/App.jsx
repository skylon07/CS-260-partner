import { useEffect, useState, useRef } from 'react'
import axios from 'axios'

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

    const [boardShape, setBoardShape] = useBoardShape()
    const updateBoardShape = (newBoardShape) => {
        setBoardShape(newBoardShape)
        resetGame()
    }
    
    // TODO: refactor below code (until end TODO) into custom hook
    const [availableBoardShapes, setAvailableBoardShapes] = useState([
        FillArray.fromArray([
            [true, true, true],
            [true, true, true],
            [true, true, true],
        ]),
        FillArray.fromArray([
            [true, true, true, true],
            [true, true, true, true],
            [true, true, true, true],
            [true, true, true, true],
        ]),
        FillArray.fromArray([
            [true, true, true, true, true],
            [true, true, true, true, true],
            [true, true, true, true, true],
            [true, true, true, true, true],
            [true, true, true, true, true],
        ]),
    ])
    const apiBoardsFetchedRef = useRef(false)
    useEffect(() => {
        if (!apiBoardsFetchedRef.current) {
            const asyncCallback = async () => {
                const response = await axios.get('/api/boards')
                const boardShapes = response.data.map((responseBoard) => {
                    const boardArray = responseBoard.board
                    if (boardArray.length === 0) {
                        return null
                    } else {
                        return FillArray.fromArray(boardArray)
                    }
                }).filter((item) => item !== null)
                setAvailableBoardShapes((availableBoardShapes) => availableBoardShapes.concat(boardShapes))
            }
            asyncCallback()
            apiBoardsFetchedRef.current = true
        }
    }, [apiBoardsFetchedRef])
    const recordNewBoard = async (newBoardShape) => {
        setAvailableBoardShapes((availableBoardShapes) => availableBoardShapes.concat([newBoardShape]))
        try {
            await axios.post('/api/boards', {board: newBoardShape.asArray()})
        } catch (error) {
            console.error(`Error when posting board: ${error}`)
        }
    }
    // (end TODO code block)

    const alertedOnPlayerNamesRef = useRef(false)
    useEffect(() => {
        if (!alertedOnPlayerNamesRef.current) {
            setTimeout(() => {
                alert("Click and edit the player names to save your progress!")
            }, 300)
            alertedOnPlayerNamesRef.current = true
        }
    }, [alertedOnPlayerNamesRef])

    return <div className="App">
        <ResettableApp
            key={resetCount}
            resetGame={resetGame}
            boardShape={boardShape}
            availableBoardShapes={availableBoardShapes}
            onSubmitNewBoard={(newBoardShape) => {
                recordNewBoard(newBoardShape)
                updateBoardShape(newBoardShape)
            }}
            onSelectBoard={updateBoardShape}
        />
    </div>
}

function ResettableApp({resetGame, boardShape, availableBoardShapes, onSubmitNewBoard, onSelectBoard}) {
    const [initNumRows] = useState(boardShape.numRows)
    const [initNumCols] = useState(boardShape.numCols)
    if (boardShape.numRows !== initNumRows || boardShape.numCols !== initNumCols) {
        throw new Error("BoardShape cannot change size across renders")
    }

    const [activateEditor, editorElem] = useEditor(onSubmitNewBoard)
    const [activateBoardSelector, boardSelectorElem] = useBoardSelector(onSelectBoard, availableBoardShapes)

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

    const [playerBlueName, setPlayerBlueName] = useState(null)
    const [playerRedName, setPlayerRedName] = useState(null)
    const onPlayerNameChange = async (player, newName) => {
        if (player === Player.PLAYER_BLUE) {
            setPlayerBlueName(newName)
        } else {
            setPlayerRedName(newName)
        }  
    }
    const playerNames = {}
    if (playerBlueName !== null) {
        playerNames.playerBlueName = playerBlueName
    }
    if (playerRedName !== null) {
        playerNames.playerRedName = playerRedName
    }
    
    const {
        [Player.PLAYER_BLUE]: playerBluePoints,
        [Player.PLAYER_RED]: playerRedPoints,
    } = playerPoints
    const winningPlayer = playerBluePoints > playerRedPoints ?
        Player.PLAYER_BLUE : playerRedPoints > playerBluePoints ?
        Player.PLAYER_RED : null

    const showPlayerTurn = !gameFinished

    useEffect(() => {
        if (gameFinished) {
            if (winningPlayer === Player.PLAYER_BLUE && playerBlueName !== null) {
                axios.put(`/api/players/win/${playerBlueName}`)
                axios.put(`/api/players/lose/${playerRedName}`)
            } else if (winningPlayer === Player.PLAYER_RED && playerRedName !== null) {
                axios.put(`/api/players/win/${playerRedName}`)
                axios.put(`/api/players/lose/${playerBlueName}`)
            }
        }
    }, [gameFinished, winningPlayer, playerBlueName, playerRedName])
    
    return <div className="ResettableApp">
        {renderGameOver(gameFinished, winningPlayer, resetGame)}
        <button
            className="ResettableApp-EditorButton"
            onClick={activateEditor}
        >
            Editor
        </button>
        {editorElem}
        <button
            className="ResettableApp-SelectBoardButton"
            onClick={activateBoardSelector}
        >
            Select
        </button>
        {boardSelectorElem}
        <InfoBar
            currPlayer={showPlayerTurn && currPlayerTurn}
            {...playerNames}
            playerBlueScore={playerBluePoints}
            playerRedScore={playerRedPoints}
            onPlayerNameChange={onPlayerNameChange}
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

function useBoardShape() {
    const [fillArray, setFillArray] = useState(() => new FillArray(5, 5, // 5, 8,
        (row, col) => true // (row !== 0 && row !== 4) || (col !== 3 && col !== 4)
    ))

    return [fillArray, setFillArray]
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

function useEditor(onSubmitNewBoard) {
    const [editorNavState, setEditorNavState] = useState(0)
    const [editorDimensions, setEditorDimensions] = useState(null)
    const editorRowsRef = useRef(null)
    const editorColsRef = useRef(null)
    const editorBoardRef = useRef(null)
    const [selectedBoardShape, setSelectedBoardShape] = useState(null)
    
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
                <div className="ResettableApp-Modal-Title">Customize your board</div>
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

        const trySubmitBoard = async () => {
            const boardInputs = Array.from(editorBoardRef.current.children)
            const boardFills = boardInputs.map((row) => Array.from(row.children).map((input) => input.checked))
            const fillArray = FillArray.fromArray(boardFills)
            setSelectedBoardShape(fillArray)
            setEditorDimensions(null)
            setEditorNavState(3)
        }
        const cancelEditor = () => {
            setEditorDimensions(null)
            setEditorNavState(0)
        }

        return [
            activateEditor,
            <div className="ResettableApp-Modal">
                <div className="ResettableApp-Modal-Title">Customize your board</div>
                <div className="ResettableApp-Modal-BoardInputs" ref={editorBoardRef}>
                    {editorBoardInputs}
                </div>
                <div className="ResettableApp-Modal-BottomButtonGroup">
                    <button onClick={trySubmitBoard}>Submit</button>
                    <span style={{margin: "5vw"}} />
                    <button onClick={cancelEditor}>Cancel</button>
                </div>
            </div>
        ]
    } else if (editorNavState === 3) {
        const cancelConfirm = () => {
            setSelectedBoardShape(null)
            setEditorNavState(2)
        }
        const submitNewBoardShape = async () => {
            onSubmitNewBoard(selectedBoardShape)
            setSelectedBoardShape(null)
            setEditorNavState(0)
        }
        
        return [
            activateEditor,
            <div className="ResettableApp-Modal">
                <div className="ResettableApp-Modal-Title">Are you sure?</div>
                <p style={{fontSize: "50%"}}>This will clear your current game!</p>
                <div className="ResettableApp-Modal-BottomButtonGroup">
                    <button onClick={submitNewBoardShape}>Submit</button>
                    <span style={{margin: "5vw"}} />
                    <button onClick={cancelConfirm}>Cancel</button>
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

function useBoardSelector(onSelectBoard, availableBoardShapes) {
    const [boardSelectorNavState, setBoardSelectorNavState] = useState(0)
    const [selectedBoardShape, setSelectedBoardShape] = useState(null)

    const activateBoardSelector = () => setBoardSelectorNavState(1)

    if (boardSelectorNavState === 0) {
        return [activateBoardSelector, null]
    } else if (boardSelectorNavState === 1) {
        const selectBoardShape = (boardShape) => {
            setSelectedBoardShape(boardShape)
            setBoardSelectorNavState(2)
        }
        const cancelEditor = () => {
            setSelectedBoardShape(null)
            setBoardSelectorNavState(0)
        }

        const boardElems = availableBoardShapes.map((boardShape, boardShapeIdx) => {
            const squareRows = boardShape.mapRows((row, rowIdx) => {
                const squareElems = row.map((filled, colIdx) => {
                    const filledClass = filled ? "filled" : ""
                    return <div
                        className={`ResettableApp-Modal-BoardShape-Square ${filledClass}`}
                        key={`${rowIdx},${colIdx}`}
                    />
                })
                return <div className="ResettableApp-Modal-BoardShape-Row" key={rowIdx}>
                    {squareElems}
                </div>
            })

            const selectThisBoardShape = () => {
                selectBoardShape(boardShape)
            }

            return <div className="ResettableApp-Modal-BoardShape" key={boardShapeIdx}>
                <div>
                    {squareRows}
                </div>
                <button onClick={selectThisBoardShape}>Select</button>
            </div>
        })

        return [
            activateBoardSelector,
            <div className="ResettableApp-Modal">
                <div className="ResettableApp-Modal-Title">Select your board</div>
                <div className="ResettableApp-Modal-BoardSelection">
                    {boardElems}
                </div>
                <div className="ResettableApp-Modal-BottomButtonGroup">
                    <button onClick={cancelEditor}>Cancel</button>
                </div>
            </div>
        ]
    } else if (boardSelectorNavState === 2) {
        const submitNewBoardShape = () => {
            onSelectBoard(selectedBoardShape)
            setSelectedBoardShape(null)
            setBoardSelectorNavState(0)
        }
        const cancelConfirm = () => {
            setSelectedBoardShape(null)
            setBoardSelectorNavState(1)
        }
        
        return [
            activateBoardSelector,
            <div className="ResettableApp-Modal">
                <div className="ResettableApp-Modal-Title">Are you sure?</div>
                <p style={{fontSize: "50%"}}>This will clear your current game!</p>
                <div className="ResettableApp-Modal-BottomButtonGroup">
                    <button onClick={submitNewBoardShape}>Submit</button>
                    <span style={{margin: "5vw"}} />
                    <button onClick={cancelConfirm}>Cancel</button>
                </div>
            </div>
        ]
    } else {
        const cancelEditor = () => {
            setBoardSelectorNavState(0)
        }

        return <div className="ResettableApp-Modal">
            INVALID SELECTOR STATE
            <button onClick={cancelEditor}>Cancel</button>
        </div>
    }
}
