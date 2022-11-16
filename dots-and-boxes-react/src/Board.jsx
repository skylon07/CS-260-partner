import Dot from "./Dot";

import './Board.css'

/**
 * @param {{
 *      boardShape: FillArray
 * }} props
 * 
 * @typedef {import('./FillArray')} FillArray
 */
export default function Board({boardShape}) {
    const dotElems = boardShape.mapRows((row, rowIdx) => {
        const dotElems = row.map((fill, colIdx) => <Dot key={`${rowIdx},${colIdx}`} filled={fill} />)
        return <div
            className="Board-BoardRow"
            key={`${rowIdx}-horizontal`}
        >
            {dotElems}
        </div>
    })
    
    return <div className="Board">
        {dotElems}
    </div>
}
