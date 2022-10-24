import { useEffect, useState } from 'react'
import { useConstant } from './hooks'

import { PlayerMoveMode, Position, PlayerPosition } from './gamestate'

import PlayerPiece from './PlayerPiece'
import NeutralToken from './NeutralToken'

import './Board.css'

export default function Board({playerMoveMode, piecePositions, onPlayerMove, onTokenMove}) {
    const onSubmitPlayerMove = (newPlayerPosition) => {
        if (!checkOverlap(newPlayerPosition, piecePositions)) {
            onPlayerMove(newPlayerPosition)
        }
    }
    const playerMouseController = usePlayerMouseController(playerMoveMode, onSubmitPlayerMove)

    const onSubmitTokenMove = (tokenNum, newTokenPosition) => {
        if (!checkOverlap(newTokenPosition)) {
            onTokenMove(tokenNum, newTokenPosition)
        }
    }
    const tokenMouseController = useTokenMouseController(playerMoveMode, onSubmitTokenMove)

    const boardSquareRows = []
    for (let rowIdx = 0; rowIdx < 4; rowIdx += 1) {
        const boardSquares = []
        for (let colIdx = 0; colIdx < 4; colIdx += 1) {
            const position = new Position(rowIdx, colIdx)
            const mouseHandler = playerMouseController.getHandler(position)
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

    const token1MouseHandler = tokenMouseController.getHandler(1)
    const token2MouseHandler = tokenMouseController.getHandler(2)

    const playerTurnClass = playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE ?
        "player-blue-turn" : "player-red-turn"

    return <div className={`Board ${playerTurnClass}`}>
        {boardSquareRows}
        <PlayerPiece
            position={piecePositions.bluePlayerPiecePosition}
            forPlayer={PlayerMoveMode.PLAYER_BLUE}
        />
        <PlayerPiece
            position={piecePositions.redPlayerPiecePosition}
            forPlayer={PlayerMoveMode.PLAYER_RED}
        />
        <NeutralToken
            position={piecePositions.tokenPiece1Position}
            mouseHandler={token1MouseHandler}
        />
        <NeutralToken
            position={piecePositions.tokenPiece2Position}
            mouseHandler={token2MouseHandler}
        />
    </div>
}

function usePlayerMouseController(playerMoveMode, onSubmitPlayerMove) {
    const controller = useConstant(() => new PlayerMouseDragController(), [])
    
    useEffect(() => {
        controller.onSubmitPlayerMove = onSubmitPlayerMove
        return () => controller.onSubmitPlayerMove = null
    }, [onSubmitPlayerMove, controller])
    
    useEffect(() => {
        if (playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER) {
            controller.enableListening()
        } else {
            controller.disableListening()
        }
    }, [playerMoveMode.moveMode, controller])

    const controllerState = {
        getHandler: useMouseController_getHandler(controller, Position.equals),
    }
    return controllerState
}

function useTokenMouseController(playerMoveMode, onSubmitTokenMove) {
    const controller = useConstant(() => new TokenMouseDragController(), [])
    
    useEffect(() => {
        controller.onSubmitTokenMove = onSubmitTokenMove
        return () => controller.onSubmitPlayerMove = null
    }, [onSubmitTokenMove, controller])
    
    useEffect(() => {
        if (playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN) {
            controller.enableListening()
        } else {
            controller.disableListening()
        }
    }, [playerMoveMode.moveMode, controller])

    const controllerState = {
        getHandler: useMouseController_getHandler(controller),
    }
    return controllerState
}

function useMouseController_getHandler(controller, equalityFn=null) {
    return (id) => {
        let handler = equalityFn !== null ?
            controller.getHandler(id, equalityFn) :
            controller.getHandler(id)
        if (!handler) {
            handler = controller.createHandler(id)
        }
        return handler
    }
}

/**
 * Checks if the given position overlaps with any other pieces
 * @param {Position|PlayerPosition} position is the position to check
 * @param {object} piecePositions is the state of all the pieces' positions
 */
function checkOverlap(position, piecePositions) {
    if (position instanceof PlayerPosition) {
        for (const pathPosition of position.toPositionPath()) {
            if (checkOverlapForPoint(pathPosition, piecePositions)) {
                return true
            }
        }
        return false
    } else if (position instanceof Position) {
        return checkOverlapForPoint(position, piecePositions)
    } else {
        throw new Error("Invalid position argument")
    }
}

/**
 * Checks if the given position overlaps with any other pieces
 * @param {Position} position is the position to check
 * @param {object} piecePositions is the state of all the pieces' positions
 */
function checkOverlapForPoint(position, piecePositions) {
    for (const pathPosition of piecePositions.bluePlayerPiecePosition.toPositionPath()) {
        if (position.equals(pathPosition)) {
            return true
        }
    }

    for (const pathPosition of piecePositions.redPlayerPiecePosition.toPositionPath()) {
        if (position.equals(pathPosition)) {
            return true
        }
    }

    if (position.equals(piecePositions.tokenPiece1Position)) {
        return true
    }
    if (position.equals(piecePositions.tokenPiece2Position)) {
        return true
    }

    return false
}

function BoardSquare({ mouseHandler }) {
    const [selected, setSelected] = useState(false)

    const exposedState = { selected, setSelected }

    const selectedClass = selected ? "selected" : ""
    return <div
        className={`BoardSquare ${selectedClass}`}
        onMouseDown={() => mouseHandler?.mouseDown(exposedState)}
        onMouseOver={() => mouseHandler?.mouseOver(exposedState)}
        onMouseLeave={() => mouseHandler?.mouseLeave(exposedState)}
        onMouseUp={() => mouseHandler?.mouseUp(exposedState)}
    />
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

    /**
     * Constructs a new `MouseSelectHandler` bound to this `MouseDragController`
     * @param {*} id is a unique identifier to name the handler, unique among identifiers this controller gives
     * @returns a `MouseSelectHandler` instance
     */
    createHandler(id) {
        const mouseHandler = new MouseDragController.MouseSelectHandler(id, MouseDragController.__createHandlerKey)
        mouseHandler.onMouseDown = this._bindHandlerCallback(this.handlerMouseDown)
        mouseHandler.onMouseOver = this._bindHandlerCallback(this.handlerMouseOver)
        mouseHandler.onMouseLeave = this._bindHandlerCallback(this.handlerMouseLeave)
        mouseHandler.onMouseUp = this._bindHandlerCallback(this.handlerMouseUp)
        this.__handlers.push(mouseHandler)
        return mouseHandler
    }

    getHandler(id, equalityFn=(id1, id2) => id1 === id2) {
        for (const handler of this.__handlers) {
            if (equalityFn(handler.id, id)) {
                return handler
            }
        }
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
    handlerMouseLeave(mouseHandler, squareState) { }
    handlerMouseUp(mouseHandler, squareState) { }

    /**
     * Provides an interface for the MouseDragController to
     * handle mouse cursor interactions
     */
    static MouseSelectHandler = class {
        constructor(id, controllerKey = null) {
            if (controllerKey !== MouseDragController.__createHandlerKey) {
                throw new Error("Cannot construct MouseSelectHandler; Use MouseDragController().createHandler() instead")
            }

            this._id = id
        }

        get id() {
            return this._id
        }

        // "input" handler functions (called by a BoardSquare)
        mouseDown(squareState) {
            this.onMouseDown(this, squareState)
        }

        mouseOver(squareState) {
            this.onMouseOver(this, squareState)
        }

        mouseLeave(squareState) {
            this.onMouseLeave(this, squareState)
        }

        mouseUp(squareState) {
            this.onMouseUp(this, squareState)
        }

        // event listener functions (set by a MouseDragController)
        onMouseDown(mouseHandler, squareState) { }
        onMouseOver(mouseHandler, squareState) { }
        onMouseLeave(mouseHandler, squareState) { }
        onMouseUp(mouseHandler, squareState) { }
    }
}

/**
 * Controls the selection logic for moving a player piece
 */
class PlayerMouseDragController extends MouseDragController {
    constructor() {
        super()
        this._selectedSquares = []
        this._cursorStack = []
        this._cursorLost = false
        this._clearTimeout = null
    }

    // event handlers to be overridden on/after instance constructon
    onSubmitPlayerMove(playerPosition) { }

    handlerMouseDown(mouseHandler, squareState) {
        const cursor = mouseHandler.id
        this._cursorStack.push(cursor)
        squareState.setSelected(true)
        this._selectedSquares.push(squareState)
    }

    handlerMouseOver(mouseHandler, squareState) {
        this._cancelScheduledClear()
        
        const cursor = mouseHandler.id
        const isSelecting = this._cursorStack.length > 0
        if (isSelecting) {
            if (!this._cursorLost) {
                if (!this._cursorBacktracked(cursor)) {
                    this._cursorStack.push(cursor)
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
                this._cursorLost = !cursor.equals(lastGoodCursor)
            }
        }
    }

    handlerMouseLeave(mouseHandler, squareState) {
        const isSelecting = this._cursorStack.length > 0
        if (isSelecting) {
            this._scheduleClear()
        }
    }

    handlerMouseUp(mouseHandler, squareState) {
        const [forwardCount, sideCount] = this._calcCursorDirCounts()
        const isValidElPath = forwardCount === 2 && sideCount === 1
        if (isValidElPath) {
            this.onSubmitPlayerMove(PlayerPosition.fromPositionPath(this._cursorStack))
        }

        this._clearSelectStates()
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

            if (relDir === Position.DIR_REL_FORWARD) {
                forwardCount += 1
            } else if (relDir === Position.DIR_REL_LEFT || relDir === Position.DIR_REL_RIGHT) {
                sideCount += 1
            }

            lastCursor = cursor
            lastMove = move
        }

        return [forwardCount, sideCount]
    }

    _clearSelectStates() {
        for (const selectedSquareState of this._selectedSquares) {
            selectedSquareState.setSelected(false)
        }
        this._cursorStack = []
        this._cursorLost = false
        this._clearTimeout = null
    }

    _scheduleClear() {
        this._clearTimeout = setTimeout(() => {
            this._clearSelectStates()
        }, 30)
    }

    _cancelScheduledClear() {
        clearTimeout(this._clearTimeout)
        this._clearTimeout = null
    }
}

/**
 * Controls the selection logic for moving a token
 */
class TokenMouseDragController extends MouseDragController {
    // event handlers to be overridden on/after instance constructon
    onSubmitTokenMove(tokenNum, tokenPosition) { }
}
