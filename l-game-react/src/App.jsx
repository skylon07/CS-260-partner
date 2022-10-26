import { useReducer, useState } from 'react'

import { PlayerMoveMode, Position, PlayerPosition } from './gamestate'

import Board from './Board'

import './App.css'
import { useConstant } from './hooks'

export default function App() {
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
        setActivePlayerPiecePosition(newPosition)
        setTimeout(() => {
            // since usePlayerMoveMode() is the first hook, it will
            // actually update first, so we force the schedule this way
            cyclePlayerMoveMode()
        })
    }

    const moveToken = (tokenNum, newPosition) => {
        if (tokenNum === 1) {
            setTokenPiece1Position(newPosition)
        } else if (tokenNum === 2) {
            setTokenPiece2Position(newPosition)
        } else {
            throw new Error("Incorrect tokenNumber; can only move token 1 or 2")
        }
        cyclePlayerMoveMode()
    }

    return (
        <div className="App">
            <Board
                playerMoveMode={playerMoveMode}
                piecePositions={piecePositions}
                onPlayerMove={movePlayer}
                onTokenMove={moveToken}
            />
        </div>
    )
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
