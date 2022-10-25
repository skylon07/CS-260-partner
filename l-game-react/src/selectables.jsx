import React, { useEffect } from "react"
import { useConstant } from "./hooks"

import { PlayerMoveMode, PlayerPosition, Position } from "./gamestate"

/**
 * @param {{
 *      mouseHandler: MouseController.MouseHandler,
 *      children: React.DOMAttributes,
 * }} props
 */
export function MouseControlledSection({mouseHandler, children}) {
    return <div
        className="MouseControlledSection"
        onMouseDown={() => mouseHandler?.mouseDown()}
        onMouseOver={() => mouseHandler?.mouseOver()}
        onMouseLeave={() => mouseHandler?.mouseLeave()}
        onMouseUp={() => mouseHandler?.mouseUp()}
    >
        {children}
    </div>
}

export function useMouseSelectController(playerMoveMode, onSubmitPlayerMove) {
    const controller = useConstant(() => new MouseSelectController(), [])
    
    useMouseController_listening(controller, playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER)
    useEffect(() => {
        controller.onSubmitPlayerMove = onSubmitPlayerMove
        return () => controller.onSubmitPlayerMove = null
    }, [onSubmitPlayerMove, controller])
    
    const controllerState = {
        getHandler: useMouseController_getHandler(controller, Position.equals),
    }
    return controllerState
}

export function useMouseDragController(playerMoveMode, onSubmitTokenMove) {
    const controller = useConstant(() => new MouseDragController(), [])
    
    useMouseController_listening(controller, playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN)
    useEffect(() => {
        controller.onSubmitTokenMove = onSubmitTokenMove
        return () => controller.onSubmitPlayerMove = null
    }, [onSubmitTokenMove, controller])

    const controllerState = {
        getHandler: useMouseController_getHandler(controller),
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
            handler = controller.createHandler(id, setStateHandle)
        }
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
     * @param {function} setStateHandle is a handler function called by the controller to indicate state changes
     * @returns a `MouseSelectHandler` instance
     */
    createHandler(id, setStateHandle) {
        const mouseHandler = new MouseController.MouseSelectHandler(id, setStateHandle, MouseController.__createHandlerKey)
        mouseHandler.onMouseDown = this._bindHandlerCallback(this.handleMouseDown)
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
    handleMouseDown(mouseHandler) { }
    handleMouseOver(mouseHandler) { }
    handleMouseLeave(mouseHandler) { }
    handleMouseUp(mouseHandler) { }

    /**
     * Provides an interface for the MouseController to
     * handle mouse cursor interactions
     */
    static MouseSelectHandler = class {
        constructor(id, setStateHandle, controllerKey=null) {
            if (controllerKey !== MouseController.__createHandlerKey) {
                throw new Error("Cannot construct MouseSelectHandler; Use MouseController().createHandler() instead")
            }

            this._id = id
            this._setStateHandle = setStateHandle
        }

        get id() {
            return this._id
        }

        get setStateHandle() {
            return this._setStateHandle
        }

        // "input" handler functions
        // (called by components on respective events)
        mouseDown() {
            this.onMouseDown(this)
        }

        mouseOver() {
            this.onMouseOver(this)
        }

        mouseLeave() {
            this.onMouseLeave(this)
        }

        mouseUp() {
            this.onMouseUp(this)
        }

        // "output" event-listener-style functions
        // (set by a MouseController)
        onMouseDown(mouseHandler) { }
        onMouseOver(mouseHandler) { }
        onMouseLeave(mouseHandler) { }
        onMouseUp(mouseHandler) { }
    }
}

/**
 * Controls the selection logic for moving a player piece
 */
class MouseSelectController extends MouseController {
    constructor() {
        super()
        this._selectedHandlers = []
        this._cursorStack = []
        this._cursorLost = false
        this._clearTimeout = null
    }

    // event handlers to be overridden on/after instance constructon
    onSubmitPlayerMove(playerPosition) { }

    handleMouseDown(mouseHandler) {
        const cursor = mouseHandler.id
        this._cursorStack.push(cursor)
        this._selectHandler(mouseHandler)
    }

    handleMouseOver(mouseHandler) {
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

    handleMouseLeave(mouseHandler, selectableState) {
        const isSelecting = this._cursorStack.length > 0
        if (isSelecting) {
            this._scheduleClear()
        }
    }

    handleMouseUp(mouseHandler, selectableState) {
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
 * Controls the selection logic for moving a token
 */
class MouseDragController extends MouseController {
    // event handlers to be overridden on/after instance constructon
    onSubmitTokenMove(tokenNum, tokenPosition) { }

    handleMouseDown(mouseHandler, draggableState) {
        // TODO
    }

    handleMouseOver(mouseHandler, draggableState) {
        // TODO
    }

    handleMouseLeave(mouseHandler, draggableState) {
        // TODO
    }

    handleMouseUp(mouseHandler, draggableState) {
        // TODO
    }
}
