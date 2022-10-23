/**
 * A basic data class representing the state of who's turn it is
 * and what they are doing
 */
export class PlayerMoveMode {
    static PLAYER_RED = "PLAYER_RED"
    static PLAYER_BLUE = "PLAYER_BLUE"
    static MODE_MOVE_PLAYER = "MODE_MOVE_PLAYER"
    static MODE_MOVE_TOKEN = "MODE_MOVE_TOKEN"

    static initMode = new PlayerMoveMode(PlayerMoveMode.PLAYER_BLUE, PlayerMoveMode.MODE_MOVE_PLAYER)

    /**
     * Returns the opposite of some static constant inside
     * the `PlayerMoveMode` class
     * @param {*} playerOrMoveMode is the player or move mode to find the opposite of
     * @returns the opposite of the passed parameter
     */
    static opposite(playerOrMoveMode) {
        const oppositeMap = {
            [PlayerMoveMode.PLAYER_RED]: PlayerMoveMode.PLAYER_BLUE,
            [PlayerMoveMode.PLAYER_BLUE]: PlayerMoveMode.PLAYER_RED,
            [PlayerMoveMode.MODE_MOVE_PLAYER]: PlayerMoveMode.MODE_MOVE_TOKEN,
            [PlayerMoveMode.MODE_MOVE_TOKEN]: PlayerMoveMode.MODE_MOVE_PLAYER,
        }
        return oppositeMap[playerOrMoveMode]
    }

    constructor(player, moveMode) {
        this._player = player
        this._moveMode = moveMode
    }

    get player() {
        return this._player
    }

    get moveMode() {
        return this._moveMode
    }
}

/**
 * Contains information regarding a piece's position
 * on the board
 */
export class Position {
    static MOVE_LEFT = "MOVE_LEFT"
    static MOVE_RIGHT = "MOVE_RIGHT"
    static MOVE_UP = "MOVE_UP"
    static MOVE_DOWN = "MOVE_DOWN"
    static MOVE_STILL = "MOVE_STILL"
    static MOVE_REL_FORWARD = "MOVE_REL_FORWARD"
    static MOVE_REL_LEFT = "MOVE_REL_LEFT"
    static MOVE_REL_RIGHT = "MOVE_REL_RIGHT"
    static MOVE_REL_BACKWARD = "MOVE_REL_BACKWARD"

    /**
     * Returns the direction of movement between two
     * orthogonally adjacent positions
     * @param {Position} fromPosition is the position something is "moving from"
     * @param {Position} toPosition is the position something is "moving to"
     * @returns a direction, MOVE_UP/DOWN/LEFT/RIGHT
     */
     static getAbsMoveDirection(fromPosition, toPosition) {
        if (fromPosition === null || toPosition === null) {
            return null
        }

        const rowDiff = toPosition.rowIdx - fromPosition.rowIdx
        const colDiff = toPosition.colIdx - fromPosition.colIdx
        if (rowDiff === 0) {
            if (colDiff === 0) {
                return Position.MOVE_STILL
            } else if (colDiff === -1) {
                return Position.MOVE_LEFT
            } else if (colDiff === 1) {
                return Position.MOVE_RIGHT
            }
        } else if (colDiff === 0) {
            if (rowDiff === -1) {
                return Position.MOVE_UP
            } else if (rowDiff === 1) {
                return Position.MOVE_DOWN
            }
        }

        throw new Error("Position.getAbsMoveDirection() -- positions are not adjacent")
    }

    /**
     * Detects the relative movement, ie the turning or
     * straightness, between two movements
     * @param {string} lastMove is the move made first
     * @param {string} currMove is the move made after `lastMove`
     * @returns a relative direction, MOVE_REL_FORWARD/BACKWARD/LEFT/RIGHT
     */
    static getRelMoveDirection(lastMove, currMove) {
        if (currMove === null) {
            return null
        }

        if (lastMove === currMove || lastMove === null) {
            return Position.MOVE_REL_FORWARD
        }

        const leftTurns = {
            [Position.MOVE_LEFT]: Position.MOVE_DOWN,
            [Position.MOVE_RIGHT]: Position.MOVE_UP,
            [Position.MOVE_UP]: Position.MOVE_LEFT,
            [Position.MOVE_DOWN]: Position.MOVE_RIGHT,
        }
        const isLeftTurn = leftTurns[lastMove] === currMove
        if (isLeftTurn) {
            return Position.MOVE_REL_LEFT
        }

        const rightTurns = {
            [Position.MOVE_LEFT]: Position.MOVE_UP,
            [Position.MOVE_RIGHT]: Position.MOVE_DOWN,
            [Position.MOVE_UP]: Position.MOVE_RIGHT,
            [Position.MOVE_DOWN]: Position.MOVE_LEFT,
        }
        const isRightTurn = rightTurns[lastMove] === currMove
        if (isRightTurn) {
            return Position.MOVE_REL_RIGHT
        }

        return Position.MOVE_REL_BACKWARD
    }
    
    constructor(rowIdx, colIdx) {
        this._rowIdx = rowIdx
        this._colIdx = colIdx
    }

    get rowIdx() {
        return this._rowIdx
    }

    get colIdx() {
        return this._colIdx
    }

    equals(otherPosition) {
        if (!(otherPosition instanceof Position)) {
            return false
        }
        const rowsMatch = this.rowIdx === otherPosition.rowIdx
        const colsMatch = this.colIdx === otherPosition.colIdx
        return rowsMatch && colsMatch
    }
}

/**
 * Contains information on a player piece's
 * position and orientation
 */
export class PlayerPosition extends Position {
    static ORTN_LEFT = "ORTN_LEFT"
    static ORTN_RIGHT = "ORTN_RIGHT"

    static fromPositionPath(posPathList) {

    }

    /**
     * Creates a new `PlayerPosition` instance. The starting positions
     * always indicate the position of the long edge of the piece. The
     * orientation signals which direction the short edge should be
     * pointed, left or right, relative to moving "forward" from the long
     * edge of the piece.
     * 
     * For example, consider these pieces and their respective positions:
     * 
     * ```
     * +XX+
     * +X++
     * +X++
     * ++++
     * PlayerPosition(2, 1, ORTN_RIGHT)
     * 
     * ++++
     * XXX+
     * ++X+
     * ++++
     * PlayerPosition(1, 0, ORTN_RIGHT)
     * 
     * ++X+
     * XXX+
     * ++++
     * ++++
     * PlayerPosition(1, 0, ORTN_LEFT)
     * 
     * ++++
     * +X++
     * +X++
     * +XX+
     * PlayerPosition(1, 1, ORTN_LEFT)
     * ```
     * 
     * @param {number} startRowIdx is the rowIdx of the long edge of the piece
     * @param {number} startColIdx is the colIdx of the long edge of the piece
     * @param {string} orientation is one of ORTN_LEFT or ORTN_RIGHT
     */
    constructor(startRowIdx, startColIdx, orientation) {
        super(startRowIdx, startColIdx)
        this._orientation = orientation
    }

    get orientation() {
        return this._orientation
    }

    equals(otherPosition) {
        const superEquals = super.equals(otherPosition)
        const orientationsMatch = this.orientation === otherPosition.orientation
        return superEquals && orientationsMatch
    }
}
