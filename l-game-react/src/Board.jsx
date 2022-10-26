import { useReducer, useRef } from 'react'
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
    
    const onSubmitPlayerMove = (newPlayerPosition) => {
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
    const playerMouseController = usePlayerMouseController(playerMoveMode, onSubmitPlayerMove)

    const tokenNumRef = useRef(null)
    const newTokenPositionRef = useRef(null)
    const onSubmitTokenMove = () => {
        const tokenNum = tokenNumRef.current
        const newTokenPosition = newTokenPositionRef.current
        if (tokenNum === null || newTokenPosition === null) {
            return
        }

        const positionsToCheck = [
            ...piecePositions.bluePlayerPiecePosition.toPositionPath(),
            ...piecePositions.redPlayerPiecePosition.toPositionPath(),
        ]
        if (tokenNum === 2) {
            positionsToCheck.push(piecePositions.tokenPiece1Position)
        } else {
            positionsToCheck.push(piecePositions.tokenPiece2Position)
        }

        if (!anyOverlap(newTokenPosition, positionsToCheck)) {
            onTokenMove(tokenNum, newTokenPosition)
        }

        tokenNumRef.current = null
        newTokenPositionRef.current = null
    }
    const queueTokenNum = (_tokenNum) => {
        tokenNumRef.current = _tokenNum
        onSubmitTokenMove()
    }
    const queueNewTokenPosition = (_newTokenPosition) => {
        newTokenPositionRef.current = _newTokenPosition
        onSubmitTokenMove()
    }
    const tokenMouseController = useTokenMouseController(playerMoveMode, queueTokenNum)

    const [selectedSquares, setSquareSelected] = useBoardSquareSelectedState([
        [false, false, false, false],
        [false, false, false, false],
        [false, false, false, false],
        [false, false, false, false],
    ])

    const boardSquareRows = []
    for (let rowIdx = 0; rowIdx < 4; rowIdx += 1) {
        const boardSquares = []
        for (let colIdx = 0; colIdx < 4; colIdx += 1) {
            const position = new Position(rowIdx, colIdx)
            const playerMouseHandler = playerMouseController.getHandler(
                position,
                (newSelectedState) => setSquareSelected(position, newSelectedState)
            )
            const boardSquare = (
                <Foreground
                    key={`${rowIdx},${colIdx}`}
                    isForeground={playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER}
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

    const tokenPiece1TransformerRef = useRef()
    const tokenPiece2TransformerRef = useRef()

    const lastSelectedRef = useRef(null)
    const handleDrag = (offset, initMouse, transformerRef) => {
        const lastSelected = lastSelectedRef.current
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
                if (lastSelected === null) {
                    setSquareSelected(selectPosition, true)
                    lastSelectedRef.current = selectPosition
                } else if (!selectPosition.equals(lastSelected)) {
                    setSquareSelected(lastSelected, false)
                    setSquareSelected(selectPosition, true)
                    lastSelectedRef.current = selectPosition
                }
            }
        } else {
            transformerRef.current.translate(null, null)
            setSquareSelected(lastSelected, false)
            queueNewTokenPosition(lastSelected)
            lastSelectedRef.current = null
        }
    }
    const token1MouseHandler = tokenMouseController.getHandler(1, (offset, initMouse) => handleDrag(offset, initMouse, tokenPiece1TransformerRef))
    const token2MouseHandler = tokenMouseController.getHandler(2, (offset, initMouse) => handleDrag(offset, initMouse, tokenPiece2TransformerRef))

    const isBluePieceFaded = playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE && 
        playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER
    const isRedPieceFaded = playerMoveMode.player === PlayerMoveMode.PLAYER_RED && 
        playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER

    const playerSelectClass = playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER ?
        playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE ?
            "player-blue-select" : "player-red-select" :
        ""

    return (
        <div ref={boardRef} className={`Board ${playerSelectClass}`}>
            {boardSquareRows}
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
            <Foreground isForeground={playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN}>
                <Transformer ref={tokenPiece1TransformerRef}>
                    <TokenPiece
                        position={piecePositions.tokenPiece1Position}
                        mouseHandler={token1MouseHandler}
                        faded={
                            // TODO: fade when picked up
                            false
                        }
                    />
                </Transformer>
            </Foreground>
            <Foreground isForeground={playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN}>
                <Transformer ref={tokenPiece2TransformerRef}>
                    <TokenPiece
                        position={piecePositions.tokenPiece2Position}
                        mouseHandler={token2MouseHandler}
                        faded={
                            // TODO: fade when picked up
                            false
                        }
                    />
                </Transformer>
            </Foreground>
        </div>
    )
}

// TODO: convert useReducer()s to useState()

function useBoardSquareSelectedState(initSelectedSquares) {
    const [selectedSquares, setSquareSelected_byArgsList] = useReducer(
        (selectedSquares, [squarePosition, newSquareSelected]) => {
            return selectedSquares.map((squareRow, rowIdx) => {
                if (squarePosition.rowIdx === rowIdx) {
                    return squareRow.map((squareSelected, colIdx) => {
                        if (squarePosition.colIdx === colIdx) {
                            if (typeof newSquareSelected === "function") {
                                newSquareSelected = newSquareSelected(selectedSquares[rowIdx][colIdx])
                            }
                            return newSquareSelected
                        } else {
                            return squareSelected
                        }
                    })
                } else {
                    return squareRow
                }
            })
        },
        initSelectedSquares,
    )

    const setSquareSelected = useConstant(() => {
        return (squarePosition, newSquareSelected) => {
            setSquareSelected_byArgsList([squarePosition, newSquareSelected])
        }
    }, [])
    return [selectedSquares, setSquareSelected]
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
