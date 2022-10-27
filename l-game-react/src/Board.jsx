import { useState, useRef } from 'react'
import { useConstant } from './hooks'

import { PlayerMoveMode, Position, PlayerPosition } from './gamestate'
import { MouseControlledSection, useTokenMouseController, usePlayerMouseController } from './selectables'

import PlayerPiece from './PlayerPiece'
import TokenPiece from './TokenPiece'
import Foreground from './Foreground'

import './Board.css'
import Transformer from './Transformer'

/**
 * @param {{
 *      playerMoveMode: PlayerMoveMode,
 *      piecePositions: PiecePositions,
 *      onPlayerMove: function,
 *      onTokenMove: function,
 * }} props
 * 
 * @typedef {import('./gamestate').PlayerMoveMode} PlayerMoveMode
 * @typedef {import('./gamestate').PiecePositions} PiecePositions
 */
export default function Board({playerMoveMode, piecePositions, onPlayerMove, onTokenMove}) {
    const boardRef = useRef()
    
    const [selectedSquares, setSquareSelected] = useBoardSquareSelectedState([
        [false, false, false, false],
        [false, false, false, false],
        [false, false, false, false],
        [false, false, false, false],
    ])
    const [tokensPickedUp, setTokenPickedUp] = useTokenPickedUpState([false, false])

    const playerMouseHandlers = usePlayerMouseHandlers(playerMoveMode, piecePositions, onPlayerMove)
    const [
        tokenPiece1TransformerRef,
        tokenPiece2TransformerRef,
        tokenMouseHandlers,
    ] = useTokenMouseHandlers(
        boardRef,
        playerMoveMode,
        piecePositions,
        setSquareSelected,
        setTokenPickedUp,
        onTokenMove,
    )

    const isBluePieceFaded = playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE && 
        playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER
    const isRedPieceFaded = playerMoveMode.player === PlayerMoveMode.PLAYER_RED && 
        playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER

    const playerTurnClass = playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE ?
        "player-blue" : "player-red"
    const moveModeClass = playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER ?
        "mode-player" : "mode-token"
    const boardSkipHiddenClass = playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER ?
        "hidden" : ""

    return (
        <div ref={boardRef} className={`Board ${playerTurnClass} ${moveModeClass}`}>
            {renderBoardSquareRows(
                playerMoveMode,
                selectedSquares,
                setSquareSelected,
                playerMouseHandlers,
            )}
            <PlayerPiece
                position={piecePositions.bluePlayerPiecePosition}
                forPlayer={PlayerMoveMode.PLAYER_BLUE}
                faded={isBluePieceFaded}
            />
            <PlayerPiece
                position={piecePositions.redPlayerPiecePosition}
                forPlayer={PlayerMoveMode.PLAYER_RED}
                faded={isRedPieceFaded}
            />
            <Foreground
                foregroundLevel={
                    +(playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN) +
                    +tokensPickedUp[0]
                }
            >
                <Transformer ref={tokenPiece1TransformerRef}>
                    <TokenPiece
                        position={piecePositions.tokenPiece1Position}
                        mouseHandler={tokenMouseHandlers.getHandler(1)}
                        isPickedUp={tokensPickedUp[0]}
                    />
                </Transformer>
            </Foreground>
            <Foreground
                foregroundLevel={
                    +(playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN) + 
                    +tokensPickedUp[1]
                }
            >
                <Transformer ref={tokenPiece2TransformerRef}>
                    <TokenPiece
                        position={piecePositions.tokenPiece2Position}
                        mouseHandler={tokenMouseHandlers.getHandler(2)}
                        isPickedUp={tokensPickedUp[1]}
                    />
                </Transformer>
            </Foreground>
            <div className="Board-Skip-Container">
                <button
                    className={`Board-Skip ${boardSkipHiddenClass}`}
                    onClick={() => onTokenMove(null)}
                >
                    Skip
                    <br></br>
                    Token
                </button>
            </div>
        </div>
    )
}

function renderBoardSquareRows(playerMoveMode, selectedSquares, setSquareSelected, playerMouseHandlers) {
    const boardSquareRows = []
    for (let rowIdx = 0; rowIdx < 4; rowIdx += 1) {
        const boardSquares = []
        for (let colIdx = 0; colIdx < 4; colIdx += 1) {
            const position = new Position(rowIdx, colIdx)
            const playerMouseHandler = playerMouseHandlers.getHandler(
                position,
                (mouseHandler, newSelectedState) => setSquareSelected(position, newSelectedState)
            )
            const boardSquare = (
                <Foreground
                    key={`${rowIdx},${colIdx}`}
                    foregroundLevel={+(playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER)}
                >
                    <MouseControlledSection mouseHandler={playerMouseHandler}>
                        <BoardSquare selected={selectedSquares[rowIdx][colIdx]} />
                    </MouseControlledSection>
                </Foreground>
            )
            
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
    return boardSquareRows
}

function usePlayerMouseHandlers(playerMoveMode, piecePositions, onPlayerMove) {
    const submitIfValidPlayerMove = (newPlayerPosition) => {
        const playerCollisionPositions = playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE ?
            piecePositions.redPlayerPiecePosition.toPositionPath() : 
            piecePositions.bluePlayerPiecePosition.toPositionPath()
        const positionsToCheck = [
            piecePositions.tokenPiece1Position,
            piecePositions.tokenPiece2Position,
            ...playerCollisionPositions,
        ]

        const activePlayerPosition = playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE ?
            piecePositions.bluePlayerPiecePosition : piecePositions.redPlayerPiecePosition
        const stayedStill = activePlayerPosition.equals(newPlayerPosition)

        const validMove = !stayedStill && !anyOverlap(newPlayerPosition, positionsToCheck)
        if (validMove) {
            onPlayerMove(newPlayerPosition)
        }
    }
    const playerMouseController = usePlayerMouseController(playerMoveMode, submitIfValidPlayerMove)
    
    return {getHandler: playerMouseController.getHandler}
}

function useTokenMouseHandlers(boardRef, playerMoveMode, piecePositions, setSquareSelected, setTokenPickedUp, onTokenMove) {
    const tokenNumRef = useRef(null)
    const newTokenPositionRef = useRef(null)
    const submitIfValidTokenMove = (tokenNum, newTokenPosition) => {
        const positionsToCheck = [
            ...piecePositions.bluePlayerPiecePosition.toPositionPath(),
            ...piecePositions.redPlayerPiecePosition.toPositionPath(),
        ]
        let prevTokenPosition
        if (tokenNum === 2) {
            positionsToCheck.push(piecePositions.tokenPiece1Position)
            prevTokenPosition = piecePositions.tokenPiece2Position
        } else {
            positionsToCheck.push(piecePositions.tokenPiece2Position)
            prevTokenPosition = piecePositions.tokenPiece1Position
        }
        if (!anyOverlap(newTokenPosition, positionsToCheck)) {
            const tokenMoved = !newTokenPosition.equals(prevTokenPosition)
            if (tokenMoved) {
                onTokenMove(tokenNum, newTokenPosition)
            }
        }
    }
    const queueTokenNum = (_tokenNum) => {
        tokenNumRef.current = _tokenNum
        if (tokenNumRef.current !== null && newTokenPositionRef.current !== null) {
            submitIfValidTokenMove(tokenNumRef.current, newTokenPositionRef.current)
            tokenNumRef.current = null
            newTokenPositionRef.current = null
        }
    }
    const queueNewTokenPosition = (_newTokenPosition) => {
        newTokenPositionRef.current = _newTokenPosition
        if (tokenNumRef.current !== null && newTokenPositionRef.current !== null) {
            submitIfValidTokenMove(tokenNumRef.current, newTokenPositionRef.current)
            tokenNumRef.current = null
            newTokenPositionRef.current = null
        }
    }
    const tokenMouseController = useTokenMouseController(playerMoveMode, queueTokenNum)

    const [lastState, selectSquare] = useBoardSquareStateForSelectedToken(setSquareSelected)
    const handleDrag = (mouseHandler, offset, initMouse, transformerRef) => {
        selectSquare((frozenSelected, lastSelected) => {
            if (offset !== null) {
                const [offX, offY] = offset
                const [initX, initY] = initMouse
                transformerRef.current.translate(offX, offY)
                const {clientLeft, clientTop, clientWidth, clientHeight} = boardRef.current
                const rowIdx = Math.floor((initY + offY - clientTop) / (clientHeight / 4))
                const colIdx = Math.floor((initX + offX - clientLeft) / (clientWidth / 4))
                const validRowIdx = rowIdx >= 0 && rowIdx < 4
                const validColIdx = colIdx >= 0 && colIdx < 4
                if (validRowIdx && validColIdx) {
                    const selectPosition = new Position(rowIdx, colIdx)
                    const positionsToCheck = [
                        ...piecePositions.bluePlayerPiecePosition.toPositionPath(),
                        ...piecePositions.redPlayerPiecePosition.toPositionPath(),
                        piecePositions.tokenPiece1Position,
                        piecePositions.tokenPiece2Position,
                    ]
                    const firstHandleCall = frozenSelected === null
                    if (!firstHandleCall) {
                        if (!anyOverlap(selectPosition, positionsToCheck)) {
                            return selectPosition
                        } else {
                            return frozenSelected
                        }
                    } else {
                        const tokenNum = mouseHandler.id
                        setTokenPickedUp(tokenNum, true)
                        return selectPosition
                    }
                } else {
                    return lastSelected
                }
            } else {
                const tokenNum = mouseHandler.id
                setTokenPickedUp(tokenNum, false)
                transformerRef.current.translate(null, null)
                queueNewTokenPosition(lastSelected)
                return null
            }
        })
    }

    const tokenPiece1TransformerRef = useRef()
    const tokenPiece2TransformerRef = useRef()

    const tokenMouseHandlers = {
        getHandler: (id) => {
            const tokenTransformerRef = id === 1 ?
                tokenPiece1TransformerRef : tokenPiece2TransformerRef
            const setStateHandle = (mouseHandler, offset, initMouse) => handleDrag(mouseHandler, offset, initMouse, tokenTransformerRef)
            return tokenMouseController.getHandler(id, setStateHandle)
        }
    }
    return [tokenPiece1TransformerRef, tokenPiece2TransformerRef, tokenMouseHandlers]
}

function useBoardSquareSelectedState(initSelectedSquares) {
    const [selectedSquares, setSelectedSquares] = useState(initSelectedSquares)
    const setSquareSelected = useConstant(() => {
        return (squarePosition, newSquareSelected) => {
            setSelectedSquares((selectedSquares) => {
                const {rowIdx, colIdx} = squarePosition
                const shouldUpdate = selectedSquares[rowIdx][colIdx] !== newSquareSelected
                if (shouldUpdate) {
                    const newSelectedSquaresRow = [...selectedSquares[rowIdx]]
                    newSelectedSquaresRow[colIdx] = newSquareSelected
                    const newSelectedSquares = [...selectedSquares]
                    newSelectedSquares[rowIdx] = newSelectedSquaresRow
                    return newSelectedSquares
                } else {
                    return selectedSquares
                }
            })
        }
    }, [])
    return [selectedSquares, setSquareSelected]
}

function useBoardSquareStateForSelectedToken(setSquareSelected) {
    const frozenSelectedRef = useRef(null)
    const lastSelectedRef = useRef(null)

    const selectSquare = useConstant(() => {
        return (squarePosition) => {
            // TODO: is there a way to generalize this functionality?
            if (typeof squarePosition === "function") {
                squarePosition = squarePosition(frozenSelectedRef.current, lastSelectedRef.current)
            }

            const shouldReset = squarePosition === null
            if (!shouldReset) {
                if (frozenSelectedRef.current !== null) {
                    const needToAvoidUnselectingFrozen = lastSelectedRef.current.equals(frozenSelectedRef.current)
                    if (!needToAvoidUnselectingFrozen) {
                        setSquareSelected(lastSelectedRef.current, false)
                    }
                    setSquareSelected(squarePosition, true)
                    lastSelectedRef.current = squarePosition
                } else {
                    setSquareSelected(squarePosition, true)
                    frozenSelectedRef.current = squarePosition
                    lastSelectedRef.current = squarePosition
                }
            } else {
                setSquareSelected(frozenSelectedRef.current, false)
                setSquareSelected(lastSelectedRef.current, false)
                frozenSelectedRef.current = null
                lastSelectedRef.current = null
            }
        }
    }, [setSquareSelected])
    return [[frozenSelectedRef.current, lastSelectedRef.current], selectSquare]
}

function useTokenPickedUpState(initTokensPickedUpState) {
    const [tokensPickedUp, setTokensPickedUp] = useState(initTokensPickedUpState)
    const setTokenPickedUp = useConstant(() => {
        return (tokenNum, tokenPickedUp) => {
            const tokenIdx = tokenNum - 1
            setTokensPickedUp((tokensPickedUp) => {
                const shouldUpdate = tokensPickedUp[tokenIdx] !== tokenPickedUp
                if (shouldUpdate) {
                    const newTokensPickedUp = [...tokensPickedUp]
                    newTokensPickedUp[tokenIdx] = tokenPickedUp
                    return newTokensPickedUp
                } else {
                    return tokensPickedUp
                }
            })
        }
    }, [])
    return [tokensPickedUp, setTokenPickedUp]
}

/**
 * Checks if the given position overlaps with any other pieces
 * @param {Position|PlayerPosition} position is the position to check
 * @param {object} checkPositions is a list of all positions to check against
 */
function anyOverlap(position, checkPositions) {
    if (position instanceof PlayerPosition) {
        for (const pathPosition of position.toPositionPath()) {
            if (anyOverlapForPoint(pathPosition, checkPositions)) {
                return true
            }
        }
        return false
    } else if (position instanceof Position) {
        return anyOverlapForPoint(position, checkPositions)
    } else {
        throw new Error("Invalid position argument")
    }
}

/**
 * Checks if the given position overlaps with any other pieces
 * @param {Position} position is the position to check
 * @param {object} checkPositions is the state of all the pieces' positions
 */
function anyOverlapForPoint(position, checkPositions) {
    for (const pathPosition of checkPositions) {
        if (position.equals(pathPosition)) {
            return true
        }
    }
    return false
}

function BoardSquare({ selected }) {
    const selectedClass = selected ? "selected" : ""
    return <div className={`BoardSquare ${selectedClass}`} />
}
