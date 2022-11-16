import { Orientation, Player } from './gamestate'

import './SelectableLine.css'

/**
 * @param {{
 *      selectedByPlayer: string,
 *      disabled: boolean,
 *      orientation: string,
 *      onClick: function
 * }} props 
 */
export default function SelectableLine({selectedByPlayer, disabled, orientation, onClick}) {
    const playerClass = selectedByPlayer === Player.PLAYER_BLUE ? "blue-selected"
        : selectedByPlayer === Player.PLAYER_RED ? "red-selected"
        : "unselected"

    const orientationClass = orientation === Orientation.HORIZONTAL ?
        "horizontal" : "vertical"
    
    const selectableClass = !disabled ? "selectable" : ""

    const callOnClickIfEnabled = () => {
        if (!disabled && typeof onClick === "function") {
            onClick()
        }
    }

    return <div
        className={`SelectableLine ${playerClass} ${orientationClass} ${selectableClass}`}
        onClick={callOnClickIfEnabled}
    >
        <div className="SelectableLine-Bar" />
    </div>
}