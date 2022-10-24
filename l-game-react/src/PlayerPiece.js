import { useRef } from "react"

import { PlayerMoveMode, PlayerPosition } from "./gamestate"

import './PlayerPiece.css'

export default function PlayerPiece({position, forPlayer}) {
    if (!(position instanceof PlayerPosition)) {
        throw new TypeError("PlayerPiece must be given a position: PlayerPosition prop")
    }

    const pieceRef = useRef()

    const pieceSquares = position.toPositionPath().map((pathPosition) => {
        const offsetYCss = `calc(${pathPosition.rowIdx} * 25%)`
        const offsetXCss = `calc(${pathPosition.colIdx} * 25%)`

        const style = {
            top: offsetYCss,
            left: offsetXCss,
        }
        return <div
            className="PlayerPiece-Square"
            style={style}
            key={`${offsetXCss}${offsetYCss}`}
        />
    })

    const playerClass = forPlayer === PlayerMoveMode.PLAYER_BLUE ?
        "player-blue" : "player-red"

    return <div
        className={`PlayerPiece ${playerClass}`}
        ref={pieceRef}
    >
        {pieceSquares}
    </div>
}
