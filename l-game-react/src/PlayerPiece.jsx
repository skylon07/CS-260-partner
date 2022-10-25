import { useRef } from "react"

import { PlayerMoveMode, PlayerPosition } from "./gamestate"

import './PlayerPiece.css'

/**
 * @param {{
 *      position: PlayerPosition,
 *      forPlayer: "PLAYER_BLUE" | "PLAYER_RED",
 *      faded: boolean,
 * }} props
 * 
 * @typedef {import('./gamestate').PlayerPosition} PlayerPosition
 */
export default function PlayerPiece({position, forPlayer, faded}) {
    if (!(position instanceof PlayerPosition)) {
        throw new TypeError("PlayerPiece must be given a position: PlayerPosition prop")
    }

    const pieceRef = useRef()

    const pieceSquares = position.toPositionPath().map((pathPosition) => {
        const offsetYCss = `calc(${pathPosition.rowIdx} * var(--PlayerPiece-Square-size))`
        const offsetXCss = `calc(${pathPosition.colIdx} * var(--PlayerPiece-Square-size))`

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
    const fadedClass = faded ? "faded" : ""

    return <div
        className={`PlayerPiece ${playerClass} ${fadedClass}`}
        ref={pieceRef}
    >
        {pieceSquares}
    </div>
}
