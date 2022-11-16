import { Orientation } from "./gamestate"

import Dot from "./Dot"
import SelectableLine from "./SelectableLine"
import FillableBox from "./FillableBox"

import './Board.css'

/**
 * @param {{
 *      boardShape: FillArray
 * }} props
 * 
 * @typedef {import('./FillArray').default} FillArray
 */
export default function Board({boardShape}) {
    const dotAndHorizontalLineElems = boardShape.mapRows((row, rowIdx) => {
        const dotElems = row.map((fill, colIdx) => {
            return <Dot
                key={`Dot${rowIdx},${colIdx}`}
                filled={fill}
            />
        })
        const lineElems = row.map((fill, colIdx) => {
            const leftDotIdx = colIdx - 1
            const leftDotFilled = leftDotIdx >= 0 && boardShape.isFilledAt(rowIdx, leftDotIdx)
            const rightDotIdx = colIdx
            const rightDotFilled = boardShape.isFilledAt(rowIdx, rightDotIdx)
            const isSelectable = leftDotFilled && rightDotFilled

            return <SelectableLine
                key={`SelectableLine${rowIdx},${colIdx}`}
                orientation={Orientation.HORIZONTAL}
                isSelectable={isSelectable}
            />
        })
        lineElems.splice(0, 1)
        return <div
            className="Board-BoardRow horizontal"
            key={`${rowIdx}-horizontal`}
        >
            {interlace(dotElems, lineElems)}
        </div>
    })

    const verticalLineAndSquareElems = boardShape.mapRows((row, rowIdx) => {
        const lineElems = row.map((fill, colIdx) => {
            const topDotIdx = rowIdx - 1
            const topDotFilled = topDotIdx >= 0 && boardShape.isFilledAt(topDotIdx, colIdx)
            const bottomDotIdx = rowIdx
            const bottomDotFilled = boardShape.isFilledAt(bottomDotIdx, colIdx)
            const isSelectable = topDotFilled && bottomDotFilled

            return <SelectableLine
                key={`SelectableLine${rowIdx},${colIdx}`}
                orientation={Orientation.VERTICAL}
                isSelectable={isSelectable}
            />
        })
        const squareElems = row.map((fill, colIdx) => {
            return <FillableBox
                key={`FillableBox${rowIdx},${colIdx}`}
            />
        })
        squareElems.splice(0, 1)
        return <div
            className="Board-BoardRow vertical"
            key={`${rowIdx}-vertical`}
        >
            {interlace(lineElems, squareElems)}
        </div>
    })
    verticalLineAndSquareElems.splice(0, 1)
    
    return <div className="Board">
        {interlace(dotAndHorizontalLineElems, verticalLineAndSquareElems)}
    </div>
}

/**
 * This function returns a new array picking elements
 * from `array1` and `array2`, one at a time, alternating between
 * them after each element is picked
 * 
 * @param {*} array1 is the array to be picked from first
 * @param {*} array2 is the next array to pick from
 */
function interlace(array1, array2) {
    const interlacedArray = []
    for (let idx = 0; idx < array1.length && idx < array2.length; idx += 1) {
        interlacedArray.push(array1[idx])
        interlacedArray.push(array2[idx])
    }
    if (array1.length > array2.length) {
        const lastIdx = interlacedArray.length / 2
        interlacedArray.push(array1[lastIdx])
    }
    return interlacedArray
}
