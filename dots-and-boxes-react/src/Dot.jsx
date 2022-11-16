import './Dot.css'

/**
 * @param {{
 *      filled: boolean
 * }} props
 */
export default function Dot({filled}) {
    const filledClass = filled ? "filled" : ""
    return <div className={`Dot ${filledClass}`} />
}
