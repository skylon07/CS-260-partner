import { useReducer, useState } from 'react'
import { useConstant } from './hooks'

import './Board.css'

function Board() {
    const [playerMoveMode, cyclePlayerMove] = useReducer(PlayerMoveMode.cycle, PlayerMoveMode.initMode())
    const moveActivePlayer = (cursorList) => {
        // TODO
    }

    const mousePlayerController = useConstant(() => new MouseDragPlayerController(), [])
    mousePlayerController.onSubmitPath = moveActivePlayer
    if (playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER) {
        mousePlayerController.enableListening()
    } else {
        mousePlayerController.disableListening()
    }

    const mouseTokenController = useConstant(() => new MouseDragTokenController(), [])
    if (playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN) {
        mouseTokenController.enableListening()
    } else {
        mouseTokenController.disableListening()
    }

    const boardSquareRows = []
    for (let rowIdx = 0; rowIdx < 4; rowIdx += 1) {
        const boardSquares = []
        for (let colIdx = 0; colIdx < 4; colIdx += 1) {
            const mouseHandler = mousePlayerController.createHandler(rowIdx, colIdx)
            const boardSquare = <BoardSquare
                key={`${rowIdx},${colIdx}`}
                mouseHandler={mouseHandler}
            />
            boardSquares.push(boardSquare)
        }

        const boardSquareRow = <div
            className="Board-Row"
            key={rowIdx}
        >
            {boardSquares}
        </div>
        boardSquareRows.push(boardSquareRow)
    }

    return <div className="Board">
        {boardSquareRows}
    </div>
}

export default Board

function BoardSquare({ mouseHandler }) {
    const [selected, setSelected] = useState(false)

    const exposedState = { selected, setSelected }

    const selectedClass = selected ? "selected" : ""
    return <div
        className={`BoardSquare ${selectedClass}`}
        onMouseDown={() => mouseHandler?.mouseDown(exposedState)}
        onMouseOver={() => mouseHandler?.mouseOver(exposedState)}
        onMouseUp={() => mouseHandler?.mouseUp(exposedState)}
    ></div>
}

/**
 * Abstract class that controls the logic for selection updates
 * for differing kinds of components
 */
class MouseDragController {
    static MOVE_LEFT = "MOVE_LEFT"
    static MOVE_RIGHT = "MOVE_RIGHT"
    static MOVE_UP = "MOVE_UP"
    static MOVE_DOWN = "MOVE_DOWN"
    static MOVE_STILL = "MOVE_STILL"
    static MOVE_REL_FORWARD = "MOVE_REL_FORWARD"
    static MOVE_REL_LEFT = "MOVE_REL_LEFT"
    static MOVE_REL_RIGHT = "MOVE_REL_RIGHT"
    static MOVE_REL_BACKWARD = "MOVE_REL_BACKWARD"
    static __createHandlerKey = ["restricts handler creation to the controller"]

    constructor() {
        this.__handlers = []
        this.__isListening = true
    }

    // event handlers to be overridden on/after instance constructon
    onSubmitPath(cursorList) { }

    /**
     * Constructs a new `MouseSelectHandler` bound to this `MouseDragController`
     * @param {number} rowIdx is the `rowIdx` of the `BoardSquare` created
     * @param {number} colIdx is the `colIdx` of the `BoardSquare` created
     * @returns a `MouseSelectHandler` instance
     */
    createHandler(rowIdx, colIdx) {
        const mouseHandler = new MouseDragController.MouseSelectHandler(rowIdx, colIdx, MouseDragController.__createHandlerKey)
        mouseHandler.onMouseDown = this._bindHandlerCallback(this.handlerMouseDown)
        mouseHandler.onMouseOver = this._bindHandlerCallback(this.handlerMouseOver)
        mouseHandler.onMouseUp = this._bindHandlerCallback(this.handlerMouseUp)
        this.__handlers.push(mouseHandler)
        return mouseHandler
    }

    _bindHandlerCallback(handlerCallback) {
        handlerCallback = handlerCallback.bind(this)
        return (...args) => {
            if (this.__isListening) {
                handlerCallback(...args)
            }
        }
    }

    enableListening() {
        this.__isListening = true
    }

    disableListening() {
        this.__isListening = false
    }

    // abstract methods to implement by subclasses
    handlerMouseDown(mouseHandler, squareState) { }
    handlerMouseOver(mouseHandler, squareState) { }
    handlerMouseUp(mouseHandler, squareState) { }

    /**
     * Provides an interface for the MouseDragController to handle
     * a specific BoardSquare
     */
    static MouseSelectHandler = class {
        constructor(rowIdx, colIdx, controllerKey = null) {
            if (controllerKey !== MouseDragController.__createHandlerKey) {
                throw new Error("Cannot construct MouseSelectHandler; Use MouseDragController().createHandler() instead")
            }

            this._rowIdx = rowIdx
            this._colIdx = colIdx
        }

        get cursor() {
            return {
                rowIdx: this._rowIdx,
                colIdx: this._colIdx,
            }
        }

        

        // "input" handler functions (called by a BoardSquare)
        mouseDown(squareState) {
            this.onMouseDown(this, squareState)
        }

        mouseOver(squareState) {
            this.onMouseOver(this, squareState)
        }

        mouseUp(squareState) {
            this.onMouseUp(this, squareState)
        }

        // event listener functions (set by a MouseDragController)
        onMouseDown(mouseHandler, squareState) { }
        onMouseOver(mouseHandler, squareState) { }
        onMouseUp(mouseHandler, squareState) { }
    }
}

/**
 * Controls the selection logic for moving a player piece
 */
class MouseDragPlayerController extends MouseDragController {
    constructor() {
        super()
        this._selectedSquares = []
        this._cursorStack = []
        this._cursorLost = false
    }

    handlerMouseDown(mouseHandler, squareState) {
        this._cursorStack.push(mouseHandler.cursor)
        squareState.setSelected(true)
        this._selectedSquares.push(squareState)
    }

    handlerMouseOver(mouseHandler, squareState) {
        const isSelecting = this._cursorStack.length > 0
        if (isSelecting) {
            if (!this._cursorLost) {
                if (!this._cursorBacktracked(mouseHandler.cursor)) {
                    this._cursorStack.push(mouseHandler.cursor)
                    const [forwardCount, sideCount] = this._calcCursorDirCounts()
                    const isValidSubPath = forwardCount <= 2 && sideCount <= 1
                    if (isValidSubPath) {
                        squareState.setSelected(true)
                        this._selectedSquares.push(squareState)
                    } else {
                        // pop() since we pushed above for _calcCursorDirCounts()
                        // and it's an invalid cursor
                        this._cursorStack.pop()
                        this._cursorLost = true
                    }
                } else {
                    this._cursorStack.pop()
                    const lastSelectedSquare = this._selectedSquares.pop()
                    lastSelectedSquare.setSelected(false)
                }
            } else {
                const lastGoodCursor = this._cursorStack[this._cursorStack.length - 1]
                const rowsEq = mouseHandler.cursor.rowIdx === lastGoodCursor.rowIdx
                const colsEq = mouseHandler.cursor.colIdx === lastGoodCursor.colIdx
                this._cursorLost = !(rowsEq && colsEq)
            }
        }
    }

    handlerMouseUp(mouseHandler, squareState) {
        const [forwardCount, sideCount] = this._calcCursorDirCounts()
        const isValidElPath = forwardCount === 2 && sideCount === 1
        if (isValidElPath && !this._cursorLost) {
            // DEBUG
            console.log("SUBMITED!")
            this.onSubmitPath(this._cursorStack)
        }

        for (const selectedSquareState of this._selectedSquares) {
            selectedSquareState.setSelected(false)
        }
        this._cursorStack = []
        this._cursorLost = false
    }

    _cursorBacktracked(newCursor) {
        if (this._cursorStack.length < 2) {
            return false
        }
        const cursorBehind = this._cursorStack[this._cursorStack.length - 2]
        const rowsEq = cursorBehind.rowIdx === newCursor.rowIdx
        const colsEq = cursorBehind.colIdx === newCursor.colIdx
        return rowsEq && colsEq
    }

    _calcCursorDirCounts() {
        let forwardCount = 0
        let sideCount = 0

        let lastCursor = null
        let lastMove = null
        for (const cursor of this._cursorStack) {
            const move = this._getAbsMoveDirection(lastCursor, cursor)
            const relDir = this._getRelMoveDirection(lastMove, move)

            if (relDir === MouseDragController.MOVE_REL_FORWARD) {
                forwardCount += 1
            } else if (relDir === MouseDragController.MOVE_REL_LEFT || relDir === MouseDragController.MOVE_REL_RIGHT) {
                sideCount += 1
            }

            lastCursor = cursor
            lastMove = move
        }

        return [forwardCount, sideCount]
    }

    _getAbsMoveDirection(fromCursor, toCursor) {
        if (fromCursor === null || toCursor === null) {
            return null
        }

        const rowDiff = toCursor.rowIdx - fromCursor.rowIdx
        const colDiff = toCursor.colIdx - fromCursor.colIdx
        if (rowDiff === 0) {
            if (colDiff === 0) {
                return MouseDragController.MOVE_STILL
            } else if (colDiff === -1) {
                return MouseDragController.MOVE_LEFT
            } else if (colDiff === 1) {
                return MouseDragController.MOVE_RIGHT
            }
        } else if (colDiff === 0) {
            if (rowDiff === -1) {
                return MouseDragController.MOVE_UP
            } else if (rowDiff === 1) {
                return MouseDragController.MOVE_DOWN
            }
        }

        console.error("Internal MouseDragController Error -- cursors were not single-step")
        return null
    }

    _getRelMoveDirection(lastMove, currMove) {
        if (currMove === null) {
            return null
        }

        if (lastMove === currMove || lastMove === null) {
            return MouseDragController.MOVE_REL_FORWARD
        }

        const leftTurns = {
            [MouseDragController.MOVE_LEFT]: MouseDragController.MOVE_DOWN,
            [MouseDragController.MOVE_RIGHT]: MouseDragController.MOVE_UP,
            [MouseDragController.MOVE_UP]: MouseDragController.MOVE_LEFT,
            [MouseDragController.MOVE_DOWN]: MouseDragController.MOVE_RIGHT,
        }
        const isLeftTurn = leftTurns[lastMove] === currMove
        if (isLeftTurn) {
            return MouseDragController.MOVE_REL_LEFT
        }

        const rightTurns = {
            [MouseDragController.MOVE_LEFT]: MouseDragController.MOVE_UP,
            [MouseDragController.MOVE_RIGHT]: MouseDragController.MOVE_DOWN,
            [MouseDragController.MOVE_UP]: MouseDragController.MOVE_RIGHT,
            [MouseDragController.MOVE_DOWN]: MouseDragController.MOVE_LEFT,
        }
        const isRightTurn = rightTurns[lastMove] === currMove
        if (isRightTurn) {
            return MouseDragController.MOVE_REL_RIGHT
        }

        return MouseDragController.MOVE_REL_BACKWARD
    }
}

/**
 * Controls the selection logic for moving a token
 */
class MouseDragTokenController extends MouseDragController {
    // TODO
}

class PlayerMoveMode {
    static PLAYER_RED = "PLAYER_RED"
    static PLAYER_BLUE = "PLAYER_BLUE"
    static MODE_MOVE_PLAYER = "MODE_MOVE_PLAYER"
    static MODE_MOVE_TOKEN = "MODE_MOVE_TOKEN"

    /**
     * Cycles a `PlayerMoveMode` to the next game state.
     * Intended to be a reducer for the `Board` component.
     * @param {PlayerMoveMode} playerMoveMode is the current state of the board
     * @returns the next `PlayerMoveMode` game state
     */
    static cycle(playerMoveMode) {
        const newPlayer = playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN ?
            this._opposite(playerMoveMode.player) : playerMoveMode.player
        const newMoveMode = this._opposite(playerMoveMode.moveMode)
        return new PlayerMoveMode(newPlayer, newMoveMode)
    }

    static initMode() {
        return new PlayerMoveMode(PlayerMoveMode.PLAYER_BLUE, PlayerMoveMode.MODE_MOVE_PLAYER)
    }

    static _opposite(playerOrMoveMode) {
        const oppositeMap = {
            [PlayerMoveMode.PLAYER_RED]: PlayerMoveMode.PLAYER_BLUE,
            [PlayerMoveMode.PLAYER_BLUE]: PlayerMoveMode.PLAYER_RED,
            [PlayerMoveMode.MODE_MOVE_PLAYER]: PlayerMoveMode.MODE_MOVE_TOKEN,
            [PlayerMoveMode.MODE_MOVE_TOKEN]: PlayerMoveMode.MODE_MOVE_PLAYER,
        }
        return oppositeMap[playerOrMoveMode]
    }

    constructor(player, moveMode) {
        this._player = player
        this._moveMode = moveMode
    }

    get player() {
        return this._player
    }

    get moveMode() {
        return this._moveMode
    }
}
