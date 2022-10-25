import { Position } from "./gamestate"

import './NeutralToken.css'

export default function NeutralToken({position}) {
    if (!(position instanceof Position)) {
        throw new TypeError("NeutralToken must be given a position: Position prop")
    }

    return <div className="NeutralToken">

    </div>
}