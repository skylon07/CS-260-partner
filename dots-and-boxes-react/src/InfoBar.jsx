import { Player } from './gamestate'

import './InfoBar.css'

/**
 * @param {{
 *      currPlayer: string,
 *      playerBlueScore: number,
 *      playerRedScore: number,
 * }} props 
 */
export default function InfoBar({currPlayer, playerBlueScore, playerRedScore}) {
    const blueTurnClass = currPlayer === Player.PLAYER_BLUE ? "active" : ""
    const redTurnClass = currPlayer === Player.PLAYER_RED ? "active" : ""

    return <div className="InfoBar">
        <h2 className="InfoBar-Player player-blue">Player Blue</h2>
        <h2 className="InfoBar-Score player-blue">{playerBlueScore}</h2>
        <div className={`InfoBar-Turn player-blue ${blueTurnClass}`} />
        <div className={`InfoBar-Turn player-red ${redTurnClass}`} />
        <h2 className="InfoBar-Score player-red">{playerRedScore}</h2>
        <h2 className="InfoBar-Player player-red">Player Red</h2>
    </div>
}