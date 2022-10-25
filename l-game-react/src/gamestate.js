/**
 * A data class holding a combined state of all positions
 * for all pieces in the game
 */
export class PiecePositions {
    /** @type {PlayerPosition} */
    bluePlayerPiecePosition = null
    /** @type {PlayerPosition} */
    redPlayerPiecePosition = null
    /** @type {Position} */
    tokenPiece1Position = null
    /** @type {Position} */
    tokenPiece2Position = null
}

/**
 * A basic data class representing the state of who's turn it is
 * and what they are doing
 */
export class PlayerMoveMode {
    static PLAYER_RED = "PLAYER_RED"
    static PLAYER_BLUE = "PLAYER_BLUE"
    static MODE_MOVE_PLAYER = "MODE_MOVE_PLAYER"
    static MODE_MOVE_TOKEN = "MODE_MOVE_TOKEN"

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
    static DIR_LEFT = "DIR_LEFT"
    static DIR_RIGHT = "DIR_RIGHT"
    static DIR_UP = "DIR_UP"
    static DIR_DOWN = "DIR_DOWN"
    static DIR_REL_FORWARD = "DIR_REL_FORWARD"
    static DIR_REL_LEFT = "DIR_REL_LEFT"
    static DIR_REL_RIGHT = "DIR_REL_RIGHT"
    static DIR_REL_BACKWARD = "DIR_REL_BACKWARD"

    /**
     * Returns the direction of movement between two
     * orthogonally adjacent positions
     * @param {Position} fromPosition is the position something is "moving from"
     * @param {Position} toPosition is the position something is "moving to"
     * @returns a direction, DIR_UP/DOWN/LEFT/RIGHT
     */
     static getAbsMoveDirection(fromPosition, toPosition) {
        if (fromPosition === null || toPosition === null) {
            return null
        }

        const rowDiff = toPosition.rowIdx - fromPosition.rowIdx
        const colDiff = toPosition.colIdx - fromPosition.colIdx
        if (rowDiff === 0) {
            if (colDiff === -1) {
                return Position.DIR_LEFT
            } else if (colDiff === 1) {
                return Position.DIR_RIGHT
            }
        } else if (colDiff === 0) {
            if (rowDiff === -1) {
                return Position.DIR_UP
            } else if (rowDiff === 1) {
                return Position.DIR_DOWN
            }
        }

        throw new Error("Position.getAbsMoveDirection() -- positions are not adjacent")
    }

    /**
     * Detects the relative movement, ie the turning or
     * straightness, between two movements
     * @param {string} lastDir is the move made first
     * @param {string} currDir is the move made after `lastDir`
     * @returns a relative direction, DIR_REL_FORWARD/BACKWARD/LEFT/RIGHT
     */
    static getRelMoveDirection(lastDir, currDir) {
        if (currDir === null) {
            return null
        }

        if (lastDir === currDir || lastDir === null) {
            return Position.DIR_REL_FORWARD
        }

        const isLeftTurn = this.applyRelDir(lastDir, Position.DIR_REL_LEFT) === currDir
        if (isLeftTurn) {
            return Position.DIR_REL_LEFT
        }

        const isRightTurn = this.applyRelDir(lastDir, Position.DIR_REL_RIGHT) === currDir
        if (isRightTurn) {
            return Position.DIR_REL_RIGHT
        }

        return Position.DIR_REL_BACKWARD
    }

    /**
     * Checks if a direction is an absolute direction
     * @param {string} direction 
     * @returns true if direction is DIR_LEFT/RIGHT/UP/DOWN, false otherwise
     */
    static isAbsDir(direction) {
        const absDirs = [
            Position.DIR_LEFT,
            Position.DIR_RIGHT,
            Position.DIR_UP,
            Position.DIR_DOWN,
        ]
        return absDirs.includes(direction)
    }

    /**
     * Checks if a direction is a relative direction
     * @param {string} direction 
     * @returns true if direction is DIR_REL_FORWARD/BACKWARD/LEFT/RIGHT, false otherwise
     */
    static isRelDir(direction) {
        const relDirs = [
            Position.DIR_REL_FORWARD,
            Position.DIR_REL_LEFT,
            Position.DIR_REL_RIGHT,
            Position.DIR_REL_BACKWARD,
        ]
        return relDirs.includes(direction)
    }

    /**
     * Gets the reverse of an absolute or relative direction
     * @param {string} direction 
     * @returns the direction pointed opposite of the given direction
     */
    static reverseDir(direction) {
        const revDirs = {
            [Position.DIR_LEFT]: Position.DIR_RIGHT,
            [Position.DIR_RIGHT]: Position.DIR_LEFT,
            [Position.DIR_UP]: Position.DIR_DOWN,
            [Position.DIR_DOWN]: Position.DIR_UP,
            [Position.DIR_REL_FORWARD]: Position.DIR_REL_BACKWARD,
            [Position.DIR_REL_LEFT]: Position.DIR_REL_RIGHT,
            [Position.DIR_REL_RIGHT]: Position.DIR_REL_LEFT,
            [Position.DIR_REL_BACKWARD]: Position.DIR_REL_FORWARD,
        }
        return revDirs[direction]
    }

    /**
     * Moves a `Position` according to the given absolute direction
     * @param {Position} position 
     * @param {string} absDir 
     * @returns 
     */
    static applyAbsDir(position, absDir) {
        if (!Position.isAbsDir(absDir)) {
            throw new Error("Invalid absDir")
        }
        
        const dirMoves = {
            [Position.DIR_LEFT]: [0, -1],
            [Position.DIR_RIGHT]: [0, 1],
            [Position.DIR_UP]: [-1, 0],
            [Position.DIR_DOWN]: [1, 0],
        }
        const move = dirMoves[absDir]
        return new Position(position.rowIdx + move[0], position.colIdx + move[1])
    }

    /**
     * Turns an absolute direction given a relative direction
     * @param {string} absDir 
     * @param {string} relDir 
     * @returns 
     */
    static applyRelDir(absDir, relDir) {
        if (!Position.isAbsDir(absDir)) {
            throw new Error("Invalid absDir")
        }

        if (relDir === Position.DIR_REL_FORWARD) {
            return absDir
        } else if (relDir === Position.DIR_REL_BACKWARD) {
            return Position.reverseDir(absDir)
        } else if (relDir === Position.DIR_REL_LEFT) {
            const leftTurns = {
                [Position.DIR_LEFT]: Position.DIR_DOWN,
                [Position.DIR_RIGHT]: Position.DIR_UP,
                [Position.DIR_UP]: Position.DIR_LEFT,
                [Position.DIR_DOWN]: Position.DIR_RIGHT,
            }
            return leftTurns[absDir]
        } else if (relDir === Position.DIR_REL_RIGHT) {
            const rightTurns = {
                [Position.DIR_LEFT]: Position.DIR_UP,
                [Position.DIR_RIGHT]: Position.DIR_DOWN,
                [Position.DIR_UP]: Position.DIR_RIGHT,
                [Position.DIR_DOWN]: Position.DIR_LEFT,
            }
            return rightTurns[absDir]
        } else {
            throw new Error("Invalid relDir")
        }
    }

    static equals(position1, position2) {
        if (!(position1 instanceof Position) || !(position2 instanceof Position)) {
            throw new Error("Cannot compare non-Position instances")
        }
        const rowsMatch = position1.rowIdx === position2.rowIdx
        const colsMatch = position1.colIdx === position2.colIdx
        return rowsMatch && colsMatch
    }
    
    constructor(rowIdx, colIdx) {
        this.__rowIdx = rowIdx
        this.__colIdx = colIdx
    }

    get rowIdx() {
        return this.__rowIdx
    }

    get colIdx() {
        return this.__colIdx
    }

    equals(otherPosition) {
        return Position.equals(this, otherPosition)
    }
}

/**
 * Contains information on a player piece's
 * position and orientation
 */
export class PlayerPosition extends Position {
    /**
     * Returns a new `PlayerPosition` given a list of
     * adjacent `Position`s (ie a path of the player's piece)
     * @param {Array<Position>} posPathList is the list of adjacent `Position`s
     * @returns 
     */
    static fromPositionPath(posPathList) {
        if (posPathList.length !== 4) {
            throw new Error("Invalid position path (length !== 4)")
        }

        const [edge1, mid1, mid2, edge2] = posPathList
        const edge1_mid1 = Position.getAbsMoveDirection(edge1, mid1)
        const mid1_mid2 = Position.getAbsMoveDirection(mid1, mid2)
        const mid2_edge2 = Position.getAbsMoveDirection(mid2, edge2)
        const edge1_mid1_mid2 = Position.getRelMoveDirection(edge1_mid1, mid1_mid2)
        const mid1_mid2_edge2 = Position.getRelMoveDirection(mid1_mid2, mid2_edge2)

        const mid1Straight = edge1_mid1_mid2 === Position.DIR_REL_FORWARD
        const mid2Straight = mid1_mid2_edge2 === Position.DIR_REL_FORWARD
        const bothStraight = mid1Straight && mid2Straight
        const neitherStraight = !mid1Straight && !mid2Straight
        if (bothStraight || neitherStraight) {
            throw new Error("Invalid position path (not L-shape path)")
        }

        const longEdgePosition = mid1Straight ?
            edge1 : edge2
        const longEdgeDirection = mid1Straight ?
            edge1_mid1 : Position.reverseDir(mid2_edge2)
        const shortEdgeRelDirection = mid1Straight ?
            mid1_mid2_edge2 : Position.reverseDir(edge1_mid1_mid2)
        return new PlayerPosition(
            longEdgePosition.rowIdx,
            longEdgePosition.colIdx,
            longEdgeDirection,
            shortEdgeRelDirection
        )
    }

    /**
     * Creates a new `PlayerPosition` instance. The starting positions
     * always indicate the position of the long edge of the piece. The
     * orientation signals which direction the short edge should be
     * pointed, left or right, relative to moving "forward" from the long
     * edge of the piece.
     * 
     * @example
     * ```
     * +XX+
     * +X++
     * +X++
     * ++++
     * => new PlayerPosition(2, 1, DIR_UP, DIR_REL_RIGHT)
     * ```
     * 
     * @example
     * ```
     * ++++
     * XXX+
     * ++X+
     * ++++
     * => new PlayerPosition(1, 0, DIR_RIGHT, DIR_REL_RIGHT)
     * ```
     * 
     * @example
     * ```
     * ++X+
     * XXX+
     * ++++
     * ++++
     * => new PlayerPosition(1, 0, DIR_RIGHT, DIR_REL_LEFT)
     * ```
     * 
     * @example
     * ```
     * ++++
     * +X++
     * +X++
     * +XX+
     * => new PlayerPosition(1, 1, DIR_DOWN, DIR_REL_LEFT)
     * ```
     * 
     * @param {number} startRowIdx is the rowIdx of the long edge of the piece
     * @param {number} startColIdx is the colIdx of the long edge of the piece
     * @param {string} orientation is the absolute direction of travel along the long edge of the piece
     * @param {string} flip is the relative direction of portrusion of the short edge from the `orientation` direction
     */
    constructor(startRowIdx, startColIdx, orientation, flip) {
        if (!Position.isAbsDir(orientation)) {
            throw new Error("PlayerPosition received an invalid orientation")
        }
        const validFlips = [
            Position.DIR_REL_LEFT,
            Position.DIR_REL_RIGHT,
        ]
        if (!validFlips.includes(flip)) {
            throw new Error("PlayerPosition received an invalid flip")
        }

        super(startRowIdx, startColIdx)
        this._orientation = orientation
        this._flip = flip
    }

    get orientation() {
        return this._orientation
    }

    get flip() {
        return this._flip
    }

    equals(otherPosition) {
        const superEquals = super.equals(otherPosition)
        const orientationsMatch = this.orientation === otherPosition.orientation
        const flipsMatch = this.flip === otherPosition.flip
        return superEquals && orientationsMatch && flipsMatch
    }

    /**
     * Returns a position path (ie list of `Position`s) indicating
     * first the long edge of the piece, then continuing to adjacent
     * positions, as if the piece was being drawn
     * @returns a list of adjacent `Position`s, indicating the `PlayerPosition`'s path
     */
    toPositionPath() {
        const edge1 = new Position(this.rowIdx, this.colIdx)
        const mid1 = Position.applyAbsDir(this, this.orientation)
        const mid2 = Position.applyAbsDir(mid1, this.orientation)
        const flipDir = Position.applyRelDir(this.orientation, this.flip)
        const edge2 = Position.applyAbsDir(mid2, flipDir)
        return [edge1, mid1, mid2, edge2]
    }
}
