import { Position } from "./gamestate"

import './TokenPiece.css'
import React from "react"
import { MouseControlledSection } from "./selectables"

/**
 * 
 * @param {{
 *      position: Position,
 *      faded: boolean,
 *      mouseHandler: MouseController.MouseHandler,
 * }} props
 * 
 * @typedef {import('./gamestate').Position} Position
 */
export default function TokenPiece({position, faded, mouseHandler}) {
    if (!(position instanceof Position)) {
        throw new TypeError("TokenPiece must be given a position: Position prop")
    }

    const offsetYCss = `calc(${position.rowIdx} * var(--TokenPiece-size) + var(--TokenPiece-indent))`
    const offsetXCss = `calc(${position.colIdx} * var(--TokenPiece-size) + var(--TokenPiece-indent))`

    const style = {
        top: offsetYCss,
        left: offsetXCss,
    }

    const fadedClass = faded ? "faded" : ""

    return (
        <div className={`TokenPiece ${fadedClass}`} style={style}>
            <MouseControlledSection mouseHandler={mouseHandler}>
                <div className="TokenPiece-Circle" />
            </MouseControlledSection>
        </div>
    )
}
