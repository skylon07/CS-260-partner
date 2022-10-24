import { useRef } from "react"
import { PlayerPosition } from "./gamestate"

import './PlayerPiece.css'

export default function PlayerPiece({position}) {
    if (!(position instanceof PlayerPosition)) {
        throw new TypeError("PlayerPiece must be given a position: PlayerPosition prop")
    }

    const pieceRef = useRef()

    const pieceSquares = position.toPositionPath().map((pathPosition) => {
        const offsetYIdx = pathPosition.rowIdx
        const offsetXIdx = pathPosition.colIdx

        // DEBUG: experimental style for demonstration purposes
        const style = {
            position: "absolute",
            top: `calc(${offsetYIdx} * 25%)`,
            left: `calc(${offsetXIdx} * 25%)`,
            width: `25%`,
            height: `25%`,
            backgroundColor: "green",
        }
        // TODO: add a PlayerPiece-Square CSS class
        return <div key={[offsetXIdx, offsetYIdx]} style={style}></div>
    })

    return <div ref={pieceRef} className="PlayerPiece">
        {pieceSquares}
    </div>
}
