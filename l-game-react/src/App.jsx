import React, { useReducer, useState } from 'react'

import { PlayerMoveMode, Position, PlayerPosition } from './gamestate'

import Board from './Board'

import './App.css'
import { useConstant } from './hooks'

export default function App() {
    const [resetCount, setResetCount] = useState(0)
    const resetGame = () => {
        setResetCount((resetCount) => resetCount + 1)
    }

    return <ResettableApp
        key={resetCount}
        resetGame={resetGame}
    />
}

function ResettableApp({resetGame}) {
    const [playerMoveMode, cyclePlayerMoveMode] = usePlayerMoveMode(
        new PlayerMoveMode(PlayerMoveMode.PLAYER_BLUE, PlayerMoveMode.MODE_MOVE_PLAYER)
    )

    const initPlayerPiecePositions = {
        bluePlayerPiecePosition: new PlayerPosition(1, 1, Position.DIR_DOWN, Position.DIR_REL_LEFT),
        redPlayerPiecePosition: new PlayerPosition(2, 2, Position.DIR_UP, Position.DIR_REL_LEFT)
    }
    const [playerPiecePositions, setActivePlayerPiecePosition] = usePlayerPiecePositions(initPlayerPiecePositions, playerMoveMode)

    const [tokenPiece1Position, setTokenPiece1Position] = useState(new Position(0, 0))
    const [tokenPiece2Position, setTokenPiece2Position] = useState(new Position(3, 3))

    const piecePositions = {
        ...playerPiecePositions,
        tokenPiece1Position,
        tokenPiece2Position,
    }

    const movePlayer = (newPosition) => {
        if (playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_PLAYER) {
            setActivePlayerPiecePosition(newPosition)
            setTimeout(() => {
                // since usePlayerMoveMode() is the first hook, it will
                // actually update first, so we force the schedule this way
                cyclePlayerMoveMode()
            })
        }
    }

    const moveToken = (tokenNum, newPosition) => {
        if (playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN) {
            const skipped = tokenNum === null
            if (skipped) {
                // pass -- don't need to do anything
            } else if (tokenNum === 1) {
                setTokenPiece1Position(newPosition)
            } else if (tokenNum === 2) {
                setTokenPiece2Position(newPosition)
            } else {
                throw new Error("Incorrect tokenNumber; can only move token 1 or 2")
            }
            cyclePlayerMoveMode()
        }
    }

    const [gameOver, setGameOver] = useState(false)
    if (!gameOver && checkPlayerStuck(piecePositions, playerMoveMode)) {
        setGameOver(true)
    }

    const winningPlayer = playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE ? 
        "Player Red" : "Player Blue"

    return (
        <div className="App">
            <Board
                playerMoveMode={playerMoveMode}
                piecePositions={piecePositions}
                onPlayerMove={movePlayer}
                onTokenMove={moveToken}
            />
            {renderPlayerLostAlert(gameOver, winningPlayer, resetGame)}
        </div>
    )
}

function renderPlayerLostAlert(gameOver, winningPlayer, resetGame) {
    if (gameOver) {
        return <div className="App-GameOver">
            {`${winningPlayer} won!`}
            <button onClick={resetGame}>Play again?</button>
        </div>
    } else {
        return null
    }
}

function usePlayerMoveMode(initPlayerMoveMode) {
    const [playerMoveMode, setPlayerMoveMode] = useState(initPlayerMoveMode)
    const cyclePlayerMoveMode = useConstant(() => {
        return () => {
            setPlayerMoveMode((playerMoveMode) => {
                const newPlayer = playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN ?
                    PlayerMoveMode.opposite(playerMoveMode.player) : playerMoveMode.player
                const newMoveMode = PlayerMoveMode.opposite(playerMoveMode.moveMode)
                return new PlayerMoveMode(newPlayer, newMoveMode)
            })
        }
    }, [])
    return [playerMoveMode, cyclePlayerMoveMode]
}

function usePlayerPiecePositions(initPlayerPiecePositions, playerMoveMode) {
    // setting state depends on playerMoveMode.player,
    // hence a dynamic reducer is used instead of static state setter
    const [playerPiecePositions, setActivePlayerPiecePosition] = useReducer(
        (playerPiecePositions, newActivePlayerPiecePosition) => {
            let {bluePlayerPiecePosition, redPlayerPiecePosition} = playerPiecePositions
            if (playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE) {
                bluePlayerPiecePosition = newActivePlayerPiecePosition
            } else {
                redPlayerPiecePosition = newActivePlayerPiecePosition
            }
            return {bluePlayerPiecePosition, redPlayerPiecePosition}
        },
        initPlayerPiecePositions,
    )
    return [playerPiecePositions, setActivePlayerPiecePosition]
}

/**
 * @param {PiecePositions} piecePositions 
 * @param {PlayerMoveMode} playerMoveMode
 * @param {function} setGameOver
 * 
 * @typedef {import('./gamestate').PiecePositions} PiecePositions
 * @typedef {import('./gamestate').PlayerMoveMode} PlayerMoveMode
 */
function checkPlayerStuck(piecePositions, playerMoveMode) {
    if (playerMoveMode.moveMode === PlayerMoveMode.MODE_MOVE_TOKEN) {
        return false
    }

    for (let currRowIdx = 0; currRowIdx < 4; currRowIdx += 1) {
        for (let currColIdx = 0; currColIdx < 4; currColIdx += 1) {
            const position = new Position(currRowIdx, currColIdx)
            if (checkOpenLPath([position], piecePositions, playerMoveMode)) {
                return false
            }
        }
    }
    return true
}

/**
 * Recursively checks from a given position if there is space
 * for a player piece (disregarding the active player)
 * @param {Position} position is the current position being checked
 * @param {PiecePositions} piecePositions is the position of all pieces to check against
 * @param {PlayerMoveMode} playerMoveMode is given to indicate the active player (ie the one to ignore)
 * @param {number} forwardPaths is a count of the number of "forward paths" taken by previous invocations
 * @param {number} sidePaths is a count of the number of "sideways paths" taken by previous invocations
 */
function checkOpenLPath(positionStack, piecePositions, playerMoveMode) {
    const position = positionStack[positionStack.length - 1]
    const rowIdxInBounds = position.rowIdx >= 0 && position.rowIdx < 4
    const colIdxInBoudns = position.colIdx >= 0 && position.colIdx < 4
    const inBounds = rowIdxInBounds && colIdxInBoudns
    if (inBounds) {
        if (position.equals(piecePositions.tokenPiece1Position)) {
            return false
        }
        if (position.equals(piecePositions.tokenPiece2Position)) {
            return false
        }
        if (playerMoveMode.player !== PlayerMoveMode.PLAYER_BLUE) {
            for (const playerPosition of piecePositions.bluePlayerPiecePosition.toPositionPath()) {
                if (position.equals(playerPosition)) {
                    return false
                }
            }
        }
        if (playerMoveMode.player !== PlayerMoveMode.PLAYER_RED) {
            for (const playerPosition of piecePositions.redPlayerPiecePosition.toPositionPath()) {
                if (position.equals(playerPosition)) {
                    return false
                }
            }
        }

        let forwardPaths = 0
        let sidePaths = 0
        let lastMove = null
        for (let positionIdx = positionStack.length - 3; positionIdx < positionStack.length; positionIdx += 1) {
            const position = positionStack[positionIdx] || null
            const lastPosition = positionStack[positionIdx - 1] || null
            const currMove = Position.getAbsMoveDirection(lastPosition, position)
            const relDir = Position.getRelMoveDirection(lastMove, currMove)
            if (relDir === Position.DIR_REL_FORWARD) {
                forwardPaths += 1
            } else if (relDir === Position.DIR_REL_LEFT || relDir === Position.DIR_REL_RIGHT) {
                sidePaths += 1
            }
            lastMove = currMove
        }

        if (forwardPaths === 2 && sidePaths === 1) {
            const stackAsPlayerPosition = PlayerPosition.fromPositionPath(positionStack.slice(-4))
            const playerPosition = playerMoveMode.player === PlayerMoveMode.PLAYER_BLUE ?
                piecePositions.bluePlayerPiecePosition : piecePositions.redPlayerPiecePosition
            const pathsAreJustPlayerPosition = stackAsPlayerPosition.equals(playerPosition)
            if (!pathsAreJustPlayerPosition) {
                return true
            }
        }

        const applyDirs = [
            Position.DIR_LEFT,
            Position.DIR_RIGHT,
            Position.DIR_UP,
            Position.DIR_DOWN,
        ]
        for (const dir of applyDirs) {
            const newPosition = Position.applyAbsDir(position, dir)
            const alreadyUsedPosition = positionStack.reduce(
                (used, position) => used || position.equals(newPosition),
                false,
            )
            if (!alreadyUsedPosition) {
                const newPositionStack = positionStack.concat([newPosition])
                const foundPath = checkOpenLPath(
                    newPositionStack,
                    piecePositions,
                    playerMoveMode,
                    forwardPaths,
                    sidePaths,
                )
                if (foundPath) {
                    return true
                }
            }
        }
        return false
    } else {
        return false
    }
}
