import { useEffect, useRef, useState } from "react"
import { PlayerPosition } from "./gamestate"

import './PlayerPiece.css'

export default function PlayerPiece({position}) {
    if (!(position instanceof PlayerPosition)) {
        throw new TypeError("PlayerPiece must be given a position: PlayerPosition prop")
    }

    const pieceRef = useRef()

    const [squareSize, setSquareSize] = useState(null)
    useEffect(() => {
        const pieceElem = pieceRef.current
        setSquareSize(pieceElem.offsetWidth / 4)
    }, [])

    const pieceSquares = position.toPositionPath().map((pathPosition) => {
        if (squareSize === null) {
            return null
        }

        const offsetY = pathPosition.rowIdx * squareSize
        const offsetX = pathPosition.colIdx * squareSize

        // DEBUG: experimental style for demonstration purposes
        const style = {
            position: "absolute",
            top: `${offsetY}px`,
            left: `${offsetX}px`,
            width: `${squareSize}px`,
            height: `${squareSize}px`,
            backgroundColor: "green",
        }
        // TODO: add a PlayerPiece-Square CSS class
        return <div key={[offsetX, offsetY]} style={style}></div>
    })

    return <div ref={pieceRef} className="PlayerPiece">
        {pieceSquares}
    </div>
}
