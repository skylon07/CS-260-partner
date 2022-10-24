import { PlayerPosition } from "./gamestate"

import './PlayerPiece.css'

export default function PlayerPiece({position}) {
    if (!(position instanceof PlayerPosition)) {
        throw new TypeError("PlayerPiece must be given a position: PlayerPosition prop")
    }

    return <div className="PlayerPiece">
        
    </div>
}
