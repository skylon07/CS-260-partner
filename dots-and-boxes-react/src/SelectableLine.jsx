import { Orientation, Player } from './gamestate'

import './SelectableLine.css'

/**
 * @param {{
 *      selectedByPlayer: string,
 *      isSelectable: boolean,
 *      orientation: string
 * }} props 
 */
export default function SelectableLine({selectedByPlayer, isSelectable, orientation}) {
    const playerClass = selectedByPlayer === Player.PLAYER_BLUE ? "blue-selected"
        : selectedByPlayer === Player.PLAYER_RED ? "red-selected"
        : "unselected"

    const orientationClass = orientation === Orientation.HORIZONTAL ?
        "horizontal" : "vertical"
    
    const selectableClass = isSelectable ? "selectable" : ""

    return <div
        className={`SelectableLine ${playerClass} ${orientationClass} ${selectableClass}`}
    />
}