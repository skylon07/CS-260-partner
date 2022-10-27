import { Position } from "./gamestate"

import './TokenPiece.css'
import React from "react"
import { MouseControlledSection } from "./selectables"

/**
 * 
 * @param {{
 *      position: Position,
 *      isPickedUp: boolean,
 *      mouseHandler: MouseController.MouseHandler,
 * }} props
 * 
 * @typedef {import('./gamestate').Position} Position
 */
export default function TokenPiece({position, isPickedUp, mouseHandler}) {
    if (!(position instanceof Position)) {
        throw new TypeError("TokenPiece must be given a position: Position prop")
    }

    const offsetYCss = `calc(${position.rowIdx} * var(--TokenPiece-size) + var(--TokenPiece-indent))`
    const offsetXCss = `calc(${position.colIdx} * var(--TokenPiece-size) + var(--TokenPiece-indent))`

    const style = {
        top: offsetYCss,
        left: offsetXCss,
    }

    const pickedUpClass = isPickedUp ? "pickedUp" : ""

    return (
        <div className={`TokenPiece ${pickedUpClass}`} style={style}>
            <MouseControlledSection mouseHandler={mouseHandler}>
                <div className="TokenPiece-Circle" />
            </MouseControlledSection>
        </div>
    )
}
