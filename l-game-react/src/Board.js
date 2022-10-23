import { useReducer, useState } from 'react'
import { useConstant } from './hooks'

import { PlayerMoveMode, Position, PlayerPosition } from './gamestate'

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
            const position = new Position(rowIdx, colIdx)
            const mouseHandler = mousePlayerController.getHandler(position)
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
    static __createHandlerKey = ["restricts handler creation to the controller"]

    constructor() {
        this.__handlers = []
        this.__isListening = true
    }

    // event handlers to be overridden on/after instance constructon
    onSubmitPath(playerPosition) { }

    /**
     * Constructs a new `MouseSelectHandler` bound to this `MouseDragController`
     * @param {Position} position is the position the handler activates for the cursor
     * @returns a `MouseSelectHandler` instance
     */
    createHandler(cursor) {
        const mouseHandler = new MouseDragController.MouseSelectHandler(cursor, MouseDragController.__createHandlerKey)
        mouseHandler.onMouseDown = this._bindHandlerCallback(this.handlerMouseDown)
        mouseHandler.onMouseOver = this._bindHandlerCallback(this.handlerMouseOver)
        mouseHandler.onMouseUp = this._bindHandlerCallback(this.handlerMouseUp)
        this.__handlers.push(mouseHandler)
        return mouseHandler
    }

    getHandler(cursor) {
        const matchingHandlers = this.__handlers.filter(
            (handler) => handler.cursor.equals(cursor)
        )
        return matchingHandlers[0]
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
     * Provides an interface for the MouseDragController to
     * handle cursor interactions
     */
    static MouseSelectHandler = class {
        constructor(cursor, controllerKey = null) {
            if (controllerKey !== MouseDragController.__createHandlerKey) {
                throw new Error("Cannot construct MouseSelectHandler; Use MouseDragController().createHandler() instead")
            }

            this._cursor = cursor
        }

        get cursor() {
            return this._cursor
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
                this._cursorLost = !mouseHandler.cursor.equals(lastGoodCursor)
            }
        }
    }

    handlerMouseUp(mouseHandler, squareState) {
        const [forwardCount, sideCount] = this._calcCursorDirCounts()
        const isValidElPath = forwardCount === 2 && sideCount === 1
        if (isValidElPath && !this._cursorLost) {
            this.onSubmitPath(PlayerPosition.fromPositionPath(this._cursorStack))
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
        return cursorBehind.equals(newCursor)
    }

    _calcCursorDirCounts() {
        let forwardCount = 0
        let sideCount = 0

        let lastCursor = null
        let lastMove = null
        for (const cursor of this._cursorStack) {
            const move = Position.getAbsMoveDirection(lastCursor, cursor)
            const relDir = Position.getRelMoveDirection(lastMove, move)

            if (relDir === Position.MOVE_REL_FORWARD) {
                forwardCount += 1
            } else if (relDir === Position.MOVE_REL_LEFT || relDir === Position.MOVE_REL_RIGHT) {
                sideCount += 1
            }

            lastCursor = cursor
            lastMove = move
        }

        return [forwardCount, sideCount]
    }
}

/**
 * Controls the selection logic for moving a token
 */
class MouseDragTokenController extends MouseDragController {
    // TODO
}
