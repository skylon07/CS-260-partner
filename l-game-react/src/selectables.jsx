import React, { useEffect } from "react"
import { useConstant } from "./hooks"

import { PlayerMoveMode, PlayerPosition, Position } from "./gamestate"

/**
 * @param {{
 *      mouseHandler: MouseController.MouseHandler,
 *      children: React.ReactNode,
 * }} props
 */
export function MouseControlledSection({mouseHandler, children}) {
    return (
        <div
            className="MouseControlledSection"
            onMouseDown={(event) => mouseHandler?.mouseDown(event)}
            onMouseMove={(event) => mouseHandler?.mouseMove(event)}
            onMouseOver={(event) => mouseHandler?.mouseOver(event)}
            onMouseLeave={(event) => mouseHandler?.mouseLeave(event)}
            onMouseUp={(event) => mouseHandler?.mouseUp(event)}
        >
            {children}
        </div>
    )
}

export function usePlayerMouseController(playerMoveMode, onSubmitPlayerMove) {
    const controller = useConstant(() => new MousePlayerSelectController(), [])
    return useMouseController(
        controller,
        playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER,
        () => {
            controller.onSubmitPlayerMove = onSubmitPlayerMove
        },
        () => {
            controller.onSubmitPlayerMove = null
        },
        Position.equals,
    )
}

export function useTokenMouseController(playerMoveMode, onFinishTokenDrag) {
    const controller = useConstant(() => new MouseTokenController(), [])
    return useMouseController(
        controller,
        playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN,
        () => {
            controller.onFinishTokenDrag = onFinishTokenDrag
        },
        () => {
            controller.onFinishTokenDrag = null
        },
        (id1, id2) => {
            if (id1 instanceof Position && id2 instanceof Position) {
                return Position.equals(id1, id2)
            } else {
                return id1 === id2
            }
        }
    )
}

function useMouseController(controller, listeningCondition, setControllerSubmit, unsetControllerSubmit, getHandlerEqFn=null) {
    useMouseController_listening(controller, listeningCondition)
    useEffect(() => {
        setControllerSubmit()
        return unsetControllerSubmit
    }, [setControllerSubmit, unsetControllerSubmit])

    const controllerState = {
        getHandler: useMouseController_getHandler(controller, getHandlerEqFn),
    }
    return controllerState
}

function useMouseController_listening(controller, listenShouldEnable) {
    useEffect(() => {
        if (listenShouldEnable) {
            controller.enableListening()
        } else {
            controller.disableListening()
        }
    }, [listenShouldEnable, controller])
}

function useMouseController_getHandler(controller, equalityFn=null) {
    return (id, setStateHandle) => {
        let handler = equalityFn !== null ?
            controller.getHandler(id, equalityFn) :
            controller.getHandler(id)
        if (!handler) {
            handler = controller.createHandler(id)
        }
        handler.setStateHandle = setStateHandle
        return handler
    }
}

/**
 * Abstract class that controls the logic for selection updates
 * for differing kinds of components
 */
class MouseController {
    static __createHandlerKey = ["restricts handler creation to the controller"]

    constructor() {
        this.__handlers = []
        this.__isListening = true
    }

    /**
     * Constructs a new `MouseSelectHandler` bound to this `MouseController`
     * @param {*} id is a unique identifier to name the handler, unique among identifiers this controller gives
     * @returns a `MouseSelectHandler` instance
     */
    createHandler(id) {
        const mouseHandler = new MouseController.MouseSelectHandler(id, MouseController.__createHandlerKey)
        mouseHandler.onMouseDown = this._bindHandlerCallback(this.handleMouseDown)
        mouseHandler.onMouseMove = this._bindHandlerCallback(this.handleMouseMove)
        mouseHandler.onMouseOver = this._bindHandlerCallback(this.handleMouseOver)
        mouseHandler.onMouseLeave = this._bindHandlerCallback(this.handleMouseLeave)
        mouseHandler.onMouseUp = this._bindHandlerCallback(this.handleMouseUp)
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
    handleMouseDown(mouseHandler, event) { }
    handleMouseMove(mouseHandler, event) { }
    handleMouseOver(mouseHandler, event) { }
    handleMouseLeave(mouseHandler, event) { }
    handleMouseUp(mouseHandler, event) { }

    /**
     * Provides an interface for the MouseController to
     * handle mouse cursor interactions
     */
    static MouseSelectHandler = class {
        constructor(id, controllerKey=null) {
            if (controllerKey !== MouseController.__createHandlerKey) {
                throw new Error("Cannot construct MouseSelectHandler; Use MouseController().createHandler() instead")
            }

            this._id = id
            this._setStateHandle = () => {}
        }

        get id() {
            return this._id
        }

        get setStateHandle() {
            return this._setStateHandle
        }

        set setStateHandle(newSetStateHandle) {
            this._setStateHandle = newSetStateHandle
        }

        // "input" handler functions
        // (called by components on respective events)
        mouseDown(event) {
            this.onMouseDown(this, event)
        }

        mouseMove(event) {
            this.onMouseMove(this, event)
        }

        mouseOver(event) {
            this.onMouseOver(this, event)
        }

        mouseLeave(event) {
            this.onMouseLeave(this, event)
        }

        mouseUp(event) {
            this.onMouseUp(this, event)
        }

        // "output" event-listener-style functions
        // (set by a MouseController)
        onMouseDown(mouseHandler, event) { }
        onMouseMove(mouseHandler, event) { }
        onMouseOver(mouseHandler, event) { }
        onMouseLeave(mouseHandler, event) { }
        onMouseUp(mouseHandler, event) { }
    }
}

/**
 * Controls the selection logic for moving a player piece
 */
class MousePlayerSelectController extends MouseController {
    constructor() {
        super()
        this._selectedHandlers = []
        this._cursorStack = []
        this._cursorLost = false
        this._clearTimeout = null
    }

    // event handlers to be overridden on/after instance constructon
    onSubmitPlayerMove(playerPosition) { }

    handleMouseDown(mouseHandler, event) {
        const cursor = mouseHandler.id
        this._cursorStack.push(cursor)
        this._selectHandler(mouseHandler)
    }

    handleMouseOver(mouseHandler, event) {
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
                        this._selectHandler(mouseHandler)
                    } else {
                        // pop() since we pushed above for _calcCursorDirCounts()
                        // and it's an invalid cursor
                        this._cursorStack.pop()
                        this._cursorLost = true
                    }
                } else {
                    this._cursorStack.pop()
                    this._unselectLastHandler()
                }
            } else {
                const lastGoodCursor = this._cursorStack[this._cursorStack.length - 1]
                this._cursorLost = !cursor.equals(lastGoodCursor)
            }
        }
    }

    handleMouseLeave(mouseHandler, event) {
        const isSelecting = this._cursorStack.length > 0
        if (isSelecting) {
            this._scheduleClear()
        }
    }

    handleMouseUp(mouseHandler, event) {
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
        while (this._selectedHandlers.length > 0) {
            this._unselectLastHandler()
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

    _selectHandler(mouseHandler) {
        mouseHandler.setStateHandle(true)
        this._selectedHandlers.push(mouseHandler)
    }

    _unselectLastHandler() {
        const mouseHandler = this._selectedHandlers.pop()
        mouseHandler.setStateHandle(false)
    }
}

/**
 * Controls the dragging/selecting logic for moving a token
 */
class MouseTokenController extends MouseController {
    constructor() {
        super()
        this._cursorStartCoords = null
        this._draggingHandler = null
        this._selectedHandler = null
    }

    // event handlers to be overridden on/after instance constructon
    onFinishTokenDrag(tokenNum) { }

    handleMouseDown(mouseHandler, event) {
        this._cursorStartCoords = [event.clientX, event.clientY]
        this._draggingHandler = mouseHandler
        mouseHandler.setStateHandle([0, 0], this._cursorStartCoords)
    }

    handleMouseMove(mouseHandler, event) {
        const isDragging = this._cursorStartCoords !== null
        const isCorrectHandler = mouseHandler === this._draggingHandler
        if (isDragging && isCorrectHandler) {
            const [startX, startY] = this._cursorStartCoords
            const [currX, currY] = [event.clientX, event.clientY]
            mouseHandler.setStateHandle([currX - startX, currY - startY], this._cursorStartCoords)
        }
    }

    handleMouseUp(mouseHandler, event) {
        const tokenNum = mouseHandler.id
        this.onFinishTokenDrag(tokenNum)

        mouseHandler.setStateHandle(null, this._cursorStartCoords)
        this._clearSelectStates()
    }

    _clearSelectStates() {
        this._cursorStartCoords = null
        if (this._selectedHandler !== null) {
            this._unselectLastHandler()
        }
    }
}
