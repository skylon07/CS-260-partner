import { Position } from "./gamestate"

import './NeutralToken.css'

/**
 * 
 * @param {{
 *      position: Position,
 *      faded: boolean,
 * }} props
 * 
 * @typedef {import('./gamestate').Position} Position
 */
export default function NeutralToken({position, faded}) {
    if (!(position instanceof Position)) {
        throw new TypeError("NeutralToken must be given a position: Position prop")
    }

    const fadedClass = faded ? "faded" : ""

    return <div className={`NeutralToken ${fadedClass}`}>
        <div className="NeutralToken-Circle" />
    </div>
}
