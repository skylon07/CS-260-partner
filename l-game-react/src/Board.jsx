import { useReducer } from 'react'
import { useConstant } from './hooks'

import { PlayerMoveMode, Position, PlayerPosition } from './gamestate'
import { MouseControlledSection, useMouseDragController, useMouseSelectController } from './selectables'

import PlayerPiece from './PlayerPiece'
import NeutralToken from './NeutralToken'
import Foreground from './Foreground'

import './Board.css'

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
    const onSubmitPlayerMove = (newPlayerPosition) => {
        const playerCollisionPositions = playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE ?
            piecePositions.redPlayerPiecePosition.toPositionPath() : 
            piecePositions.bluePlayerPiecePosition.toPositionPath()
        const positionsToCheck = [
            piecePositions.tokenPiece1Position,
            piecePositions.tokenPiece2Position,
            ...playerCollisionPositions,
        ]

        if (!anyOverlap(newPlayerPosition, positionsToCheck)) {
            onPlayerMove(newPlayerPosition)
        }
    }
    const playerMouseController = useMouseSelectController(playerMoveMode, onSubmitPlayerMove)

    const onSubmitTokenMove = (tokenNum, newTokenPosition) => {
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
    }
    const tokenMouseController = useMouseDragController(playerMoveMode, onSubmitTokenMove)

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
            const mouseHandler = playerMouseController.getHandler(
                position,
                (newSelectedState) => setSquareSelected(position, newSelectedState)
            )
            const boardSquare = <Foreground isForeground={playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER}>
                <MouseControlledSection
                    key={`${rowIdx},${colIdx}`}
                    mouseHandler={mouseHandler}
                >
                    <BoardSquare selected={selectedSquares[rowIdx][colIdx]} />
                </MouseControlledSection>
            </Foreground>
            
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
            faded={playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE}
        />
        <PlayerPiece
            position={piecePositions.redPlayerPiecePosition}
            forPlayer={PlayerMoveMode.PLAYER_RED}
            faded={playerMoveMode.player === PlayerMoveMode.PLAYER_RED}
        />
        <Foreground isForeground={playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN}>
            <MouseControlledSection mouseHandler={token1MouseHandler}>
                <NeutralToken
                    position={piecePositions.tokenPiece1Position}
                />
            </MouseControlledSection>
        </Foreground>
        <Foreground isForeground={playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN}>
            <MouseControlledSection mouseHandler={token2MouseHandler}>
                <NeutralToken
                    position={piecePositions.tokenPiece2Position}
                />
            </MouseControlledSection>
        </Foreground>
    </div>
}

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
